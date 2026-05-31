'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, X, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Member { id: string; name: string; role: string; email?: string; }
interface Message { id: string; sender_id: string; receiver_id: string; text: string; created_at: string; }

export default function MessagesView({ user }: { user?: any }) {
  const [conversations, setConversations] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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

    // Busca info dos interlocutores
    const [teachersRes, profilesRes] = await Promise.all([
      supabase.from('teachers').select('id, name, role').in('id', ids),
      supabase.from('profiles').select('id, full_name, role').in('id', ids),
    ]);

    const people: Member[] = [];
    ids.forEach(id => {
      const t = teachersRes.data?.find(x => x.id === id);
      const p = profilesRes.data?.find(x => x.id === id);
      if (t) people.push({ id: t.id, name: t.name, role: 'Professor' });
      else if (p) people.push({ id: p.id, name: p.full_name || 'Usuário', role: p.role === 'admin' ? 'Admin' : 'Professor' });
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

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          if (selected && (msg.sender_id === selected.id || msg.receiver_id === selected.id)) {
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
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, selected]);

  useEffect(() => {
    if (selected) fetchMessages(selected.id);
  }, [selected]);

  // Busca membros
  const searchMembers = async (query: string) => {
    if (!query.trim()) { setMembers([]); return; }
    setLoadingMembers(true);
    try {
      const [teachersRes, profilesRes] = await Promise.all([
        supabase.from('teachers').select('id, name, role').ilike('name', `%${query}%`).limit(5),
        supabase.from('profiles').select('id, full_name, role').ilike('full_name', `%${query}%`).limit(5),
      ]);
      const teachers = (teachersRes.data || []).map(t => ({ id: t.id, name: t.name, role: 'Professor' }));
      const profiles = (profilesRes.data || [])
        .filter(p => p.id !== user?.id)
        .map(p => ({ id: p.id, name: p.full_name || 'Usuário', role: p.role === 'admin' ? 'Admin' : 'Professor' }));
      const all = [...teachers, ...profiles].filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i && m.id !== user?.id);
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

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Sidebar */}
      <div className="w-80 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
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
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Users size={36} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-medium">Nenhuma conversa</p>
              <p className="text-xs text-gray-300 mt-1">Clique em 🔍 para buscar um membro</p>
            </div>
          ) : conversations.map(conv => (
            <div key={conv.id} onClick={() => setSelected(conv)}
              className={`p-4 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-50 ${selected?.id === conv.id ? 'bg-purple-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {conv.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{conv.name}</p>
                  <p className="text-xs text-purple-400">{conv.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {selected.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{selected.name}</p>
                <p className="text-xs text-purple-500">{selected.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare size={36} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-gray-300">Diga olá para {selected.name}!</p>
                  </div>
                </div>
              ) : messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm shadow-sm ${m.sender_id === user?.id ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                    {m.text.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) =>
                      part.match(/^https?:\/\//) ? (
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                          className="underline text-blue-200 hover:text-white break-all">
                          📥 Clique aqui para baixar o PDF
                        </a>
                      ) : part
                    )}
                    <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${m.sender_id === user?.id ? 'text-purple-200' : 'text-gray-400'}`}>
                      {formatTime(m.created_at)}
                      {m.sender_id === user?.id && (
                        <span className={`font-bold ${(m as any).read ? 'text-white' : 'text-purple-300'}`}>
                          {(m as any).read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
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
