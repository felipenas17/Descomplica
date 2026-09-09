fixes = [
("components/views/MessagesView.tsx",
"""          <div onClick={() => setSelected({ id: GROUP_ID, name: 'Grupo Professoras', role: 'Grupo' })}
            className={`p-4 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-100 ${selected?.id === GROUP_ID ? 'bg-purple-50' : ''}`}>""",
"""          <div onClick={() => setSelected({ id: GROUP_ID, name: 'Grupo Professoras', role: 'Grupo' })}
            className={`sticky top-0 z-10 p-4 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-100 ${selected?.id === GROUP_ID ? 'bg-purple-50' : 'bg-white'}`}>"""),
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
