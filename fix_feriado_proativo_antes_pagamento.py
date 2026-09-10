fixes = [
("components/views/AbsencesView.tsx",
"""    if (s.attendance_status === 'feriado') return { label: 'Feriado', color: 'text-purple-600' };""",
"""    if (s.attendance_status === 'feriado' || (s.date && isFeriado(s.date))) return { label: 'Feriado', color: 'text-purple-600' };"""),

("components/views/AbsencesView.tsx",
"""      const st = s.attendance_status==='feriado'?'Feriado':s.status==='reposicao_concluida'?'Concluida':(s.status==='concluido'&&s.admin_confirmed)?'Concluida':s.attendance_status==='falta'?'Falta':(s.reposicao_pendente||s.status==='reposicao_marcada')?'Reposicao':(s.attendance_status==='justificada'||s.attendance_status==='Justificada')?'Justificada':s.lesson_type==='avulsa'?'Avulsa':'Aguardando';""",
"""      const st = (s.attendance_status==='feriado'||(s.date&&isFeriado(s.date)))?'Feriado':s.status==='reposicao_concluida'?'Concluida':(s.status==='concluido'&&s.admin_confirmed)?'Concluida':s.attendance_status==='falta'?'Falta':(s.reposicao_pendente||s.status==='reposicao_marcada')?'Reposicao':(s.attendance_status==='justificada'||s.attendance_status==='Justificada')?'Justificada':s.lesson_type==='avulsa'?'Avulsa':'Aguardando';"""),
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
