old = """      // Se teacher_id for 'todos', salva como null na tabela (coluna é UUID)
      const agendaData: any = { ...form, user_id: user?.id, created_at: new Date().toISOString() };
      if (agendaData.teacher_id === 'todos') agendaData.teacher_id = null;
      const { error } = await supabase.from('admin_agenda').insert(agendaData);"""
new = """      // Se teacher_id for 'todos', salva como null na tabela (coluna é UUID) e marca pra notificar todas
      const agendaData: any = { ...form, user_id: user?.id, created_at: new Date().toISOString() };
      if (agendaData.teacher_id === 'todos') { agendaData.teacher_id = null; agendaData.notify_all_teachers = true; }
      const { error } = await supabase.from('admin_agenda').insert(agendaData);"""

path = "components/views/AdminAgendaView.tsx"
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
print("OK:", path)
