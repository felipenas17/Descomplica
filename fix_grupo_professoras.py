fixes = [
("components/views/MessagesView.tsx",
"""interface Member { id: string; name: string; role: string; email?: string; }
interface Message { id: string; sender_id: string; receiver_id: string; text: string; created_at: string; }""",
"""interface Member { id: string; name: string; role: string; email?: string; }
interface Message { id: string; sender_id: string; receiver_id: string; text: string; created_at: string; }
interface GroupMessage { id: string; sender_id: string; sender_name: string; text: string; created_at: string; }
const GROUP_ID = 'GROUP';"""),

("components/views/MessagesView.tsx",
"""  const [messages, setMessages] = useState<Message[]>([]);""",
"""  const [messages, setMessages] = useState<Message[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);"""),

("components/views/MessagesView.tsx",
"""  // Realtime
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
  }, [selected]);""",
"""  // Busca mensagens do grupo (conversa unica, compartilhada por todo mundo)
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
  }, [selected]);"""),

("components/views/MessagesView.tsx",
"""  const sendMessage = async () => {
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
  };""",
"""  const sendMessage = async () => {
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
  };"""),

("components/views/MessagesView.tsx",
"""        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (""",
"""        <div className="flex-1 overflow-y-auto">
          <div onClick={() => setSelected({ id: GROUP_ID, name: 'Grupo Professoras', role: 'Grupo' })}
            className={`p-4 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-100 ${selected?.id === GROUP_ID ? 'bg-purple-50' : ''}`}>
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
          {conversations.length === 0 ? ("""),

("components/views/MessagesView.tsx",
"""              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare size={36} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-gray-300">Diga olá para {selected.name}!</p>
                  </div>
                </div>
              ) : messages.map(m => {""",
"""              {selected.id === GROUP_ID ? (
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
              ) : messages.map(m => {"""),
]

for path, old, new in fixes:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    n = content.count(old)
    if n == 0:
        raise SystemExit(f"NAO ENCONTROU em {path}, abortando (nada mudou):\n{old}")
    if n > 1:
        raise SystemExit(f"ENCONTROU {n}x em {path}, ambiguo, abortando:\n{old}")
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK:", path)
