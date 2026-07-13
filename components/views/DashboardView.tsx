'use client';
import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Wallet, AlertCircle, Clock, TrendingUp, TrendingDown, Target, CheckCircle, XCircle, Calendar, Zap, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { gerarRelatorioPDF } from '@/lib/relatorioMensal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const D_BG    = '#0f1117';
const D_CARD  = '#1a1d27';
const D_BORDER= '#2a2d3a';
const D_TEXT  = '#e2e8f0';
const D_MUTED = '#64748b';
const D_GREEN = '#22d3a5';
const D_RED   = '#f43f5e';
const D_PURPLE= '#a78bfa';
const D_YELLOW= '#f59e0b';

const cardStyle: React.CSSProperties = { background: D_CARD, borderRadius: 16, border: `1px solid ${D_BORDER}`, padding: '18px 20px' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0f1117', border: `1px solid ${D_BORDER}`, borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ color: D_TEXT, fontWeight: 700, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {typeof p.value === 'number' && p.value > 100 ? fmt(p.value) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardView() {
  const [loading, setLoading] = useState(true);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const handleGerarPDF = async () => {
    setGerandoPDF(true);
    try { await gerarRelatorioPDF(); } catch(e) { console.error(e); }
    setGerandoPDF(false);
  };
  const [meta, setMeta] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_meta');
      return saved ? parseInt(saved) : 5000;
    }
    return 5000;
  });
  const [editMeta, setEditMeta] = useState(false);
  const saveMeta = (value: number) => {
    setMeta(value);
    if (typeof window !== 'undefined') localStorage.setItem('dashboard_meta', String(value));
  };
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [data, setData] = useState<any>({
    totalAlunos: 0, totalProfessores: 0, alunosNovos: 0, alunosRenovacao: 0, expMatriculadas: 0, expNaoConvertidas: 0, expTotal: 0, expPorMes: [], despesasPorCategoria: [], despesasDetalhe: [],
    receitaMes: 0, recebidoMes: 0, despesasMes: 0, lucroMes: 0,
    ticketMedio: 0, taxaOcupacao: 0, inadimplentes: 0,
    aulasHoje: 0, aulasConcluidas: 0,
    proximasAulas: [], alertas: [], fluxoAnual: [], aniversarios: [],
    rankingProfessores: [], taxaRecebimento: 0,
  });

  useEffect(() => {
    fetchDashboard();
    const tables = ['schedules', 'students', 'monthly_payments', 'expenses', 'teachers', 'aulas_experimentais'];
    const channels = tables.map(table =>
      supabase.channel('dash_' + table)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchDashboard())
        .subscribe()
    );
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const hojeD = new Date(); const hoje = hojeD.getFullYear() + '-' + String(hojeD.getMonth()+1).padStart(2,'0') + '-' + String(hojeD.getDate()).padStart(2,'0');
      const mesAtual = MONTHS_FULL[new Date().getMonth()];
      const ano = new Date().getFullYear();

      const [studentsRes, teachersRes, schedulesRes, paymentsRes, expensesRes] = await Promise.all([
        supabase.from('students').select('id, name, monthly_value, birth_date, enrollment_type'),
        supabase.from('teachers').select('id, name, birth_date'),
        supabase.from('schedules').select('*').gte('date', ano + '-01-01'),
        supabase.from('monthly_payments').select('*').eq('year', ano),
        supabase.from('expenses').select('*').eq('year', ano),
      ]);

      const students = studentsRes.data || [];
      const teachers = teachersRes.data || [];
      const schedules = schedulesRes.data || [];
      const payments = paymentsRes.data || [];
      const expenses = expensesRes.data || [];

      const receitaMes = payments.filter(p => p.month === mesAtual).reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
      const recebidoMes = payments.filter(p => p.month === mesAtual && p.status === 'paid').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
      const despesasMes = expenses.filter(e => e.month === mesAtual).reduce((a, e) => a + (e.amount || 0), 0);
      const lucroMes = recebidoMes - despesasMes;
      const ticketMedio = students.length > 0 ? students.reduce((a, s) => a + (s.monthly_value || 0), 0) / students.length : 0;
      const inadimplentes = payments.filter(p => p.month === mesAtual && p.status === 'overdue').length;
      const aulasHoje = schedules.filter(s => s.date === hoje).length;
      const aulasConcluidas = schedules.filter(s => s.status === 'concluido').length;
      const taxaOcupacao = schedules.length > 0 ? Math.round((aulasConcluidas / schedules.length) * 100) : 0;
      const taxaRecebimento = receitaMes > 0 ? Math.round((recebidoMes / receitaMes) * 100) : 0;

      const proximasAulas = schedules
        .filter(s => s.date === hoje)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
        .slice(0, 5);

      // Ranking professores
      const rankingProfessores = teachers.map(t => ({
        nome: t.name,
        aulas: schedules.filter(s => s.teacher_id === t.id && s.status === 'concluido').length,
        alunos: [...new Set(schedules.filter(s => s.teacher_id === t.id).map(s => s.student_id))].length,
      })).sort((a, b) => b.aulas - a.aulas).slice(0, 5);

      // Alertas inteligentes
      const alertas: any[] = [];
      if (inadimplentes > 0) alertas.push({ type: 'danger', msg: `🚨 ${inadimplentes} aluno(s) inadimplente(s) — risco de ${fmt(inadimplentes * ticketMedio)} em receita` });
      const aguardando = schedules.filter(s => s.status === 'aguardando_confirmacao').length;
      if (aguardando > 0) alertas.push({ type: 'warning', msg: `⏳ ${aguardando} aula(s) aguardando sua confirmação` });
      if (lucroMes < 0) alertas.push({ type: 'danger', msg: `📉 Prejuízo de ${fmt(Math.abs(lucroMes))} este mês` });
      if (recebidoMes < receitaMes * 0.5 && receitaMes > 0) alertas.push({ type: 'warning', msg: `💰 Apenas ${taxaRecebimento}% da receita foi recebida este mês` });
      if (students.length < 5) alertas.push({ type: 'info', msg: '💡 Dica: Aulas em grupo aumentam receita sem mais horas trabalhadas' });


      // Aniversários
      const anivAlunos = students.filter(s => {
        if (!s.birth_date) return false;
        const bday = new Date(s.birth_date);
        const hoje2 = new Date();
        const diff = new Date(hoje2.getFullYear(), bday.getMonth(), bday.getDate()).getTime() - hoje2.getTime();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      }).map(s => ({ ...s, tipo: 'aluno' }));
      const anivProfs = teachers.filter((t: any) => {
        if (!t.birth_date) return false;
        const bday = new Date(t.birth_date);
        const hoje2 = new Date();
        const diff = new Date(hoje2.getFullYear(), bday.getMonth(), bday.getDate()).getTime() - hoje2.getTime();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      }).map((t: any) => ({ ...t, tipo: 'professora' }));
      const aniversarios = [...anivProfs, ...anivAlunos];

      // Fluxo anual
      const fluxoAnual = MONTHS.map((m, i) => {
        const mFull = MONTHS_FULL[i];
        const entradas = payments.filter(p => p.month === mFull).reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
        const saidas = expenses.filter(e => e.month === mFull).reduce((a, e) => a + (e.amount || 0), 0);
        const recebido = payments.filter(p => p.month === mFull && p.status === 'paid').reduce((a, p) => a + (p.final_amount || p.amount || 0), 0);
        return { mes: m, entradas, saidas, recebido, lucro: recebido - saidas };
      });

      // Busca dados de experimentais e renovações
      const { data: experimentais } = await supabase.from('aulas_experimentais').select('*');
      // Lembrete: aulas experimentais de amanhã
      const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
      const amanhaStr = amanha.getFullYear() + '-' + String(amanha.getMonth()+1).padStart(2,'0') + '-' + String(amanha.getDate()).padStart(2,'0');
      const expAmanha = (experimentais || []).filter((e: any) => e.data === amanhaStr && e.status !== 'arquivada' && e.status !== 'matriculado');
      expAmanha.forEach((e: any) => {
        const tel = (e.telefone || '').replace(/\D/g, '');
        const msg = encodeURIComponent('Ol\u00e1! Lembramos que amanh\u00e3, ' + amanha.toLocaleDateString('pt-BR') + ', \u00e0s ' + (e.hora_inicio || '') + ', temos a aula experimental de ' + (e.nome || '') + ' na Descomplica com a professora ' + (e.professor_nome || '') + '. Confirmamos a presen\u00e7a?');
        const waLink = tel ? 'https://wa.me/55' + tel + '?text=' + msg : '';
        alertas.push({ type: 'experimental', msg: '\ud83d\udccb Aula experimental amanh\u00e3: ' + (e.nome || '') + ' \u00e0s ' + (e.hora_inicio || '') + ' com ' + (e.professor_nome || ''), waLink, tel });
      });
      const expMatriculadas = (experimentais || []).filter((e: any) => e.status === 'matriculado').length;
      const expNaoConvertidas = (experimentais || []).filter((e: any) => e.status === 'arquivada').length;
      const expTotal = (experimentais || []).length;

      const alunosNovos = students.filter((s: any) => s.enrollment_type === 'nova').length;
      const alunosRenovacao = students.filter((s: any) => s.enrollment_type === 'renovacao' || s.enrollment_type === 'anual').length;

      // Gráfico de conversão experimental por mês
      const expPorMes = MONTHS.map((m, i) => {
        const mesExp = (experimentais || []).filter((e: any) => new Date(e.created_at).getMonth() === i);
        return {
          mes: m,
          total: mesExp.length,
          matriculados: mesExp.filter((e: any) => e.status === 'matriculado').length,
          nao_convertidos: mesExp.filter((e: any) => e.status === 'arquivada').length,
        };
      });

      const despesasPorCategoria = Object.entries(
        expenses.reduce((acc: any, e: any) => {
          const cat = e.category_name || 'Outros';
          acc[cat] = (acc[cat] || 0) + (e.amount || 0);
          return acc;
        }, {})
      ).map(([cat, total]) => ({ categoria: cat, total })).sort((a: any, b: any) => b.total - a.total);
      setData({ totalAlunos: students.length, totalProfessores: teachers.length, receitaMes, recebidoMes, despesasMes, lucroMes, ticketMedio, taxaOcupacao, inadimplentes, aulasHoje, aulasConcluidas, proximasAulas, alertas, fluxoAnual, aniversarios, rankingProfessores, taxaRecebimento, alunosNovos, alunosRenovacao, expMatriculadas, expNaoConvertidas, expTotal, expPorMes, despesasPorCategoria, despesasDetalhe: expenses.map((e: any) => ({ description: e.description, amount: e.amount, category_name: e.category_name, due_date: e.due_date })) });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, background: D_BG }}>
      <div style={{ width: 40, height: 40, border: `4px solid ${D_PURPLE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const pctMeta = meta > 0 ? Math.min(Math.round((data.recebidoMes / meta) * 100), 100) : 0;

  return (
    <div style={{ background: D_BG, minHeight: '100vh', padding: '20px 16px 60px', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Alertas */}
      {data.alertas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.alertas.map((a: any, i: number) => (
            <div key={i} style={{ padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: a.type === 'danger' ? '#2a0d0d' : a.type === 'warning' ? '#2a1f0d' : a.type === 'experimental' ? '#0d2a1a' : '#0d1a2a', color: a.type === 'danger' ? D_RED : a.type === 'warning' ? D_YELLOW : a.type === 'experimental' ? '#34d399' : '#60a5fa', border: `1px solid ${a.type === 'danger' ? '#5a1a1a' : a.type === 'warning' ? '#5a3a1a' : a.type === 'experimental' ? '#1a4a2a' : '#1a2a4a'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{a.msg}</span>
              {a.waLink && <a href={a.waLink} target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Enviar WhatsApp</a>}
            </div>
          ))}
        </div>
      )}

      {/* KPIs principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)', borderRadius: 16, padding: '18px 20px', gridColumn: 'span 2' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c4b5fd', marginBottom: 8 }}>Receita do Mês</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{fmt(data.receitaMes)}</div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 10 }}>
            <div style={{ height: 4, background: '#fff', borderRadius: 2, width: `${data.taxaRecebimento}%`, transition: 'width 1s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#c4b5fd' }}>
            <span>Recebido: {fmt(data.recebidoMes)}</span>
            <span>{data.taxaRecebimento}%</span>
          </div>
        </div>

        <div style={{ ...cardStyle, borderColor: data.lucroMes >= 0 ? '#1a3a2a' : '#3a1a1a' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: D_MUTED, marginBottom: 8 }}>{data.lucroMes >= 0 ? 'Lucro' : 'Prejuízo'}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: data.lucroMes >= 0 ? D_GREEN : D_RED }}>{fmt(Math.abs(data.lucroMes))}</div>
          <div style={{ fontSize: 12, color: D_MUTED, marginTop: 6 }}>Despesas: {fmt(data.despesasMes)}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: D_MUTED, marginBottom: 8 }}>Ticket Médio</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: D_PURPLE }}>{fmt(data.ticketMedio)}</div>
          <div style={{ fontSize: 12, color: D_MUTED, marginTop: 6 }}>por aluno/mês</div>
        </div>
      </div>

      {/* Botão relatório PDF */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
        <button onClick={handleGerarPDF} disabled={gerandoPDF}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#7c3aed', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: gerandoPDF ? 0.7 : 1 }}>
          {gerandoPDF ? '⏳ Gerando...' : '📄 Relatório PDF'}
        </button>
      </div>

      {/* Meta mensal */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT }}>🎯 Meta Mensal de Receita</div>
          <button onClick={() => setEditMeta(!editMeta)} style={{ fontSize: 12, color: D_PURPLE, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {editMeta ? 'Salvar' : '✏️ Editar'}
          </button>
        </div>
        {editMeta && (
          <input type="number" value={meta} onChange={e => saveMeta(Number(e.target.value))}
            style={{ width: '100%', background: '#0f1117', border: `1px solid ${D_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 14, color: D_TEXT, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: D_MUTED, marginBottom: 8 }}>
          <span>Recebido: {fmt(data.recebidoMes)}</span>
          <span>Meta: {fmt(meta)}</span>
        </div>
        <div style={{ height: 8, background: D_BORDER, borderRadius: 4 }}>
          <div style={{ height: 8, borderRadius: 4, background: pctMeta >= 100 ? D_GREEN : pctMeta >= 60 ? D_PURPLE : D_YELLOW, width: `${pctMeta}%`, transition: 'width 1s' }} />
        </div>
        <div style={{ fontSize: 12, color: pctMeta >= 100 ? D_GREEN : D_MUTED, marginTop: 6, fontWeight: 600 }}>
          {pctMeta >= 100 ? '🎉 Meta atingida!' : `${pctMeta}% da meta — faltam ${fmt(meta - data.recebidoMes)}`}
        </div>
      </div>

      {/* KPIs secundários */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Alunos', value: data.totalAlunos, color: '#60a5fa' },
          { label: 'Professores', value: data.totalProfessores, color: D_PURPLE },
          { label: 'Aulas Hoje', value: data.aulasHoje, color: D_YELLOW },
          { label: 'Taxa Ocupação', value: data.taxaOcupacao + '%', color: D_GREEN },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: D_MUTED, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: D_TEXT, marginBottom: 4 }}>Fluxo de Caixa Anual</div>
        <div style={{ fontSize: 12, color: D_MUTED, marginBottom: 16 }}>Receita vs Despesas — {new Date().getFullYear()}</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.fluxoAnual}>
            <defs>
              <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={D_GREEN} stopOpacity={0.3}/><stop offset="95%" stopColor={D_GREEN} stopOpacity={0}/></linearGradient>
              <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={D_RED} stopOpacity={0.3}/><stop offset="95%" stopColor={D_RED} stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={D_BORDER} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: D_MUTED }} />
            <YAxis tickFormatter={v => v >= 1000 ? 'R$' + (v/1000).toFixed(0) + 'k' : 'R$' + v} tick={{ fontSize: 10, fill: D_MUTED }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="recebido" name="Receita" stroke={D_GREEN} strokeWidth={2} fill="url(#gE)" />
            <Area type="monotone" dataKey="saidas" name="Despesas" stroke={D_RED} strokeWidth={2} fill="url(#gS)" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: D_MUTED }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 3, background: D_GREEN, display: 'inline-block', borderRadius: 2 }}></span>Receita</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 3, background: D_RED, display: 'inline-block', borderRadius: 2 }}></span>Despesas</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Aulas de hoje */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT, marginBottom: 14 }}>🕐 Aulas de Hoje</div>
          {data.proximasAulas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: D_MUTED, fontSize: 13 }}>Nenhuma aula hoje</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.proximasAulas.map((s: any) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#0f1117', borderRadius: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1a1040', display: 'flex', alignItems: 'center', justifyContent: 'center', color: D_PURPLE, fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                    {s.start_time?.slice(0, 5)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: D_TEXT, fontSize: 13 }}>{s.subject || 'Aula'}</div>
                    <div style={{ fontSize: 11, color: D_MUTED, marginTop: 2 }}>{s.student_name} · {s.teacher_name}</div>
                  </div>
                  <span style={{ fontSize: 16 }}>{s.status === 'concluido' ? '✅' : s.status === 'aguardando_confirmacao' ? '⏳' : '📅'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Situação financeira + aniversários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT, marginBottom: 12 }}>💰 Situação Financeira</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Em dia', value: data.totalAlunos - data.inadimplentes, color: D_GREEN },
                { label: 'Inadimp.', value: data.inadimplentes, color: D_RED },
                { label: 'Recebido', value: data.taxaRecebimento + '%', color: D_PURPLE },
              ].map(item => (
                <div key={item.label} style={{ background: '#0f1117', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: D_MUTED, marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT, marginBottom: 12 }}>📊 Despesas por categoria</div>
            {(() => {
              const catColors: Record<string,string> = { 'Salário':'#7C3AED','Aluguel':'#DC2626','Despesas Gerais':'#6B7280','Energia':'#F59E0B','Marketing':'#2563EB','Agua':'#0EA5E9','Supermercado':'#16A34A','Imposto/Prefeitura':'#9333EA','Farmácia':'#EC4899','Transporte':'#F97316','Streaming':'#8B5CF6' };
              const totalDesp = (data as any).despesasPorCategoria?.reduce((a: number, c: any) => a + c.total, 0) || 1;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {((data as any).despesasPorCategoria || []).slice(0, 8).map((c: any) => {
                    const pct = Math.round((c.total / totalDesp) * 100);
                    const color = catColors[c.categoria] || '#6B7280';
                    return (
                      <div key={c.categoria} style={{ cursor: 'pointer' }} onClick={() => setExpandedCat(expandedCat === c.categoria ? null : c.categoria)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{expandedCat === c.categoria ? '▼' : '▶'} {c.categoria}</span>
                          <span style={{ color: '#9CA3AF' }}>R$ {Math.round(c.total).toLocaleString('pt-BR')} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: '#1a1d27', borderRadius: 3 }}>
                          <div style={{ height: 6, width: pct + '%', background: color, borderRadius: 3 }} />
                        </div>
                        {expandedCat === c.categoria && (
                          <div style={{ marginTop: 6, marginBottom: 8, paddingLeft: 12, borderLeft: '2px solid ' + color }}>
                            {((data as any).despesasDetalhe || []).filter((e: any) => e.category_name === c.categoria).sort((a: any, b: any) => b.amount - a.amount).slice(0, 15).map((e: any, i: number) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderBottom: '0.5px solid #1a1d27' }}>
                                <span style={{ color: '#9CA3AF', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>R$ {Math.round(e.amount).toLocaleString('pt-BR')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT, marginBottom: 12 }}>🎂 Aniversários — próximos 7 dias</div>
            {data.aniversarios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: D_MUTED, fontSize: 13 }}>Nenhum aniversário próximo 🎉</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.aniversarios.map((s: any) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#2a1f0d', borderRadius: 10 }}>
                    <span style={{ fontSize: 20 }}>🎂</span>
                    <div>
                      <div style={{ fontWeight: 600, color: D_TEXT, fontSize: 13 }}>{s.name} <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: s.tipo === 'professora' ? '#7C3AED' : '#2563EB', color: '#fff', marginLeft: 4 }}>{s.tipo === 'professora' ? 'Professora' : 'Aluno'}</span></div>
                      <div style={{ fontSize: 11, color: D_YELLOW }}>{new Date(s.birth_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs de alunos e experimentais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Novos Alunos', value: data.alunosNovos, color: '#60a5fa', sub: 'matriculas novas' },
          { label: 'Renovacoes', value: data.alunosRenovacao, color: D_GREEN, sub: 'alunos renovados' },
          { label: 'Exp. Convertidas', value: data.expMatriculadas, color: D_PURPLE, sub: 'de ' + data.expTotal + ' experimentais' },
          { label: 'Nao Convertidas', value: data.expNaoConvertidas, color: D_RED, sub: 'arquivadas' },
        ].map(k => (
          <div key={k.label} style={{ ...cardStyle }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: D_MUTED, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: D_MUTED, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico conversão experimental */}
      {data.expTotal > 0 && (
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: D_TEXT, marginBottom: 4 }}>Aulas Experimentais — Conversao</div>
          <div style={{ fontSize: 12, color: D_MUTED, marginBottom: 16 }}>Matriculados vs Nao Convertidos por mes</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.expPorMes.filter((m: any) => m.total > 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke={D_BORDER} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: D_MUTED }} />
              <YAxis tick={{ fontSize: 10, fill: D_MUTED }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="matriculados" name="Matriculados" fill={D_GREEN} radius={[4,4,0,0]} />
              <Bar dataKey="nao_convertidos" name="Nao Convertidos" fill={D_RED} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ranking professores */}
      {data.rankingProfessores.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT, marginBottom: 14 }}>🏆 Ranking de Professores</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.rankingProfessores.map((p: any, i: number) => (
              <div key={p.nome} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#2a1f05' : i === 1 ? '#1a1a2a' : '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: D_TEXT, fontSize: 13 }}>{p.nome}</div>
                  <div style={{ fontSize: 11, color: D_MUTED }}>{p.alunos} aluno(s)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: D_PURPLE, fontSize: 14 }}>{p.aulas}</div>
                  <div style={{ fontSize: 10, color: D_MUTED }}>aulas</div>
                </div>
                <div style={{ width: 80, height: 4, background: D_BORDER, borderRadius: 2 }}>
                  <div style={{ height: 4, borderRadius: 2, background: i === 0 ? D_YELLOW : D_PURPLE, width: `${data.rankingProfessores[0].aulas > 0 ? (p.aulas / data.rankingProfessores[0].aulas) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
