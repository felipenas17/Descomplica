fixes = [
("components/views/MessagesView.tsx",
"""  useEffect(() => {
    if (!menuOpenId) return;
    const closeMenu = () => setMenuOpenId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [menuOpenId]);""",
"""  useEffect(() => {
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
  }, [convMenuOpenId]);"""),

("components/views/MessagesView.tsx",
"""  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);""",
"""  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convMenuOpenId, setConvMenuOpenId] = useState<string | null>(null);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);"""),

("components/views/MessagesView.tsx",
"""  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });""",
"""  const deleteConversation = async (otherId: string) => {
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

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });"""),

("components/views/MessagesView.tsx",
"""          ) : conversations.map(conv => (
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
          ))}""",
"""          ) : conversations.map(conv => (
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
          ))}"""),
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
