'use client';
import { supabase } from '@/lib/supabase';

const MONTHS_FULL = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_FULL_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export async function gerarRelatorioPDF(mes?: string, ano?: number) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const now = new Date();
  const anoAtual = ano || now.getFullYear();
  const mesIdx = mes ? MONTHS_FULL_PT.indexOf(mes) : now.getMonth();
  const mesAtual = MONTHS_FULL_PT[mesIdx];
  const mesStr = String(mesIdx + 1).padStart(2, '0');
  const dataInicio = anoAtual + '-' + mesStr + '-01';
  const ultimoDia = new Date(anoAtual, mesIdx + 1, 0).getDate();
  const dataFim = anoAtual + '-' + mesStr + '-' + String(ultimoDia).padStart(2, '0');

  const [
    { data: teachers },
    { data: schedules },
    { data: payments },
    { data: expenses },
    { data: feedbacks },
  ] = await Promise.all([
    supabase.from('teachers').select('id, name'),
    supabase.from('schedules').select('*').gte('date', dataInicio).lte('date', dataFim),
    supabase.from('monthly_payments').select('*').eq('month', mesAtual).eq('year', anoAtual),
    supabase.from('expenses').select('*').eq('month', mesAtual).eq('year', anoAtual),
    supabase.from('feedbacks').select('*').gte('class_date', dataInicio).lte('class_date', dataFim),
  ]);

  const receitaPrevista = (payments || []).reduce((a: number, p: any) => a + (p.final_amount || p.amount || 0), 0);
  const receitaRecebida = (payments || []).filter((p: any) => p.status === 'paid').reduce((a: number, p: any) => a + (p.final_amount || p.amount || 0), 0);
  const totalDespesas = (expenses || []).reduce((a: number, e: any) => a + (e.amount || 0), 0);
  const lucro = receitaRecebida - totalDespesas;
  const inadimplentes = (payments || []).filter((p: any) => p.status === 'overdue');
  const aulasConcluidas = (schedules || []).filter((s: any) => s.status === 'concluido');
  const taxaReceb = receitaPrevista > 0 ? Math.round((receitaRecebida / receitaPrevista) * 100) : 0;

  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, W, 45, 'F');
  doc.setFillColor(109, 40, 217);
  doc.rect(0, 35, W, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Professora Descomplica', 14, 18);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatorio Mensal — ' + mesAtual + ' de ' + anoAtual, 14, 28);
  doc.setFontSize(9);
  doc.text('Gerado em: ' + now.toLocaleDateString('pt-BR') + ' as ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 14, 40);

  let y = 58;

  // KPIs em cards
  const kpis = [
    { label: 'Receita Prevista', value: 'R$ ' + receitaPrevista.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), color: [124, 58, 237] as [number,number,number] },
    { label: 'Receita Recebida', value: 'R$ ' + receitaRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), color: [22, 163, 74] as [number,number,number] },
    { label: 'Total Despesas', value: 'R$ ' + totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), color: [220, 38, 38] as [number,number,number] },
    { label: lucro >= 0 ? 'Lucro Liquido' : 'Prejuizo', value: 'R$ ' + Math.abs(lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 }), color: lucro >= 0 ? [22, 163, 74] as [number,number,number] : [220, 38, 38] as [number,number,number] },
  ];

  const cardW = (W - 28 - 9) / 4;
  kpis.forEach((kpi, i) => {
    const x = 14 + i * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(x, y, cardW, 22, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, x + 4, y + 8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 4, y + 17);
  });

  y += 30;

  // Stats linha
  const stats = [
    'Aulas: ' + (schedules || []).length + ' agendadas / ' + aulasConcluidas.length + ' concluidas',
    'Feedbacks: ' + (feedbacks || []).length,
    'Inadimplentes: ' + inadimplentes.length,
    'Taxa recebimento: ' + taxaReceb + '%',
  ];
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  stats.forEach((s, i) => {
    doc.text(s, 14 + i * (W - 28) / 4, y);
  });

  y += 12;

  // Aulas por professor
  const profData = (teachers || []).map((t: any) => {
    const aulasProf = (schedules || []).filter((s: any) => s.teacher_id === t.id);
    const conc = aulasProf.filter((s: any) => s.status === 'concluido').length;
    return { name: t.name, total: aulasProf.length, conc, taxa: aulasProf.length > 0 ? Math.round((conc / aulasProf.length) * 100) : 0 };
  }).filter((r: any) => r.total > 0);

  if (profData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 58, 237);
    doc.text('Desempenho por Professor', 14, y);
    y += 2;
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Professor', 'Total Aulas', 'Concluidas', 'Taxa Conclusao']],
      body: profData.map((r: any) => [r.name, r.total, r.conc, r.taxa + '%']),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Inadimplentes
  if (inadimplentes.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('Inadimplentes', 14, y);
    y += 2;
    doc.setDrawColor(220, 38, 38);
    doc.line(14, y, W - 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Aluno', 'Valor', 'Vencimento', 'Status']],
      body: inadimplentes.map((p: any) => [
        p.student_name,
        'R$ ' + Number(p.final_amount || p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        new Date(p.due_date + 'T00:00:00').toLocaleDateString('pt-BR'),
        'Em atraso'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: [180, 0, 0] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Despesas
  if ((expenses || []).length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 58, 237);
    doc.text('Despesas do Mes', 14, y);
    y += 2;
    doc.setDrawColor(124, 58, 237);
    doc.line(14, y, W - 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Descricao', 'Categoria', 'Valor', 'Status']],
      body: (expenses || []).map((e: any) => [
        e.description || '-',
        e.category_name || '-',
        'R$ ' + Number(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        e.status === 'paid' ? 'Pago' : 'Pendente'
      ]),
      foot: [['TOTAL', '', 'R$ ' + totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), '']],
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 10 },
      footStyles: { fillColor: [240, 235, 255], textColor: [80, 0, 180], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      columnStyles: { 2: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer em todas as páginas
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(124, 58, 237);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Professora Descomplica — ' + mesAtual + '/' + anoAtual + ' — Pagina ' + i + ' de ' + pageCount, W / 2, H - 4, { align: 'center' });
  }

  doc.save('Relatorio_' + mesAtual + '_' + anoAtual + '.pdf');
}
