fixes = [
("components/views/MessagesView.tsx",
"""  useEffect(() => {
    if (!selected) return;
    if (selected.id === GROUP_ID) fetchGroupMessages();
    else fetchMessages(selected.id);
  }, [selected]);""",
"""  useEffect(() => {
    if (!selected) return;
    if (selected.id === GROUP_ID) fetchGroupMessages();
    else fetchMessages(selected.id);
  }, [selected]);

  // Rede de seguranca: confere sozinho a cada poucos segundos se chegou mensagem nova,
  // mesmo que o aviso em tempo real falhe por algum motivo (rede, celular em segundo plano, etc.)
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      fetchConversations();
      if (selected?.id === GROUP_ID) fetchGroupMessages();
      else if (selected?.id) fetchMessages(selected.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [user?.id, selected]);"""),
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
