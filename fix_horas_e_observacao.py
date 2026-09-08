fixes = [
("components/views/AbsencesView.tsx",
"""  // Aula marcada (presenca/falta/justificada/feriado ja gravado) conta. Aula em feriado cadastrado
  // que AINDA nao foi marcada tambem conta automaticamente (grade fixa), e vira 'feriado' gravado ao confirmar o pagamento.
  const pagaveisMarcadas = pagamentoBase.filter((s: any) => !!s.attendance_status);
  const pagaveisFeriadoNovo = pagamentoBase.filter((s: any) => !s.attendance_status && isFeriado(s.date));
  const pagaveis = [...pagaveisMarcadas, ...pagaveisFeriadoNovo];
  const pagPresentes = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'presente').length;
  const pagJustificadas = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'justificada').length;
  const pagFaltas = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'falta').length;
  const pagFeriados = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'feriado').length + pagaveisFeriadoNovo.length;
  const pagSemMarcacaoLista = pagamentoBase.filter((s: any) => !s.attendance_status && s.date < hojeStr && !isFeriado(s.date));
  const pagSemMarcacao = pagSemMarcacaoLista.length;
  const gradeMensal = (selectedTeacher?.weekly_lessons || 0) * 4;
  const valorMensal = Number(selectedTeacher?.monthly_value) || 0;
  const valorPorAula = gradeMensal > 0 ? valorMensal / gradeMensal : 0;
  const valorCalculado = pagaveis.length * valorPorAula;
  const fmtMoeda = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });""",
"""  // Aula marcada (presenca/justificada/feriado ja gravado) conta. Falta so conta se a professora
  // NAO foi liberada (ficou trabalhando). Aula em feriado cadastrado sem marcacao tambem conta
  // automaticamente (grade fixa), e vira 'feriado' gravado ao confirmar o pagamento.
  const pagaveisMarcadas = pagamentoBase.filter((s: any) => {
    if (!s.attendance_status) return false;
    const st = (s.attendance_status || '').toLowerCase();
    if (st === 'falta' && s.professor_liberado) return false; // liberada -> nao conta
    return true;
  });
  const pagLiberadas = pagamentoBase.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'falta' && s.professor_liberado).length;
  const pagaveisFeriadoNovo = pagamentoBase.filter((s: any) => !s.attendance_status && isFeriado(s.date));
  const pagaveis = [...pagaveisMarcadas, ...pagaveisFeriadoNovo];
  const pagPresentes = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'presente').length;
  const pagJustificadas = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'justificada').length;
  const pagFaltas = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'falta').length;
  const pagFeriados = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'feriado').length + pagaveisFeriadoNovo.length;
  const pagSemMarcacaoLista = pagamentoBase.filter((s: any) => !s.attendance_status && s.date < hojeStr && !isFeriado(s.date));
  const pagSemMarcacao = pagSemMarcacaoLista.length;
  // Nem toda aula dura 1h - calcula pelo tempo real (1h30 conta 1.5x, por exemplo).
  const getDuracaoHoras = (s: any) => {
    if (!s.start_time || !s.end_time) return 1;
    const [h1, m1] = s.start_time.split(':').map(Number);
    const [h2, m2] = s.end_time.split(':').map(Number);
    const min = (h2 * 60 + m2) - (h1 * 60 + m1);
    return min > 0 ? min / 60 : 1;
  };
  const totalHoras = pagaveis.reduce((acc: number, s: any) => acc + getDuracaoHoras(s), 0);
  const gradeMensal = (selectedTeacher?.weekly_lessons || 0) * 4;
  const valorMensal = Number(selectedTeacher?.monthly_value) || 0;
  const valorPorAula = gradeMensal > 0 ? valorMensal / gradeMensal : 0; // valor de 1 aula padrao (1h) = valor por hora
  const valorCalculado = totalHoras * valorPorAula;
  const fmtMoeda = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });"""),

("components/views/AbsencesView.tsx",
 """              {pagaveis.length} aula(s) pagável(is) nesse filtro · {fmtMoeda(valorCalculado)} calculado pra {selectedTeacher?.name}""",
 """              {pagaveis.length} aula(s) ({totalHoras.toFixed(1)}h) pagável(is) nesse filtro · {fmtMoeda(valorCalculado)} calculado pra {selectedTeacher?.name}"""),

("components/views/AbsencesView.tsx",
 """              <p className="font-bold text-gray-800">{pagaveis.length} aula(s) no filtro atual (presentes: {pagPresentes}, justificadas: {pagJustificadas}, faltas: {pagFaltas}, feriados: {pagFeriados})</p>""",
 """              <p className="font-bold text-gray-800">{pagaveis.length} aula(s) / {totalHoras.toFixed(1)}h no filtro atual (presentes: {pagPresentes}, justificadas: {pagJustificadas}, faltas: {pagFaltas}, feriados: {pagFeriados})</p>
              {pagLiberadas > 0 && <p className="text-gray-500 mt-1">{pagLiberadas} falta(s) com professora liberada — não entram na conta.</p>}"""),

("components/views/AbsencesView.tsx",
"""                      {attendance && <span className={`text-[10px] font-black ${attendance.color}`}>{attendance.label}</span>}
                      {s.reposicao_pendente && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Reposicao Pendente</span>}
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap text-xs text-gray-400">
                      {s.date && <span className="flex items-center gap-1"><Calendar size={11} />{new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      {s.start_time && <span className="flex items-center gap-1"><Clock size={11} />{s.start_time}{s.end_time ? ' - ' + s.end_time : ''}</span>}
                      {s.student_name && <span className="flex items-center gap-1"><User size={11} />{s.student_name}</span>}
                      {s.teacher_name && <span>Prof: {s.teacher_name}</span>}
                    </div>""",
"""                      {attendance && <span className={`text-[10px] font-black ${attendance.color}`}>{attendance.label}</span>}
                      {s.status === 'falta_confirmada' && s.professor_liberado && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Professora Liberada</span>}
                      {s.reposicao_pendente && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Reposicao Pendente</span>}
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap text-xs text-gray-400">
                      {s.date && <span className="flex items-center gap-1"><Calendar size={11} />{new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      {s.start_time && <span className="flex items-center gap-1"><Clock size={11} />{s.start_time}{s.end_time ? ' - ' + s.end_time : ''}</span>}
                      {s.student_name && <span className="flex items-center gap-1"><User size={11} />{s.student_name}</span>}
                      {s.teacher_name && <span>Prof: {s.teacher_name}</span>}
                    </div>
                    {s.motivo_falta && (
                      <div className="mt-1 text-xs text-gray-500">📝 {s.motivo_falta}</div>
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
