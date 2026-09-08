path = "components/views/AbsencesView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = "<th>Status</th></tr></thead><tbody>"
new = "<th>Status</th><th>Observa\u00e7\u00e3o</th></tr></thead><tbody>"

n = content.count(old)
if n == 0:
    raise SystemExit("NAO ENCONTROU, abortando (nada mudou): " + old)
if n > 1:
    raise SystemExit(f"ENCONTROU {n}x, ambiguo, abortando")
content = content.replace(old, new)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("OK:", path)
