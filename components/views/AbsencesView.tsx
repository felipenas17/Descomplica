'use client';

import React, { useState, useEffect } from 'react';
import { UserX, CheckCircle, XCircle, RefreshCw, Plus, Calendar, AlertTriangle, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AbsencesView() {
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'notified' | 'not_notified' | 'pending_replenishment'>('all');

  const fetchAbsences = async () => {
    setLoading(true);
    const { data } = await supabase.from('absences').select('*').order('absence_date', { ascending: false });
    setAbsences(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAbsences(); }, []);

  const toggleNotified = async (id: string, current: boolean) => {
    await supabase.from('absences').update({ notified_advance: !current }).eq('id', id);
    fetchAbsences();
    toast.success(!current ? 'Marcado como avisado ✅' : 'Marcado como não avisado');
  };

  const markReplenishment = async (id: string) => {
    await supabase.from('absences').update({
      replenishment_done: true,
      replenishment_date: new Date().toISOString().split('T')[0]
    }).eq('id', id);
    fetchAbsences();
    toast.success('Reposição registrada! ✅');
  };

  const toggleExtraClass = async (id: string, current: boolean) => {
    await supabase.from('absences').update({ extra_class_purchased: !current }).eq('id', id);
    fetchAbsences();
    toast.success(!current ? 'Aula extra registrada! 💰' : 'Aula extra removida');
  };

  const filtered = absences.filter(a => {
    if (filter === 'notified') return a.notified_advance;
    if (filter === 'not_notified') return !a.notified_advance;
    if (filter === 'pending_replenishment') return a.notified_advance && !a.replenishment_done;
    return true;
  });

  // Agrupa por aluno
  const byStudent: Record<string, any[]> = {};
  absences.forEach(a => {
    const key = a.student_name || 'Sem nome';
    if (!byStudent[key]) byStudent[key] = [];
    byStudent[key].push(a);
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Faltas', value: absences.length, icon: UserX, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Avisaram', value: absences.filter(a => a.notified_advance).length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Não Avisaram', value: absences.filter(a => !a.notified_advance).length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Reposições Pendentes', value: absences.filter(a => a.notified_advance && !a.replenishment_done).length, icon: RefreshCw, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Resumo por aluno */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-yellow-500" /> Resumo por Aluno
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(byStudent).map(([name, faults]) => (
            <div key={name} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="font-bold text-gray-900 text-sm">{name}</p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <span className="text-xs text-red-500 font-bold">{faults.length} falta(s)</span>
                <span className="text-xs text-green-500 font-bold">{faults.filter(f => f.notified_advance).length} avisou</span>
                <span className="text-xs text-yellow-500 font-bold">{faults.filter(f => f.notified_advance && !f.replenishment_done).length} reposição pendente</span>
                <span className="text-xs text-purple-500 font-bold">{faults.filter(f => f.extra_class_purchased).length} aula(s) extra(s)</span>
              </div>
            </div>
          ))}
          {Object.keys(byStudent).length === 0 && (
            <p className="text-gray-400 text-sm col-span-full text-center py-4">Nenhuma falta registrada ainda.</p>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <BookOpen size={18} className="text-purple-500" /> Histórico de Faltas
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1 flex-wrap">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'notified', label: 'Avisaram' },
              { key: 'not_notified', label: 'Não Avisaram' },
              { key: 'pending_replenishment', label: 'Reposição Pendente' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key as any)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filter === f.key ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <UserX size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-bold">Nenhuma falta encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(absence => (
              <div key={absence.id} className={`p-4 rounded-xl border transition-all ${absence.notified_advance ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{absence.student_name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${absence.notified_advance ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {absence.notified_advance ? '✓ Avisou' : '✗ Não avisou'}
                      </span>
                      {absence.replenishment_done && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">✓ Reposto</span>
                      )}
                      {absence.extra_class_purchased && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">💰 Aula Extra</span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} /> {absence.absence_date ? new Date(absence.absence_date + 'T00:00:00').toLocaleDateString('pt-BR') : '---'}
                      </span>
                      {absence.notes && <span className="text-xs text-gray-400">{absence.notes}</span>}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => toggleNotified(absence.id, absence.notified_advance)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${absence.notified_advance ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {absence.notified_advance ? '✓ Avisou' : 'Marcar Avisou'}
                    </button>
                    {absence.notified_advance && !absence.replenishment_done && (
                      <button onClick={() => markReplenishment(absence.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all flex items-center gap-1">
                        <RefreshCw size={11} /> Marcar Reposição
                      </button>
                    )}
                    {!absence.notified_advance && (
                      <button onClick={() => toggleExtraClass(absence.id, absence.extra_class_purchased)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${absence.extra_class_purchased ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {absence.extra_class_purchased ? '💰 Aula Extra' : 'Comprou Aula Extra?'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
