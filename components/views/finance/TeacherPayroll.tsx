'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const D_BG = '#0f1117';
const D_CARD = '#1a1d27';
const D_BORDER = '#2a2d3a';
const D_TEXT = '#e2e8f0';
const D_MUTED = '#64748b';
const D_GREEN = '#22d3a5';
const D_RED = '#f43f5e';
const D_PURPLE = '#a78bfa';
const D_YELLOW = '#f59e0b';

const fmt = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function computeDefaultPeriod(paymentDay = 10) {
  const hoje = new Date();
  let end = new Date(hoje.getFullYear(), hoje.getMonth(), paymentDay);
  if (end > hoje) { end = new Date(hoje.getFullYear(), hoje.getMonth() - 1, paymentDay); }
  const start = new Date(end.getFullYear(), end.getMonth() - 1, paymentDay);
  const toISO = (d: Date) => d.toISOString().split('T')[0];
  return { start: toISO(start), end: toISO(end) };
}

interface Calc {
  total: number; presentes: number; justificadas: number; faltas: number;
  gradeMensal: number; valorPorAula: number; valorCalculado: number;
}

async function calcularFolha(teacher: any, periodStart: string, periodEnd: string): Promise<Calc> {
  const { data: aulas } = await supabase.from('schedules').select('attendance_status')
    .eq('teacher_id', teacher.id).gte('date', periodStart).lte('date', periodEnd);
  const pagaveis = (aulas || []).filter((a: any) => !!a.attendance_status);
  const norm = (v: any) => (v || '').toString().toLowerCase();
  const presentes = pagaveis.filter((a: any) => norm(a.attendance_status) === 'presente').length;
  const justificadas = pagaveis.filter((a: any) => norm(a.attendance_status) === 'justificada').length;
  const faltas = pagaveis.filter((a: any) => norm(a.attendance_status) === 'falta').length;
  const gradeMensal = (teacher.weekly_lessons || 0) * 4;
  const valorMensal = Number(teacher.monthly_value) || 0;
  const valorPorAula = gradeMensal > 0 ? valorMensal / gradeMensal : 0;
  const valorCalculado = pagaveis.length * valorPorAula;
  return { total: pagaveis.length, presentes, justificadas, faltas, gradeMensal, valorPorAula, valorCalculado };
}

