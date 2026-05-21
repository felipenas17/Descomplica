'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, 
  Clock, Plus, X, ArrowUpRight, ArrowDownRight, BarChart3,
  Calendar, ChevronRight, Target, Zap
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PAYMENT_METHODS = ['PIX','Boleto','Cartão de Crédito','Cartão de Débito','Dinheiro','Transferência'];
const COLORS = ['#8A2BE2','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899'];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtK = (v: number) => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : fmt(v);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs">
        <p className="font-black mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinanceView() {
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entradas' | 'saidas'>('dashboard');
  const [filterMonth, setFilterMonth] = useState(MONTHS_FULL[new Date().getMonth()]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [periodMode, setPeriodMode] = useState<'month' | 'period' | 'year'>('month');
  const [periodFrom, setPeriodFrom] = useState(MONTHS_FULL[0]);
  const [periodTo, setPeriodTo] = useState(MONTHS_FULL[new Date().getMonth()]);
  const [showPayModal, setShowPayModal] = useState<any>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPayExpenseModal, setShowPayExpenseModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [generateFrom, setGenerateFrom] = useState(MONTHS_FULL[new Date().getMonth()]);
  const [generateTo, setGenerateTo] = useState('Dezembro');
  const [expenseForm, setExpenseForm] = useState({
    category_name: '', description: '', amount: 0,
    month: MONTHS_FULL[new Date().getMonth()],
    year: new Date().getFullYear(), due_date: '', is_recurring: false,
  });

  useEffect(() => { fetchData(); }, []);

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

  const monthPayments = payments.filter(p => {
    if (periodMode === 'month') return p.month === filterMonth && p.year === filterYear;
    if (periodMode === 'year') return p.year === filterYear;
    const fromIdx = MONTHS_FULL.indexOf(periodFrom);
    const toIdx = MONTHS_FULL.indexOf(periodTo);
    const mIdx = MONTHS_FULL.indexOf(p.month);
    return p.year === filterYear && mIdx >= fromIdx && mIdx <= toIdx;
  });
  const monthExpenses = expenses.filter(e => {
    if (periodMode === 'month') return e.month === filterMonth && e.year === filterYear;
    if (periodMode === 'year') return e.year === filterYear;
    const fromIdx = MONTHS_FULL.indexOf(periodFrom);
    const toIdx = MONTHS_FULL.indexOf(periodTo);
    const mIdx = MONTHS_FULL.indexOf(e.month);
    return e.year === filterYear && mIdx >= fromIdx && mIdx <= toIdx;
  });

  const totalEntradas = monthPayments.reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
  const totalRecebido = monthPayments.filter(p => p.status === 'paid').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
  const totalPendente = monthPayments.filter(p => p.status === 'pending').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
  const totalAtrasado = monthPayments.filter(p => p.status === 'overdue').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
  const totalSaidas = monthExpenses.reduce((a, e) => a + (e.amount || 0), 0);
  const totalPago = monthExpenses.filter(e => e.status === 'paid').reduce((a, e) => a + (e.amount || 0), 0);
  const resultado = totalRecebido - totalPago;
  const taxaRecebimento = totalEntradas > 0 ? Math.round((totalRecebido / totalEntradas) * 100) : 0;
  const inadimplentes = monthPayments.filter(p => p.status === 'overdue').length;

  // Gráfico fluxo anual
  const fluxoAnual = MONTHS.map((m, i) => {
    const mFull = MONTHS_FULL[i];
    const p = payments.filter(x => x.month === mFull && x.year === filterYear);
    const e = expenses.filter(x => x.month === mFull && x.year === filterYear);
    const entradas = p.reduce((a, x) => a + (x.final_amount || x.amount || 0), 0);
    const saidas = e.reduce((a, x) => a + (x.amount || 0), 0);
    const recebido = p.filter(x => x.status === 'paid').reduce((a, x) => a + (x.final_amount || x.amount || 0), 0);
    return { mes: m, entradas, saidas, recebido, resultado: recebido - saidas };
  });

  // Gráfico pizza despesas
  const expensesByCategory = Object.entries(
    monthExpenses.reduce((acc: any, e) => {
      acc[e.category_name] = (acc[e.category_name] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Projeção 6 meses
  const currentMonthIdx = MONTHS_FULL.indexOf(filterMonth);
  const projection = Array.from({ length: 6 }, (_, i) => {
    const idx = (currentMonthIdx + i) % 12;
    const year = filterYear + Math.floor((currentMonthIdx + i) / 12);
    const month = MONTHS_FULL[idx];
    const p = payments.filter(x => x.month === month && x.year === year);
    const e = expenses.filter(x => x.month === month && x.year === year);
    const entradas = p.reduce((a, x) => a + (x.final_amount || x.amount || 0), 0);
    const saidas = e.reduce((a, x) => a + (x.amount || 0), 0);
    return { mes: MONTHS[idx], entradas, saidas, resultado: entradas - saidas };
  });

  const generatePeriod = async () => {
    setGenerating(true);
    try {
      const fromIdx = MONTHS_FULL.indexOf(generateFrom);
      const toIdx = MONTHS_FULL.indexOf(generateTo);
      let totalCreated = 0;
      for (let i = fromIdx; i <= toIdx; i++) {
        const month = MONTHS_FULL[i];
        const existing = payments.filter(p => p.month === month && p.year === filterYear && !p.is_extra);
        const existingIds = new Set(existing.map(p => p.student_id));
        const toCreate = students.filter(s => !existingIds.has(s.id));
        if (toCreate.length > 0) {
          const dueDate = `${filterYear}-${String(i + 1).padStart(2, '0')}-07`;
          await supabase.from('monthly_payments').insert(toCreate.map(s => ({
            student_id: s.id, student_name: s.name, month, year: filterYear,
            amount: s.monthly_value || 0, discount: 0, final_amount: s.monthly_value || 0,
            due_date: dueDate, status: new Date() > new Date(dueDate) ? 'overdue' : 'pending',
            is_extra: false, created_at: new Date().toISOString(),
          })));
          totalCreated += toCreate.length;
        }
      }
      toast.success(`${totalCreated} mensalidade(s) gerada(s)! ✅`);
      setShowGenerateModal(false);
      fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setGenerating(false); }
  };

  const markAsPaid = async () => {
    if (!showPayModal) return;
    setSaving(true);
    try {
      await supabase.from('monthly_payments').update({ status: 'paid', paid_date: paymentDate, payment_method: paymentMethod }).eq('id', showPayModal.id);
      toast.success('Pagamento registrado! ✅');
      setShowPayModal(null); fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  const markExpenseAsPaid = async () => {
    if (!showPayExpenseModal) return;
    setSaving(true);
    try {
      await supabase.from('expenses').update({ status: 'paid', paid_date: paymentDate }).eq('id', showPayExpenseModal.id);
      toast.success('Despesa paga! ✅');
      setShowPayExpenseModal(null); fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  const saveExpense = async () => {
    setSaving(true);
    try {
      await supabase.from('expenses').insert({ ...expenseForm, status: 'pending', created_at: new Date().toISOString() });
      toast.success('Despesa registrada! ✅');
      setShowExpenseModal(false); fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm">
            {MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="number" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-bold w-24 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-200">
            <Plus size={16} /> Gerar Mensalidades
          </button>
          <button onClick={() => { setActiveTab('saidas'); setShowExpenseModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">
            <Plus size={16} /> Nova Despesa
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white shadow-xl shadow-purple-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">Receita Prevista</p>
            <TrendingUp size={18} className="text-purple-300" />
          </div>
          <p className="text-2xl font-black">{fmt(totalEntradas)}</p>
          <p className="text-xs text-purple-300 mt-1">{monthPayments.length} aluno(s)</p>
          <div className="mt-3 h-1.5 bg-purple-500 rounded-full">
            <div className="h-full bg-white rounded-full" style={{ width: `${taxaRecebimento}%` }} />
          </div>
          <p className="text-[10px] text-purple-200 mt-1">{taxaRecebimento}% recebido</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recebido</p>
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{fmt(totalRecebido)}</p>
          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
            <CheckCircle size={12} /> {monthPayments.filter(p=>p.status==='paid').length} pagamentos
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Despesas</p>
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <ArrowDownRight size={16} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{fmt(totalSaidas)}</p>
          <p className="text-xs text-red-500 mt-1">{fmt(totalPago)} pago</p>
        </div>

        <div className={`rounded-2xl p-5 border shadow-sm ${resultado >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{resultado >= 0 ? 'Lucro' : 'Prejuízo'}</p>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${resultado >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {resultado >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
            </div>
          </div>
          <p className={`text-2xl font-black ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(Math.abs(resultado))}</p>
          <p className={`text-xs mt-1 ${resultado >= 0 ? 'text-green-500' : 'text-red-500'}`}>{resultado >= 0 ? '✅ Positivo' : '⚠️ Atenção'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-gray-100 p-1 rounded-2xl shadow-sm gap-1">
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'entradas', label: `💚 Entradas (${monthPayments.length})` },
          { key: 'saidas', label: `🔴 Saídas (${monthExpenses.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-600'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Insights rápidos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Em dia', value: monthPayments.filter(p=>p.status==='paid').length, total: monthPayments.length, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Pendentes', value: monthPayments.filter(p=>p.status==='pending').length, total: monthPayments.length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: 'Inadimplentes', value: inadimplentes, total: monthPayments.length, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'A receber', value: fmt(totalPendente + totalAtrasado), total: null, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(item => (
                  <div key={item.label} className={`${item.bg} rounded-2xl p-4`}>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{item.label}</p>
                    <p className={`text-xl font-black mt-1 ${item.color}`}>{item.value}</p>
                    {item.total && <p className="text-[10px] text-gray-400 mt-0.5">de {item.total} alunos</p>}
                  </div>
                ))}
              </div>

              {/* Gráfico Fluxo Anual */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-gray-900">Evolução do Fluxo de Caixa</h3>
                    <p className="text-xs text-gray-400">Entradas vs Saídas — {filterYear}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={fluxoAnual}>
                    <defs>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#8A2BE2" strokeWidth={2} fill="url(#colorEntradas)" />
                    <Area type="monotone" dataKey="saidas" name="Saídas" stroke="#EF4444" strokeWidth={2} fill="url(#colorSaidas)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pizza despesas */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-black text-gray-900 mb-4">Despesas por Categoria</h3>
                  {expensesByCategory.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-300">
                      <div className="text-center">
                        <BarChart3 size={40} className="mx-auto mb-2" />
                        <p className="text-sm">Sem despesas registradas</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                          {expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmt(v)} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Projeção */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-black text-gray-900 mb-4">Projeção 6 Meses</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={projection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 700 }} />
                      <YAxis tickFormatter={fmtK} tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="entradas" name="Entradas" fill="#8A2BE2" radius={[4,4,0,0]} />
                      <Bar dataKey="saidas" name="Saídas" fill="#EF4444" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights Inteligentes */}
              {(() => {
                const insights = [];
                const totalAlunos = students.length;
                const receitaPorAluno = totalAlunos > 0 ? totalEntradas / totalAlunos : 0;
                const margemLucro = totalEntradas > 0 ? ((totalEntradas - totalSaidas) / totalEntradas * 100) : 0;
                const custoAluguel = monthExpenses.filter(e => e.category_name === 'Aluguel').reduce((a,e) => a+e.amount, 0);
                const pctAluguel = totalEntradas > 0 ? (custoAluguel / totalEntradas * 100) : 0;

                if (inadimplentes > 0) insights.push({ icon: '🚨', color: 'border-red-200 bg-red-50', text: `Você tem ${inadimplentes} aluno(s) inadimplente(s) — risco de ${(inadimplentes * receitaPorAluno).toLocaleString('pt-BR', {style:'currency',currency:'BRL'})} em receita.`, action: 'Enviar cobrança via WhatsApp' });
                if (pctAluguel > 40) insights.push({ icon: '⚠️', color: 'border-yellow-200 bg-yellow-50', text: `Aluguel representa ${pctAluguel.toFixed(0)}% da sua receita. Para equilibrar, você precisa de pelo menos ${Math.ceil(custoAluguel / receitaPorAluno)} alunos só para cobrir o aluguel.`, action: null });
                if (margemLucro < 20 && totalEntradas > 0) insights.push({ icon: '📉', color: 'border-orange-200 bg-orange-50', text: `Margem de lucro atual: ${margemLucro.toFixed(0)}%. Para chegar a 30%, você precisa aumentar a receita em ${((totalSaidas * 1.3 - totalEntradas)).toLocaleString('pt-BR', {style:'currency',currency:'BRL'})} ou reduzir custos.`, action: null });
                if (totalAlunos > 0 && totalAlunos < 5) insights.push({ icon: '💡', color: 'border-blue-200 bg-blue-50', text: `Com ${totalAlunos} aluno(s), focar em aulas em grupo pode aumentar sua receita sem aumentar horas trabalhadas. 1 aula dupla = 2x receita no mesmo horário.`, action: null });
                if (totalRecebido >= totalEntradas && totalEntradas > 0) insights.push({ icon: '🎉', color: 'border-green-200 bg-green-50', text: `Parabéns! 100% da receita deste período foi recebida. Ótima taxa de adimplência!`, action: null });
                if (insights.length === 0) insights.push({ icon: '✅', color: 'border-green-200 bg-green-50', text: 'Suas finanças estão saudáveis! Continue monitorando mensalmente.', action: null });

                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                      <span>🧠</span> Insights do Negócio
                    </h3>
                    <div className="space-y-3">
                      {insights.map((insight, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${insight.color} flex items-start gap-3`}>
                          <span className="text-xl shrink-0">{insight.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{insight.text}</p>
                            {insight.action && <p className="text-xs font-black text-purple-600 mt-1">→ {insight.action}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Resultado comparativo */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2"><Zap size={18} className="text-purple-500" /> Resultado Comparativo — {filterMonth}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-wider mb-2">Receitas</p>
                    <p className="text-2xl font-black text-green-700">{fmt(totalEntradas)}</p>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Recebido</span><span className="font-black text-green-600">{fmt(totalRecebido)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Pendente</span><span className="font-black text-yellow-600">{fmt(totalPendente)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Atrasado</span><span className="font-black text-red-600">{fmt(totalAtrasado)}</span></div>
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">Despesas</p>
                    <p className="text-2xl font-black text-red-700">{fmt(totalSaidas)}</p>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Pago</span><span className="font-black text-red-600">{fmt(totalPago)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-500">A pagar</span><span className="font-black text-yellow-600">{fmt(totalSaidas - totalPago)}</span></div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${resultado >= 0 ? 'bg-purple-50 border-purple-100' : 'bg-red-50 border-red-100'}`}>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider mb-2">Resultado</p>
                    <p className={`text-2xl font-black ${resultado >= 0 ? 'text-purple-700' : 'text-red-700'}`}>{resultado >= 0 ? '+' : ''}{fmt(resultado)}</p>
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${resultado >= 0 ? 'bg-purple-500' : 'bg-red-500'}`}
                          style={{ width: `${totalEntradas > 0 ? Math.min((totalRecebido/totalEntradas)*100, 100) : 0}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{taxaRecebimento}% da meta recebido</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENTRADAS */}
          {activeTab === 'entradas' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-[10px] font-black text-green-600 uppercase">Pagos</p>
                  <p className="font-black text-green-700">{fmt(totalRecebido)}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl text-center">
                  <p className="text-[10px] font-black text-yellow-600 uppercase">Pendentes</p>
                  <p className="font-black text-yellow-700">{fmt(totalPendente)}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-center">
                  <p className="text-[10px] font-black text-red-600 uppercase">Atrasados</p>
                  <p className="font-black text-red-700">{fmt(totalAtrasado)}</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {monthPayments.length === 0 ? (
                  <div className="text-center py-16">
                    <DollarSign size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">Clique em "Gerar Mensalidades" para começar!</p>
                  </div>
                ) : monthPayments.map(payment => {
                  const sc = payment.status === 'paid' ? { label: 'Pago', color: 'bg-green-100 text-green-700' } : payment.status === 'overdue' ? { label: 'Atrasado', color: 'bg-red-100 text-red-700' } : { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' };
                  return (
                    <div key={payment.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all flex-wrap">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-black shrink-0">
                        {payment.student_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{payment.student_name}</p>
                          {payment.is_extra && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">Extra</span>}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                        </div>
                        <div className="flex gap-3 mt-1 flex-wrap text-xs text-gray-400">
                          {payment.due_date && <span>Vence: {new Date(payment.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                          {payment.paid_date && <span className="text-green-500">Pago: {new Date(payment.paid_date + 'T00:00:00').toLocaleDateString('pt-BR')} • {payment.payment_method}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="font-black text-gray-900 text-lg">{fmt(payment.final_amount || payment.amount)}</p>
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
            </div>
          )}

          {/* SAÍDAS */}
          {activeTab === 'saidas' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div className="p-3 bg-red-50 rounded-xl">
                    <p className="text-[10px] font-black text-red-600 uppercase">Total Despesas</p>
                    <p className="font-black text-red-700">{fmt(totalSaidas)}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-[10px] font-black text-green-600 uppercase">Já Pago</p>
                    <p className="font-black text-green-700">{fmt(totalPago)}</p>
                  </div>
                </div>
                <button onClick={() => setShowExpenseModal(true)} className="ml-4 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all shrink-0">
                  <Plus size={16} /> Nova
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {monthExpenses.length === 0 ? (
                  <div className="text-center py-16">
                    <ArrowDownRight size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">Nenhuma despesa registrada.</p>
                    <button onClick={() => setShowExpenseModal(true)} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl text-sm font-bold">Adicionar</button>
                  </div>
                ) : monthExpenses.map(expense => (
                  <div key={expense.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-black shrink-0 text-xs">
                      {expense.category_name?.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{expense.description || expense.category_name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">{expense.category_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${expense.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {expense.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                        </span>
                      </div>
                      {expense.due_date && <p className="text-xs text-gray-400 mt-1">Vence: {new Date(expense.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-black text-red-600 text-lg">{fmt(expense.amount)}</p>
                      {expense.status !== 'paid' && (
                        <button onClick={() => setShowPayExpenseModal(expense)}
                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all">
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Gerar */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Gerar Mensalidades</h2>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Gera mensalidades para todos os <strong>{students.length} alunos</strong> no período selecionado.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">De</label>
                  <select value={generateFrom} onChange={e => setGenerateFrom(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                    {MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Até</label>
                  <select value={generateTo} onChange={e => setGenerateTo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                    {MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-700 font-bold">
                Cada aluno terá seu valor individual aplicado automaticamente.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={generatePeriod} disabled={generating}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
                {generating ? 'Gerando...' : 'Gerar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagar entrada */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Registrar Pagamento</h2>
              <button onClick={() => setShowPayModal(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl mb-4">
              <p className="font-black text-gray-900">{showPayModal.student_name}</p>
              <p className="text-2xl font-black text-green-600 mt-1">{fmt(showPayModal.final_amount || showPayModal.amount)}</p>
              <p className="text-xs text-gray-400">{showPayModal.month} {showPayModal.year}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Data</label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Forma</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${paymentMethod === m ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Comprovante <span className="text-gray-300 font-normal">(opcional)</span></label>
                <label className={`w-full border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all ${comprovante ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
                  <input type="file" accept="image/*,.pdf" onChange={e => setComprovante(e.target.files?.[0] || null)} className="hidden" />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${comprovante ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                    📎
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">{comprovante ? comprovante.name : 'Anexar comprovante'}</p>
                    <p className="text-xs text-gray-400">{comprovante ? (comprovante.size / 1024).toFixed(0) + ' KB' : 'Foto ou PDF — opcional'}</p>
                  </div>
                  {comprovante && <button type="button" onClick={e => { e.preventDefault(); setComprovante(null); }} className="ml-auto text-gray-400 hover:text-red-500">✕</button>}
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPayModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={markAsPaid} disabled={saving}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                Confirmar
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
              <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
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
                  placeholder="Ex: Salário Prof. L. Silva — Maio"
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
                    {MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="recorrente" checked={expenseForm.is_recurring} 
                      onChange={e => setExpenseForm(f => ({ ...f, is_recurring: e.target.checked, recorrente_ate: '' }))} 
                      className="w-5 h-5 accent-purple-600" />
                    <label htmlFor="recorrente" className="text-sm font-bold text-gray-700">Recorrente</label>
                  </div>
                  {expenseForm.is_recurring && (
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-2">Repetir até qual mês?</label>
                      <select value={expenseForm.recorrente_ate} 
                        onChange={e => setExpenseForm(f => ({ ...f, recorrente_ate: e.target.value }))}
                        className="w-full bg-white border border-purple-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300">
                        <option value="">Selecione o mês final...</option>
                        {MONTHS_FULL.slice(MONTHS_FULL.indexOf(expenseForm.month)).map(m => (
                          <option key={m} value={m}>{m} {expenseForm.year}</option>
                        ))}
                      </select>
                      {expenseForm.recorrente_ate && (
                        <p className="text-xs text-purple-600 font-bold mt-2">
                          ✅ Serão criadas {MONTHS_FULL.indexOf(expenseForm.recorrente_ate) - MONTHS_FULL.indexOf(expenseForm.month) + 1} despesa(s) de {expenseForm.month} até {expenseForm.recorrente_ate}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={saveExpense} disabled={saving || !expenseForm.category_name || !expenseForm.amount}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
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
              <button onClick={() => setShowPayExpenseModal(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl mb-4">
              <p className="font-black text-gray-900">{showPayExpenseModal.description || showPayExpenseModal.category_name}</p>
              <p className="text-2xl font-black text-red-600 mt-1">{fmt(showPayExpenseModal.amount)}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Data</label>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPayExpenseModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={markExpenseAsPaid} disabled={saving}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
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
