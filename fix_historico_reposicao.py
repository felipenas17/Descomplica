old = """                      {s.teacher_name && <span>Prof: {s.teacher_name}</span>}
                    </div>
                  </div>"""

new = """                      {s.teacher_name && <span>Prof: {s.teacher_name}</span>}
                    </div>
                    {(s.status === 'reposicao_marcada' || s.status === 'reposicao_concluida') && (() => {
                      const vinc = schedules.find(x => x.reposicao_de_id === s.id);
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
                  </div>"""

path = "components/views/AbsencesView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

n = content.count(old)
if n == 0:
    raise SystemExit("NAO ENCONTROU, abortando (nada mudou)")
if n > 1:
    raise SystemExit(f"ENCONTROU {n}x, ambiguo, abortando")

content = content.replace(old, new)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: histórico de reposição adicionado.")
