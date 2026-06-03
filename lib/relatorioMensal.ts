'use client';
import { supabase } from '@/lib/supabase';

const MONTHS_FULL = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export async function gerarRelatorioPDF(mes?: string, ano?: number) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const now = new Date();
  const mesAtual = mes || MONTHS_FULL[now.getMonth()];
  const anoAtual = ano || now.getFullYear();
  const mesIdx = MONTHS_FULL.indexOf(mesAtual);
  const mesStr = String(mesIdx + 1).padStart(2, '0');

  const [
    { data: teachers },
    { data: schedules },
    { data: payments },
    { data: expenses },
    { data: feedbacks },
  ] = await Promise.all([
    supabase.from('teachers').select('id, name'),
    supabase.from('schedules').select('*').gte('date', anoAtual + '-' + mesStr + '-01').lte('date', anoAtual + '-' + mesStr + '-31'),
    supabase.from('monthly_payments').select('*').eq('month', mesAtual).eq('year', anoAtual),
    supabase.from('expenses').select('*').eq('month', mesAtual).eq('year', anoAtual),
    supabase.from('feedbacks').select('*').gte('class_date', anoAtual + '-' + mesStr + '-01').lte('class_date', anoAtual + '-' + mesStr + '-31'),
  ]);

  const receitaPrevista = (payments || []).reduce((a: number, p: any) => a + (p.final_amount || p.amount || 0), 0);
  const receitaRecebida = (payments || []).filter((p: any) => p.status === 'paid').reduce((a: number, p: any) => a + (p.final_amount || p.amount || 0), 0);
  const totalDespesas = (expenses || []).reduce((a: number, e: any) => a + (e.amount || 0), 0);
  const lucro = receitaRecebida - totalDespesas;
  const inadimplentes = (payments || []).filter((p: any) => p.status === 'overdue');
  const aulasConcluidas = (schedules || []).filter((s: any) => s.status === 'concluido');

  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, W, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Professora Descomplica', 14, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatorio Mensal - ' + mesAtual + '/' + anoAtual, 14, 26);
  doc.text('Gerado em: ' + now.toLocaleDateString('pt-BR'), 14, 34);

  y = 52;

  doc.setTextColor(124, 58, 237);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Financeiro', 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Valor']],
    body: [
      ['Receita Prevista', 'R$ ' + receitaPrevista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Receita Recebida', 'R$ ' + receitaRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Total Despesas', 'R$ ' + totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      [lucro >= 0 ? 'Lucro Liquido' : 'Prejuizo', 'R$ ' + Math.abs(lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Aulas Concluidas', aulasConcluidas.length + ' de ' + (schedules || []).length],
      ['Inadimplentes', inadimplentes.length + ' aluno(s)'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  if ((teachers || []).length > 0) {
    doc.setTextColor(124, 58, 237);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Aulas por Professor', 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [['Professor', 'Total', 'Concluidas', 'Taxa']],
      body: (teachers || []).map((t: any) => {
        const aulasProf = (schedules || []).filter((s: any) => s.teacher_id === t.id);
        const conc = aulasProf.filter((s: any) => s.status === 'concluido').length;
        return [t.name, aulasProf.length, conc, aulasProf.length > 0 ? Math.round((conc / aulasProf.length) * 100) + '%' : '0%'];
      }).filter((r: any) => r[1] > 0),
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  if (inadimplentes.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Inadimplentes', 14, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [['Aluno', 'Valor', 'Vencimento']],
      body: inadimplentes.map((p: any) => [p.student_name, 'R$ ' + Number(p.final_amount || p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }), new Date(p.due_date + 'T00:00:00').toLocaleDateString('pt-BR')]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  if ((expenses || []).length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setTextColor(124, 58, 237);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Despesas', 14, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [['Descricao', 'Categoria', 'Valor']],
      body: (expenses || []).map((e: any) => [e.description || '-', e.category_name || '-', 'R$ ' + Number(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })]),
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
  }

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Professora Descomplica - Pagina ' + i + ' de ' + pageCount, W / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  doc.save('Relatorio_' + mesAtual + '_' + anoAtual + '.pdf');
}
