fixes = [
("components/views/operations/SchoolCalendar.tsx",
 "  const [motivoTag, setMotivoTag] = useState('');",
 """  const [motivoTag, setMotivoTag] = useState('');
  const [professorLiberado, setProfessorLiberado] = useState(false);"""),

("components/views/operations/SchoolCalendar.tsx",
 "                <button onClick={() => { setMotivoModal({ tipo: 'justificar', lesson: viewingLesson }); setMotivoTexto(''); setMotivoTag(''); }}",
 "                <button onClick={() => { setMotivoModal({ tipo: 'justificar', lesson: viewingLesson }); setMotivoTexto(''); setMotivoTag(''); setProfessorLiberado(false); }}"),

("components/views/operations/SchoolCalendar.tsx",
 "                <button onClick={() => { setMotivoModal({ tipo: 'falta', lesson: viewingLesson }); setMotivoTexto(''); setMotivoTag(''); }}",
 "                <button onClick={() => { setMotivoModal({ tipo: 'falta', lesson: viewingLesson }); setMotivoTexto(''); setMotivoTag(''); setProfessorLiberado(false); }}"),

("components/views/operations/SchoolCalendar.tsx",
"""                <textarea value={motivoTexto} onChange={e => setMotivoTexto(e.target.value)} rows={3} placeholder="Detalhes adicionais..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>""",
"""                <textarea value={motivoTexto} onChange={e => setMotivoTexto(e.target.value)} rows={3} placeholder="Detalhes adicionais..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              {motivoModal.tipo === 'falta' && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={professorLiberado} onChange={e => setProfessorLiberado(e.target.checked)} className="w-4 h-4" />
                    <span className="text-xs font-bold text-gray-700">Professor(a) foi liberado(a) (NÃO conta pra pagamento)</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1 ml-6">Deixe desmarcado se ela ficou trabalhando nesse horário — aí conta normalmente.</p>
                </div>
              )}
            </div>"""),

("components/views/operations/SchoolCalendar.tsx",
 "                  await supabase.from('schedules').update({ attendance_status: 'falta', status: 'falta_confirmada', motivo_falta: motivoFinal, reposicao_pendente: false }).eq('id', lesson.id);",
 "                  await supabase.from('schedules').update({ attendance_status: 'falta', status: 'falta_confirmada', motivo_falta: motivoFinal, reposicao_pendente: false, professor_liberado: professorLiberado }).eq('id', lesson.id);"),
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
