fixes = [
("components/views/FinanceView.tsx",
 "import TeacherPayroll from './finance/TeacherPayroll';\n",
 ""),

("components/views/FinanceView.tsx",
 "const [activeTab, setActiveTab] = useState<'dashboard' | 'entradas' | 'saidas' | 'projecao' | 'professores'>('dashboard');",
 "const [activeTab, setActiveTab] = useState<'dashboard' | 'entradas' | 'saidas' | 'projecao'>('dashboard');"),

("components/views/FinanceView.tsx",
 "{[{ key: 'dashboard', label: `Dashboard` },{ key: 'entradas', label: `Entradas (${monthPayments.length})` },{ key: 'saidas', label: `Saídas (${monthExpenses.length})` },{ key: 'projecao', label: `📈 Projeção` },{ key: 'professores', label: `👩‍🏫 Pagar Professores` }].map(tab => (",
 "{[{ key: 'dashboard', label: `Dashboard` },{ key: 'entradas', label: `Entradas (${monthPayments.length})` },{ key: 'saidas', label: `Saídas (${monthExpenses.length})` },{ key: 'projecao', label: `📈 Projeção` }].map(tab => ("),

("components/views/FinanceView.tsx",
"""          {activeTab === 'professores' && (
            <div style={cardStyle}>
              <TeacherPayroll />
            </div>
          )}

""",
 ""),
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
