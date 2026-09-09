'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, X, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Member { id: string; name: string; role: string; email?: string; }
interface Message { id: string; sender_id: string; receiver_id: string; text: string; created_at: string; }
interface GroupMessage { id: string; sender_id: string; sender_name: string; text: string; created_at: string; }
const GROUP_ID = 'GROUP';

export default function MessagesView({ user }: { user?: any }) {
  const [conversations, setConversations] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [sending, setSending] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convMenuOpenId, setConvMenuOpenId] = useState<string | null>(null);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!menuOpenId) return;
    const closeMenu = () => setMenuOpenId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [menuOpenId]);

  useEffect(() => {
    if (!convMenuOpenId) return;
    const closeMenu = () => setConvMenuOpenId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [convMenuOpenId]);

  // Busca conversas existentes (pessoas com quem já trocou mensagem)
  useEffect(() => {
    if (!user?.id) return;
    fetchConversations();
  }, [user?.id]);

  const fetchConversations = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('messages').select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) return;

    // Pega IDs únicos de interlocutores
    const ids = [...new Set(data.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))];

    // Busca info dos interlocutores (sempre pelo profiles.id, que e o mesmo id do login/auth.uid() -
    // teachers.id e um id diferente da mesma pessoa e NUNCA deve ser usado aqui)
    const { data: profilesData } = await supabase.from('profiles').select('id, full_name, role').in('id', ids);

    const people: Member[] = [];
    ids.forEach(id => {
      const p = profilesData?.find(x => x.id === id);
      if (p) people.push({ id: p.id, name: p.full_name || 'Usuário', role: p.role === 'admin' ? 'Admin' : 'Professor' });
    });
    setConversations(people);
  };

  // Busca mensagens da conversa selecionada
  const fetchMessages = async (otherId: string) => {
    if (!user?.id) return;
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);

    // Marca como lidas
    await supabase.from('messages').update({ read: true })
      .eq('receiver_id', user.id).eq('sender_id', otherId).eq('read', false);
  };

  // Busca mensagens do grupo (conversa unica, compartilhada por todo mundo)
  const fetchGroupMessages = async () => {
    const { data } = await supabase.from('group_messages').select('*').order('created_at', { ascending: true });
    setGroupMessages(data || []);
  };

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          if (selected && selected.id !== GROUP_ID && (msg.sender_id === selected.id || msg.receiver_id === selected.id)) {
            setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
          }
          fetchConversations();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: (msg as any).read } : m));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) => {
        const gm = payload.new as GroupMessage;
        setGroupMessages(prev => prev.find(m => m.id === gm.id) ? prev : [...prev, gm]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, selected]);

  useEffect(() => {
    if (!selected) return;
    if (selected.id === GROUP_ID) fetchGroupMessages();
    else fetchMessages(selected.id);
  }, [selected]);

  // Busca membros
  const searchMembers = async (query: string) => {
    if (!query.trim()) { setMembers([]); return; }
    setLoadingMembers(true);
    try {
      // Busca sempre em profiles (o id de login/auth.uid()) - nunca em teachers,
      // cujo id e diferente do id de login da mesma pessoa e faz a mensagem nunca chegar.
      const { data: profilesRes } = await supabase.from('profiles').select('id, full_name, role').ilike('full_name', `%${query}%`).limit(8);
      const all = (profilesRes || [])
        .filter(p => p.id !== user?.id)
        .map(p => ({ id: p.id, name: p.full_name || 'Usuário', role: p.role === 'admin' ? 'Admin' : 'Professor' }));
      setMembers(all);
    } finally { setLoadingMembers(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => searchMembers(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const selectMember = (member: Member) => {
    setSelected(member);
    if (!conversations.find(c => c.id === member.id)) {
      setConversations(prev => [member, ...prev]);
    }
    setShowSearch(false);
    setSearchQuery('');
    setMembers([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected || !user?.id) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    if (selected.id === GROUP_ID) {
      const { data: newGm } = await supabase.from('group_messages').insert({
        sender_id: user.id,
        sender_name: user?.name || 'Alguém',
        text,
        created_at: new Date().toISOString(),
      }).select().single();
      if (newGm) setGroupMessages(prev => [...prev, newGm]);
      setSending(false);
      return;
    }
    const { data: newMsg } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selected.id,
      text,
      read: false,
      created_at: new Date().toISOString(),
    }).select().single();
    if (newMsg) setMessages(prev => [...prev, newMsg]);
    fetchMessages(selected.id);
    setSending(false);
    fetchConversations();
  };

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setEditText(m.text);
    setMenuOpenId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    setSavingEdit(true);
    const { error } = await supabase.from('messages').update({ text: editText.trim(), edited_at: new Date().toISOString() }).eq('id', editingId);
    if (!error) {
      setMessages(prev => prev.map(m => m.id === editingId ? { ...m, text: editText.trim(), edited_at: new Date().toISOString() } : m));
      setEditingId(null);
      setEditText('');
    }
    setSavingEdit(false);
  };

  const deleteMessage = async (id: string) => {
    setMenuOpenId(null);
    setDeletingId(id);
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
    setDeletingId(null);
  };

  const deleteConversation = async (otherId: string) => {
    setConvMenuOpenId(null);
    if (!user?.id) return;
    setDeletingConvId(otherId);
    const { error } = await supabase.from('messages').delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`);
    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== otherId));
      if (selected?.id === otherId) { setSelected(null); setMessages([]); }
    }
    setDeletingConvId(null);
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 relative">
      {/* Sidebar */}
      <div className={`${selected ? "hidden md:flex" : "flex"} w-full md:w-80 bg-white rounded-2xl border border-gray-100 shadow-sm flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" /> Mensagens
            </h2>
            <button onClick={() => setShowSearch(!showSearch)}
              className="w-8 h-8 rounded-xl bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-600 transition-colors">
              {showSearch ? <X size={16} /> : <Search size={16} />}
            </button>
          </div>

          {showSearch && (
            <div className="relative">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar professor ou admin..."
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
                {searchQuery && <button onClick={() => { setSearchQuery(''); setMembers([]); }}><X size={14} className="text-gray-400" /></button>}
              </div>
              {(members.length > 0 || loadingMembers || searchQuery) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  {loadingMembers ? <div className="p-4 text-center text-sm text-gray-400">Buscando...</div>
                  : members.length === 0 && searchQuery ? <div className="p-4 text-center text-sm text-gray-400">Nenhum membro encontrado</div>
                  : members.map(m => (
                    <button key={m.id} onClick={() => selectMember(m)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 transition-colors text-left">
                      <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {m.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div onClick={() => setSelected({ id: GROUP_ID, name: 'Grupo Professoras', role: 'Grupo' })}
            className={`sticky top-0 z-10 p-4 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-100 ${selected?.id === GROUP_ID ? 'bg-purple-50' : 'bg-white'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0">
                <Users size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">Grupo Professoras</p>
                <p className="text-xs text-green-500">Todo mundo vê essa conversa</p>
              </div>
            </div>
          </div>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Users size={36} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-medium">Nenhuma conversa</p>
              <p className="text-xs text-gray-300 mt-1">Clique em 🔍 para buscar um membro</p>
            </div>
          ) : conversations.map(conv => (
            <div key={conv.id} onClick={() => setSelected(conv)}
              onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setConvMenuOpenId(convMenuOpenId === conv.id ? null : conv.id); }}
              className={`relative group p-4 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-50 ${selected?.id === conv.id ? 'bg-purple-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {conv.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{conv.name}</p>
                  <p className="text-xs text-purple-400">{conv.role}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setConvMenuOpenId(convMenuOpenId === conv.id ? null : conv.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full hover:bg-gray-200 text-gray-400 text-xs flex items-center justify-center shrink-0">
                  ⋮
                </button>
              </div>
              {convMenuOpenId === conv.id && (
                <div onClick={e => e.stopPropagation()} className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-sm right-3 top-12 min-w-[150px]">
                  <button onClick={() => deleteConversation(conv.id)} disabled={deletingConvId === conv.id}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600">
                    {deletingConvId === conv.id ? 'Excluindo...' : '🗑️ Excluir conversa'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 shrink-0">←</button>
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {selected.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{selected.name}</p>
                <p className="text-xs text-purple-500">{selected.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {selected.id === GROUP_ID ? (
                groupMessages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Users size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Nenhuma mensagem no grupo ainda</p>
                      <p className="text-xs text-gray-300">Todo mundo vê o que for escrito aqui</p>
                    </div>
                  </div>
                ) : groupMessages.map(gm => {
                  const own = gm.sender_id === user?.id;
                  return (
                    <div key={gm.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm shadow-sm ${own ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                        {!own && <p className="text-[11px] font-bold text-green-600 mb-0.5">{gm.sender_name}</p>}
                        {gm.text}
                        <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${own ? 'text-purple-200' : 'text-gray-400'}`}>
                          {formatTime(gm.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare size={36} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-gray-300">Diga olá para {selected.name}!</p>
                  </div>
                </div>
              ) : messages.map(m => {
                const own = m.sender_id === user?.id;
                return (
                <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'} group relative`}
                  onContextMenu={e => { if (own) { e.preventDefault(); setMenuOpenId(menuOpenId === m.id ? null : m.id); } }}>
                  {own && editingId !== m.id && (
                    <button onClick={() => setMenuOpenId(menuOpenId === m.id ? null : m.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity self-center mr-1 w-6 h-6 rounded-full hover:bg-gray-200 text-gray-400 text-xs flex items-center justify-center shrink-0">
                      ⋮
                    </button>
                  )}
                  {menuOpenId === m.id && (
                    <div className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-sm right-8 top-0 min-w-[110px]">
                      <button onClick={() => startEdit(m)} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700">✏️ Editar</button>
                      <button onClick={() => deleteMessage(m.id)} disabled={deletingId === m.id}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600">
                        {deletingId === m.id ? 'Excluindo...' : '🗑️ Excluir'}
                      </button>
                    </div>
                  )}
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm shadow-sm ${own ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                    {editingId === m.id ? (
                      <div className="flex flex-col gap-2 min-w-[180px]">
                        <input autoFocus value={editText} onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                          className="px-2 py-1.5 rounded-lg text-gray-800 text-sm focus:outline-none" />
                        <div className="flex gap-2 justify-end">
                          <button onClick={cancelEdit} className="text-xs underline text-purple-200 hover:text-white">Cancelar</button>
                          <button onClick={saveEdit} disabled={savingEdit || !editText.trim()} className="text-xs font-bold underline text-white disabled:opacity-50">
                            {savingEdit ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {m.text.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) =>
                          part.match(/^https?:\/\//) ? (
                            <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                              className="underline text-blue-200 hover:text-white break-all">
                              📥 Clique aqui para baixar o PDF
                            </a>
                          ) : part
                        )}
                        <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${own ? 'text-purple-200' : 'text-gray-400'}`}>
                          {(m as any).edited_at && <span className="italic mr-1">editado</span>}
                          {formatTime(m.created_at)}
                          {own && (
                            <span className={`font-bold ${(m as any).read ? 'text-white' : 'text-purple-300'}`}>
                              {(m as any).read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2 bg-white">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Digite uma mensagem..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-purple-300" />
              </div>
              <p className="text-gray-500 font-medium">Selecione uma conversa</p>
              <p className="text-gray-300 text-sm mt-1">ou clique em 🔍 para iniciar uma nova</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
