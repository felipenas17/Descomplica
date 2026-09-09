fixes = [
("components/views/MessagesView.tsx",
"""    // Busca info dos interlocutores
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
    setConversations(people);""",
"""    // Busca info dos interlocutores (sempre pelo profiles.id, que e o mesmo id do login/auth.uid() -
    // teachers.id e um id diferente da mesma pessoa e NUNCA deve ser usado aqui)
    const { data: profilesData } = await supabase.from('profiles').select('id, full_name, role').in('id', ids);

    const people: Member[] = [];
    ids.forEach(id => {
      const p = profilesData?.find(x => x.id === id);
      if (p) people.push({ id: p.id, name: p.full_name || 'Usuário', role: p.role === 'admin' ? 'Admin' : 'Professor' });
    });
    setConversations(people);"""),

("components/views/MessagesView.tsx",
"""    try {
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
    } finally { setLoadingMembers(false); }""",
"""    try {
      // Busca sempre em profiles (o id de login/auth.uid()) - nunca em teachers,
      // cujo id e diferente do id de login da mesma pessoa e faz a mensagem nunca chegar.
      const { data: profilesRes } = await supabase.from('profiles').select('id, full_name, role').ilike('full_name', `%${query}%`).limit(8);
      const all = (profilesRes || [])
        .filter(p => p.id !== user?.id)
        .map(p => ({ id: p.id, name: p.full_name || 'Usuário', role: p.role === 'admin' ? 'Admin' : 'Professor' }));
      setMembers(all);
    } finally { setLoadingMembers(false); }"""),
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