export default function TeacherPayroll() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [calcs, setCalcs] = useState<Record<string, Calc>>({});
  const [periods, setPeriods] = useState<Record<string, { start: string; end: string }>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('teachers').select('id, name, weekly_lessons, monthly_value, payment_method, pix_key').order('name');
      setTeachers(data || []);
      setLoading(false);
    })();
  }, []);

  const toggleExpand = async (teacher: any) => {
    if (expanded === teacher.id) { setExpanded(null); return; }
    setExpanded(teacher.id);
    if (!periods[teacher.id]) {
      const periodo = computeDefaultPeriod(10);
      setPeriods(p => ({ ...p, [teacher.id]: periodo }));
      const calc = await calcularFolha(teacher, periodo.start, periodo.end);
      setCalcs(c => ({ ...c, [teacher.id]: calc }));
      setAmounts(a => ({ ...a, [teacher.id]: calc.valorCalculado.toFixed(2) }));
    }
  };

  const recalcular = async (teacher: any, start: string, end: string) => {
    setPeriods(p => ({ ...p, [teacher.id]: { start, end } }));
    const calc = await calcularFolha(teacher, start, end);
    setCalcs(c => ({ ...c, [teacher.id]: calc }));
    setAmounts(a => ({ ...a, [teacher.id]: calc.valorCalculado.toFixed(2) }));
  };

  const registrar = async (teacher: any) => {
    const periodo = periods[teacher.id];
    const calc = calcs[teacher.id];
    const amount = parseFloat(amounts[teacher.id] || '0');
    if (!amount || !periodo) return;
    setSaving(teacher.id);
    const { error } = await supabase.from('teacher_payments').insert({
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      amount,
      period_start: periodo.start,
      period_end: periodo.end,
      aulas_no_periodo: calc?.total || 0,
      valor_por_aula: calc?.valorPorAula || null,
      payment_method: teacher.payment_method,
      pix_key: teacher.pix_key,
      notes: notes[teacher.id] || '',
      status: 'pago',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    setSaving(null);
    if (!error) {
      setDone(d => ({ ...d, [teacher.id]: true }));
      // Também lança como despesa no Financeiro, categoria Salário Professor
      const { data: cat } = await supabase.from('expense_categories').select('id').eq('name', 'Salário Professor').maybeSingle();
      const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const d = new Date(periodo.end + 'T00:00:00');
      await supabase.from('expenses').insert({
        description: 'Pagamento ' + teacher.name + ' (' + periodo.start.split('-').reverse().join('/') + ' a ' + periodo.end.split('-').reverse().join('/') + ')',
        amount,
        category_id: cat?.id || null,
        category_name: 'Salário Professor',
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        due_date: periodo.end,
        status: 'paid',
        teacher_id: teacher.id,
        teacher_name: teacher.name,
      });
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: D_MUTED, fontSize: 13 }}><Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 10px' }} /> Carregando professoras...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
      <div style={{ fontSize: 12.5, color: D_MUTED, marginBottom: 4 }}>
        Período padrão: dia 10 do mês anterior até dia 10 deste mês. Conta aulas com presença, justificada ou falta registrada. Clica numa professora pra ver o cálculo.
      </div>
      {teachers.map(teacher => {
        const isOpen = expanded === teacher.id;
        const calc = calcs[teacher.id];
        const periodo = periods[teacher.id];
        return (
          <div key={teacher.id} style={{ background: D_CARD, border: `1px solid ${D_BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <div onClick={() => toggleExpand(teacher)} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: D_TEXT }}>{teacher.name}</span>
              {isOpen ? <ChevronUp size={16} color={D_MUTED} /> : <ChevronDown size={16} color={D_MUTED} />}
            </div>
            {isOpen && (
              <div style={{ padding: '0 16px 16px' }}>
                {!calc ? (
                  <div style={{ color: D_MUTED, fontSize: 12.5 }}><Loader2 size={14} className="animate-spin" /> Calculando...</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: D_MUTED, marginBottom: 4 }}>PERÍODO INÍCIO</div>
                        <input type="date" value={periodo.start} onChange={e => recalcular(teacher, e.target.value, periodo.end)} style={{ width: '100%', background: D_BG, border: `1px solid ${D_BORDER}`, color: D_TEXT, borderRadius: 8, padding: '7px 8px', fontSize: 12 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: D_MUTED, marginBottom: 4 }}>PERÍODO FIM</div>
                        <input type="date" value={periodo.end} onChange={e => recalcular(teacher, periodo.start, e.target.value)} style={{ width: '100%', background: D_BG, border: `1px solid ${D_BORDER}`, color: D_TEXT, borderRadius: 8, padding: '7px 8px', fontSize: 12 }} />
                      </div>
                    </div>

                    <div style={{ background: '#12141c', borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: 12, color: D_MUTED }}>
                      <div style={{ fontWeight: 700, color: D_TEXT, marginBottom: 4 }}>{calc.total} aula(s) no período (presentes: {calc.presentes}, justificadas: {calc.justificadas}, faltas: {calc.faltas})</div>
                      <div>Grade mensal: {calc.gradeMensal} aulas · Valor por aula: {fmt(calc.valorPorAula)}</div>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: D_MUTED, marginBottom: 4 }}>VALOR A PAGAR (R$)</div>
                      <input type="number" step="0.01" value={amounts[teacher.id] || ''} onChange={e => setAmounts(a => ({ ...a, [teacher.id]: e.target.value }))} style={{ width: '100%', background: D_BG, border: `1px solid ${D_PURPLE}`, color: D_PURPLE, fontWeight: 700, borderRadius: 8, padding: '9px 10px', fontSize: 14 }} />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: D_MUTED, marginBottom: 4 }}>OBSERVAÇÕES</div>
                      <input type="text" value={notes[teacher.id] || ''} onChange={e => setNotes(n => ({ ...n, [teacher.id]: e.target.value }))} placeholder="opcional" style={{ width: '100%', background: D_BG, border: `1px solid ${D_BORDER}`, color: D_TEXT, borderRadius: 8, padding: '9px 10px', fontSize: 12.5 }} />
                    </div>

                    {done[teacher.id] ? (
                      <div style={{ color: D_GREEN, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Check size={16} /> Pago e lançado em Saídas</div>
                    ) : (
                      <button onClick={() => registrar(teacher)} disabled={saving === teacher.id} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: D_PURPLE, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {saving === teacher.id ? <><Loader2 size={15} className="animate-spin" /> Registrando...</> : <><DollarSign size={15} /> Registrar Pagamento</>}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
