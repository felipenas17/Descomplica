fixes = [
("components/views/AbsencesView.tsx",
"""  const rejectLesson = async (id: string) => {
    await supabase.from('schedules').update({ status: 'cancelado', admin_confirmed: false }).eq('id', id);
    fetchData();
    toast.error('Aula recusada!');
  };""",
"""  const rejectLesson = async (id: string) => {
    // Recusar a confirmacao NAO cancela a aula (ela pode nem ter acontecido ainda, so foi marcada errada) -
    // reverte pro estado normal, pronta pra ser marcada de novo, do jeito certo, quando o dia chegar.
    await supabase.from('schedules').update({ status: 'confirmado', attendance_status: null, admin_confirmed: false }).eq('id', id);
    fetchData();
    toast.error('Aula recusada e revertida para pendente!');
  };"""),

("components/views/TeacherScheduleView.tsx",
"""  const openFeedback = (lesson: any) => {
    setFeedbackLesson(lesson);
    setFeedback({ attendance: 'Presente', discipline: '', content: '', resources: '', notes: '' });
  };""",
"""  const openFeedback = (lesson: any) => {
    const hojeStr = new Date().toISOString().split('T')[0];
    if (lesson.date && lesson.date > hojeStr) {
      const dataFmt = new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR');
      const confirmou = window.confirm('Atencao: essa aula e do dia ' + dataFmt + ', que ainda nao chegou. Tem certeza que quer finalizar ela agora, antes da data?');
      if (!confirmou) return;
    }
    setFeedbackLesson(lesson);
    setFeedback({ attendance: 'Presente', discipline: '', content: '', resources: '', notes: '' });
  };"""),
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
