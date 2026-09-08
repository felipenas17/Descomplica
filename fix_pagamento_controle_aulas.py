fixes = [
("components/views/AbsencesView.tsx",
 "import { BookOpen, CheckCircle, XCircle, RefreshCw, Calendar, Search, User, Clock, X } from 'lucide-react';",
 "import { BookOpen, CheckCircle, XCircle, RefreshCw, Calendar, Search, User, Clock, X, DollarSign, Check } from 'lucide-react';"),

("components/views/AbsencesView.tsx",
 "      supabase.from('teachers').select('id, name').order('name'),",
 "      supabase.from('teachers').select('id, name, weekly_lessons, monthly_value, payment_method, pix_key').order('name'),"),

("components/views/AbsencesView.tsx",
"""  const [savingRemarcar, setSavingRemarcar] = useState(false);""",
"""  const [savingRemarcar, setSavingRemarcar] = useState(false);
  const [showPayPanel, setShowPayPanel] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [savingPay, setSavingPay] = useState(false);
  const [payDone, setPayDone] = useState(false);
  const [lastPayIds, setLastPayIds] = useState<{ paymentId: string; expenseId: string | null } | null>(null);
  const [undoingPay, setUndoingPay] = useState(false);"""),

("components/views/AbsencesView.tsx",
"""  const avulsas = base.filter(s => s.lesson_type === 'avulsa').length;""",
"""  const avulsas = base.filter(s => s.lesson_type === 'avulsa').length;

  // Base especifica pra pagamento: mesmo filtro de professora+periodo da tela,
  // mas SEM excluir reposicao_concluida (aula original justificada tambem conta pra pagamento).
  const selectedTeacher = teachers.find((t: any) => t.id === filterTeacher);
  const hojeStr = new Date().toISOString().split('T')[0];
  const pagamentoBase = schedules.filter((s: any) => {
    const matchTeacher = !filterTeacher || s.teacher_id === filterTeacher;
    const matchDateRange = (!filterDateFrom && !filterDateTo) ||
      (filterDateFrom && filterDateTo ? s.date >= filterDateFrom && s.date <= filterDateTo :
        filterDateFrom ? s.date >= filterDateFrom : s.date <= filterDateTo);
    return matchTeacher && matchDateRange;
  });
  const pagaveis = pagamentoBase.filter((s: any) => !!s.attendance_status);
  const pagPresentes = pagaveis.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'presente').length;
  const pagJustificadas = pagaveis.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'justificada').length;
  const pagFaltas = pagaveis.filter((s: any) => (s.attendance_status || '').toLowerCase() === 'falta').length;
  const pagSemMarcacao = pagamentoBase.filter((s: any) => !s.attendance_status && s.date < hojeStr).length;
  const gradeMensal = (selectedTeacher?.weekly_lessons || 0) * 4;
  const valorMensal = Number(selectedTeacher?.monthly_value) || 0;
  const valorPorAula = gradeMensal > 0 ? valorMensal / gradeMensal : 0;
  const valorCalculado = pagaveis.length * valorPorAula;
  const fmtMoeda = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });"""),

("components/views/AbsencesView.tsx",
"""  const exportarPDF = () => {""",
"""  const abrirPagamento = () => {
    setPayAmount(valorCalculado.toFixed(2));
    setPayNotes('');
    setPayDone(false);
    setLastPayIds(null);
    setShowPayPanel(true);
  };

  const registrarPagamentoAulas = async () => {
    if (!selectedTeacher || !payAmount) return;
    setSavingPay(true);
    const amount = parseFloat(payAmount);
    const { data: paymentData, error } = await supabase.from('teacher_payments').insert({
      teacher_id: selectedTeacher.id,
      teacher_name: selectedTeacher.name,
      amount,
      period_start: filterDateFrom || null,
      period_end: filterDateTo || null,
      aulas_no_periodo: pagaveis.length,
      valor_por_aula: valorPorAula || null,
      payment_method: selectedTeacher.payment_method,
      pix_key: selectedTeacher.pix_key,
      notes: payNotes,
      status: 'pago',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }).select('id').single();
    if (!error) {
      const { data: cat } = await supabase.from('expense_categories').select('id').eq('name', 'Salário Professor').maybeSingle();
      const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const dRef = new Date((filterDateTo || hojeStr) + 'T00:00:00');
      const { data: expenseData } = await supabase.from('expenses').insert({
        description: 'Pagamento ' + selectedTeacher.name + (filterDateFrom && filterDateTo ? ' (' + filterDateFrom.split('-').reverse().join('/') + ' a ' + filterDateTo.split('-').reverse().join('/') + ')' : ''),
        amount,
        category_id: cat?.id || null,
        category_name: 'Salário Professor',
        month: monthNames[dRef.getMonth()],
        year: dRef.getFullYear(),
        due_date: filterDateTo || hojeStr,
        status: 'paid',
        teacher_id: selectedTeacher.id,
        teacher_name: selectedTeacher.name,
      }).select('id').single();
      setLastPayIds({ paymentId: paymentData?.id, expenseId: expenseData?.id || null });
      setPayDone(true);
    } else {
      toast.error('Erro ao registrar pagamento: ' + error.message);
    }
    setSavingPay(false);
  };

  const desfazerPagamentoAulas = async () => {
    if (!lastPayIds) return;
    setUndoingPay(true);
    await supabase.from('teacher_payments').delete().eq('id', lastPayIds.paymentId);
    if (lastPayIds.expenseId) await supabase.from('expenses').delete().eq('id', lastPayIds.expenseId);
    setUndoingPay(false);
    setPayDone(false);
    setLastPayIds(null);
  };

  const exportarPDF = () => {"""),

("components/views/AbsencesView.tsx",
"""          <button onClick={exportarPDF}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
            Exportar PDF
          </button>
        </div>
      </div>""",
"""          <button onClick={exportarPDF}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
            Exportar PDF
          </button>
        </div>
        {filterTeacher && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-gray-500">
              {pagaveis.length} aula(s) pagável(is) nesse filtro · {fmtMoeda(valorCalculado)} calculado pra {selectedTeacher?.name}
              {pagSemMarcacao > 0 && <span className="text-yellow-600 font-bold"> · ⚠ {pagSemMarcacao} sem marcação</span>}
            </span>
            <button onClick={abrirPagamento}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all">
              <DollarSign size={14} /> Registrar Pagamento
            </button>
          </div>
        )}
      </div>

      {showPayPanel && selectedTeacher && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-gray-800">💰 Pagamento — {selectedTeacher.name}</p>
            <button onClick={() => setShowPayPanel(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-600 space-y-1">
            <p className="font-bold text-gray-800">{pagaveis.length} aula(s) no filtro atual (presentes: {pagPresentes}, justificadas: {pagJustificadas}, faltas: {pagFaltas})</p>
            <p>Grade mensal: {gradeMensal} aulas · Valor por aula: {fmtMoeda(valorPorAula)}</p>
            {pagSemMarcacao > 0 && <p className="text-yellow-600 font-bold">⚠ {pagSemMarcacao} aula(s) já aconteceram sem marcação — não contam aqui.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Valor (R$)</label>
              <input type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="w-full bg-gray-50 border border-purple-200 text-purple-700 font-bold rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observações</label>
              <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="opcional"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
          </div>
          {payDone ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm"><Check size={16} /> Pago e lançado em Saídas</div>
              <button onClick={desfazerPagamentoAulas} disabled={undoingPay}
                className="self-start px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50">
                {undoingPay ? 'Desfazendo...' : '↩ Desfazer este pagamento'}
              </button>
            </div>
          ) : (
            <button onClick={registrarPagamentoAulas} disabled={savingPay || !payAmount}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
              {savingPay ? 'Registrando...' : 'Confirmar Pagamento'}
            </button>
          )}
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
