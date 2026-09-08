old = """      {showPayPanel && selectedTeacher && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-gray-800">💰 Pagamento — {selectedTeacher.name}</p>
            <button onClick={() => setShowPayPanel(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-600 space-y-1">
            <p className="font-bold text-gray-800">{pagaveis.length} aula(s) no filtro atual (presentes: {pagPresentes}, justificadas: {pagJustificadas}, faltas: {pagFaltas})</p>
            <p>Grade mensal: {gradeMensal} aulas · Valor por aula: {fmtMoeda(valorPorAula)}</p>
            {pagSemMarcacao > 0 && <p className="text-yellow-600 font-bold">⚠ {pagSemMarcacao} aula(s) já aconteceram sem marcação — não contam aqui.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Valor (R$)</label>
              <input type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="w-full bg-gray-50 border border-purple-200 text-purple-700 font-bold rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observações</label>
              <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="opcional"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
          </div>
          {payDone ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm"><Check size={16} /> Pago e lançado em Saídas</div>
              <button onClick={desfazerPagamentoAulas} disabled={undoingPay}
                className="self-start px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50">
                {undoingPay ? 'Desfazendo...' : '↩ Desfazer este pagamento'}
              </button>
            </div>
          ) : (
            <button onClick={registrarPagamentoAulas} disabled={savingPay || !payAmount}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
              {savingPay ? 'Registrando...' : 'Confirmar Pagamento'}
            </button>
          )}
        </div>
      )}"""

new = """      {showPayPanel && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-black text-gray-900">💰 Pagamento — {selectedTeacher.name}</p>
              <button onClick={() => setShowPayPanel(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={18} /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-800">{pagaveis.length} aula(s) no filtro atual (presentes: {pagPresentes}, justificadas: {pagJustificadas}, faltas: {pagFaltas})</p>
              <p>Grade mensal: {gradeMensal} aulas · Valor por aula: {fmtMoeda(valorPorAula)}</p>
              {pagSemMarcacao > 0 && <p className="text-yellow-600 font-bold">⚠ {pagSemMarcacao} aula(s) já aconteceram sem marcação — não contam aqui.</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Valor (R$)</label>
                <input type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-purple-200 text-purple-700 font-bold rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observações</label>
                <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="opcional"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            {payDone ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-green-600 font-bold text-sm"><Check size={16} /> Pago e lançado em Saídas</div>
                <button onClick={desfazerPagamentoAulas} disabled={undoingPay}
                  className="self-start px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50">
                  {undoingPay ? 'Desfazendo...' : '↩ Desfazer este pagamento'}
                </button>
              </div>
            ) : (
              <button onClick={registrarPagamentoAulas} disabled={savingPay || !payAmount}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                {savingPay ? 'Registrando...' : 'Confirmar Pagamento'}
              </button>
            )}
          </div>
        </div>
      )}"""

path = "components/views/AbsencesView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
n = content.count(old)
if n == 0:
    raise SystemExit("NAO ENCONTROU, abortando (nada mudou)")
if n > 1:
    raise SystemExit(f"ENCONTROU {n}x, ambiguo, abortando")
content = content.replace(old, new)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("OK:", path)
