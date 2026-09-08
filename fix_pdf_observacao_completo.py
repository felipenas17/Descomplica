fixes = [
("components/views/AbsencesView.tsx",
"""    const rows = base2.sort((a: any,b: any) => (a.date+a.start_time).localeCompare(b.date+b.start_time)).map((s: any) => {
      const mins = duracao(s.start_time,s.end_time);
      const durLabel = mins===60?'1h':mins===90?'1h30':mins===120?'2h':mins+'min';
      const st = s.attendance_status==='feriado'?'Feriado':s.status==='reposicao_concluida'?'Concluida':(s.status==='concluido'&&s.admin_confirmed)?'Concluida':s.attendance_status==='falta'?'Falta':(s.reposicao_pendente||s.status==='reposicao_marcada')?'Reposicao':(s.attendance_status==='justificada'||s.attendance_status==='Justificada')?'Justificada':s.lesson_type==='avulsa'?'Avulsa':'Aguardando';
      const stColor = st==='Feriado'?'#EDE9FE;color:#5B21B6':st==='Concluida'?'#D1FAE5;color:#065F46':st==='Falta'?'#FEE2E2;color:#991B1B':st==='Justificada'?'#FEF3C7;color:#92400E':st==='Reposicao'?'#DBEAFE;color:#1E40AF':'#F3F4F6;color:#374151';
      const [y,m,d] = (s.date||'').split('-');
      return '<tr><td>'+(d||'')+'/'+( m||'')+'</td><td>'+(s.start_time||'')+'-'+(s.end_time||'')+'</td><td>'+(s.student_name||'')+'</td><td>'+durLabel+'</td><td><span style="display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;background:'+stColor+'">'+st+'</span></td></tr>';
    }).join('');""",
"""    const escHtml = (t: string) => (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const rows = base2.sort((a: any,b: any) => (a.date+a.start_time).localeCompare(b.date+b.start_time)).map((s: any) => {
      const mins = duracao(s.start_time,s.end_time);
      const durLabel = mins===60?'1h':mins===90?'1h30':mins===120?'2h':mins+'min';
      const st = s.attendance_status==='feriado'?'Feriado':s.status==='reposicao_concluida'?'Concluida':(s.status==='concluido'&&s.admin_confirmed)?'Concluida':s.attendance_status==='falta'?'Falta':(s.reposicao_pendente||s.status==='reposicao_marcada')?'Reposicao':(s.attendance_status==='justificada'||s.attendance_status==='Justificada')?'Justificada':s.lesson_type==='avulsa'?'Avulsa':'Aguardando';
      const stColor = st==='Feriado'?'#EDE9FE;color:#5B21B6':st==='Concluida'?'#D1FAE5;color:#065F46':st==='Falta'?'#FEE2E2;color:#991B1B':st==='Justificada'?'#FEF3C7;color:#92400E':st==='Reposicao'?'#DBEAFE;color:#1E40AF':'#F3F4F6;color:#374151';
      const [y,m,d] = (s.date||'').split('-');
      const obsParts = [];
      if (s.motivo_falta) obsParts.push(escHtml(s.motivo_falta));
      if (s.status === 'falta_confirmada' && s.professor_liberado) obsParts.push('<b>Professora liberada</b>');
      const origIds = (s.reposicao_de_ids && s.reposicao_de_ids.length > 0) ? s.reposicao_de_ids : (s.reposicao_de_id ? [s.reposicao_de_id] : []);
      const origs = origIds.map((oid: string) => schedules.find((x: any) => x.id === oid)).filter(Boolean);
      origs.forEach((o: any) => {
        const [oy,om,od] = (o.date||'').split('-');
        obsParts.push('Reposi\u00e7\u00e3o da aula de '+(od||'')+'/'+(om||'')+' com '+escHtml(o.teacher_name||''));
      });
      const obs = obsParts.join(' \u2014 ');
      return '<tr><td>'+(d||'')+'/'+( m||'')+'</td><td>'+(s.start_time||'')+'-'+(s.end_time||'')+'</td><td>'+(s.student_name||'')+'</td><td>'+durLabel+'</td><td><span style="display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;background:'+stColor+'">'+st+'</span></td><td style="font-size:10px;color:#6B7280">'+obs+'</td></tr>';
    }).join('');"""),

("components/views/AbsencesView.tsx",
"""<table><thead><tr><th>Data</th><th>Hor\u00e1rio</th><th>Aluno</th><th>Dura\u00e7\u00e3o</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table>""",
"""<table><thead><tr><th>Data</th><th>Hor\u00e1rio</th><th>Aluno</th><th>Dura\u00e7\u00e3o</th><th>Status</th><th>Observa\u00e7\u00e3o</th></tr></thead><tbody>'+rows+'</tbody></table>"""),
]

for path, old, new in fixes:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    n = content.count(old)
    if n == 0:
        raise SystemExit(f"NAO ENCONTROU em {path}, abortando (nada mudou):\n{old}")
    if n > 1:
        raise SystemExit(f"ENCONTROU {n}x em {path}, ambiguo, abortando:\n{old}")
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK:", path)
