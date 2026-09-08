fixes = [
("components/views/TeachersView.tsx",
"""                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pagamentos</p>
                  <button onClick={() => setShowPayModal(true)}
                    className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg hover:bg-purple-100 transition-all">
                    + Registrar Pagamento
                  </button>
                </div>""",
"""                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pagamentos</p>
                  <span className="text-[10px] font-bold text-gray-400">Registre em Controle de Aulas</span>
                </div>"""),

("components/views/TeachersView.tsx",
"""      {/* Modal Registrar Pagamento */}
      {showPayModal && viewingTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900">💰 Registrar Pagamento</h3>
              <button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-xl text-sm font-bold text-purple-700">
                Professor: {viewingTeacher.name} · {teacherStats?.aulasMes || 0} aulas este mês
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Período início</label>
                  <input type="date" value={payForm.period_start} onChange={e => setPayForm(f => ({ ...f, period_start: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Período fim</label>
                  <input type="date" value={payForm.period_end} onChange={e => setPayForm(f => ({ ...f, period_end: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Valor (R$)</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observações</label>
                <textarea rows={2} value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ex: 13 aulas concluídas..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              {viewingTeacher.payment_method && (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 font-bold">
                  {viewingTeacher.payment_method === 'pix' ? '💠 PIX: ' + (viewingTeacher.pix_key || 'não cadastrado') : viewingTeacher.payment_method === 'dinheiro' ? '💵 Dinheiro' : '🏦 Transferência'}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPayModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={registrarPagamento} disabled={savingPay}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {savingPay ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '💰'}
                {savingPay ? 'Salvando...' : 'Registrar e Enviar WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}""",
""""""),
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
