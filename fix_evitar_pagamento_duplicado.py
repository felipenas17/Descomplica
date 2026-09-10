fixes = [
("components/views/operations/SchoolCalendar.tsx",
"""      await supabase.from('schedules').update({
        attendance_status: substAlunoData.tipo,
        status: substAlunoData.tipo === 'falta' ? 'falta_confirmada' : selectedLesson.status,
        motivo_falta: motivoFinal,
        notes: (selectedLesson.notes || '') + ' | Substituido por ' + novoAluno?.name,
      }).eq('id', selectedLesson.id);""",
"""      await supabase.from('schedules').update({
        attendance_status: substAlunoData.tipo,
        status: substAlunoData.tipo === 'falta' ? 'falta_confirmada' : selectedLesson.status,
        motivo_falta: motivoFinal,
        notes: (selectedLesson.notes || '') + ' | Substituido por ' + novoAluno?.name,
        professor_liberado: true,
      }).eq('id', selectedLesson.id);"""),

("components/views/AbsencesView.tsx",
"""    if (st === 'falta' && s.professor_liberado) return false; // liberada -> nao conta""",
"""    if ((st === 'falta' || st === 'justificada') && s.professor_liberado) return false; // liberada ou vaga substituida -> nao conta (quem conta e o substituto)"""),

("components/views/AbsencesView.tsx",
"""                      {s.status === 'falta_confirmada' && s.professor_liberado && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Professora Liberada</span>}""",
"""                      {s.status === 'falta_confirmada' && s.professor_liberado && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                          {(s.notes || '').includes('Substituido por') ? 'Vaga Substituída' : 'Professora Liberada'}
                        </span>
                      )}"""),
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
