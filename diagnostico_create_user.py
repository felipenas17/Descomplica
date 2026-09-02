fixes = [
("app/api/create-user/route.ts",
"""    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });""",
"""    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized: nenhum token foi enviado pelo app' }, { status: 401 });
    const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized: token invalido/expirado - ' + (tokenError?.message || 'motivo desconhecido') }, { status: 401 });"""),

("components/views/UsersView.tsx",
"""      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/create-user', {""",
"""      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session) {
        console.error('Sem sessao local ao tentar criar usuario:', sessionError);
        alert('Sua sessao local nao foi encontrada (session=null). Faca logout e login de novo antes de tentar criar staff.');
        setUsers(prev => prev.filter(u => u.id !== tempId));
        setIsSaving(false);
        return;
      }
      const res = await fetch('/api/create-user', {"""),
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
