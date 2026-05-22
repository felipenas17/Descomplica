'use client';

import React from 'react';
import { Plus, Trash2, Mail, Award, Video, UserCheck, ShieldCheck, Pencil, X, Clock, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import TeacherForm from '@/components/forms/TeacherForm';

export default function TeachersView() {
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingTeacher, setEditingTeacher] = React.useState<any>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [showExtraEdit, setShowExtraEdit] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const [selectedDaysEdit, setSelectedDaysEdit] = React.useState<string[]>([]);
  const [daySchedulesEdit, setDaySchedulesEdit] = React.useState<Record<string, { start: string; end: string }>>({});

  const openEdit = (teacher: any) => {
    setEditingTeacher({ ...teacher });
    const avail = teacher.availability ? teacher.availability.split(', ').filter(Boolean) : [];
    setSelectedDaysEdit(avail);
    try {
      const sched = teacher.availability_schedule ? JSON.parse(teacher.availability_schedule) : {};
      setDaySchedulesEdit(sched);
    } catch { setDaySchedulesEdit({}); }
  };

  const toggleDayEdit = (day: string) => {
    setSelectedDaysEdit(prev => {
      const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      if (!prev.includes(day)) setDaySchedulesEdit(ds => ({ ...ds, [day]: { start: '08:00', end: '09:00' } }));
      else setDaySchedulesEdit(ds => { const n = { ...ds }; delete n[day]; return n; });
      return next;
    });
  };

  const saveEditTeacher = async () => {
    if (!editingTeacher) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase.from('teachers').update({
        name: editingTeacher.name,
        email: editingTeacher.email,
        phone: editingTeacher.phone,
        cpf: editingTeacher.cpf,
        age: editingTeacher.age,
        sex: editingTeacher.sex,
        subject: editingTeacher.subject,
        formation: editingTeacher.formation,
        payment_method: editingTeacher.payment_method,
        pix_key: editingTeacher.pix_key,
        address: editingTeacher.address,
        neighborhood: editingTeacher.neighborhood,
        city: editingTeacher.city,
        cep: editingTeacher.cep,
        availability: selectedDaysEdit.join(', '),
        availability_schedule: JSON.stringify(daySchedulesEdit),
      }).eq('id', editingTeacher.id);
      if (error) throw error;
      toast.success('Professor atualizado! ✅');
      setEditingTeacher(null);
      fetchTeachers();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSavingEdit(false); }
  };

  const fetchTeachers = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase não configurado. Verifique as chaves API.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (supabaseError) {
        throw new Error(supabaseError.message || 'Erro ao carregar professores');
      }
      
      setTeachers(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    fetchTeachers();
  }, [fetchTeachers]);

  const handleAddTeacher = async (data: any) => {
    const loadingToast = toast.loading('Cadastrando professor...');
    try {
      const teacherData = {
        name: data.name,
        email: data.email,
        subject: data.subject,
        availability: data.availability ? (typeof data.availability === 'string' ? data.availability.split(',').map((s: string) => s.trim()) : data.availability) : [],
        avatar: `https://picsum.photos/seed/${data.name}/200`,
        role: 'Professor'
      };

      const { data: insertedTeacher, error: teacherError } = await supabase
        .from('teachers')
        .insert([teacherData])
        .select()
        .single();

      if (teacherError) throw teacherError;

      // Sync profile (optional but recommended)
      if (insertedTeacher) {
        await supabase.from('profiles').upsert([{
          id: (insertedTeacher as any).id,
          email: data.email,
          full_name: data.name,
          role: 'professor',
          needs_password_change: false
        }]);
      }

      toast.success('Professor cadastrado com sucesso!', { id: loadingToast });
      fetchTeachers();
      setShowForm(false);
    } catch (err: any) {
      console.error('[TeachersView] Erro no cadastro:', err);
      const message = err.message || 'Erro ao cadastrar. Verifique as RLS e se o e-mail já existe.';
      toast.error('Erro no cadastro: ' + message, { id: loadingToast });
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Professor removido.');
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + (err.message || 'Erro desconhecido'));
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-10">
      {showForm && <TeacherForm onClose={() => setShowForm(false)} onSubmit={handleAddTeacher} />}

      {/* Modal Editar Professor */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b border-gray-100 flex justify-between items-center z-10">
              <h2 className="text-xl font-black text-purple-600">Editar Professor</h2>
              <button onClick={() => setEditingTeacher(null)} className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Dados básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Nome</label>
                  <input value={editingTeacher.name || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, name: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">E-mail</label>
                  <input value={editingTeacher.email || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, email: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Telefone</label>
                  <input value={editingTeacher.phone || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, phone: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">CPF</label>
                  <input value={editingTeacher.cpf || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, cpf: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Formação</label>
                  <input value={editingTeacher.formation || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, formation: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Disciplinas</label>
                  <input value={editingTeacher.subject || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, subject: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>

              {/* Disponibilidade */}
              <div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Clock size={12} /> Disponibilidade
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DAYS_OF_WEEK.map(day => (
                    <button type="button" key={day} onClick={() => toggleDayEdit(day)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedDaysEdit.includes(day) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {selectedDaysEdit.length > 0 && (
                  <div className="space-y-2">
                    {selectedDaysEdit.map(day => (
                      <div key={day} className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-2">
                        <span className="text-xs font-black text-purple-700 w-12">{day.slice(0, 3)}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <Clock size={14} className="text-purple-400" />
                          <input type="time" value={daySchedulesEdit[day]?.start || '08:00'}
                            onChange={e => setDaySchedulesEdit(ds => ({ ...ds, [day]: { ...ds[day], start: e.target.value } }))}
                            className="bg-white border border-purple-200 rounded-lg py-1 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
                          <span className="text-xs text-gray-400">até</span>
                          <input type="time" value={daySchedulesEdit[day]?.end || '09:00'}
                            onChange={e => setDaySchedulesEdit(ds => ({ ...ds, [day]: { ...ds[day], end: e.target.value } }))}
                            className="bg-white border border-purple-200 rounded-lg py-1 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagamento */}
              <div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-3">Forma de Recebimento</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[{ value: 'pix', label: '💠 PIX' }, { value: 'dinheiro', label: '💵 Dinheiro' }, { value: 'transferencia', label: '🏦 Transferência' }].map(opt => (
                    <button type="button" key={opt.value} onClick={() => setEditingTeacher((t: any) => ({ ...t, payment_method: opt.value }))}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${editingTeacher.payment_method === opt.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {editingTeacher.payment_method === 'pix' && (
                  <input value={editingTeacher.pix_key || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, pix_key: e.target.value }))}
                    placeholder="Chave PIX" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                )}
              </div>

              {/* Endereço */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setShowExtraEdit(!showExtraEdit)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Endereço</span>
                  {showExtraEdit ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {showExtraEdit && (
                  <div className="p-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Rua</label>
                      <input value={editingTeacher.address || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, address: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Rua, número..." />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Bairro</label>
                      <input value={editingTeacher.neighborhood || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, neighborhood: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Bairro" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Cidade</label>
                      <input value={editingTeacher.city || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, city: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Cidade" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">CEP</label>
                      <input value={editingTeacher.cep || ''} onChange={e => setEditingTeacher((t: any) => ({ ...t, cep: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="00000-000" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setEditingTeacher(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={saveEditTeacher} disabled={savingEdit}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {savingEdit ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                {savingEdit ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header & Registration Form Trigger */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Corpo Docente</h1>
          <p className="text-gray-500 mt-2">Gerencie informações, disponibilidade e atribuições dos professores.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all">
            Exportar Lista
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Novo Cadastro
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 p-12 rounded-[2.5rem] text-center">
          <ShieldCheck className="mx-auto text-red-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-red-900 mb-2">Erro ao carregar corpo docente</h3>
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {(teachers || []).map(teacher => (
            <div key={teacher.id} className="glass-card rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-primary/5">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                  <div className="relative">
                  <Avatar name={teacher.name} size={80} className="w-20 h-20 rounded-2xl group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-secondary rounded-full border-4 border-white flex items-center justify-center text-black z-10">
                    <UserCheck size={14} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(teacher)}
                    className="p-2 text-gray-300 hover:text-purple-500 transition-colors" title="Editar">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDeleteTeacher(teacher.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Remover">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{teacher.name}</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-[8px] font-black uppercase" title="Login ativo no sistema">
                      <ShieldCheck size={10} /> Ativo
                    </div>
                  </div>
                  <p className="text-primary font-bold text-xs uppercase tracking-widest">{teacher.subject}</p>
                <p className="text-gray-400 text-xs">{teacher.role}</p>
              </div>

              <div className="mt-8 pt-8 border-t border-primary/5 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Mail size={16} className="text-primary/40" />
                  <span className="truncate">{teacher.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Award size={16} className="text-secondary" />
                  <div className="flex gap-2">
                    {teacher.availability?.map((day: string) => (
                      <span key={day} className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">{day}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-primary/5 py-4 px-8 flex justify-between items-center group-hover:bg-primary transition-colors">
              <button className="text-xs font-bold text-primary group-hover:text-white transition-colors flex items-center gap-2">
                <Video size={14} /> Aulas Remotas
              </button>
              <button className="text-xs font-bold text-gray-500 group-hover:text-white/70 transition-colors uppercase tracking-widest">Perfíl Completo</button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
