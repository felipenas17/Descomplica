fixes = [
("components/views/AbsencesView.tsx",
 "  const pagSemMarcacao = pagamentoBase.filter((s: any) => !s.attendance_status && s.date < hojeStr).length;",
 """  const pagSemMarcacaoLista = pagamentoBase.filter((s: any) => !s.attendance_status && s.date < hojeStr);
  const pagSemMarcacao = pagSemMarcacaoLista.length;"""),

("components/views/AbsencesView.tsx",
"""              {pagSemMarcacao > 0 && <p className="text-yellow-600 font-bold">⚠ {pagSemMarcacao} aula(s) já aconteceram sem marcação — não contam aqui.</p>}
            </div>""",
"""              {pagSemMarcacao > 0 && (
                <div className="text-yellow-600">
                  <p className="font-bold">⚠ {pagSemMarcacao} aula(s) já aconteceram sem marcação — não contam aqui:</p>
                  <ul className="mt-1 space-y-0.5">
                    {pagSemMarcacaoLista.map((s: any) => (
                      <li key={s.id}>• {new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {s.start_time} — {s.student_name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>"""),
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
