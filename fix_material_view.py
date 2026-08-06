fixes = [
    ("components/views/MaterialsView.tsx",
     """                      <div style={{ marginTop: '4px', color: '#9ca3af', fontSize: '12px' }}>Enviado em {new Date(m.created_at).toLocaleDateString('pt-BR')}</div>""",
     """                      <div style={{ marginTop: '4px', color: '#9ca3af', fontSize: '12px' }}>Enviado por {m.uploader_name || 'Professor'} em {new Date(m.created_at).toLocaleDateString('pt-BR')}</div>"""),
    ("components/views/MaterialsView.tsx",
     """  const isImage = (url: string) => /\\.(jpg|jpeg|png|webp)$/i.test(url);
  const isPDF   = (url: string) => /\\.pdf$/i.test(url);""",
     """  const isImage = (url: string) => /\\.(jpg|jpeg|png|webp)$/i.test(url);
  const isPDF   = (url: string) => /\\.pdf$/i.test(url);
  const isDoc   = (url: string) => /\\.(doc|docx)$/i.test(url);"""),
    ("components/views/MaterialsView.tsx",
     """              {isImage(previewUrl) ? <img src={previewUrl} alt="Preview" style={{ width: '100%', objectFit: 'contain' }} />
                : isPDF(previewUrl) ? <iframe src={previewUrl} style={{ width: '100%', height: '70vh', border: 'none' }} title="PDF" />
                : <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>""",
     """              {isImage(previewUrl) ? <img src={previewUrl} alt="Preview" style={{ width: '100%', objectFit: 'contain' }} />
                : isPDF(previewUrl) ? <iframe src={previewUrl} style={{ width: '100%', height: '70vh', border: 'none' }} title="PDF" />
                : isDoc(previewUrl) ? <iframe src={'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(previewUrl)} style={{ width: '100%', height: '70vh', border: 'none' }} title="Documento" />
                : <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>"""),
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
