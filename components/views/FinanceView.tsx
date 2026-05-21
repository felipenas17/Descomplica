'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, AlertTriangle, Plus, X, Search, Filter, Calendar, User, TrendingUp, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PAYMENT_METHODS = ['PIX', 'Boleto', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência'];

export default function FinanceView() {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mensalidades' | 'extras' | 'historico'>('mensalidades');
  const [filterMonth, setFilterMonth] = useState(MONTHS[new Date().getMonth()]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPayModal, setShowPayModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [form, setForm] = useState({
    student_id: '',
    student_name: '',
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    amount: 0,
    discount: 0,
    due_date: '',
    notes: '',
    is_extra: false,
    extra_description: '',
  });

  useEffect(() => { fetchData(); }, [filterMonth, filterYear]);

  const fetchData = async () => {
    setLoading(true);
    const [paymentsRes, studentsRes] = await Promise.all([
      supabase.from('monthly_payments').select('*').order('due_date', { ascending: true }),
      supabase.from('students').select('id, name, parent_phone, parent_name').order('name'),
    ]);
    setPayments(paymentsRes.data || []);
    setStudents(studentsRes.data || []);
    setLoading(false);
  };

  const generateMonthlyPayments = async () => {
    setGenerating(true);
    try {
      // Verifica alunos que já têm mensalidade no mês
      const existing = payments.filter(p => p.month === filterMonth && p.year === filterYear && !p.is_extra);
      const existingIds = new Set(existing.map(p => p.student_id));
      const toCreate = students.filter(s => !existingIds.has(s.id));

      if (toCreate.length === 0) {
        toast.info('Mensalidades já geradas para este mês!');
        setGenerating(false);
        return;
      }

      const dueDate = `${filterYear}-${String(MONTHS.indexOf(filterMonth) + 1).padStart(2, '0')}-07`;
      const inserts = toCreate.map(s => ({
        student_id: s.id,
        student_name: s.name,
        month: filterMonth,
        year: filterYear,
        amount: 240,
        discount: 0,
        final_amount: 240,
        due_date: dueDate,
        status: 'pending',
        is_extra: false,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('monthly_payments').insert(inserts);
      toast.success(`${inserts.length} mensalidade(s) gerada(s)! ✅`);
      fetchData();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally { setGenerating(false); }
  };

  const markAsPaid = async () => {
    if (!showPayModal) return;
    setSaving(true);
    try {
      await supabase.from('monthly_payments').update({
        status: 'paid',
        paid_date: paymentDate,
        payment_method: paymentMethod,
      }).eq('id', showPayModal.id);
      toast.success('Pagamento registrado! ✅');
      setShowPayModal(null);
      fetchData();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally { setSaving(false); }
  };

  const markAsOverdue = async (id: string) => {
    await supabase.from('monthly_payments').update({ status: 'overdue' }).eq('id', id);
    fetchData();
    toast.error('Marcado como atrasado!');
  };

  const saveExtra = async () => {
    if (!form.student_id || !form.amount) { toast.error('Preencha todos os campos!'); return; }
    setSaving(true);
    try {
      const finalAmount = Number(form.amount) - Number(form.discount);
      await supabase.from('monthly_payments').insert({
        ...form,
        final_amount: finalAmount,
        status: 'pending',
        is_extra: true,
        created_at: new Date().toISOString(),
      });
      toast.success('Aula extra registrada! ✅');
      setShowForm(false);
      fetchData();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally { setSaving(false); }
  };

  const updateAmount = async (id: string, amount: number, discount: number) => {
    const finalAmount = amount - discount;
    await supabase.from('monthly_payments').update({ amount, discount, final_amount: finalAmount }).eq('id', id);
    fetchData();
  };

  // Filtra
  const monthPayments = payments.filter(p => p.month === filterMonth && p.year === filterYear && !p.is_extra);
  const extraPayments = payments.filter(p => p.is_extra);
  const allPayments = activeTab === 'historico' ? payments.filter(p => {
    const matchSearch = !searchTerm || p.student_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  }) : [];

  // KPIs do mês
  const totalMonth = monthPayments.reduce((a, p) => a + (p.final_amount || 0), 0);
  const received = monthPayments.filter(p => p.status === 'paid').reduce((a, p) => a + (p.final_amount || 0), 0);
  const pending = monthPayments.filter(p => p.status === 'pending').reduce((a, p) => a + (p.final_amount || 0), 0);
  const overdue = monthPayments.filter(p => p.status === 'overdue').reduce((a, p) => a + (p.final_amount || 0), 0);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getStatusConfig = (status: string) => {
    if (status === 'paid') return { label: 'Pago', color: 'bg-green-100 text-green-700', icon: '✅' };
    if (status === 'overdue') return { label: 'Atrasado', color: 'bg-red-100 text-red-700', icon: '🔴' };
    return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total do Mês', value: fmt(totalMonth), color: 'text-purple-600', bg: 'bg-purple-50', icon: TrendingUp },
          { label: 'Recebido', value: fmt(received), color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
          { label: 'Pendente', value: fmt(pending), color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
          { label: 'Atrasado', value: fmt(overdue), color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filtro de mês */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="number" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
            className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold w-24 focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <button onClick={generateMonthlyPayments} disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">
          {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
          Gerar Mensalidades
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            {[
              { key: 'mensalidades', label: `Mensalidades (${monthPayments.length})` },
              { key: 'extras', label: `Aulas Extras (${extraPayments.length})` },
              { key: 'historico', label: 'Histórico' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'extras' && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
              <Plus size={16} /> Nova Aula Extra
            </button>
          )}
          {activeTab === 'historico' && (
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar aluno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-300">
                <option value="all">Todos</option>
                <option value="paid">Pagos</option>
                <option value="pending">Pendentes</option>
                <option value="overdue">Atrasados</option>
              </select>
            </div>
          )}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(activeTab === 'mensalidades' ? monthPayments : activeTab === 'extras' ? extraPayments : allPayments).length === 0 ? (
              <div className="text-center py-16">
                <DollarSign size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">
                  {activeTab === 'mensalidades' ? 'Clique em "Gerar Mensalidades" para começar!' : 'Nenhum registro encontrado.'}
                </p>
              </div>
            ) : (activeTab === 'mensalidades' ? monthPayments : activeTab === 'extras' ? extraPayments : allPayments).map(payment => {
              const status = getStatusConfig(payment.status);
              return (
                <div key={payment.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-all flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black shrink-0">
                    {payment.student_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{payment.student_name}</p>
                      {payment.is_extra && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">Aula Extra</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.icon} {status.label}</span>
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">{payment.month} {payment.year}</span>
                      {payment.due_date && <span className="text-xs text-gray-400">Vence: {new Date(payment.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      {payment.paid_date && <span className="text-xs text-green-500">Pago: {new Date(payment.paid_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      {payment.payment_method && <span className="text-xs text-gray-400">{payment.payment_method}</span>}
                      {payment.extra_description && <span className="text-xs text-blue-500">{payment.extra_description}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {payment.discount > 0 && <p className="text-[10px] text-gray-400 line-through">{fmt(payment.amount)}</p>}
                      <p className="font-black text-gray-900">{fmt(payment.final_amount || payment.amount)}</p>
                      {payment.discount > 0 && <p className="text-[10px] text-green-500">-{fmt(payment.discount)}</p>}
                    </div>
                    {payment.status !== 'paid' && (
                      <div className="flex gap-1">
                        <button onClick={() => setShowPayModal(payment)}
                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all">
                          Marcar Pago
                        </button>
                        {payment.status !== 'overdue' && (
                          <button onClick={() => markAsOverdue(payment.id)}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-all">
                            Atrasado
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Marcar Pago */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Registrar Pagamento</h2>
              <button onClick={() => setShowPayModal(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-2xl">
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
              <button onClick={() => setShowPayModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={markAsPaid} disabled={saving}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aula Extra */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Nova Aula Extra</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Aluno</label>
                <select value={form.student_id} onChange={e => {
                  const s = students.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, student_id: e.target.value, student_name: s?.name || '' }));
                }} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Selecione...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Descrição</label>
                <input type="text" placeholder="Ex: Aula extra de matemática" value={form.extra_description}
                  onChange={e => setForm(f => ({ ...f, extra_description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Valor (R$)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Desconto (R$)</label>
                  <input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Mês</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Vencimento</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              {form.amount > 0 && (
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="text-sm font-black text-green-700">Total: {fmt(form.amount - form.discount)}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={saveExtra} disabled={saving || !form.student_id}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
