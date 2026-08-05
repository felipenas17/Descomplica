fixes = [
    ("components/views/AbsencesView.tsx",
     """  const confirmLesson = async (id: string) => {
    await supabase.from('schedules').update({ status: 'concluido', admin_confirmed: true }).eq('id', id);
    // Se esta aula era uma reposição de outra, fecha o ciclo da aula original
    const lesson = schedules.find(s => s.id === id);
    if (lesson && (lesson as any).reposicao_de_id) {
      await supabase.from('schedules').update({ status: 'reposicao_concluida' }).eq('id', (lesson as any).reposicao_de_id);
    }
    fetchData();""",
     """  const confirmLesson = async (id: string) => {
    await supabase.from('schedules').update({ status: 'concluido', admin_confirmed: true }).eq('id', id);
    // Se esta aula era uma reposição de outra (ou de varias), fecha o ciclo de todas as originais
    const lesson = schedules.find(s => s.id === id);
    const idsOriginais: string[] = (lesson as any)?.reposicao_de_ids || ((lesson as any)?.reposicao_de_id ? [(lesson as any).reposicao_de_id] : []);
    for (const origId of idsOriginais) {
      await supabase.from('schedules').update({ status: 'reposicao_concluida' }).eq('id', origId);
    }
    fetchData();"""),
    ("components/views/AbsencesView.tsx",
     "        reposicao_de_id: showRemarcarModal.id,",
     "        reposicao_de_ids: [showRemarcarModal.id],"),
    ("components/views/AbsencesView.tsx",
     "                      const vinc = schedules.find(x => x.reposicao_de_id === s.id);",
     "                      const vinc = schedules.find(x => (x.reposicao_de_ids && x.reposicao_de_ids.includes(s.id)) || x.reposicao_de_id === s.id);"),
    ("components/views/operations/SchoolCalendar.tsx",
     """      // Atualiza a aula
      const vinculoId = vinculosSelecionados.length === 1 ? vinculosSelecionados[0] : null;
      await supabase.from('schedules').update({
        teacher_id: substData.professor_id,
        teacher_name: novoProf?.name,
        notes: (selectedLesson.notes || '') + ' | Substituido: ' + (selectedLesson.teacher_name) + ' por ' + novoProf?.name,
        reposicao_de_id: vinculoId,
      }).eq('id', selectedLesson.id);
      if (vinculoId) {
        await supabase.from('schedules').update({ reposicao_pendente: false, status: 'reposicao_marcada' }).eq('id', vinculoId);
      }""",
     """      // Atualiza a aula
      await supabase.from('schedules').update({
        teacher_id: substData.professor_id,
        teacher_name: novoProf?.name,
        notes: (selectedLesson.notes || '') + ' | Substituido: ' + (selectedLesson.teacher_name) + ' por ' + novoProf?.name,
        reposicao_de_ids: vinculosSelecionados.length > 0 ? vinculosSelecionados : null,
      }).eq('id', selectedLesson.id);
      for (const vincId of vinculosSelecionados) {
        await supabase.from('schedules').update({ reposicao_pendente: false, status: 'reposicao_marcada' }).eq('id', vincId);
      }"""),
    ("components/views/operations/SchoolCalendar.tsx",
     "        reposicao_de_id: vinculosSelecionados.length === 1 ? vinculosSelecionados[0] : null,",
     "        reposicao_de_ids: vinculosSelecionados.length > 0 ? vinculosSelecionados : null,"),
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
