fixes = [
("components/views/FeedbacksView.tsx",
"""  Loader2,
  Trash2
} from 'lucide-react';""",
"""  Loader2,
  Trash2,
  Archive,
  ArchiveRestore
} from 'lucide-react';"""),

("components/views/FeedbacksView.tsx",
"""    await supabase.from('feedbacks').update({ sent_to_parent: true, sent_to_parent_at: new Date().toISOString() }).eq('id', feedback.id);
    fetchFeedbacks();
  };""",
"""    await supabase.from('feedbacks').update({ sent_to_parent: true, sent_to_parent_at: new Date().toISOString(), arquivado: true }).eq('id', feedback.id);
    fetchFeedbacks();
  };

  const toggleArquivado = async (feedback: any) => {
    await supabase.from('feedbacks').update({ arquivado: !feedback.arquivado }).eq('id', feedback.id);
    fetchFeedbacks();
  };"""),

("components/views/FeedbacksView.tsx",
"""    const matchesSent = filterSent === 'todos' || (filterSent === 'enviado' && f.sent_to_parent) || (filterSent === 'nao_enviado' && !f.sent_to_parent);
    return matchesSearch && matchesTeacher && matchesFrom && matchesTo && matchesSent;
  });""",
"""    const matchesSent = filterSent === 'todos' || (filterSent === 'enviado' && f.sent_to_parent) || (filterSent === 'arquivado' && f.arquivado) || (filterSent === 'nao_enviado' && !f.sent_to_parent && !f.arquivado);
    return matchesSearch && matchesTeacher && matchesFrom && matchesTo && matchesSent;
  });"""),

("components/views/FeedbacksView.tsx",
"""          {[{v:'nao_enviado',l:'Pendentes',c:feedbacks.filter(f=>!f.sent_to_parent).length,bg:'text-red-600'},{v:'enviado',l:'Enviados',c:feedbacks.filter(f=>f.sent_to_parent).length,bg:'text-green-600'},{v:'todos',l:'Todos',c:feedbacks.length,bg:'text-gray-600'}].map(o=>(""",
"""          {[{v:'nao_enviado',l:'Pendentes',c:feedbacks.filter(f=>!f.sent_to_parent && !f.arquivado).length,bg:'text-red-600'},{v:'enviado',l:'Enviados',c:feedbacks.filter(f=>f.sent_to_parent).length,bg:'text-green-600'},{v:'arquivado',l:'Arquivados',c:feedbacks.filter(f=>f.arquivado).length,bg:'text-purple-600'},{v:'todos',l:'Todos',c:feedbacks.length,bg:'text-gray-600'}].map(o=>("""),

("components/views/FeedbacksView.tsx",
"""          <h3 className="text-sm font-black text-gray-900">{filterSent === 'nao_enviado' ? 'Pendentes de envio' : filterSent === 'enviado' ? 'Enviados ao pai' : 'Histórico de Feedbacks'}</h3>""",
"""          <h3 className="text-sm font-black text-gray-900">{filterSent === 'nao_enviado' ? 'Pendentes de envio' : filterSent === 'enviado' ? 'Enviados ao pai' : filterSent === 'arquivado' ? 'Arquivados (por aluno)' : 'Histórico de Feedbacks'}</h3>"""),

("components/views/FeedbacksView.tsx",
"""              ) : (() => {
                const getWeekLabel = (dateStr: string) => {
                  if (!dateStr) return 'Sem data';
                  const d = new Date(dateStr + 'T00:00:00');
                  const now = new Date();
                  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1);
                  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
                  const prevStart = new Date(startOfWeek); prevStart.setDate(prevStart.getDate() - 7);
                  if (d >= startOfWeek && d <= endOfWeek) return 'Esta semana';
                  if (d >= prevStart && d < startOfWeek) return 'Semana passada';
                  return 'Semana de ' + new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + 1).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                };
                let lastWeek = '';
                return filteredFeedbacks.map((f, idx) => {
                const weekLabel = getWeekLabel(f.class_date);
                const showWeekHeader = weekLabel !== lastWeek;
                if (showWeekHeader) lastWeek = weekLabel;
                return (<>
                {showWeekHeader && (
                  <tr key={'week-'+idx}><td colSpan={6} className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">{weekLabel}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>""",
"""              ) : (() => {
                const getWeekLabel = (dateStr: string) => {
                  if (!dateStr) return 'Sem data';
                  const d = new Date(dateStr + 'T00:00:00');
                  const now = new Date();
                  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1);
                  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
                  const prevStart = new Date(startOfWeek); prevStart.setDate(prevStart.getDate() - 7);
                  if (d >= startOfWeek && d <= endOfWeek) return 'Esta semana';
                  if (d >= prevStart && d < startOfWeek) return 'Semana passada';
                  return 'Semana de ' + new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + 1).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                };
                const isArquivadoView = filterSent === 'arquivado';
                const listaExibida = isArquivadoView
                  ? [...filteredFeedbacks].sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''))
                  : filteredFeedbacks;
                let lastWeek = '';
                let lastAluno = '';
                return listaExibida.map((f, idx) => {
                const weekLabel = isArquivadoView ? (f.student_name || 'Sem aluno') : getWeekLabel(f.class_date);
                const showWeekHeader = isArquivadoView ? (weekLabel !== lastAluno) : (weekLabel !== lastWeek);
                if (isArquivadoView) { if (showWeekHeader) lastAluno = weekLabel; } else { if (showWeekHeader) lastWeek = weekLabel; }
                return (<>
                {showWeekHeader && (
                  <tr key={'week-'+idx}><td colSpan={6} className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">{weekLabel}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>"""),

("components/views/FeedbacksView.tsx",
"""                      <button className="p-2 hover:bg-white rounded-xl text-gray-400 group-hover:text-purple-600 transition-all border border-transparent group-hover:border-purple-100 shadow-sm">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Excluir este feedback? Essa acao nao pode ser desfeita.')) return;
                          await supabase.from('feedbacks').delete().eq('id', f.id);
                          fetchFeedbacks();
                        }}
                        className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 shadow-sm">
                        <Trash2 size={18} />
                      </button>""",
"""                      <button className="p-2 hover:bg-white rounded-xl text-gray-400 group-hover:text-purple-600 transition-all border border-transparent group-hover:border-purple-100 shadow-sm">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={async (e) => { e.stopPropagation(); await toggleArquivado(f); }}
                        title={f.arquivado ? 'Desarquivar' : 'Arquivar (mantem historico, sem enviar)'}
                        className="p-2 hover:bg-purple-50 rounded-xl text-gray-400 hover:text-purple-500 transition-all border border-transparent hover:border-purple-100 shadow-sm">
                        {f.arquivado ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Excluir este feedback? Essa acao nao pode ser desfeita.')) return;
                          await supabase.from('feedbacks').delete().eq('id', f.id);
                          fetchFeedbacks();
                        }}
                        className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 shadow-sm">
                        <Trash2 size={18} />
                      </button>"""),
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
