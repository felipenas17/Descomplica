fixes = [
("components/views/operations/SchoolCalendar.tsx",
"""      const novoAluno = students.find(s => s.id === substAlunoData.novo_aluno_id);
      const motivoFinal = substAlunoData.motivo_tag + (substAlunoData.motivo_texto ? (substAlunoData.motivo_tag ? ' - ' : '') + substAlunoData.motivo_texto : '');
      await supabase.from('schedules').update({
        attendance_status: substAlunoData.tipo,
        status: substAlunoData.tipo === 'falta' ? 'falta_confirmada' : selectedLesson.status,
        motivo_falta: motivoFinal,
        notes: (selectedLesson.notes || '') + ' | Substituido por ' + novoAluno?.name,
        professor_liberado: true,
      }).eq('id', selectedLesson.id);
      await supabase.from('schedules').insert({
        date: selectedLesson.date,
        start_time: (selectedLesson as any).start_time,
        end_time: (selectedLesson as any).end_time,
        teacher_id: selectedLesson.teacher_id,
        teacher_name: selectedLesson.teacher_name,
        subject: selectedLesson.subject,
        student_id: substAlunoData.novo_aluno_id,
        student_name: novoAluno?.name,
        status: vinculosSelecionados.length > 0 ? 'reposicao_marcada' : 'confirmado',
        reposicao_de_ids: vinculosSelecionados.length > 0 ? vinculosSelecionados : null,
        notes: 'Substituindo ' + selectedLesson.student_name + ' (' + motivoFinal + ')',
      });
      for (const vincId of vinculosSelecionados) {
        await supabase.from('schedules').update({ reposicao_pendente: false, status: 'reposicao_marcada' }).eq('id', vincId);
      }
      toast.success('Aluno substituido, historico preservado!');""",
"""      const novoAluno = students.find(s => s.id === substAlunoData.novo_aluno_id);
      const motivoFinal = substAlunoData.motivo_tag + (substAlunoData.motivo_texto ? (substAlunoData.motivo_tag ? ' - ' : '') + substAlunoData.motivo_texto : '');
      const { error: erro1 } = await supabase.from('schedules').update({
        attendance_status: substAlunoData.tipo,
        status: substAlunoData.tipo === 'falta' ? 'falta_confirmada' : selectedLesson.status,
        motivo_falta: motivoFinal,
        notes: (selectedLesson.notes || '') + ' | Substituido por ' + novoAluno?.name,
        professor_liberado: true,
      }).eq('id', selectedLesson.id);
      if (erro1) { toast.error('Erro ao marcar aula original: ' + erro1.message); setSavingSubst(false); return; }

      const { error: erro2 } = await supabase.from('schedules').insert({
        date: selectedLesson.date,
        start_time: (selectedLesson as any).start_time,
        end_time: (selectedLesson as any).end_time,
        teacher_id: selectedLesson.teacher_id,
        teacher_name: selectedLesson.teacher_name,
        subject: selectedLesson.subject,
        student_id: substAlunoData.novo_aluno_id,
        student_name: novoAluno?.name,
        status: vinculosSelecionados.length > 0 ? 'reposicao_marcada' : 'confirmado',
        reposicao_de_ids: vinculosSelecionados.length > 0 ? vinculosSelecionados : null,
        notes: 'Substituindo ' + selectedLesson.student_name + ' (' + motivoFinal + ')',
      });
      if (erro2) { toast.error('Erro ao criar aula do substituto (pendencia NAO foi fechada): ' + erro2.message); setSavingSubst(false); return; }

      for (const vincId of vinculosSelecionados) {
        const { error: erro3 } = await supabase.from('schedules').update({ reposicao_pendente: false, status: 'reposicao_marcada' }).eq('id', vincId);
        if (erro3) { toast.error('Aula do substituto foi criada, mas erro ao fechar a pendencia antiga: ' + erro3.message); setSavingSubst(false); return; }
      }
      toast.success('Aluno substituido, historico preservado!');"""),
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
