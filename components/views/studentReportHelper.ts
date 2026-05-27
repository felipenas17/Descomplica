export function generateStudentReportHTML(student: any, schedules: any[], payments: any[], feedbacks: any[], month: string, year: number): string {
  const o = (tag: string, content: string, attr?: string) => {
    const open = attr ? '<' + tag + ' ' + attr + '>' : '<' + tag + '>';
    return open + content + '</' + tag + '>';
  };

  const aulasConcluidas = schedules.filter(s => s.status === 'concluido').length;
  const faltasNaoJustificadas = schedules.filter(s => s.attendance_status === 'falta' || s.attendance_status === 'Ausente').length;
  const faltasJustificadas = schedules.filter(s => s.attendance_status === 'justificada' || s.attendance_status === 'Justificada').length;
  const pagamento = payments.find(p => p.month === month && p.year === year);
  const presencas = schedules.filter(s => s.attendance_status === 'Presente' || s.attendance_status === 'presente').length;
  const taxaPresenca = schedules.length > 0 ? Math.round((presencas / schedules.length) * 100) : 0;

  return (
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:11pt;margin:2cm;color:#000;line-height:1.6}' +
    '.header{border-bottom:3px solid #7C3AED;padding-bottom:15px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}' +
    '.logo{font-size:18pt;font-weight:bold;color:#7C3AED}' +
    '.logo-sub{font-size:9pt;color:#666}' +
    'h1{font-size:14pt;text-align:center;margin:20px 0;color:#7C3AED;text-transform:uppercase}' +
    'h2{font-size:11pt;font-weight:bold;color:#7C3AED;border-bottom:1px solid #ddd;padding-bottom:5px;margin-top:20px}' +
    '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}' +
    '.info-box{background:#f5f0ff;padding:10px;border-radius:8px}' +
    '.info-label{font-size:9pt;color:#666;font-weight:bold;text-transform:uppercase}' +
    '.info-value{font-size:12pt;font-weight:bold;color:#333}' +
    '.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:15px 0}' +
    '.kpi{text-align:center;padding:10px;border-radius:8px}' +
    '.kpi-green{background:#f0fdf4}.kpi-red{background:#fef2f2}.kpi-yellow{background:#fefce8}.kpi-purple{background:#f5f0ff}' +
    '.kpi-num{font-size:20pt;font-weight:bold}' +
    '.kpi-label{font-size:8pt;color:#666;text-transform:uppercase}' +
    'table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10pt}' +
    'th{background:#7C3AED;color:white;padding:8px;text-align:left}' +
    'td{padding:6px 8px;border-bottom:1px solid #eee}' +
    'tr:nth-child(even){background:#f9f9f9}' +
    '.status-ok{color:green;font-weight:bold}.status-err{color:red;font-weight:bold}.status-warn{color:orange;font-weight:bold}' +
    '.footer{margin-top:40px;text-align:center;font-size:9pt;color:#999;border-top:1px solid #eee;padding-top:15px}' +
    '.sign-area{display:flex;justify-content:space-between;margin-top:60px}' +
    '.sign-box{text-align:center;width:45%}' +
    '.sign-line{border-top:1px solid #000;margin-bottom:5px;margin-top:40px}' +
    '@media print{body{margin:1.5cm}}' +
    '</style></head><body>' +

    '<div class="header">' +
    '<div><div class="logo">Professora Descomplica</div><div class="logo-sub">Espaco Pedagogico - CNPJ: 55.010.967/0001-46</div></div>' +
    '<div style="text-align:right;font-size:9pt;color:#666">Rua Vicente Viana, 293<br>Novo Rio das Ostras - RJ</div>' +
    '</div>' +

    o('h1', 'RELATORIO MENSAL DO ALUNO - ' + month.toUpperCase() + '/' + year) +

    '<div class="info-grid">' +
    '<div class="info-box"><div class="info-label">Aluno</div><div class="info-value">' + (student.name || '') + '</div></div>' +
    '<div class="info-box"><div class="info-label">Responsavel</div><div class="info-value">' + (student.parent_name || '---') + '</div></div>' +
    '<div class="info-box"><div class="info-label">Turno</div><div class="info-value">' + (student.shift || '---') + '</div></div>' +
    '<div class="info-box"><div class="info-label">Mensalidade</div><div class="info-value">R$ ' + Number(student.monthly_value || 0).toFixed(2).replace('.', ',') + '</div></div>' +
    '</div>' +

    o('h2', 'Resumo de Frequencia') +
    '<div class="kpi-grid">' +
    '<div class="kpi kpi-purple"><div class="kpi-num" style="color:#7C3AED">' + schedules.length + '</div><div class="kpi-label">Total Aulas</div></div>' +
    '<div class="kpi kpi-green"><div class="kpi-num" style="color:green">' + aulasConcluidas + '</div><div class="kpi-label">Concluidas</div></div>' +
    '<div class="kpi kpi-red"><div class="kpi-num" style="color:red">' + faltasNaoJustificadas + '</div><div class="kpi-label">Faltas</div></div>' +
    '<div class="kpi kpi-yellow"><div class="kpi-num" style="color:orange">' + faltasJustificadas + '</div><div class="kpi-label">Justificadas</div></div>' +
    '</div>' +
    o('p', 'Taxa de Presenca: ' + o('strong', taxaPresenca + '%') + ' (' + presencas + ' de ' + schedules.length + ' aulas)', 'style="margin:5px 0"') +

    (schedules.length > 0 ? (
      o('h2', 'Aulas do Mes') +
      '<table><tr><th>Data</th><th>Horario</th><th>Disciplina</th><th>Professor</th><th>Status</th></tr>' +
      schedules.map(s => (
        '<tr><td>' + (s.date ? new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR') : '---') + '</td>' +
        '<td>' + (s.start_time || '---') + '</td>' +
        '<td>' + (s.subject || '---') + '</td>' +
        '<td>' + (s.teacher_name || '---') + '</td>' +
        '<td class="' + (s.status === 'concluido' ? 'status-ok' : s.status === 'cancelado' ? 'status-err' : 'status-warn') + '">' +
        (s.status === 'concluido' ? 'Concluida' : s.status === 'cancelado' ? 'Cancelada' : 'Agendada') + '</td></tr>'
      )).join('') +
      '</table>'
    ) : o('p', 'Nenhuma aula registrada neste mes.')) +

    (feedbacks.length > 0 ? (
      o('h2', 'Observacoes do Professor') +
      feedbacks.map(f => (
        '<div style="background:#f9f9f9;padding:10px;border-radius:8px;margin:8px 0;border-left:3px solid #7C3AED">' +
        '<div style="font-size:9pt;color:#666;margin-bottom:4px">' + (f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR') : '') + ' - Presenca: ' + (f.attendance || '---') + '</div>' +
        (f.content ? '<div>' + f.content + '</div>' : '') +
        (f.observations ? '<div style="color:#666;font-style:italic;margin-top:4px">' + f.observations + '</div>' : '') +
        '</div>'
      )).join('')
    ) : '') +

    o('h2', 'Situacao Financeira') +
    '<div class="info-box" style="margin:10px 0">' +
    '<div class="info-label">Mensalidade ' + month + '/' + year + '</div>' +
    '<div class="info-value ' + (pagamento?.status === 'paid' ? 'status-ok' : 'status-err') + '">' +
    (pagamento ? (pagamento.status === 'paid' ? 'PAGO' : 'PENDENTE') : 'NAO LANCADO') + '</div>' +
    '</div>' +

    '<div class="sign-area">' +
    '<div class="sign-box"><div class="sign-line"></div><p><strong>Responsavel</strong></p><p>' + (student.parent_name || '') + '</p></div>' +
    '<div class="sign-box"><div class="sign-line"></div><p><strong>Gestao</strong></p><p>DESCOMPLICA EDUCACIONAL LTDA</p></div>' +
    '</div>' +

    '<div class="footer">Relatorio gerado em ' + new Date().toLocaleDateString('pt-BR') + ' - Descomplica Educacional LTDA - CNPJ: 55.010.967/0001-46</div>' +
    '</body></html>'
  );
}
