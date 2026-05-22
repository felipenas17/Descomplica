'use client';
import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Wallet, AlertCircle, Clock, TrendingUp, TrendingDown, Target, CheckCircle, XCircle, Calendar, Zap, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs">
        <p className="font-black mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 100 ? fmt(p.value) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    totalAlunos: 0, alunosAtivos: 0, totalProfessores: 0,
    receitaMes: 0, recebidoMes: 0, despesasMes: 0, lucroMes: 0,
    ticketMedio: 0, taxaOcupacao: 0, inadimplentes: 0,
    aulasMes: 0, aulasHoje: 0, aulasConcluidas: 0,
    proximasAulas: [], alertas: [], fluxoAnual: [], aniversarios: [],
  });

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const mesAtual = MONTHS_FULL[new Date().getMonth()];
      const ano = new Date().getFullYear();

      const [studentsRes, teachersRes, schedulesRes, paymentsRes, expensesRes] = await Promise.all([
        supabase.from('students').select('id, name, monthly_value, birth_date'),
        supabase.from('teachers').select('id, name'),
        supabase.from('schedules').select('*').gte('date', ano + '-01-01'),
        supabase.from('monthly_payments').select('*').eq('year', ano),
        supabase.from('expenses').select('*').eq('year', ano),
      ]);

      const students = studentsRes.data || [];
      const teachers = teachersRes.data || [];
      const schedules = schedulesRes.data || [];
      const payments = paymentsRes.data || [];
      const expenses = expensesRes.data || [];

      // KPIs básicos
      const totalAlunos = students.length;
      const totalProfessores = teachers.length;
      const receitaMes = payments.filter(p => p.month === mesAtual).reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
      const recebidoMes = payments.filter(p => p.month === mesAtual && p.status === 'paid').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
      const despesasMes = expenses.filter(e => e.month === mesAtual).reduce((a, e) => a + (e.amount || 0), 0);
      const lucroMes = recebidoMes - despesasMes;
      const ticketMedio = totalAlunos > 0 ? students.reduce((a, s) => a + (s.monthly_value || 0), 0) / totalAlunos : 0;
      const inadimplentes = payments.filter(p => p.month === mesAtual && p.status === 'overdue').length;

      // Aulas
      const aulasMes = schedules.filter(s => s.date?.startsWith(ano + '-' + String(new Date().getMonth() + 1).padStart(2, '0'))).length;
      const aulasHoje = schedules.filter(s => s.date === hoje).length;
      const aulasConcluidas = schedules.filter(s => s.status === 'concluido').length;
      const totalAulas = schedules.length;
      const taxaOcupacao = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

      // Próximas aulas de hoje
      const proximasAulas = schedules
        .filter(s => s.date === hoje)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
        .slice(0, 5);

      // Alertas
      const alertas = [];
      if (inadimplentes > 0) alertas.push({ type: 'danger', msg: `${inadimplentes} aluno(s) inadimplente(s) este mês` });
      const aguardando = schedules.filter(s => s.status === 'aguardando_confirmacao').length;
      if (aguardando > 0) alertas.push({ type: 'warning', msg: `${aguardando} aula(s) aguardando confirmação` });
      if (lucroMes < 0) alertas.push({ type: 'danger', msg: `Prejuízo de ${fmt(Math.abs(lucroMes))} este mês` });
      if (totalAlunos < 5) alertas.push({ type: 'info', msg: 'Dica: Foque em aulas em grupo para aumentar receita sem mais horas' });

      // Aniversários próximos (7 dias)
      const aniversarios = students.filter(s => {
        if (!s.birth_date) return false;
        const bday = new Date(s.birth_date);
        const hoje2 = new Date();
        const diff = new Date(hoje2.getFullYear(), bday.getMonth(), bday.getDate()).getTime() - hoje2.getTime();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      });

      // Fluxo anual
      const fluxoAnual = MONTHS.map((m, i) => {
        const mFull = MONTHS_FULL[i];
        const entradas = payments.filter(p => p.month === mFull).reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
        const saidas = expenses.filter(e => e.month === mFull).reduce((a, e) => a + (e.amount || 0), 0);
        const recebido = payments.filter(p => p.month === mFull && p.status === 'paid').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
        return { mes: m, entradas, saidas, recebido, lucro: recebido - saidas };
      });

      setData({
        totalAlunos, totalProfessores, receitaMes, recebidoMes,
        despesasMes, lucroMes, ticketMedio, taxaOcupacao,
        inadimplentes, aulasMes, aulasHoje, aulasConcluidas,
        proximasAulas, alertas, fluxoAnual, aniversarios,
        taxaRecebimento: receitaMes > 0 ? Math.round((recebidoMes / receitaMes) * 100) : 0,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Alertas críticos */}
      {data.alertas.length > 0 && (
        <div className="space-y-2">
          {data.alertas.map((a: any, i: number) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${a.type === 'danger' ? 'bg-red-50 text-red-700 border border-red-200' : a.type === 'warning' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <AlertCircle size={16} />
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Receita */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white shadow-xl shadow-purple-200 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">Receita do Mês</p>
            <TrendingUp size={18} className="text-purple-300" />
          </div>
          <p className="text-3xl font-black">{fmt(data.receitaMes)}</p>
          <div className="mt-3 h-2 bg-purple-500 rounded-full">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${data.taxaRecebimento}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-purple-300">Recebido: {fmt(data.recebidoMes)}</p>
            <p className="text-xs text-purple-300">{data.taxaRecebimento}%</p>
          </div>
        </div>

        {/* Lucro */}
        <div className={`rounded-2xl p-5 border shadow-sm ${data.lucroMes >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{data.lucroMes >= 0 ? 'Lucro' : 'Prejuízo'}</p>
            {data.lucroMes >= 0 ? <ArrowUpRight size={18} className="text-green-600" /> : <ArrowDownRight size={18} className="text-red-600" />}
          </div>
          <p className={`text-2xl font-black ${data.lucroMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(Math.abs(data.lucroMes))}</p>
          <p className="text-xs text-gray-400 mt-1">Despesas: {fmt(data.despesasMes)}</p>
        </div>

        {/* Ticket médio */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ticket Médio</p>
            <Target size={18} className="text-purple-400" />
          </div>
          <p className="text-2xl font-black text-gray-900">{fmt(data.ticketMedio)}</p>
          <p className="text-xs text-gray-400 mt-1">por aluno/mês</p>
        </div>
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Alunos', value: data.totalAlunos, sub: 'cadastrados', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Professores', value: data.totalProfessores, sub: 'ativos', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Aulas Hoje', value: data.aulasHoje, sub: 'agendadas', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Taxa de Ocupação', value: data.taxaOcupacao + '%', sub: 'aulas concluídas', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico fluxo anual */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-gray-900">Fluxo de Caixa Anual</h3>
            <p className="text-xs text-gray-400">Receita vs Despesas — {new Date().getFullYear()}</p>
          </div>
          <Zap size={20} className="text-purple-500" />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.fluxoAnual}>
            <defs>
              <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 700 }} />
            <YAxis tickFormatter={v => v >= 1000 ? 'R$' + (v/1000).toFixed(0) + 'k' : 'R$' + v} tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="entradas" name="Receita" stroke="#8A2BE2" strokeWidth={2} fill="url(#gradEntradas)" />
            <Area type="monotone" dataKey="saidas" name="Despesas" stroke="#EF4444" strokeWidth={2} fill="url(#gradSaidas)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aulas de hoje */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-purple-500" /> Aulas de Hoje
          </h3>
          {data.proximasAulas.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-bold">Nenhuma aula hoje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.proximasAulas.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-black text-xs shrink-0">
                    {s.start_time?.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm truncate">{s.subject || 'Aula'}</p>
                    <p className="text-xs text-gray-400">{s.student_name} • {s.teacher_name}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${s.status === 'concluido' ? 'bg-green-100 text-green-700' : s.status === 'aguardando_confirmacao' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {s.status === 'concluido' ? '✅' : s.status === 'aguardando_confirmacao' ? '⏳' : '📅'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas e aniversários */}
        <div className="space-y-4">
          {/* Inadimplentes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" /> Situação Financeira
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-xl font-black text-green-600">{data.totalAlunos - data.inadimplentes}</p>
                <p className="text-[10px] text-gray-400 font-bold">Em dia</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <p className="text-xl font-black text-red-600">{data.inadimplentes}</p>
                <p className="text-[10px] text-gray-400 font-bold">Inadimp.</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-xl font-black text-purple-600">{data.taxaRecebimento}%</p>
                <p className="text-[10px] text-gray-400 font-bold">Recebido</p>
              </div>
            </div>
          </div>

          {/* Aniversários */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <Award size={18} className="text-yellow-500" /> Aniversários nos próximos 7 dias
            </h3>
            {data.aniversarios.length === 0 ? (
              <p className="text-sm text-gray-400 font-bold text-center py-4">Nenhum aniversário próximo 🎉</p>
            ) : (
              <div className="space-y-2">
                {data.aniversarios.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                    <span className="text-2xl">🎂</span>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-400">{new Date(s.birth_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
