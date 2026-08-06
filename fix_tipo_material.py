old = "const TYPES = ['Lista de Exercícios', 'Apostila', 'Resumo', 'Template', 'Jogos', 'Revisão', 'Teoria'];"
new = "const TYPES = ['Lista de Exercícios', 'Apostila', 'Resumo', 'Template', 'Jogos', 'Revisão', 'Teoria', 'Avaliação Diagnóstica'];"

path = "components/views/MaterialsView.tsx"
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
print("OK: tipo Avaliacao Diagnostica adicionado")
