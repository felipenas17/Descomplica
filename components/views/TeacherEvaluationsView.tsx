'use client';

import React, { useState, useEffect } from 'react';
import { Star, Plus, ChevronRight, FolderOpen, Folder, X, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const CRITERIA = [
  { key: 'punctuality', label: 'Pontualidade', desc: 'Chega no horário, avisa imprevistos' },
  { key: 'didactics', label: 'Didática', desc: 'Explica bem, adapta ao aluno' },
  { key: 'student_engagement', label: 'Engajamento do Aluno', desc: 'Aluno participa e evolui' },
  { key: 'materials_quality', label: 'Qualidade dos Materiais', desc: 'Materiais adequados e variados' },
  { key: 'communication', label: 'Comunicação', desc: 'Responde rápido, feedbacks detalhados' },
  { key: 'student_progress', label: 'Progresso do Aluno', desc: 'Resultados visíveis na aprendizagem' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110">
          <Star size={24} className={s <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
        </button>
      ))}
      <span className="ml-2 text-sm font-bold text-gray-500 self-center">{value}/5</span>
    </div>
  );
}

export default function TeacherEvaluationsView() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    teacher_id: '',
    teacher_name: '',
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    punctuality: 5,
    didactics: 5,
    student_engagement: 5,
    materials_quality: 5,
    communication: 5,
    student_progress: 5,
    overall_notes: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [evalsRes, teachersRes] = await Promise.all([
      supabase.from('teacher_evaluations').select('*').order('year', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('teachers').select('id, name').order('name'),
    ]);
    setEvaluations(evalsRes.data || []);
    setTeachers(teachersRes.data || []);
    setLoading(false);
  };

  const saveEvaluation = async () => {
    if (!form.teacher_id) { toast.error('Selecione um professor!'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('teacher_evaluations').insert({
        ...form,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Avaliação salva! ✅');
      setShowForm(false);
      fetchData();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally { setSaving(false); }
  };

  const getAverage = (ev: any) => {
    const vals = CRITERIA.map(c => ev[c.key] || 0);
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  // Agrupa por mês/ano
  const grouped: Record<string, any[]> = {};
  evaluations.forEach(ev => {
    const key = `${ev.month} ${ev.year}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Avaliação de Professores</h1>
          <p className="text-sm text-gray-400 mt-1">Registro mensal privado para reuniões pedagógicas</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
          <Plus size={16} /> Nova Avaliação
        </button>
      </div>

      {/* Pastas por mês */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <Star size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold">Nenhuma avaliação ainda.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all">
            Criar primeira avaliação
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([monthYear, evals]) => (
            <div key={monthYear} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Pasta do mês */}
              <button onClick={() => setExpandedMonth(expandedMonth === monthYear ? null : monthYear)}
                className="w-full flex items-center gap-3 p-5 hover:bg-purple-50 transition-all text-left">
                {expandedMonth === monthYear
                  ? <FolderOpen size={22} className="text-purple-500 shrink-0" />
                  : <Folder size={22} className="text-gray-400 shrink-0" />}
                <div className="flex-1">
                  <span className="font-black text-gray-800">{monthYear}</span>
                  <span className="text-xs text-gray-400 ml-3">{evals.length} avaliação(ões)</span>
                </div>
                <ChevronRight size={16} className={`text-gray-400 transition-transform ${expandedMonth === monthYear ? 'rotate-90' : ''}`} />
              </button>

              {/* Professores do mês */}
              {expandedMonth === monthYear && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {evals.map(ev => (
                    <div key={ev.id} className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-black">
                            {ev.teacher_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-gray-900">{ev.teacher_name}</p>
                            <p className="text-xs text-gray-400">Média: <span className="font-black text-purple-600">{getAverage(ev)}/5</span></p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={16} className={s <= Math.round(Number(getAverage(ev))) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>

                      {/* Critérios */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {CRITERIA.map(c => (
                          <div key={c.key} className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{c.label}</p>
                            <div className="flex items-center gap-1">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={12} className={s <= ev[c.key] ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-gray-600">{ev[c.key]}/5</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {ev.overall_notes && (
                        <div className="p-3 bg-purple-50 rounded-xl">
                          <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-1">Observações</p>
                          <p className="text-sm text-purple-900 italic">"{ev.overall_notes}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Nova Avaliação */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <h2 className="text-xl font-black text-gray-900">Nova Avaliação</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Professor */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Professor</label>
                <select value={form.teacher_id} onChange={e => {
                  const t = teachers.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, teacher_id: e.target.value, teacher_name: t?.name || '' }));
                }} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Selecione...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Mês/Ano */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Mês</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Ano</label>
                  <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>

              {/* Critérios */}
              {CRITERIA.map(c => (
                <div key={c.key}>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">{c.label}</label>
                  <p className="text-[10px] text-gray-400 mb-2">{c.desc}</p>
                  <StarRating value={(form as any)[c.key]} onChange={v => setForm(f => ({ ...f, [c.key]: v }))} />
                </div>
              ))}

              {/* Observações */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observações para a Reunião</label>
                <textarea rows={4} value={form.overall_notes} onChange={e => setForm(f => ({ ...f, overall_notes: e.target.value }))}
                  placeholder="Pontos a discutir na reunião mensal..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={saveEvaluation} disabled={saving || !form.teacher_id}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                {saving ? 'Salvando...' : 'Salvar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
