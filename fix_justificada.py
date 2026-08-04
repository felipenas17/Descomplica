path = "components/views/AbsencesView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (
        "filterStatus === 'justificada' ? (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') && !s.reposicao_pendente && s.status !== 'reposicao_marcada' :",
        "filterStatus === 'justificada' ? (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') && !s.reposicao_pendente && s.status !== 'reposicao_marcada' && s.status !== 'reposicao_concluida' && s.status !== 'concluido' :"
    ),
    (
        "const justificadas = base.filter(s => (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') && !s.reposicao_pendente && s.status !== 'reposicao_marcada').length;",
        "const justificadas = base.filter(s => (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') && !s.reposicao_pendente && s.status !== 'reposicao_marcada' && s.status !== 'reposicao_concluida' && s.status !== 'concluido').length;"
    ),
]

for old, new in replacements:
    n = content.count(old)
    if n == 0:
        raise SystemExit("NAO ENCONTROU, abortando (nada mudou):\n" + old)
    if n > 1:
        raise SystemExit(f"ENCONTROU {n}x, ambiguo, abortando:\n" + old)
    content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: 2 substituicoes aplicadas.")
