'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, AlertTriangle, Plus, X, Search, Calendar, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PAYMENT_METHODS = ['PIX','Boleto','Cartão de Crédito','Cartão de Débito','Dinheiro','Transferência'];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FinanceView() {
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'entradas' | 'saidas' | 'projecao'>('overview');
  const [filterMonth, setFilterMonth] = useState(MONTHS[new Date().getMonth()]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showPayModal, setShowPayModal] = useState<any>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPayExpenseModal, setShowPayExpenseModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [generateFrom, setGenerateFrom] = useState(MONTHS[new Date().getMonth()]);
  const [generateTo, setGenerateTo] = useState('Dezembro');
  const [expenseForm, setExpenseForm] = useState({
    category_name: '',
    description: '',
    amount: 0,
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    due_date: '',
    is_recurring: false,
  });

  useEffect(() => { fetchData(); }, [filterMonth, filterYear]);

  const fetchData = async () => {
    setLoading(true);
    const [paymentsRes, expensesRes, categoriesRes, studentsRes] = await Promise.all([
      supabase.from('monthly_payments').select('*').order('due_date'),
      supabase.from('expenses').select('*').order('due_date'),
      supabase.from('expense_categories').select('*').order('name'),
      supabase.from('students').select('id, name, monthly_value').order('name'),
    ]);
    setPayments(paymentsRes.data || []);
    setExpenses(expensesRes.data || []);
    setCategories(categoriesRes.data || []);
    setStudents(studentsRes.data || []);
    setLoading(false);
  };

  // Filtra por mês/ano
  const monthPayments = payments.filter(p => p.month === filterMonth && p.year === filterYear);
  const monthExpenses = expenses.filter(e => e.month === filterMonth && e.year === filterYear);

  // KPIs do mês
  const totalEntradas = monthPayments.reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
  const totalRecebido = monthPayments.filter(p => p.status === 'paid').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
  const totalPendente = monthPayments.filter(p => p.status === 'pending').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
  const totalAtrasado = monthPayments.filter(p => p.status === 'overdue').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
  const totalSaidas = monthExpenses.reduce((a, e) => a + (e.amount || 0), 0);
  const totalPago = monthExpenses.filter(e => e.status === 'paid').reduce((a, e) => a + (e.amount || 0), 0);
  const resultado = totalRecebido - totalPago;
  const resultadoPrevisto = totalEntradas - totalSaidas;

  // Gerar mensalidades por período
  const generatePeriod = async () => {
    setGenerating(true);
    try {
      const fromIdx = MONTHS.indexOf(generateFrom);
      const toIdx = MONTHS.indexOf(generateTo);
      let totalCreated = 0;

      for (let i = fromIdx; i <= toIdx; i++) {
        const month = MONTHS[i];
        const existing = payments.filter(p => p.month === month && p.year === filterYear && !p.is_extra);
        const existingIds = new Set(existing.map(p => p.student_id));
        const toCreate = students.filter(s => !existingIds.has(s.id));

        if (toCreate.length > 0) {
          const dueDate = `${filterYear}-${String(i + 1).padStart(2, '0')}-07`;
          const inserts = toCreate.map(s => ({
            student_id: s.id,
            student_name: s.name,
            month,
            year: filterYear,
            amount: s.monthly_value || 0,
            discount: 0,
            final_amount: s.monthly_value || 0,
            due_date: dueDate,
            status: new Date() > new Date(dueDate) ? 'overdue' : 'pending',
            is_extra: false,
            created_at: new Date().toISOString(),
          }));
          await supabase.from('monthly_payments').insert(inserts);
          totalCreated += inserts.length;
        }
      }

      toast.success(`${totalCreated} mensalidade(s) gerada(s)! ✅`);
      setShowGenerateModal(false);
      fetchData();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally { setGenerating(false); }
  };

  const markAsPaid = async () => {
    if (!showPayModal) return;
    setSaving(true);
    try {
      await supabase.from('monthly_payments').update({ status: 'paid', paid_date: paymentDate, payment_method: paymentMethod }).eq('id', showPayModal.id);
      toast.success('Pagamento registrado! ✅');
      setShowPayModal(null);
      fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  const markExpenseAsPaid = async () => {
    if (!showPayExpenseModal) return;
    setSaving(true);
    try {
      await supabase.from('expenses').update({ status: 'paid', paid_date: paymentDate }).eq('id', showPayExpenseModal.id);
      toast.success('Despesa paga! ✅');
      setShowPayExpenseModal(null);
      fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  const saveExpense = async () => {
    setSaving(true);
    try {
      await supabase.from('expenses').insert({ ...expenseForm, status: 'pending', created_at: new Date().toISOString() });
      toast.success('Despesa registrada! ✅');
      setShowExpenseModal(false);
      fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  // Projeção dos próximos 6 meses
  const currentMonthIdx = MONTHS.indexOf(filterMonth);
  const projection = Array.from({ length: 6 }, (_, i) => {
    const idx = (currentMonthIdx + i) % 12;
    const year = filterYear + Math.floor((currentMonthIdx + i) / 12);
    const month = MONTHS[idx];
    const monthP = payments.filter(p => p.month === month && p.year === year);
    const monthE = expenses.filter(e => e.month === month && e.year === year);
    const entradas = monthP.reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
    const saidas = monthE.reduce((a, e) => a + (e.amount || 0), 0);
    const recebido = monthP.filter(p => p.status === 'paid').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
    return { month, year, entradas, saidas, resultado: entradas - saidas, recebido, isPast: i === 0 };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Filtro de mês */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="number" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
            className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold w-24 focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <button onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
          <Plus size={16} /> Gerar Mensalidades
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Receita Prevista', value: fmt(totalEntradas), sub: `${monthPayments.length} alunos`, color: 'text-purple-600', bg: 'bg-purple-50', icon: TrendingUp },
          { label: 'Recebido', value: fmt(totalRecebido), sub: `${monthPayments.filter(p=>p.status==='paid').length} pagos`, color: 'text-green-600', bg: 'bg-green-50', icon: ArrowUpRight },
          { label: 'Despesas', value: fmt(totalSaidas), sub: `${monthExpenses.length} lançamentos`, color: 'text-red-600', bg: 'bg-red-50', icon: ArrowDownRight },
          { label: resultado >= 0 ? 'Lucro do Mês' : 'Prejuízo do Mês', value: fmt(Math.abs(resultado)), sub: resultado >= 0 ? '✅ Positivo' : '⚠️ Negativo', color: resultado >= 0 ? 'text-green-600' : 'text-red-600', bg: resultado >= 0 ? 'bg-green-50' : 'bg-red-50', icon: BarChart3 },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1 flex-wrap">
            {[
              { key: 'overview', label: '📊 Resumo' },
              { key: 'entradas', label: `💚 Entradas (${monthPayments.length})` },
              { key: 'saidas', label: `🔴 Saídas (${monthExpenses.length})` },
              { key: 'projecao', label: '📈 Projeção' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'saidas' && (
            <button onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">
              <Plus size={16} /> Nova Despesa
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="p-4">
            {/* RESUMO */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Entradas resumo */}
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                    <h3 className="font-black text-green-800 mb-3 flex items-center gap-2"><ArrowUpRight size={16} /> Entradas — {filterMonth}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-600">Previsto</span><span className="font-black text-gray-900">{fmt(totalEntradas)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-green-600">Recebido</span><span className="font-black text-green-600">{fmt(totalRecebido)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-yellow-600">Pendente</span><span className="font-black text-yellow-600">{fmt(totalPendente)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-red-600">Atrasado</span><span className="font-black text-red-600">{fmt(totalAtrasado)}</span></div>
                    </div>
                  </div>
                  {/* Saídas resumo */}
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                    <h3 className="font-black text-red-800 mb-3 flex items-center gap-2"><ArrowDownRight size={16} /> Saídas — {filterMonth}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-600">Total Previsto</span><span className="font-black text-gray-900">{fmt(totalSaidas)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-red-600">Pago</span><span className="font-black text-red-600">{fmt(totalPago)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-yellow-600">A Pagar</span><span className="font-black text-yellow-600">{fmt(totalSaidas - totalPago)}</span></div>
                    </div>
                    {/* Por categoria */}
                    <div className="mt-3 pt-3 border-t border-red-100 space-y-1">
                      {Object.entries(monthExpenses.reduce((acc: any, e) => {
                        acc[e.category_name] = (acc[e.category_name] || 0) + e.amount;
                        return acc;
                      }, {})).map(([cat, val]: any) => (
                        <div key={cat} className="flex justify-between text-xs"><span className="text-gray-500">{cat}</span><span className="font-bold text-gray-700">{fmt(val)}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Resultado */}
                <div className={`p-5 rounded-2xl border ${resultado >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Resultado do Mês</p>
                      <p className={`text-3xl font-black mt-1 ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>{resultado >= 0 ? '+' : ''}{fmt(resultado)}</p>
                      <p className="text-xs text-gray-400 mt-1">Previsto: {fmt(resultadoPrevisto)}</p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${resultado >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {resultado >= 0 ? <TrendingUp size={32} className="text-green-600" /> : <TrendingDown size={32} className="text-red-600" />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ENTRADAS */}
            {activeTab === 'entradas' && (
              <div className="space-y-2">
                {monthPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">Clique em "Gerar Mensalidades" para começar!</p>
                  </div>
                ) : monthPayments.map(payment => {
                  const statusConfig = payment.status === 'paid' ? { label: 'Pago', color: 'bg-green-100 text-green-700' } : payment.status === 'overdue' ? { label: 'Atrasado', color: 'bg-red-100 text-red-700' } : { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' };
                  return (
                    <div key={payment.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all flex-wrap">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black shrink-0">
                        {payment.student_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{payment.student_name}</p>
                          {payment.is_extra && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">Extra</span>}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>
                        <div className="flex gap-3 mt-1 flex-wrap text-xs text-gray-400">
                          {payment.due_date && <span>Vence: {new Date(payment.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                          {payment.paid_date && <span className="text-green-500">Pago: {new Date(payment.paid_date + 'T00:00:00').toLocaleDateString('pt-BR')} • {payment.payment_method}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="font-black text-gray-900">{fmt(payment.final_amount || payment.amount)}</p>
                        {payment.status !== 'paid' && (
                          <button onClick={() => setShowPayModal(payment)}
                            className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all">
                            Marcar Pago
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SAÍDAS */}
            {activeTab === 'saidas' && (
              <div className="space-y-2">
                {monthExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowDownRight size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">Nenhuma despesa registrada para este mês.</p>
                    <button onClick={() => setShowExpenseModal(true)} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all">
                      Adicionar Despesa
                    </button>
                  </div>
                ) : monthExpenses.map(expense => (
                  <div key={expense.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-black shrink-0 text-xs">
                      {expense.category_name?.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{expense.description || expense.category_name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">{expense.category_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${expense.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {expense.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                      {expense.due_date && <p className="text-xs text-gray-400 mt-1">Vence: {new Date(expense.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-black text-red-600">{fmt(expense.amount)}</p>
                      {expense.status !== 'paid' && (
                        <button onClick={() => setShowPayExpenseModal(expense)}
                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all">
                          Marcar Pago
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PROJEÇÃO */}
            {activeTab === 'projecao' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 font-bold mb-4">Projeção dos próximos 6 meses baseada nos dados cadastrados</p>
                {projection.map((p, i) => (
                  <div key={i} className={`p-4 rounded-xl border transition-all ${i === 0 ? 'border-purple-200 bg-purple-50' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-black text-gray-900">{p.month} {p.year}</p>
                        {i === 0 && <span className="text-[10px] text-purple-600 font-bold">MÊS ATUAL</span>}
                      </div>
                      <div className="flex gap-6 flex-wrap">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Entradas</p>
                          <p className="font-black text-green-600">{fmt(p.entradas)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Saídas</p>
                          <p className="font-black text-red-600">{fmt(p.saidas)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Resultado</p>
                          <p className={`font-black ${p.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(p.resultado)}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-black ${p.resultado >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.resultado >= 0 ? '✅ Lucro' : '⚠️ Prejuízo'}
                      </div>
                    </div>
                    {/* Barra de progresso */}
                    {p.entradas > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Recebido: {fmt(p.recebido)}</span>
                          <span>{Math.round((p.recebido / p.entradas) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min((p.recebido / p.entradas) * 100, 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Gerar Mensalidades */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Gerar Mensalidades</h2>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Selecione o período para gerar as mensalidades de todos os alunos automaticamente.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">De</label>
                  <select value={generateFrom} onChange={e => setGenerateFrom(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Até</label>
                  <select value={generateTo} onChange={e => setGenerateTo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <p className="text-xs text-purple-700 font-bold">
                  Serão geradas mensalidades para <span className="font-black">{students.length} aluno(s)</span> de {generateFrom} a {generateTo} de {filterYear}.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={generatePeriod} disabled={generating}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
                {generating ? 'Gerando...' : 'Gerar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Marcar Pago (entrada) */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Registrar Pagamento</h2>
              <button onClick={() => setShowPayModal(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-2xl">
                <p className="font-black text-gray-900">{showPayModal.student_name}</p>
                <p className="text-sm text-gray-500">{showPayModal.month} {showPayModal.year} — {fmt(showPayModal.final_amount || showPayModal.amount)}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Data do Pagamento</label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Forma de Pagamento</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${paymentMethod === m ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPayModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={markAsPaid} disabled={saving}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Despesa */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Nova Despesa</h2>
              <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Categoria</label>
                <select value={expenseForm.category_name} onChange={e => setExpenseForm(f => ({ ...f, category_name: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Descrição</label>
                <input type="text" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Salário maio - Prof. L. Silva"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Valor (R$)</label>
                  <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Vencimento</label>
                  <input type="date" value={expenseForm.due_date} onChange={e => setExpenseForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Mês</label>
                  <select value={expenseForm.month} onChange={e => setExpenseForm(f => ({ ...f, month: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" id="recurring" checked={expenseForm.is_recurring} onChange={e => setExpenseForm(f => ({ ...f, is_recurring: e.target.checked }))}
                    className="w-5 h-5 accent-purple-600" />
                  <label htmlFor="recurring" className="text-sm font-bold text-gray-700">Recorrente</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={saveExpense} disabled={saving || !expenseForm.category_name || !expenseForm.amount}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagar Despesa */}
      {showPayExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Confirmar Pagamento</h2>
              <button onClick={() => setShowPayExpenseModal(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl mb-4">
              <p className="font-black text-gray-900">{showPayExpenseModal.description || showPayExpenseModal.category_name}</p>
              <p className="text-sm text-gray-500">{fmt(showPayExpenseModal.amount)}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Data do Pagamento</label>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPayExpenseModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={markExpenseAsPaid} disabled={saving}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
