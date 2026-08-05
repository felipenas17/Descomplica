old = """    const validStudents = studentsList.filter(s => s.id || s.name);
    if (validStudents.length === 0) { setReposicoesPendentesDetectadas([]); return; }
    const results: any[] = [];
    for (const st of validStudents) {
      let query = supabase.from('schedules').select('*').eq('reposicao_pendente', true).neq('status', 'reposicao_concluida');
      if (st.id) query = query.eq('student_id', st.id);
      else query = query.ilike('student_name', st.name);
      const { data } = await query.limit(1);
      if (data && data.length > 0) results.push(data[0]);
    }
    setReposicoesPendentesDetectadas(results);
    setVinculosSelecionados([]);
  };"""
new = """    const validStudents = studentsList.filter(s => s.id || s.name);
    if (validStudents.length === 0) { setReposicoesPendentesDetectadas([]); return; }
    const results: any[] = [];
    for (const st of validStudents) {
      let query = supabase.from('schedules').select('*')
        .in('attendance_status', ['justificada', 'Justificada'])
        .neq('status', 'reposicao_concluida')
        .neq('status', 'reposicao_marcada');
      if (st.id) query = query.eq('student_id', st.id);
      else query = query.ilike('student_name', st.name);
      const { data } = await query.order('date', { ascending: true }).limit(10);
      if (data) results.push(...data);
    }
    setReposicoesPendentesDetectadas(results);
    setVinculosSelecionados([]);
  };"""

path = "components/views/operations/SchoolCalendar.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
n = content.count(old)
if n == 0:
    raise SystemExit("NAO ENCONTROU, abortando (nada mudou):\n" + old)
if n > 1:
    raise SystemExit(f"ENCONTROU {n}x, ambiguo, abortando:\n" + old)
content = content.replace(old, new)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("OK: deteccao agora acha justificada esquecida, sem precisar clicar em nada antes")
