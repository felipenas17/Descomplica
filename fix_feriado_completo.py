fixes = [
("components/views/AbsencesView.tsx",
 "  const [savingRemarcar, setSavingRemarcar] = useState(false);",
 """  const [savingRemarcar, setSavingRemarcar] = useState(false);
  const [feriados, setFeriados] = useState<any[]>([]);"""),

("components/views/AbsencesView.tsx",
"""  const fetchData = async () => {
    setLoading(true);
    const [schedulesRes, teachersRes] = await Promise.all([
      supabase.from('schedules').select('*').order('date', { ascending: false }),
      supabase.from('teachers').select('id, name, weekly_lessons, monthly_value, payment_method, pix_key').order('name'),
    ]);
    setSchedules(schedulesRes.data || []);
    setTeachers(teachersRes.data || []);
    setLoading(false);""",
"""  const fetchData = async () => {
    setLoading(true);
    const [schedulesRes, teachersRes, feriadosRes] = await Promise.all([
      supabase.from('schedules').select('*').order('date', { ascending: false }),
      supabase.from('teachers').select('id, name, weekly_lessons, monthly_value, payment_method, pix_key').order('name'),
      supabase.from('feriados').select('data, recorrente, titulo'),
    ]);
    setSchedules(schedulesRes.data || []);
    setTeachers(teachersRes.data || []);
    setFeriados(feriadosRes.data || []);
    setLoading(false);"""),

("components/views/AbsencesView.tsx",
"""  const pagaveis = pagamentoBase.filter((s: any) => !!s.attendance_status);
  const pagPresentes = pagaveis.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'presente').length;
  const pagJustificadas = pagaveis.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'justificada').length;
  const pagFaltas = pagaveis.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'falta').length;
  const pagSemMarcacaoLista = pagamentoBase.filter((s: any) => !s.attendance_status && s.date < hojeStr);
  const pagSemMarcacao = pagSemMarcacaoLista.length;""",
"""  const isFeriado = (dateStr: string) => {
    const [, m, d] = dateStr.split('-');
    return feriados.some((f: any) => {
      if (!f.data) return false;
      const [, fm, fd] = f.data.split('-');
      return f.recorrente ? (fm === m && fd === d) : f.data === dateStr;
    });
  };
  // Aula marcada (presenca/falta/justificada/feriado ja gravado) conta. Aula em feriado cadastrado
  // que AINDA nao foi marcada tambem conta automaticamente (grade fixa), e vira 'feriado' gravado ao confirmar o pagamento.
  const pagaveisMarcadas = pagamentoBase.filter((s: any) => !!s.attendance_status);
  const pagaveisFeriadoNovo = pagamentoBase.filter((s: any) => !s.attendance_status && isFeriado(s.date));
  const pagaveis = [...pagaveisMarcadas, ...pagaveisFeriadoNovo];
  const pagPresentes = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'presente').length;
  const pagJustificadas = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'justificada').length;
  const pagFaltas = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'falta').length;
  const pagFeriados = pagaveisMarcadas.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'feriado').length + pagaveisFeriadoNovo.length;
  const pagSemMarcacaoLista = pagamentoBase.filter((s: any) => !s.attendance_status && s.date < hojeStr && !isFeriado(s.date));
  const pagSemMarcacao = pagSemMarcacaoLista.length;"""),

("components/views/AbsencesView.tsx",
"""  const registrarPagamentoAulas = async () => {
    if (!selectedTeacher || !payAmount) return;
    setSavingPay(true);
    const amount = parseFloat(payAmount);
    const { data: paymentData, error } = await supabase.from('teacher_payments').insert({""",
"""  const registrarPagamentoAulas = async () => {
    if (!selectedTeacher || !payAmount) return;
    setSavingPay(true);
    if (pagaveisFeriadoNovo.length > 0) {
      await supabase.from('schedules').update({ attendance_status: 'feriado' }).in('id', pagaveisFeriadoNovo.map((s: any) => s.id));
    }
    const amount = parseFloat(payAmount);
    const { data: paymentData, error } = await supabase.from('teacher_payments').insert({"""),

("components/views/AbsencesView.tsx",
"""  const getAttendanceLabel = (s: any) => {
    if (s.attendance_status === 'Presente' || s.attendance_status === 'presente') return { label: 'Presente', color: 'text-green-600' };
    if (s.status === 'falta_confirmada') return { label: 'Falta Confirmada', color: 'bg-red-100 text-red-700' };
    if (s.attendance_status === 'falta' || s.attendance_status === 'Ausente') return { label: 'Falta', color: 'text-red-600' };
    if (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') return { label: 'Justificada', color: 'text-yellow-600' };
    return null;
  };""",
"""  const getAttendanceLabel = (s: any) => {
    if (s.attendance_status === 'Presente' || s.attendance_status === 'presente') return { label: 'Presente', color: 'text-green-600' };
    if (s.status === 'falta_confirmada') return { label: 'Falta Confirmada', color: 'bg-red-100 text-red-700' };
    if (s.attendance_status === 'falta' || s.attendance_status === 'Ausente') return { label: 'Falta', color: 'text-red-600' };
    if (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') return { label: 'Justificada', color: 'text-yellow-600' };
    if (s.attendance_status === 'feriado') return { label: 'Feriado', color: 'text-purple-600' };
    return null;
  };"""),

("components/views/AbsencesView.tsx",
"""      const st = s.status==='reposicao_concluida'?'Concluida':(s.status==='concluido'&&s.admin_confirmed)?'Concluida':s.attendance_status==='falta'?'Falta':(s.reposicao_pendente||s.status==='reposicao_marcada')?'Reposicao':(s.attendance_status==='justificada'||s.attendance_status==='Justificada')?'Justificada':s.lesson_type==='avulsa'?'Avulsa':'Aguardando';
      const stColor = st==='Concluida'?'#D1FAE5;color:#065F46':st==='Falta'?'#FEE2E2;color:#991B1B':st==='Justificada'?'#FEF3C7;color:#92400E':st==='Reposicao'?'#DBEAFE;color:#1E40AF':'#F3F4F6;color:#374151';""",
"""      const st = s.attendance_status==='feriado'?'Feriado':s.status==='reposicao_concluida'?'Concluida':(s.status==='concluido'&&s.admin_confirmed)?'Concluida':s.attendance_status==='falta'?'Falta':(s.reposicao_pendente||s.status==='reposicao_marcada')?'Reposicao':(s.attendance_status==='justificada'||s.attendance_status==='Justificada')?'Justificada':s.lesson_type==='avulsa'?'Avulsa':'Aguardando';
      const stColor = st==='Feriado'?'#EDE9FE;color:#5B21B6':st==='Concluida'?'#D1FAE5;color:#065F46':st==='Falta'?'#FEE2E2;color:#991B1B':st==='Justificada'?'#FEF3C7;color:#92400E':st==='Reposicao'?'#DBEAFE;color:#1E40AF':'#F3F4F6;color:#374151';"""),

("components/views/AbsencesView.tsx",
"""              <p className="font-bold text-gray-800">{pagaveis.length} aula(s) no filtro atual (presentes: {pagPresentes}, justificadas: {pagJustificadas}, faltas: {pagFaltas})</p>""",
"""              <p className="font-bold text-gray-800">{pagaveis.length} aula(s) no filtro atual (presentes: {pagPresentes}, justificadas: {pagJustificadas}, faltas: {pagFaltas}, feriados: {pagFeriados})</p>"""),
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
