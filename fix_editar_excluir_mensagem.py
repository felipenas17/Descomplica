fixes = [
("components/views/MessagesView.tsx",
"""  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);""",
"""  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!menuOpenId) return;
    const closeMenu = () => setMenuOpenId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [menuOpenId]);"""),

("components/views/MessagesView.tsx",
"""  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);""",
"""  const [sending, setSending] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);"""),

("components/views/MessagesView.tsx",
"""  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });""",
"""  const startEdit = (m: Message) => {
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

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });"""),

("components/views/MessagesView.tsx",
"""              ) : messages.map(m => (
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
              ))}""",
"""              ) : messages.map(m => {
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
              })}"""),
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
