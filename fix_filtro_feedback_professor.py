fixes = [
("components/views/FeedbacksView.tsx",
 "    const matchesTeacher = !filterTeacher || f.teacher_name === filterTeacher;",
 "    const matchesTeacher = !filterTeacher || f.teacher_id === filterTeacher;"),

("components/views/FeedbacksView.tsx",
 "          {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}",
 "          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}"),
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
