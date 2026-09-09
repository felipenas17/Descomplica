fixes = [
("components/views/AbsencesView.tsx",
"""                    {(s.status === 'reposicao_marcada' || s.status === 'reposicao_concluida') && (() => {
                      const vinc = schedules.find(x => (x.reposicao_de_ids && x.reposicao_de_ids.includes(s.id)) || x.reposicao_de_id === s.id);
                      return vinc ? (
                        <div className="mt-1 text-xs text-green-600 font-bold">
                          ↳ Reposição em {new Date(vinc.date + 'T00:00:00').toLocaleDateString('pt-BR')}{vinc.start_time ? ' às ' + vinc.start_time : ''}{vinc.status === 'concluido' && vinc.admin_confirmed ? ' — dada' : ' — agendada, aguardando confirmar'}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-red-500 font-bold">
                          ⚠ Sem aula de reposição vinculada no sistema
                        </div>
                      );
                    })()}""",
"""                    {(s.status === 'reposicao_marcada' || s.status === 'reposicao_concluida') && !((s.reposicao_de_ids && s.reposicao_de_ids.length > 0) || s.reposicao_de_id) && (() => {
                      const vinc = schedules.find(x => (x.reposicao_de_ids && x.reposicao_de_ids.includes(s.id)) || x.reposicao_de_id === s.id);
                      return vinc ? (
                        <div className="mt-1 text-xs text-green-600 font-bold">
                          ↳ Reposição em {new Date(vinc.date + 'T00:00:00').toLocaleDateString('pt-BR')}{vinc.start_time ? ' às ' + vinc.start_time : ''}{vinc.status === 'concluido' && vinc.admin_confirmed ? ' — dada' : ' — agendada, aguardando confirmar'}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-red-500 font-bold">
                          ⚠ Sem aula de reposição vinculada no sistema
                        </div>
                      );
                    })()}
                    {((s.reposicao_de_ids && s.reposicao_de_ids.length > 0) || s.reposicao_de_id) && (() => {
                      const origIds = (s.reposicao_de_ids && s.reposicao_de_ids.length > 0) ? s.reposicao_de_ids : [s.reposicao_de_id];
                      const origs = origIds.map((oid: string) => schedules.find((x: any) => x.id === oid)).filter(Boolean);
                      if (origs.length === 0) return null;
                      return (
                        <div className="mt-1 text-xs text-green-600 font-bold">
                          {origs.map((o: any) => (
                            <div key={o.id}>
                              ↳ Reposição da aula de {new Date(o.date + 'T00:00:00').toLocaleDateString('pt-BR')} com {o.teacher_name || 'professor(a)'}{o.motivo_falta ? ' — Motivo: ' + o.motivo_falta : ''}
                            </div>
                          ))}
                        </div>
                      );
                    })()}"""),
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
