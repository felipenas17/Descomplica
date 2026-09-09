fixes = [
("components/views/TeacherScheduleView.tsx",
"""    if (lesson.attendance_status === 'justificada' || lesson.attendance_status === 'Justificada' || lesson.status === 'reposicao_marcada' || lesson.status === 'reposicao_concluida') {
      toast.error('Esta aula ja foi justificada pelo administrador e nao pode ser alterada.');
      return;
    }""",
"""    if (lesson.attendance_status === 'justificada' || lesson.attendance_status === 'Justificada' || lesson.status === 'reposicao_marcada' || lesson.status === 'reposicao_concluida' || lesson.status === 'falta_confirmada') {
      toast.error('Esta aula ja foi resolvida pelo administrador (justificativa, reposicao ou substituicao) e nao pode ser alterada por aqui.');
      return;
    }"""),
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
