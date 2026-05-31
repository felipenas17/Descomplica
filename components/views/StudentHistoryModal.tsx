'use client';
import React from 'react';
import { X, Calendar, DollarSign, MessageSquare } from 'lucide-react';

interface Props {
  student: any;
  historyData: any;
  loading: boolean;
  onClose: () => void;
}

export default function StudentHistoryModal({ student, historyData, loading, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-black text-gray-900">{student.name}</h2>
            <p className="text-sm text-gray-400">Historico e evolucao do aluno</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
            <X size={20} />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-purple-600">{historyData.schedules.length}</p>
                <p className="text-xs text-gray-500 font-bold">Total Aulas</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-green-600">{historyData.payments.filter((p: any) => p.status === 'paid').length}</p>
                <p className="text-xs text-gray-500 font-bold">Meses Pagos</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-blue-600">
                  {historyData.schedules.length > 0
                    ? Math.round((historyData.schedules.filter((s: any) => s.attendance_status === 'Presente' || s.attendance_status === 'presente').length / historyData.schedules.length) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 font-bold">Presenca</p>
              </div>
            </div>

            <div>
              <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-purple-500" /> Ultimas Aulas
              </h3>
              {historyData.schedules.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma aula registrada</p>
              ) : (
                <div className="space-y-2">
                  {historyData.schedules.slice(0, 8).map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{s.subject || 'Aula'}</p>
                        <p className="text-xs text-gray-400">
                          {s.date ? new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                          {s.teacher_name ? ' - ' + s.teacher_name : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${s.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {s.status === 'concluido' ? 'Concluida' : 'Agendada'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign size={16} className="text-green-500" /> Mensalidades
              </h3>
              {historyData.payments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum pagamento registrado</p>
              ) : (
                <div className="space-y-2">
                  {historyData.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{p.month} {p.year}</p>
                        <p className="text-xs text-gray-400">R$ {Number(p.final_amount || p.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {historyData.feedbacks.length > 0 && (
              <div>
                <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-500" /> Feedbacks
                </h3>
                <div className="space-y-2">
                  {historyData.feedbacks.map((f: any) => (
                    <div key={f.id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-gray-500">{f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR') : ''}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${f.attendance === 'Presente' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{f.attendance}</span>
                      </div>
                      {f.content && <p className="text-xs text-gray-600">{f.content}</p>}
                      {f.observations && <p className="text-xs text-gray-400 mt-1 italic">{f.observations}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
