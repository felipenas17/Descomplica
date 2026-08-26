fixes = [
    ("components/views/MaterialsView.tsx",
     """    if (!uploadFile || !uploadForm.title || !uploadForm.type || !uploadForm.subject || !uploadForm.grade) {
      alert('Preencha todos os campos e selecione um arquivo.');
      return;
    }
    setUploading(true);""",
     """    if (!uploadFile || !uploadForm.title || !uploadForm.type || !uploadForm.subject || !uploadForm.grade) {
      alert('Preencha todos os campos e selecione um arquivo.');
      return;
    }
    if (uploadFile.size > 20 * 1024 * 1024) {
      alert('Arquivo muito grande: ' + (uploadFile.size / 1024 / 1024).toFixed(1) + 'MB. O máximo é 20MB. Tente compactar o PDF ou reduzir a qualidade da imagem.');
      return;
    }
    setUploading(true);"""),
    ("components/views/MaterialsView.tsx",
     """    const { error: storageError } = await supabase.storage.from('materials').upload(path, uploadFile);
    if (storageError) { alert('Erro ao enviar arquivo.'); setUploading(false); return; }""",
     """    const { error: storageError } = await supabase.storage.from('materials').upload(path, uploadFile);
    if (storageError) { alert('Erro ao enviar arquivo: ' + storageError.message); setUploading(false); return; }"""),
    ("components/views/MaterialsView.tsx",
     """    const { error: storageError } = await supabase.storage.from('materials').upload(path, resubmitFile);
    if (storageError) { alert('Erro ao enviar arquivo.'); setResubmitLoading(false); return; }""",
     """    const { error: storageError } = await supabase.storage.from('materials').upload(path, resubmitFile);
    if (storageError) { alert('Erro ao enviar arquivo: ' + storageError.message); setResubmitLoading(false); return; }"""),
    ("components/views/MaterialsView.tsx",
     """<label style={labelStyle}>Arquivo * (PDF, Word, Imagem — máx 10MB)</label>""",
     """<label style={labelStyle}>Arquivo * (PDF, Word, Imagem — máx 20MB)</label>"""),
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
