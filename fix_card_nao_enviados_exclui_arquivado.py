fixes = [
("components/views/FeedbacksView.tsx",
"""          <h3 className="text-3xl font-black text-yellow-600">{feedbacks.filter(f => !f.sent_to_parent).length}</h3>""",
"""          <h3 className="text-3xl font-black text-yellow-600">{feedbacks.filter(f => !f.sent_to_parent && !f.arquivado).length}</h3>"""),
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
