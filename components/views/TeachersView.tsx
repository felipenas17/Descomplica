'use client';

import React from 'react';
import { 
  Plus, 
  Trash2, 
  Mail, 
  Award,
  Video,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import TeacherForm from '@/components/forms/TeacherForm';

export default function TeachersView() {
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

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
                <button 
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  title="Remover Professor"
                >
                  <Trash2 size={20} />
                </button>
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
