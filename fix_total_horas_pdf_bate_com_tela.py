fixes = [
("components/views/AbsencesView.tsx",
"""    const totalHoras = base2.reduce((acc: number, s: any) => acc + duracao(s.start_time,s.end_time)/60, 0);""",
"""    const totalHoras = pagaveis.reduce((acc: number, s: any) => acc + getDuracaoHoras(s), 0);"""),
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
