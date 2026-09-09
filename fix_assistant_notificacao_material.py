fixes = [
("components/views/AssistantView.tsx",
"""      else if (msg.acao === 'APROVAR_MATERIAL') {
        const { error } = await supabase.from('materials').update({
          approval_status: 'approved',
          reviewed_by_id: user.id,
          reviewed_at: new Date().toISOString(),
        }).eq('id', msg.dados.material_id);
        resultado = error ? '❌ Erro ao aprovar: ' + error.message : '✅ Material "' + msg.dados.material_titulo + '" aprovado e publicado na biblioteca!';
      }

      else if (msg.acao === 'REPROVAR_MATERIAL') {
        const { error } = await supabase.from('materials').update({
          approval_status: 'rejected',
          rejection_reason: msg.dados.motivo,
          reviewed_by_id: user.id,
          reviewed_at: new Date().toISOString(),
        }).eq('id', msg.dados.material_id);
        resultado = error ? '❌ Erro ao reprovar: ' + error.message : '❌ Material "' + msg.dados.material_titulo + '" reprovado. Professor será notificado.';
      }""",
"""      else if (msg.acao === 'APROVAR_MATERIAL') {
        const { data: matAprov, error } = await supabase.from('materials').update({
          approval_status: 'approved',
          reviewed_by_id: user.id,
          reviewed_at: new Date().toISOString(),
        }).eq('id', msg.dados.material_id).select('uploaded_by_id, title').single();
        if (!error && matAprov?.uploaded_by_id) {
          await supabase.from('notifications').insert({
            user_id: matAprov.uploaded_by_id,
            title: '✅ Material "' + (matAprov.title || msg.dados.material_titulo) + '" aprovado!',
            message: 'Seu material foi aprovado e já está na biblioteca.',
            type: 'success',
          });
        }
        resultado = error ? '❌ Erro ao aprovar: ' + error.message : '✅ Material "' + msg.dados.material_titulo + '" aprovado e publicado na biblioteca!';
      }

      else if (msg.acao === 'REPROVAR_MATERIAL') {
        const { data: matReprov, error } = await supabase.from('materials').update({
          approval_status: 'rejected',
          rejection_reason: msg.dados.motivo,
          reviewed_by_id: user.id,
          reviewed_at: new Date().toISOString(),
        }).eq('id', msg.dados.material_id).select('uploaded_by_id, title').single();
        if (!error && matReprov?.uploaded_by_id) {
          await supabase.from('notifications').insert({
            user_id: matReprov.uploaded_by_id,
            title: '❌ Material "' + (matReprov.title || msg.dados.material_titulo) + '" reprovado',
            message: 'Motivo: ' + (msg.dados.motivo || 'não informado'),
            type: 'warning',
          });
        }
        resultado = error ? '❌ Erro ao reprovar: ' + error.message : '❌ Material "' + msg.dados.material_titulo + '" reprovado. Professor será notificado.';
      }"""),
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
