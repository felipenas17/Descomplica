fixes = [
("components/views/FeedbacksView.tsx",
"""  const [filterSent, setFilterSent] = useState('nao_enviado');""",
"""  const [filterSent, setFilterSent] = useState('nao_enviado');
  const [selectedArquivadoAluno, setSelectedArquivadoAluno] = useState<string | null>(null);"""),

("components/views/FeedbacksView.tsx",
"""                const isArquivadoView = filterSent === 'arquivado';
                const listaExibida = isArquivadoView
                  ? [...filteredFeedbacks].sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''))
                  : filteredFeedbacks;
                let lastWeek = '';
                let lastAluno = '';
                return listaExibida.map((f, idx) => {
                const weekLabel = isArquivadoView ? (f.student_name || 'Sem aluno') : getWeekLabel(f.class_date);
                const showWeekHeader = isArquivadoView ? (weekLabel !== lastAluno) : (weekLabel !== lastWeek);
                if (isArquivadoView) { if (showWeekHeader) lastAluno = weekLabel; } else { if (showWeekHeader) lastWeek = weekLabel; }
                return (<>""",
"""                const listaExibida = (filterSent === 'arquivado' && selectedArquivadoAluno)
                  ? filteredFeedbacks.filter(f => f.student_name === selectedArquivadoAluno)
                  : filteredFeedbacks;
                let lastWeek = '';
                return listaExibida.map((f, idx) => {
                const weekLabel = getWeekLabel(f.class_date);
                const showWeekHeader = weekLabel !== lastWeek;
                if (showWeekHeader) lastWeek = weekLabel;
                return (<>"""),

("components/views/FeedbacksView.tsx",
"""            <button key={o.v} onClick={()=>setFilterSent(o.v)}""",
"""            <button key={o.v} onClick={()=>{setFilterSent(o.v); setSelectedArquivadoAluno(null);}}"""),

("components/views/FeedbacksView.tsx",
"""        <div className="overflow-x-auto">
          <table className="w-full text-left">""",
"""        {filterSent === 'arquivado' && !selectedArquivadoAluno ? (
          <div style={{ padding: '20px 24px' }}>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>Selecione um aluno:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {Array.from(new Set(filteredFeedbacks.map(f => f.student_name || 'Sem aluno'))).sort().length === 0
                ? <p style={{ color: '#9ca3af' }}>Nenhum feedback arquivado ainda.</p>
                : Array.from(new Set(filteredFeedbacks.map(f => f.student_name || 'Sem aluno'))).sort().map(aluno => (
                    <div key={aluno} onClick={() => setSelectedArquivadoAluno(aluno)}
                      style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '20px 16px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e1b4b' }}>{aluno}</div>
                      <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>{filteredFeedbacks.filter(f => (f.student_name || 'Sem aluno') === aluno).length} feedback(s)</div>
                    </div>
                  ))
              }
            </div>
          </div>
        ) : (
        <div className="overflow-x-auto">
          {filterSent === 'arquivado' && selectedArquivadoAluno && (
            <div style={{ padding: '16px 24px 0' }}>
              <button onClick={() => setSelectedArquivadoAluno(null)} style={{ color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>← Voltar para pastas</button>
            </div>
          )}
          <table className="w-full text-left">"""),

("components/views/FeedbacksView.tsx",
"""              </>); }); })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}""",
"""              </>); }); })()}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Details Modal */}"""),
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
