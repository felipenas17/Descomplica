fixes = [
    ("components/forms/TeacherForm.tsx",
     "      availability: selectedDays.join(', '),",
     "      availability: selectedDays,"),
    ("components/views/TeachersView.tsx",
     "    const avail = teacher.availability ? teacher.availability.split(', ').filter(Boolean) : [];",
     "    const avail = Array.isArray(teacher.availability) ? teacher.availability : (teacher.availability ? String(teacher.availability).split(', ').filter(Boolean) : []);"),
    ("components/views/operations/TeacherAvailability.tsx",
     "                  <div className=\"text-xs text-gray-400\">{totalSlots > 0 ? totalSlots+' slot'+(totalSlots>1?'s':'')+' vago'+(totalSlots>1?'s':'') : 'Agenda cheia'}</div>",
     "                  <div className=\"text-xs text-gray-400\">{totalSlots > 0 ? totalSlots+' slot'+(totalSlots>1?'s':'')+' vago'+(totalSlots>1?'s':'') : ((teacher.availability||[]).length > 0 ? 'Agenda cheia' : 'Sem disponibilidade cadastrada')}</div>"),
]

for path, old, new in fixes:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    n = content.count(old)
    if n == 0:
        raise SystemExit(f"NAO ENCONTROU em {path}, abortando (nada mudou nesse arquivo):\n{old}")
    if n > 1:
        raise SystemExit(f"ENCONTROU {n}x em {path}, ambiguo, abortando:\n{old}")
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK:", path)
