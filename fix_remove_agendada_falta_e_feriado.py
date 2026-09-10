fixes = [
("components/views/AbsencesView.tsx",
"""  const getStatusLabel = (s: any) => {
    if (s.status === 'concluido' && s.admin_confirmed) return { label: 'Concluida', color: 'bg-green-100 text-green-700' };""",
"""  const getStatusLabel = (s: any) => {
    if (s.status === 'falta_confirmada') return { label: '', color: '' };
    if (s.attendance_status === 'feriado' || (s.date && isFeriado(s.date))) return { label: '', color: '' };
    if (s.status === 'concluido' && s.admin_confirmed) return { label: 'Concluida', color: 'bg-green-100 text-green-700' };"""),
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
