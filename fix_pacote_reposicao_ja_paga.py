fixes = [
("components/views/AbsencesView.tsx",
"""    if ((st === 'falta' || st === 'justificada') && s.professor_liberado) return false; // liberada ou vaga substituida -> nao conta (quem conta e o substituto)""",
"""    if (s.professor_liberado) return false; // liberada, vaga substituida, ou reposicao ja paga antes do sistema -> nunca conta"""),

("components/views/AbsencesView.tsx",
"""      origs.forEach((o: any) => {
        const [oy,om,od] = (o.date||'').split('-');
        obsParts.push('Reposição da aula de '+(od||'')+'/'+(om||'')+' com '+escHtml(o.teacher_name||''));
      });""",
"""      origs.forEach((o: any) => {
        const [oy,om,od] = (o.date||'').split('-');
        const jaPago = o.date && o.date < '2026-07-27' ? ' (ja paga anteriormente)' : '';
        obsParts.push('Reposição da aula de '+(od||'')+'/'+(om||'')+' com '+escHtml(o.teacher_name||'')+jaPago);
      });"""),

("components/views/AbsencesView.tsx",
"""                          {origs.map((o: any) => (
                            <div key={o.id}>
                              ↳ Reposição da aula de {new Date(o.date + 'T00:00:00').toLocaleDateString('pt-BR')} com {o.teacher_name || 'professor(a)'}{o.motivo_falta ? ' — Motivo: ' + o.motivo_falta : ''}
                            </div>
                          ))}""",
"""                          {origs.map((o: any) => (
                            <div key={o.id}>
                              ↳ Reposição da aula de {new Date(o.date + 'T00:00:00').toLocaleDateString('pt-BR')} com {o.teacher_name || 'professor(a)'}{o.motivo_falta ? ' — Motivo: ' + o.motivo_falta : ''}
                              {o.date && o.date < '2026-07-27' && <span className="text-gray-400 font-normal"> (já paga anteriormente)</span>}
                            </div>
                          ))}"""),
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
