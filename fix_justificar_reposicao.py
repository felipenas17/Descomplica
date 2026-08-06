fixes = [
    ("components/views/operations/SchoolCalendar.tsx",
     "await supabase.from('schedules').update({ attendance_status: 'justificada', reposicao_pendente: true, motivo_falta: motivoFinal }).eq('id', lesson.id);",
     "await supabase.from('schedules').update({ attendance_status: 'justificada', motivo_falta: motivoFinal }).eq('id', lesson.id);"),
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
