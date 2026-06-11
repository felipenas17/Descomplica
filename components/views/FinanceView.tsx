'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Clock, Plus, X, ArrowUpRight, ArrowDownRight, BarChart3, Calendar, ChevronRight, Target, Zap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PAYMENT_METHODS = ['PIX','Boleto','Cartão de Crédito','Cartão de Débito','Dinheiro','Transferência'];
const COLORS = ['#a78bfa','#22d3a5','#f59e0b','#f43f5e','#60a5fa','#ec4899'];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtK = (v: number) => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : fmt(v);

const D_BG = '#0f1117';
const D_CARD = '#1a1d27';
const D_BORDER = '#2a2d3a';
const D_TEXT = '#e2e8f0';
const D_MUTED = '#64748b';
const D_GREEN = '#22d3a5';
const D_RED = '#f43f5e';
const D_PURPLE = '#a78bfa';
const D_YELLOW = '#f59e0b';

const cardStyle: React.CSSProperties = { background: D_CARD, borderRadius: 16, border: `1px solid ${D_BORDER}`, padding: '18px 20px' };
const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: D_MUTED, marginBottom: 6, display: 'block' };
const inputStyle: React.CSSProperties = { width: '100%', background: '#0f1117', border: `1px solid ${D_BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: D_TEXT, outline: 'none', boxSizing: 'border-box' as const };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0f1117', border: `1px solid ${D_BORDER}`, borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ color: D_TEXT, fontWeight: 700, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {fmt(p.value)}</p>
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
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entradas' | 'saidas' | 'projecao'>('dashboard');
  const [filterMonth, setFilterMonth] = useState(MONTHS_FULL[new Date().getMonth()]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [periodMode, setPeriodMode] = useState<'month' | 'period' | 'year' | 'week'>('month');
  const [filterWeek, setFilterWeek] = useState(new Date().toISOString().split('T')[0]);
  const [periodFrom, setPeriodFrom] = useState(MONTHS_FULL[0]);
  const [periodTo, setPeriodTo] = useState(MONTHS_FULL[new Date().getMonth()]);
  const [showPayModal, setShowPayModal] = useState<any>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const importFileRef = React.useRef<HTMLInputElement>(null);
  const [showPayExpenseModal, setShowPayExpenseModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [generateFrom, setGenerateFrom] = useState(MONTHS_FULL[new Date().getMonth()]);
  const [generateTo, setGenerateTo] = useState('Dezembro');
  const [expenseForm, setExpenseForm] = useState({
    category_name: '', description: '', amount: 0,
    month: MONTHS_FULL[new Date().getMonth()],
    year: new Date().getFullYear(), due_date: '', is_recurring: false,
    recorrente_ate: '', teacher_id: '', teacher_name: '',
  });

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('monthly_payments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_payments' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [paymentsRes, expensesRes, categoriesRes, studentsRes, teachersRes] = await Promise.all([
      supabase.from('monthly_payments').select('*').order('due_date'),
      supabase.from('expenses').select('*').order('due_date'),
      supabase.from('expense_categories').select('*').order('name'),
      supabase.from('students').select('id, name, monthly_value').order('name'),
      supabase.from('teachers').select('id, name').order('name'),
    ]);
    setPayments(paymentsRes.data || []);
    setExpenses(expensesRes.data || []);
    setCategories(categoriesRes.data || []);
    setStudents(studentsRes.data || []);
    setTeachers((teachersRes as any).data || []);
    setLoading(false);
  };

  const getWeekRange = () => {
    const d = new Date(filterWeek + 'T00:00:00');
    const day = d.getDay();
    const start = new Date(d); start.setDate(d.getDate() - day);
    const end = new Date(d); end.setDate(d.getDate() + (6 - day));
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  const monthPayments = payments.filter(p => {
    if (periodMode === 'week') { const { start, end } = getWeekRange(); return p.due_date >= start && p.due_date <= end; }
    if (periodMode === 'month') return p.month === filterMonth && p.year === filterYear;
    if (periodMode === 'year') return p.year === filterYear;
    const fromIdx = MONTHS_FULL.indexOf(periodFrom); const toIdx = MONTHS_FULL.indexOf(periodTo); const mIdx = MONTHS_FULL.indexOf(p.month);
    return p.year === filterYear && mIdx >= fromIdx && mIdx <= toIdx;
  });

  const monthExpenses = expenses.filter(e => {
    if (periodMode === 'week') { const { start, end } = getWeekRange(); return e.due_date >= start && e.due_date <= end; }
    if (periodMode === 'month') return e.month === filterMonth && e.year === filterYear;
    if (periodMode === 'year') return e.year === filterYear;
    const fromIdx = MONTHS_FULL.indexOf(periodFrom); const toIdx = MONTHS_FULL.indexOf(periodTo); const mIdx = MONTHS_FULL.indexOf(e.month);
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

  const fluxoAnual = MONTHS.map((m, i) => {
    const mFull = MONTHS_FULL[i];
    const p = payments.filter(x => x.month === mFull && x.year === filterYear);
    const e = expenses.filter(x => x.month === mFull && x.year === filterYear);
    const entradas = p.reduce((a, x) => a + (x.final_amount || x.amount || 0), 0);
    const saidas = e.reduce((a, x) => a + (x.amount || 0), 0);
    const recebido = p.filter(x => x.status === 'paid').reduce((a, x) => a + (x.final_amount || x.amount || 0), 0);
    return { mes: m, entradas, saidas, recebido, resultado: recebido - saidas };
  });

  const expensesByCategory = Object.entries(
    monthExpenses.reduce((acc: any, e) => { acc[e.category_name] = (acc[e.category_name] || 0) + e.amount; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const currentMonthIdx = MONTHS_FULL.indexOf(filterMonth);
  const projection = Array.from({ length: 6 }, (_, i) => {
    const idx = (currentMonthIdx + i) % 12;
    const year = filterYear + Math.floor((currentMonthIdx + i) / 12);
    const month = MONTHS_FULL[idx];
    const p = payments.filter(x => x.month === month && x.year === year);
    const e = expenses.filter(x => x.month === month && x.year === year);
    return { mes: MONTHS[idx], entradas: p.reduce((a, x) => a + (x.final_amount || x.amount || 0), 0), saidas: e.reduce((a, x) => a + (x.amount || 0), 0) };
  });

  const parseCSV = (text: string) => {
    const raw = text.replace(/\r/g, '').replace(/^\xEF\xBB\xBF/, '');
    const lines = raw.split('\n').filter(l => l.trim());
    const rows: any[] = [];
    const headerIdx = lines.findIndex(l => l.toLowerCase().includes('data') && l.toLowerCase().includes('entrada'));
    if (headerIdx === -1) {
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 3) continue;
        let data = cols[0]; let descricao = cols[1]; let valorStr = cols[2] || '0';
        if (data.includes('/')) { const [d, m, y] = data.split('/'); data = y + '-' + m.padStart(2,'0') + '-' + d.padStart(2,'0'); }
        const valor = Math.abs(parseFloat(valorStr.replace(/[R$\s.]/g, '').replace(',', '.'))) || 0;
        if (valor === 0) continue;
        const isDebito = valorStr.includes('-') || cols[3]?.toLowerCase().includes('debito');
        rows.push({ data, descricao, valor, tipo: isDebito ? 'saida' : 'entrada' });
      }
      return rows;
    }
    for (let i = headerIdx + 1; i < lines.length; i++) {
      let line = lines[i].replace(/^"|"$/g, '').replace(/""/g, '');
      const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
      if (cols.length < 5) continue;
      let data = cols[0];
      const titulo = cols[2] || '';
      const descricao = titulo + (cols[3] ? ' - ' + cols[3] : '');
      const entradaStr = cols[4] || '0';
      const saidaStr = cols[5] || '0';
      if (data.includes('/')) { const [d, m, y] = data.split('/'); data = y + '-' + m.padStart(2,'0') + '-' + d.padStart(2,'0'); }
      const entrada = parseFloat(entradaStr.replace(/[R$\s]/g, '').replace(',', '.')) || 0;
      const saida = parseFloat(saidaStr.replace(/[R$\s]/g, '').replace(',', '.')) || 0;
      if (entrada === 0 && saida === 0) continue;
      if (entrada > 0) rows.push({ data, descricao, valor: entrada, tipo: 'entrada' });
      if (saida > 0) rows.push({ data, descricao, valor: saida, tipo: 'saida' });
    }
    return rows;
  };

  const handleImportFile = (file: File) => {
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setImportPreview(rows.slice(0, 10));
    };
    reader.readAsText(file, 'UTF-8');
  };

  const confirmImport = async () => {
    if (!importFile) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      let importadosSaidas = 0;
      let importadosEntradas = 0;
      let erros = 0;
      // Busca nomes para categorização inteligente
      const { data: teachersList } = await supabase.from('teachers').select('name');
      const { data: studentsList } = await supabase.from('students').select('name, parent_name');
      const tNames = (teachersList || []).map((t: any) => t.name?.toLowerCase()).filter(Boolean);
      const sNames = (studentsList || []).map((s: any) => s.name?.toLowerCase()).filter(Boolean);
      const pNames = (studentsList || []).map((s: any) => s.parent_name?.toLowerCase()).filter(Boolean);
      const categorizar = (desc: string, tipo: string) => {
        const d = desc.toLowerCase();
        if (d.includes('aluguel') || d.includes('locacao')) return 'Aluguel';
        if (d.includes('luz') || d.includes('energia')) return 'Energia';
        if (d.includes('agua') || d.includes('saneamento')) return 'Agua';
        if (d.includes('internet') || d.includes('wifi') || d.includes('fibra')) return 'Internet';
        if (tipo === 'saida' && tNames.some(n => d.includes(n))) return 'Pagamento Professora';
        if (tipo === 'entrada' && (sNames.some(n => d.includes(n)) || pNames.some(n => d.includes(n)))) return 'Mensalidade';
        return 'Importado C6';
      };

      for (const row of rows) {
        // Detecta mês e ano de cada transação pela data
        const dataObj = new Date(row.data + 'T00:00:00');
        const mes = MONTHS_FULL[dataObj.getMonth()];
        const ano = dataObj.getFullYear();

        const categoria = categorizar(row.descricao, row.tipo);
        if (row.tipo === 'saida') {
          const { error } = await supabase.from('expenses').insert({
            description:   row.descricao,
            category_name: categoria,
            amount:        row.valor,
            month:         mes,
            year:          ano,
            due_date:      row.data,
            paid_date:     row.data,
            status:        'paid',
            is_recurring:  false,
            created_at:    new Date().toISOString(),
          });
          if (error) erros++; else importadosSaidas++;
        } else {
          // Entradas viram receitas extras
          const { error } = await supabase.from('monthly_payments').insert({
            student_name:  row.descricao,
            month:         mes,
            year:          ano,
            amount:        row.valor,
            final_amount:  row.valor,
            due_date:      row.data,
            paid_date:     row.data,
            status:        'paid',
            is_extra:      true,
            payment_method:'C6 Bank',
            created_at:    new Date().toISOString(),
          });
          if (error) erros++; else importadosEntradas++;
        }
      }

      toast.success(
        '✅ Importado! ' + 
        importadosSaidas + ' saída(s) e ' + 
        importadosEntradas + ' entrada(s). ' + 
        (erros > 0 ? '⚠️ ' + erros + ' erro(s).' : '')
      );
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
      fetchData();
    };
    reader.readAsText(importFile, 'UTF-8');
    setImporting(false);
  };

  const generatePeriod = async () => {
    setGenerating(true);
    try {
      const fromIdx = MONTHS_FULL.indexOf(generateFrom); const toIdx = MONTHS_FULL.indexOf(generateTo);
      let totalCreated = 0;

      // Detecta irmãos pelo mesmo parent_phone ou parent_name
      const { data: allStudentsData } = await supabase.from('students').select('id, name, monthly_value, parent_phone, parent_name, enrollment_type');
      const allStudentsFull = allStudentsData || [];

      // Agrupa por responsável para detectar irmãos
      const byParent: Record<string, any[]> = {};
      allStudentsFull.forEach(s => {
        const key = s.parent_phone || s.parent_name || s.id;
        if (!byParent[key]) byParent[key] = [];
        byParent[key].push(s);
      });
      const irmaosIds = new Set(
        Object.values(byParent).filter(g => g.length > 1).flatMap(g => g.map(s => s.id))
      );

      for (let i = fromIdx; i <= toIdx; i++) {
        const month = MONTHS_FULL[i];
        const existing = payments.filter(p => p.month === month && p.year === filterYear && !p.is_extra);
        const existingIds = new Set(existing.map(p => p.student_id));
        const toCreate = students.filter(s => !existingIds.has(s.id));
        if (toCreate.length > 0) {
          const dueDate = `${filterYear}-${String(i + 1).padStart(2, '0')}-07`;
          await supabase.from('monthly_payments').insert(toCreate.map(s => {
            const fullStudent = allStudentsFull.find(x => x.id === s.id);
            const isIrmao = irmaosIds.has(s.id);
            const isAnual = fullStudent?.enrollment_type === 'anual';
            const valorBase = s.monthly_value || 0;
            let valorFinal = valorBase;
            let desconto = 0;
            if (isIrmao) { valorFinal = valorBase * 0.95; desconto = 5; }
            else if (isAnual) { valorFinal = valorBase * 0.92; desconto = 8; }
            return {
              student_id: s.id, student_name: s.name, month, year: filterYear,
              amount: valorBase,
              discount: desconto,
              final_amount: Math.round(valorFinal * 100) / 100,
              due_date: dueDate,
              status: new Date() > new Date(dueDate) ? 'overdue' : 'pending',
              is_extra: false, created_at: new Date().toISOString(),
            };
          }));
          totalCreated += toCreate.length;
        }
      }
      toast.success(`${totalCreated} mensalidade(s) gerada(s) com descontos aplicados! ✅`);
      setShowGenerateModal(false); fetchData();
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

  const sendComprovanteToChat = async (expense: any) => {
    if (!expense.teacher_id) return;
    const mesIdx = MONTHS_FULL.indexOf(expense.month || MONTHS_FULL[new Date().getMonth()]);
    const ano = expense.year || new Date().getFullYear();
    const mesSegIdx = (mesIdx + 1) % 12; const anoSeg = mesSegIdx === 0 ? ano + 1 : ano;
    const dataInicio = ano + '-' + String(mesIdx + 1).padStart(2,'0') + '-10';
    const dataFim = anoSeg + '-' + String(mesSegIdx + 1).padStart(2,'0') + '-10';
    const { data: aulas } = await supabase.from('schedules').select('id, date, subject').eq('teacher_id', expense.teacher_id).gte('date', dataInicio).lte('date', dataFim).eq('status', 'concluido');
    const totalAulas = aulas?.length || 0;
    const numComprovante = Date.now().toString().slice(-8);
    const dataPgto = paymentDate ? new Date(paymentDate + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const periodoInicio = '10/' + String(mesIdx + 1).padStart(2,'0') + '/' + ano;
    const periodoFim = '10/' + String(mesSegIdx + 1).padStart(2,'0') + '/' + anoSeg;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFillColor(245, 243, 255); doc.rect(0, 0, 210, 297, 'F');
    doc.setFillColor(109, 40, 217); doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('Professora Descomplica', 105, 18, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Espaco Pedagogico', 105, 26, { align: 'center' });
    doc.text('CNPJ: 55.010.967/0001-46', 105, 34, { align: 'center' });
    doc.setFillColor(255, 255, 255); doc.roundedRect(20, 52, 170, 14, 4, 4, 'F');
    doc.setTextColor(109, 40, 217); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE PAGAMENTO', 105, 62, { align: 'center' });
    doc.setTextColor(120, 120, 120); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('N: ' + numComprovante, 105, 72, { align: 'center' });
    doc.setFillColor(255, 255, 255); doc.roundedRect(20, 78, 170, 90, 4, 4, 'F');
    const rows = [['Professor(a)', expense.teacher_name],['Referencia', (expense.month || '') + ' ' + ano],['Periodo', periodoInicio + ' a ' + periodoFim],['Aulas realizadas', totalAulas + ' aula(s)'],['Valor', Number(expense.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],['Data do pagamento', dataPgto]];
    let y = 90;
    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) { doc.setFillColor(249, 246, 255); doc.rect(22, y - 5, 166, 12, 'F'); }
      doc.setTextColor(120, 120, 120); doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text(label + ':', 28, y);
      doc.setTextColor(30, 30, 30); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text(String(value), 28, y + 5); y += 14;
    });
    doc.setFillColor(220, 252, 231); doc.roundedRect(20, 175, 170, 20, 4, 4, 'F');
    doc.setTextColor(22, 163, 74); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('PAGAMENTO CONFIRMADO', 105, 188, { align: 'center' });
    doc.setTextColor(150, 150, 150); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Professora Descomplica - Espaco Pedagogico', 105, 280, { align: 'center' });
    doc.text('CNPJ: 55.010.967/0001-46', 105, 286, { align: 'center' });
    const pdfBlob = doc.output('blob');
    const fileName = 'comprovantes/comp-' + numComprovante + '.pdf';
    const { error: uploadError } = await supabase.storage.from('materials').upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });
    let pdfUrl = '';
    if (!uploadError) { const { data: urlData } = supabase.storage.from('materials').getPublicUrl(fileName); pdfUrl = urlData.publicUrl; }
    const msgText = ['PROFESSORA DESCOMPLICA - ESPACO PEDAGOGICO','CNPJ: 55.010.967/0001-46','---','COMPROVANTE DE PAGAMENTO','N: ' + numComprovante,'---','Professor(a): ' + expense.teacher_name,'Referencia: ' + (expense.month || '') + ' ' + ano,'Periodo: ' + periodoInicio + ' a ' + periodoFim,'Aulas realizadas: ' + totalAulas + ' aula(s)','Valor: ' + Number(expense.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),'Data pagamento: ' + dataPgto,'---','Pagamento confirmado!',pdfUrl ? 'Baixar PDF: ' + pdfUrl : ''].filter(Boolean).join('\n');
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('messages').insert({ sender_id: userData.user?.id, receiver_id: expense.teacher_id, text: msgText, read: false, created_at: new Date().toISOString() });
    toast.success('Comprovante PDF enviado no chat!');
  };

  const markExpenseAsPaid = async () => {
    if (!showPayExpenseModal) return;
    setSaving(true);
    try {
      await supabase.from('expenses').update({ status: 'paid', paid_date: paymentDate }).eq('id', showPayExpenseModal.id);
      toast.success('Despesa paga! ✅');
      if (showPayExpenseModal.category_name === 'Salário Professor' && showPayExpenseModal.teacher_id) await sendComprovanteToChat(showPayExpenseModal);
      setShowPayExpenseModal(null); fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Excluir esta despesa?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    fetchData(); toast.success('Despesa excluída!');
  };

  const deletePayment = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    await supabase.from('monthly_payments').delete().eq('id', id);
    fetchData(); toast.success('Lançamento excluído!');
  };

  const saveExpense = async () => {
    setSaving(true);
    try {
      if (expenseForm.is_recurring && expenseForm.recorrente_ate) {
        const fromIdx = MONTHS_FULL.indexOf(expenseForm.month); const toIdx = MONTHS_FULL.indexOf(expenseForm.recorrente_ate);
        const inserts = [];
        for (let i = fromIdx; i <= toIdx; i++) {
          const month = MONTHS_FULL[i]; const dueDay = expenseForm.due_date ? expenseForm.due_date.split('-')[2] : '10';
          const dueDate = expenseForm.year + '-' + String(i + 1).padStart(2, '0') + '-' + dueDay;
          inserts.push({ category_name: expenseForm.category_name, description: expenseForm.description, amount: expenseForm.amount, month, year: expenseForm.year, due_date: dueDate, is_recurring: true, teacher_id: expenseForm.teacher_id || null, teacher_name: expenseForm.teacher_name || null, status: 'pending', created_at: new Date().toISOString() });
        }
        const { error } = await supabase.from('expenses').insert(inserts);
        if (error) throw error;
        toast.success(inserts.length + ' despesa(s) criada(s)! ✅');
      } else {
        const { error } = await supabase.from('expenses').insert({ category_name: expenseForm.category_name, description: expenseForm.description, amount: expenseForm.amount, month: expenseForm.month, year: expenseForm.year, due_date: expenseForm.due_date, is_recurring: expenseForm.is_recurring, teacher_id: expenseForm.teacher_id || null, teacher_name: expenseForm.teacher_name || null, status: 'pending', created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success('Despesa registrada! ✅');
      }
      setShowExpenseModal(false); fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  const Modal = ({ children, title, onClose }: any) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: D_CARD, borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${D_BORDER}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: D_TEXT }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D_MUTED, fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ background: D_BG, minHeight: '100vh', padding: '20px 16px 60px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 12 }}>
          <div style={{ display: 'flex', background: '#0f1117', borderRadius: 10, padding: 4, gap: 4 }}>
            {[{ key: 'week', label: 'Semana' },{ key: 'month', label: 'Mensal' },{ key: 'period', label: 'Período' },{ key: 'year', label: 'Anual' }].map(opt => (
              <button key={opt.key} onClick={() => setPeriodMode(opt.key as any)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: periodMode === opt.key ? D_PURPLE : 'transparent', color: periodMode === opt.key ? '#fff' : D_MUTED, transition: 'all 0.2s' }}>
                {opt.label}
              </button>
            ))}
          </div>
          {periodMode === 'week' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" value={filterWeek} onChange={e => setFilterWeek(e.target.value)} style={{ ...inputStyle, width: 'auto' }} />
              <span style={{ fontSize: 12, color: D_PURPLE, fontWeight: 600 }}>
                {(() => { const { start, end } = getWeekRange(); return new Date(start + 'T00:00:00').toLocaleDateString('pt-BR') + ' – ' + new Date(end + 'T00:00:00').toLocaleDateString('pt-BR'); })()}
              </span>
            </div>
          )}
          {periodMode === 'month' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                {MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input type="number" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} />
            </div>
          )}
          {periodMode === 'period' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
              <select value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                {MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <span style={{ color: D_MUTED }}>até</span>
              <select value={periodTo} onChange={e => setPeriodTo(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                {MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input type="number" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ ...inputStyle, width: 80 }} />
            </div>
          )}
          {periodMode === 'year' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: D_PURPLE }}>Ano completo {filterYear}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          <button onClick={() => setShowGenerateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: D_PURPLE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Gerar Mensalidades
          </button>
          <button onClick={() => { setActiveTab('saidas'); setShowExpenseModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: D_RED, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Nova Despesa
          </button>
          <button onClick={() => setShowImportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0891b2', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            📥 Importar C6
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#c4b5fd', marginBottom: 8 }}>Receita Prevista</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{fmt(totalEntradas)}</div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 10 }}>
            <div style={{ height: 4, background: '#fff', borderRadius: 2, width: `${taxaRecebimento}%` }} />
          </div>
          <div style={{ fontSize: 11, color: '#c4b5fd', marginTop: 6 }}>{taxaRecebimento}% recebido · {monthPayments.length} aluno(s)</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Recebido</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: D_GREEN }}>{fmt(totalRecebido)}</div>
          <div style={{ fontSize: 12, color: D_GREEN, marginTop: 6 }}>✓ {monthPayments.filter(p=>p.status==='paid').length} pagamentos</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Despesas</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: D_RED }}>{fmt(totalSaidas)}</div>
          <div style={{ fontSize: 12, color: D_MUTED, marginTop: 6 }}>{fmt(totalPago)} pago</div>
        </div>
        <div style={{ ...cardStyle, borderColor: resultado >= 0 ? '#1a3a2a' : '#3a1a1a' }}>
          <div style={labelStyle}>{resultado >= 0 ? 'Lucro' : 'Prejuízo'}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: resultado >= 0 ? D_GREEN : D_RED }}>{fmt(Math.abs(resultado))}</div>
          <div style={{ fontSize: 12, color: resultado >= 0 ? D_GREEN : D_RED, marginTop: 6 }}>{resultado >= 0 ? '✅ Positivo' : '⚠️ Atenção'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: D_CARD, border: `1px solid ${D_BORDER}`, padding: 4, borderRadius: 14, gap: 4, marginBottom: 16 }}>
        {[{ key: 'dashboard', label: `Dashboard` },{ key: 'entradas', label: `Entradas (${monthPayments.length})` },{ key: 'saidas', label: `Saídas (${monthExpenses.length})` },{ key: 'projecao', label: `📈 Projeção` }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: activeTab === tab.key ? D_PURPLE : 'transparent', color: activeTab === tab.key ? '#fff' : D_MUTED, transition: 'all 0.2s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: D_MUTED }}>Carregando...</div>
      ) : (
        <>
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

              {/* Insight IA */}
              {(() => {
                const receitaPorAluno = students.length > 0 ? totalEntradas / students.length : 0;
                const margemLucro = totalEntradas > 0 ? ((totalEntradas - totalSaidas) / totalEntradas * 100) : 0;
                const custoAluguel = monthExpenses.filter(e => e.category_name === 'Aluguel').reduce((a,e) => a+e.amount, 0);
                const pctAluguel = totalEntradas > 0 ? (custoAluguel / totalEntradas * 100) : 0;
                let insight = { icon: '✅', text: 'Finanças saudáveis! Continue monitorando mensalmente.', color: '#1a3a2a', borderColor: '#1a5a3a' };
                if (inadimplentes > 0) insight = { icon: '🚨', text: `${inadimplentes} aluno(s) inadimplente(s) — risco de ${(inadimplentes * receitaPorAluno).toLocaleString('pt-BR', {style:'currency',currency:'BRL'})} em receita.`, color: '#3a1a1a', borderColor: '#5a1a1a' };
                else if (resultado < 0) insight = { icon: '📉', text: `Prejuízo de ${fmt(Math.abs(resultado))} este período. Aumente alunos ou reduza custos fixos.`, color: '#3a2a1a', borderColor: '#5a3a1a' };
                else if (pctAluguel > 40) insight = { icon: '⚠️', text: `Aluguel representa ${pctAluguel.toFixed(0)}% da receita. Considere dividir o espaço.`, color: '#3a2a1a', borderColor: '#5a3a1a' };
                return (
                  <div style={{ background: insight.color, border: `1px solid ${insight.borderColor}`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{insight.icon}</span>
                    <span style={{ fontSize: 13, color: D_TEXT, lineHeight: 1.5 }}>{insight.text}</span>
                  </div>
                );
              })()}

              {/* Mini KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Em dia', value: monthPayments.filter(p=>p.status==='paid').length, color: D_GREEN },
                  { label: 'Pendentes', value: monthPayments.filter(p=>p.status==='pending').length, color: D_YELLOW },
                  { label: 'Inadimplentes', value: inadimplentes, color: D_RED },
                  { label: 'A receber', value: fmt(totalPendente + totalAtrasado), color: D_PURPLE },
                ].map(item => (
                  <div key={item.label} style={cardStyle}>
                    <div style={labelStyle}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Gráfico fluxo anual */}
              <div style={cardStyle}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: D_TEXT }}>Fluxo de Caixa Anual</div>
                  <div style={{ fontSize: 12, color: D_MUTED, marginTop: 2 }}>Entradas vs Saídas — {filterYear}</div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={fluxoAnual}>
                    <defs>
                      <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={D_GREEN} stopOpacity={0.3}/><stop offset="95%" stopColor={D_GREEN} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gSai" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={D_RED} stopOpacity={0.3}/><stop offset="95%" stopColor={D_RED} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={D_BORDER} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: D_MUTED }} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: D_MUTED }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="entradas" name="Entradas" stroke={D_GREEN} strokeWidth={2} fill="url(#gEnt)" />
                    <Area type="monotone" dataKey="saidas" name="Saídas" stroke={D_RED} strokeWidth={2} fill="url(#gSai)" />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: D_MUTED }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 3, background: D_GREEN, display: 'inline-block', borderRadius: 2 }}></span>Entradas</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 3, background: D_RED, display: 'inline-block', borderRadius: 2 }}></span>Saídas</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Pizza */}
                <div style={cardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT, marginBottom: 14 }}>Despesas por categoria</div>
                  {expensesByCategory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: D_MUTED, fontSize: 13 }}>Sem despesas registradas</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name">
                          {expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: D_CARD, border: `1px solid ${D_BORDER}`, borderRadius: 10 }} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: D_MUTED }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {/* Projeção */}
                <div style={cardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT, marginBottom: 14 }}>Projeção 6 meses</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={projection}>
                      <CartesianGrid strokeDasharray="3 3" stroke={D_BORDER} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: D_MUTED }} />
                      <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: D_MUTED }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="entradas" name="Entradas" fill={D_PURPLE} radius={[4,4,0,0]} />
                      <Bar dataKey="saidas" name="Saídas" fill={D_RED} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparativo */}
              <div style={cardStyle}>
                <div style={{ fontSize: 15, fontWeight: 700, color: D_TEXT, marginBottom: 14 }}>Resultado detalhado</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#0d2a1a', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: D_GREEN, textTransform: 'uppercase' as const, marginBottom: 8 }}>Receitas</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: D_GREEN }}>{fmt(totalEntradas)}</div>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: D_MUTED }}>Recebido</span><span style={{ color: D_GREEN, fontWeight: 700 }}>{fmt(totalRecebido)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: D_MUTED }}>Pendente</span><span style={{ color: D_YELLOW, fontWeight: 700 }}>{fmt(totalPendente)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: D_MUTED }}>Atrasado</span><span style={{ color: D_RED, fontWeight: 700 }}>{fmt(totalAtrasado)}</span></div>
                    </div>
                  </div>
                  <div style={{ background: '#2a0d0d', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: D_RED, textTransform: 'uppercase' as const, marginBottom: 8 }}>Despesas</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: D_RED }}>{fmt(totalSaidas)}</div>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: D_MUTED }}>Pago</span><span style={{ color: D_RED, fontWeight: 700 }}>{fmt(totalPago)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: D_MUTED }}>A pagar</span><span style={{ color: D_YELLOW, fontWeight: 700 }}>{fmt(totalSaidas - totalPago)}</span></div>
                    </div>
                  </div>
                  <div style={{ background: resultado >= 0 ? '#0d1a2a' : '#2a0d0d', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: resultado >= 0 ? D_PURPLE : D_RED, textTransform: 'uppercase' as const, marginBottom: 8 }}>Resultado</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: resultado >= 0 ? D_PURPLE : D_RED }}>{resultado >= 0 ? '+' : ''}{fmt(resultado)}</div>
                    <div style={{ height: 4, background: D_BORDER, borderRadius: 2, marginTop: 14 }}>
                      <div style={{ height: 4, background: resultado >= 0 ? D_PURPLE : D_RED, borderRadius: 2, width: `${Math.min(taxaRecebimento, 100)}%` }} />
                    </div>
                    <div style={{ fontSize: 11, color: D_MUTED, marginTop: 6 }}>{taxaRecebimento}% da meta recebido</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENTRADAS */}
          {activeTab === 'entradas' && (
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[{ label: 'Pagos', value: fmt(totalRecebido), color: D_GREEN },{ label: 'Pendentes', value: fmt(totalPendente), color: D_YELLOW },{ label: 'Atrasados', value: fmt(totalAtrasado), color: D_RED }].map(item => (
                  <div key={item.label} style={{ background: '#0f1117', borderRadius: 10, padding: '12px 14px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.color, textTransform: 'uppercase' as const, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
                {monthPayments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 0', color: D_MUTED }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
                    <div style={{ fontSize: 14 }}>Clique em "Gerar Mensalidades" para começar!</div>
                  </div>
                ) : monthPayments.map(payment => {
                  const sc = payment.status === 'paid' ? { label: 'Pago', color: D_GREEN, bg: '#0d2a1a' } : payment.status === 'overdue' ? { label: 'Atrasado', color: D_RED, bg: '#2a0d0d' } : { label: 'Pendente', color: D_YELLOW, bg: '#2a1f0d' };
                  return (
                    <div key={payment.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${D_BORDER}`, flexWrap: 'wrap' as const }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3b1d8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {payment.student_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                          <span style={{ fontWeight: 600, color: D_TEXT, fontSize: 14 }}>{payment.student_name}</span>
                          {payment.is_extra && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#1a2a3a', color: '#60a5fa', fontWeight: 700 }}>Extra</span>}
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 700 }}>{sc.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: D_MUTED, marginTop: 4 }}>
                          {payment.due_date && `Vence: ${new Date(payment.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                          {payment.paid_date && ` · Pago: ${new Date(payment.paid_date + 'T00:00:00').toLocaleDateString('pt-BR')} · ${payment.payment_method}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: D_TEXT, fontSize: 16 }}>{fmt(payment.final_amount || payment.amount)}</span>
                        {payment.status !== 'paid' && (
                          <button onClick={() => setShowPayModal(payment)} style={{ padding: '6px 12px', background: '#0d2a1a', color: D_GREEN, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Pagar</button>
                        )}
                        <button onClick={() => deletePayment(payment.id)} style={{ padding: '6px 10px', background: '#2a0d0d', color: D_RED, border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SAÍDAS */}
          {activeTab === 'projecao' && (() => {
            const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
            const now = new Date();
            const receitaBase = students.reduce((a: number, s: any) => a + (s.monthly_value || 0), 0);
            // Calcula média de despesas dos últimos 3 meses com dados reais
            const despesaRecorrente = expenses.filter((e: any) => e.is_recurring)
              .reduce((a: number, e: any) => a + (e.amount || 0), 0);
            const despesaMedia = (() => {
              const mesesComDados = [0,1,2].map(i => {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const mes = MONTHS_PT[d.getMonth()];
                const ano = d.getFullYear();
                return expenses.filter((e: any) => e.month === mes && e.year === ano && !e.is_recurring)
                  .reduce((a: number, e: any) => a + (e.amount || 0), 0);
              }).filter(v => v > 0);
              return mesesComDados.length > 0 ? mesesComDados.reduce((a, b) => a + b, 0) / mesesComDados.length : 0;
            })();
            const projecao = Array.from({ length: 6 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
              const mes = MONTHS_PT[d.getMonth()];
              const ano = d.getFullYear();
              const receitaReal = payments.filter((p: any) => p.month === mes && p.year === ano && p.status === 'paid')
                .reduce((a: number, p: any) => a + (p.final_amount || p.amount || 0), 0);
              const despesaReal = expenses.filter((e: any) => e.month === mes && e.year === ano)
                .reduce((a: number, e: any) => a + (e.amount || 0), 0);
              const isPassado = d < new Date(now.getFullYear(), now.getMonth(), 1);
              const isFuturo = d > new Date(now.getFullYear(), now.getMonth(), 1);
              return {
                mes, ano,
                receita: isPassado || !isFuturo ? receitaReal : receitaBase,
                despesa: isPassado || !isFuturo ? despesaReal : despesaMedia + despesaRecorrente,
                projetado: isFuturo,
              };
            });
            const totalReceita = projecao.reduce((a, p) => a + p.receita, 0);
            const totalDespesa = projecao.reduce((a, p) => a + p.despesa, 0);
            const maxVal = Math.max(...projecao.map(p => Math.max(p.receita, p.despesa)), 1);
            return (
              <div style={{ padding: '20px 16px' }}>
                {/* Resumo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Receita Projetada (6m)', value: totalReceita, color: '#22d3a5' },
                    { label: 'Despesa Projetada (6m)', value: totalDespesa, color: '#f43f5e' },
                    { label: 'Resultado Projetado', value: totalReceita - totalDespesa, color: totalReceita - totalDespesa >= 0 ? '#22d3a5' : '#f43f5e' },
                  ].map(k => (
                    <div key={k.label} style={{ background: '#0f1117', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>{k.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>R$ {Math.abs(k.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                </div>

                {/* Info base */}
                <div style={{ background: '#0d1a2a', border: '1px solid #1a2a4a', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: '#60a5fa' }}>
                  💡 Receita base: <strong>R$ {receitaBase.toFixed(2)}</strong>/mês ({students.length} aluno(s)) · Despesa média: <strong>R$ {(despesaMedia + despesaRecorrente).toFixed(2)}</strong>/mês
                </div>

                {/* Gráfico de barras */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {projecao.map((p, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ color: '#e2e8f0' }}>{p.mes.slice(0,3)} {p.ano} {p.projetado ? <span style={{ fontSize: 10, color: '#64748b' }}>(projetado)</span> : ''}</span>
                        <span style={{ color: p.receita - p.despesa >= 0 ? '#22d3a5' : '#f43f5e', fontWeight: 700 }}>
                          {p.receita - p.despesa >= 0 ? '+' : ''}R$ {(p.receita - p.despesa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 60, fontSize: 10, color: '#22d3a5', fontWeight: 600 }}>Receita</span>
                          <div style={{ flex: 1, background: '#1a1d27', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                            <div style={{ width: `${(p.receita / maxVal) * 100}%`, height: '100%', background: p.projetado ? 'repeating-linear-gradient(45deg, #22d3a5, #22d3a5 4px, transparent 4px, transparent 8px)' : '#22d3a5', borderRadius: 4, transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ width: 80, fontSize: 11, color: '#22d3a5', textAlign: 'right', fontWeight: 600 }}>R$ {p.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 60, fontSize: 10, color: '#f43f5e', fontWeight: 600 }}>Despesa</span>
                          <div style={{ flex: 1, background: '#1a1d27', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                            <div style={{ width: `${(p.despesa / maxVal) * 100}%`, height: '100%', background: p.projetado ? 'repeating-linear-gradient(45deg, #f43f5e, #f43f5e 4px, transparent 4px, transparent 8px)' : '#f43f5e', borderRadius: 4, transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ width: 80, fontSize: 11, color: '#f43f5e', textAlign: 'right', fontWeight: 600 }}>R$ {p.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontSize: 11, color: '#64748b', display: 'flex', gap: 16 }}>
                  <span>▓ Real</span>
                  <span>▨ Projetado</span>
                </div>
              </div>
            );
          })()}

          {activeTab === 'saidas' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
                  {[{ label: 'Total', value: fmt(totalSaidas), color: D_RED },{ label: 'Já pago', value: fmt(totalPago), color: D_GREEN }].map(item => (
                    <div key={item.label} style={{ background: '#0f1117', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: item.color, textTransform: 'uppercase' as const, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowExpenseModal(true)} style={{ marginLeft: 14, padding: '10px 16px', background: D_RED, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>+ Nova</button>
              </div>
              <div>
                {monthExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 0', color: D_MUTED }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 14 }}>Nenhuma despesa registrada.</div>
                  </div>
                ) : monthExpenses.map(expense => (
                  <div key={expense.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${D_BORDER}`, flexWrap: 'wrap' as const }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2a0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: D_RED, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {expense.category_name?.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                        <span style={{ fontWeight: 600, color: D_TEXT, fontSize: 14 }}>{expense.description || expense.category_name}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#1a1a2a', color: D_MUTED, fontWeight: 700 }}>{expense.category_name}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: expense.status === 'paid' ? '#0d2a1a' : '#2a1f0d', color: expense.status === 'paid' ? D_GREEN : D_YELLOW, fontWeight: 700 }}>
                          {expense.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                        </span>
                      </div>
                      {expense.due_date && <div style={{ fontSize: 12, color: D_MUTED, marginTop: 4 }}>Vence: {new Date(expense.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: D_RED, fontSize: 16 }}>{fmt(expense.amount)}</span>
                      {expense.status !== 'paid' && (
                        <button onClick={() => setShowPayExpenseModal(expense)} style={{ padding: '6px 12px', background: '#0d2a1a', color: D_GREEN, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Pagar</button>
                      )}
                      <button onClick={() => deleteExpense(expense.id)} style={{ padding: '6px 10px', background: '#2a0d0d', color: D_RED, border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑</button>
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
        <Modal title="Gerar Mensalidades" onClose={() => setShowGenerateModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            <p style={{ fontSize: 13, color: D_MUTED }}>Gera mensalidades para todos os <strong style={{ color: D_TEXT }}>{students.length} alunos</strong> no período selecionado.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>De</label><select value={generateFrom} onChange={e => setGenerateFrom(e.target.value)} style={inputStyle}>{MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><label style={labelStyle}>Até</label><select value={generateTo} onChange={e => setGenerateTo(e.target.value)} style={inputStyle}>{MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowGenerateModal(false)} style={{ flex: 1, padding: '12px 0', border: `1px solid ${D_BORDER}`, borderRadius: 10, background: 'none', color: D_MUTED, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={generatePeriod} disabled={generating} style={{ flex: 1, padding: '12px 0', background: D_PURPLE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{generating ? 'Gerando...' : 'Gerar'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Pagar entrada */}
      {showPayModal && (
        <Modal title="Registrar Pagamento" onClose={() => setShowPayModal(null)}>
          <div style={{ background: '#0d2a1a', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: D_TEXT, fontSize: 15 }}>{showPayModal.student_name}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: D_GREEN, marginTop: 4 }}>{fmt(showPayModal.final_amount || showPayModal.amount)}</div>
            <div style={{ fontSize: 12, color: D_MUTED, marginTop: 4 }}>{showPayModal.month} {showPayModal.year}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            <div><label style={labelStyle}>Data</label><input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Forma de pagamento</label>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {PAYMENT_METHODS.map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${paymentMethod === m ? D_PURPLE : D_BORDER}`, background: paymentMethod === m ? D_PURPLE : 'transparent', color: paymentMethod === m ? '#fff' : D_MUTED, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>{m}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPayModal(null)} style={{ flex: 1, padding: '12px 0', border: `1px solid ${D_BORDER}`, borderRadius: 10, background: 'none', color: D_MUTED, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={markAsPaid} disabled={saving} style={{ flex: 1, padding: '12px 0', background: D_GREEN, border: 'none', borderRadius: 10, color: '#0d2a1a', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Confirmar'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Nova Despesa */}
      {showExpenseModal && (
        <Modal title="Nova Despesa" onClose={() => setShowExpenseModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            <div><label style={labelStyle}>Categoria</label>
              <select value={expenseForm.category_name} onChange={e => setExpenseForm(f => ({ ...f, category_name: e.target.value }))} style={inputStyle}>
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            {expenseForm.category_name === 'Salário Professor' && (
              <div><label style={labelStyle}>Professor</label>
                <select value={expenseForm.teacher_id} onChange={e => { const t = teachers.find(x => x.id === e.target.value); setExpenseForm(f => ({ ...f, teacher_id: e.target.value, teacher_name: t?.name || '', description: 'Salário ' + (t?.name || '') })); }} style={inputStyle}>
                  <option value="">Selecione...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
            <div><label style={labelStyle}>Descrição</label><input type="text" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Aluguel Maio 2026" style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Valor (R$)</label><input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: Number(e.target.value) }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Vencimento</label><input type="date" value={expenseForm.due_date} onChange={e => setExpenseForm(f => ({ ...f, due_date: e.target.value }))} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Mês</label>
                <select value={expenseForm.month} onChange={e => setExpenseForm(f => ({ ...f, month: e.target.value }))} style={inputStyle}>
                  {MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
                <input type="checkbox" id="rec" checked={expenseForm.is_recurring} onChange={e => setExpenseForm(f => ({ ...f, is_recurring: e.target.checked, recorrente_ate: '' }))} style={{ width: 18, height: 18, accentColor: D_PURPLE }} />
                <label htmlFor="rec" style={{ fontSize: 13, fontWeight: 600, color: D_TEXT, cursor: 'pointer' }}>Recorrente</label>
              </div>
            </div>
            {expenseForm.is_recurring && (
              <div style={{ background: '#1a1040', border: `1px solid #3b1d8a`, borderRadius: 10, padding: 14 }}>
                <label style={{ ...labelStyle, color: D_PURPLE }}>Repetir até qual mês?</label>
                <select value={expenseForm.recorrente_ate} onChange={e => setExpenseForm(f => ({ ...f, recorrente_ate: e.target.value }))} style={inputStyle}>
                  <option value="">Selecione...</option>
                  {MONTHS_FULL.slice(MONTHS_FULL.indexOf(expenseForm.month)).map(m => <option key={m} value={m}>{m} {expenseForm.year}</option>)}
                </select>
                {expenseForm.recorrente_ate && <p style={{ fontSize: 12, color: D_PURPLE, marginTop: 8, fontWeight: 600 }}>✅ {MONTHS_FULL.indexOf(expenseForm.recorrente_ate) - MONTHS_FULL.indexOf(expenseForm.month) + 1} despesa(s) serão criadas</p>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowExpenseModal(false)} style={{ flex: 1, padding: '12px 0', border: `1px solid ${D_BORDER}`, borderRadius: 10, background: 'none', color: D_MUTED, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveExpense} disabled={saving || !expenseForm.category_name || !expenseForm.amount} style={{ flex: 1, padding: '12px 0', background: D_RED, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving || !expenseForm.category_name || !expenseForm.amount ? 0.5 : 1 }}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Importar CSV */}
      {showImportModal && (
        <Modal title="📥 Importar Extrato C6 Bank" onClose={() => { setShowImportModal(false); setImportFile(null); setImportPreview([]); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#0d1a2a', border: '1px solid #1a2a4a', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#60a5fa' }}>
              💡 Exporte o extrato do C6 Bank em CSV. Saídas → despesas pagas. Entradas → receitas extras. Cada transação vai para o mês correto automaticamente!
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Arquivo CSV *</label>
              <input type="file" ref={importFileRef} accept=".csv,.txt" onChange={e => e.target.files?.[0] && handleImportFile(e.target.files[0])} style={{ display: 'none' }} />
              <div onClick={() => importFileRef.current?.click()} style={{ border: '2px dashed #2a2d3a', borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', color: '#64748b', fontSize: 14 }}>
                {importFile ? '📎 ' + importFile.name : '📁 Clique para selecionar o CSV do C6'}
              </div>
            </div>

            {importPreview.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>Preview ({importPreview.length} primeiras transações):</div>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {importPreview.map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0f1117', borderRadius: 8, fontSize: 12 }}>
                      <div>
                        <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{row.descricao}</div>
                        <div style={{ color: '#64748b' }}>{row.data}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <div style={{ fontWeight: 700, color: row.tipo === 'saida' ? '#f43f5e' : '#22d3a5' }}>
                          {row.tipo === 'saida' ? '-' : '+'}R$ {row.valor.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{row.tipo === 'saida' ? '💸 Saída' : '💰 Entrada'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportPreview([]); }} style={{ flex: 1, padding: '12px 0', border: '1px solid #2a2d3a', borderRadius: 10, background: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmImport} disabled={!importFile || importing} style={{ flex: 1, padding: '12px 0', background: '#0891b2', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: !importFile || importing ? 0.5 : 1 }}>
                {importing ? 'Importando...' : '📥 Importar ' + importPreview.length + ' transações'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Pagar Despesa */}
      {showPayExpenseModal && (
        <Modal title="Confirmar Pagamento" onClose={() => setShowPayExpenseModal(null)}>
          <div style={{ background: '#2a0d0d', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: D_TEXT, fontSize: 15 }}>{showPayExpenseModal.description || showPayExpenseModal.category_name}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: D_RED, marginTop: 4 }}>{fmt(showPayExpenseModal.amount)}</div>
          </div>
          <div><label style={labelStyle}>Data</label><input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={inputStyle} /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => setShowPayExpenseModal(null)} style={{ flex: 1, padding: '12px 0', border: `1px solid ${D_BORDER}`, borderRadius: 10, background: 'none', color: D_MUTED, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={markExpenseAsPaid} disabled={saving} style={{ flex: 1, padding: '12px 0', background: D_GREEN, border: 'none', borderRadius: 10, color: '#0d2a1a', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Confirmar'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
