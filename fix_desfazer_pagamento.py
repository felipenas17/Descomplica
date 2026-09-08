fixes = [
("components/views/finance/TeacherPayroll.tsx",
"""  const [done, setDone] = useState<Record<string, boolean>>({});""",
"""  const [done, setDone] = useState<Record<string, boolean>>({});
  const [lastIds, setLastIds] = useState<Record<string, { paymentId: string; expenseId: string | null }>>({});
  const [undoing, setUndoing] = useState<string | null>(null);"""),

("components/views/finance/TeacherPayroll.tsx",
"""    setSaving(teacher.id);
    const { error } = await supabase.from('teacher_payments').insert({
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      amount,
      period_start: periodo.start,
      period_end: periodo.end,
      aulas_no_periodo: calc?.total || 0,
      valor_por_aula: calc?.valorPorAula || null,
      payment_method: teacher.payment_method,
      pix_key: teacher.pix_key,
      notes: notes[teacher.id] || '',
      status: 'pago',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    setSaving(null);
    if (!error) {
      setDone(d => ({ ...d, [teacher.id]: true }));
      // Também lança como despesa no Financeiro, categoria Salário Professor
      const { data: cat } = await supabase.from('expense_categories').select('id').eq('name', 'Salário Professor').maybeSingle();
      const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const d = new Date(periodo.end + 'T00:00:00');
      await supabase.from('expenses').insert({
        description: 'Pagamento ' + teacher.name + ' (' + periodo.start.split('-').reverse().join('/') + ' a ' + periodo.end.split('-').reverse().join('/') + ')',
        amount,
        category_id: cat?.id || null,
        category_name: 'Salário Professor',
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        due_date: periodo.end,
        status: 'paid',
        teacher_id: teacher.id,
        teacher_name: teacher.name,
      });
    }
  };""",
"""    setSaving(teacher.id);
    const { data: paymentData, error } = await supabase.from('teacher_payments').insert({
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      amount,
      period_start: periodo.start,
      period_end: periodo.end,
      aulas_no_periodo: calc?.total || 0,
      valor_por_aula: calc?.valorPorAula || null,
      payment_method: teacher.payment_method,
      pix_key: teacher.pix_key,
      notes: notes[teacher.id] || '',
      status: 'pago',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }).select('id').single();
    setSaving(null);
    if (!error) {
      // Também lança como despesa no Financeiro, categoria Salário Professor
      const { data: cat } = await supabase.from('expense_categories').select('id').eq('name', 'Salário Professor').maybeSingle();
      const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const d = new Date(periodo.end + 'T00:00:00');
      const { data: expenseData } = await supabase.from('expenses').insert({
        description: 'Pagamento ' + teacher.name + ' (' + periodo.start.split('-').reverse().join('/') + ' a ' + periodo.end.split('-').reverse().join('/') + ')',
        amount,
        category_id: cat?.id || null,
        category_name: 'Salário Professor',
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        due_date: periodo.end,
        status: 'paid',
        teacher_id: teacher.id,
        teacher_name: teacher.name,
      }).select('id').single();
      setLastIds(l => ({ ...l, [teacher.id]: { paymentId: paymentData?.id, expenseId: expenseData?.id || null } }));
      setDone(d => ({ ...d, [teacher.id]: true }));
    }
  };

  const desfazer = async (teacher: any) => {
    const ids = lastIds[teacher.id];
    if (!ids) return;
    setUndoing(teacher.id);
    await supabase.from('teacher_payments').delete().eq('id', ids.paymentId);
    if (ids.expenseId) await supabase.from('expenses').delete().eq('id', ids.expenseId);
    setUndoing(null);
    setDone(d => ({ ...d, [teacher.id]: false }));
    setLastIds(l => { const copy = { ...l }; delete copy[teacher.id]; return copy; });
  };"""),

("components/views/finance/TeacherPayroll.tsx",
"""                      <div style={{ color: D_GREEN, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Check size={16} /> Pago e lançado em Saídas</div>""",
"""                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        <div style={{ color: D_GREEN, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Check size={16} /> Pago e lançado em Saídas</div>
                        <button onClick={() => desfazer(teacher)} disabled={undoing === teacher.id} style={{ background: 'transparent', border: `1px solid ${D_RED}`, color: D_RED, borderRadius: 8, padding: '7px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>
                          {undoing === teacher.id ? 'Desfazendo...' : '↩ Desfazer este pagamento'}
                        </button>
                      </div>"""),
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
