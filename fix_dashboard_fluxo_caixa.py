fixes = [
    ("components/views/FinanceView.tsx",
     """  const fluxoAnual = MONTHS.map((m, i) => {
    const mFull = MONTHS_FULL[i];
    const p = payments.filter(x => x.month === mFull && x.year === filterYear);
    const e = expenses.filter(x => x.month === mFull && x.year === filterYear);
    const entradas = p.reduce((a, x) => a + (x.final_amount || x.amount || 0), 0);
    const saidas = e.reduce((a, x) => a + (x.amount || 0), 0);
    const recebido = p.filter(x => x.status === 'paid').reduce((a, x) => a + (x.final_amount || x.amount || 0), 0);
    return { mes: m, entradas, saidas, recebido, resultado: recebido - saidas };
  });""",
     """  const fluxoAnual = MONTHS.map((m, i) => {
    const mFull = MONTHS_FULL[i];
    const p = payments.filter(x => x.month === mFull && x.year === filterYear);
    const e = expenses.filter(x => x.month === mFull && x.year === filterYear);
    const totalCobrado = p.reduce((a, x) => a + (x.final_amount || x.amount || 0), 0);
    const totalLancado = e.reduce((a, x) => a + (x.amount || 0), 0);
    const recebido = p.filter(x => x.status === 'paid').reduce((a, x) => a + (x.final_amount || x.amount || 0), 0);
    const pago = e.filter(x => x.status === 'paid').reduce((a, x) => a + (x.amount || 0), 0);
    // Fluxo de Caixa = dinheiro que realmente entrou/saiu, nao o total cobrado/lancado (que inclui pendente e atrasado)
    return { mes: m, entradas: recebido, saidas: pago, totalCobrado, totalLancado, recebido, resultado: recebido - pago };
  });"""),
    ("components/views/FinanceView.tsx",
     """  const expensesByCategory = Object.entries(
    monthExpenses.reduce((acc: any, e) => { acc[e.category_name] = (acc[e.category_name] || 0) + e.amount; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));""",
     """  const expensesByCategory = Object.entries(
    monthExpenses.filter(e => e.status === 'paid').reduce((acc: any, e) => { acc[e.category_name] = (acc[e.category_name] || 0) + e.amount; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));"""),
    ("components/views/FinanceView.tsx",
     """<div style={{ fontSize: 12, color: D_MUTED, marginTop: 2 }}>Entradas vs Saídas — {filterYear}</div>""",
     """<div style={{ fontSize: 12, color: D_MUTED, marginTop: 2 }}>Recebido vs Pago (dinheiro real) — {filterYear}</div>"""),
    ("components/views/FinanceView.tsx",
     """<div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT, marginBottom: 14 }}>Despesas por categoria</div>""",
     """<div style={{ fontSize: 14, fontWeight: 700, color: D_TEXT, marginBottom: 14 }}>Despesas pagas por categoria</div>"""),
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
