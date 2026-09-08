fixes = [
("components/views/operations/SchoolCalendar.tsx",
"""  const [substData, setSubstData] = useState({ professor_id: '', motivo: '' });""",
"""  const [substData, setSubstData] = useState({ professor_id: '', motivo: '' });
  const [showSubstAlunoModal, setShowSubstAlunoModal] = useState(false);
  const [substAlunoData, setSubstAlunoData] = useState({ novo_aluno_id: '', motivo_tag: '', motivo_texto: '', tipo: 'justificada' as 'justificada' | 'falta' });"""),

("components/views/operations/SchoolCalendar.tsx",
"""  const substituirProfessor = async () => {""",
"""  const substituirAluno = async () => {
    if (!substAlunoData.novo_aluno_id || !selectedLesson) return;
    setSavingSubst(true);
    try {
      const novoAluno = students.find(s => s.id === substAlunoData.novo_aluno_id);
      const motivoFinal = substAlunoData.motivo_tag + (substAlunoData.motivo_texto ? (substAlunoData.motivo_tag ? ' - ' : '') + substAlunoData.motivo_texto : '');
      await supabase.from('schedules').update({
        attendance_status: substAlunoData.tipo,
        status: substAlunoData.tipo === 'falta' ? 'falta_confirmada' : selectedLesson.status,
        motivo_falta: motivoFinal,
        notes: (selectedLesson.notes || '') + ' | Substituido por ' + novoAluno?.name,
      }).eq('id', selectedLesson.id);
      await supabase.from('schedules').insert({
        date: selectedLesson.date,
        start_time: (selectedLesson as any).start_time,
        end_time: (selectedLesson as any).end_time,
        teacher_id: selectedLesson.teacher_id,
        teacher_name: selectedLesson.teacher_name,
        subject: selectedLesson.subject,
        student_id: substAlunoData.novo_aluno_id,
        student_name: novoAluno?.name,
        status: vinculosSelecionados.length > 0 ? 'reposicao_marcada' : 'confirmado',
        reposicao_de_ids: vinculosSelecionados.length > 0 ? vinculosSelecionados : null,
        notes: 'Substituindo ' + selectedLesson.student_name + ' (' + motivoFinal + ')',
      });
      for (const vincId of vinculosSelecionados) {
        await supabase.from('schedules').update({ reposicao_pendente: false, status: 'reposicao_marcada' }).eq('id', vincId);
      }
      toast.success('Aluno substituido, historico preservado!');
      setShowSubstAlunoModal(false);
      setSelectedLesson(null);
      setEditingLesson(null);
      setSubstAlunoData({ novo_aluno_id: '', motivo_tag: '', motivo_texto: '', tipo: 'justificada' });
      setReposicoesPendentesDetectadas([]);
      setVinculosSelecionados([]);
      fetchLessons();
    } catch (e) {
      toast.error('Erro ao substituir aluno');
    } finally {
      setSavingSubst(false);
    }
  };

  const substituirProfessor = async () => {"""),

("components/views/operations/SchoolCalendar.tsx",
"""              <button onClick={() => { setShowSubstModal(true); if (selectedLesson) checkReposicaoPendente([{ id: (selectedLesson as any).student_id || '', name: selectedLesson.student_name || '' }]); }} className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all">Substituir</button>""",
"""              <button onClick={() => { setShowSubstModal(true); if (selectedLesson) checkReposicaoPendente([{ id: (selectedLesson as any).student_id || '', name: selectedLesson.student_name || '' }]); }} className="px-3 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all">Subst. Professor</button>
              <button onClick={() => setShowSubstAlunoModal(true)} className="px-3 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all">Subst. Aluno</button>"""),

("components/views/operations/SchoolCalendar.tsx",
"""              <button onClick={substituirProfessor} disabled={savingSubst || !substData.professor_id}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {savingSubst ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {savingSubst ? 'Substituindo...' : 'Confirmar Substituicao'}
              </button>
            </div>
          </div>
        </div>
      )}""",
"""              <button onClick={substituirProfessor} disabled={savingSubst || !substData.professor_id}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {savingSubst ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {savingSubst ? 'Substituindo...' : 'Confirmar Substituicao'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubstAlunoModal && selectedLesson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900">Substituir Aluno</h3>
              <button onClick={() => { setShowSubstAlunoModal(false); setReposicoesPendentesDetectadas([]); setVinculosSelecionados([]); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl text-sm">
                <p className="font-bold text-blue-700">Aula: {selectedLesson.subject}</p>
                <p className="text-blue-600 text-xs mt-1">{new Date(selectedLesson.date + 'T00:00:00').toLocaleDateString('pt-BR')} · Prof: {selectedLesson.teacher_name}</p>
                <p className="text-blue-600 text-xs">Aluno atual: {selectedLesson.student_name} (fica marcado, não é apagado)</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Motivo da ausência de {selectedLesson.student_name}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Atestado medico', 'Avisou com antecedencia', 'Faltou sem aviso', 'Compromisso familiar', 'Outro'].map(tag => (
                    <button key={tag} type="button" onClick={() => setSubstAlunoData(d => ({ ...d, motivo_tag: tag }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${substAlunoData.motivo_tag === tag ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
                <textarea rows={2} value={substAlunoData.motivo_texto} onChange={e => setSubstAlunoData(d => ({ ...d, motivo_texto: e.target.value }))}
                  placeholder="Detalhes adicionais..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Marcar aula original como</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSubstAlunoData(d => ({ ...d, tipo: 'justificada' }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border ${substAlunoData.tipo === 'justificada' ? 'bg-yellow-500 text-white border-yellow-500' : 'border-gray-200 text-gray-600'}`}>Justificada</button>
                  <button type="button" onClick={() => setSubstAlunoData(d => ({ ...d, tipo: 'falta' }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border ${substAlunoData.tipo === 'falta' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600'}`}>Falta</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Novo Aluno (vai usar esse horário) *</label>
                <select value={substAlunoData.novo_aluno_id} onChange={e => {
                  const id = e.target.value;
                  setSubstAlunoData(d => ({ ...d, novo_aluno_id: id }));
                  const st = students.find(s => s.id === id);
                  if (st) checkReposicaoPendente([{ id: st.id, name: st.name }]);
                }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option value="">Selecione o aluno...</option>
                  {students.filter(s => s.id !== (selectedLesson as any).student_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {reposicoesPendentesDetectadas.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  {reposicoesPendentesDetectadas.map((rep: any) => (
                    <div key={rep.id}>
                      <p className="text-xs font-bold text-amber-700">
                        {rep.student_name} tem uma reposicao pendente: aula de {new Date(rep.date + 'T00:00:00').toLocaleDateString('pt-BR')} com {rep.teacher_name}.
                      </p>
                      <label className="flex items-center gap-2 mt-1 text-xs font-bold text-amber-700 cursor-pointer">
                        <input type="checkbox" checked={vinculosSelecionados.includes(rep.id)}
                          onChange={e => setVinculosSelecionados(v => e.target.checked ? [...v, rep.id] : v.filter(id => id !== rep.id))} />
                        Esta aula e a reposicao dessa aula pendente
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowSubstAlunoModal(false); setReposicoesPendentesDetectadas([]); setVinculosSelecionados([]); }} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={substituirAluno} disabled={savingSubst || !substAlunoData.novo_aluno_id}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {savingSubst ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {savingSubst ? 'Substituindo...' : 'Confirmar Substituicao'}
              </button>
            </div>
          </div>
        </div>
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
