old = "      let query = supabase.from('schedules').select('*').eq('reposicao_pendente', true).neq('status', 'reposicao_concluida').neq('status', 'reposicao_marcada');"
new = "      let query = supabase.from('schedules').select('*').eq('reposicao_pendente', true).neq('status', 'reposicao_concluida');"

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
print("OK: deteccao de reposicao pendente corrigida")
