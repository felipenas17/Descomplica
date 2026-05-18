'use client';

import React from 'react';
import { 
  Plus, 
  Trash2,
  Mail, 
  UserCheck,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import StudentForm from '@/components/forms/StudentForm';

export default function StudentsView() {
  const [students, setStudents] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  const fetchStudents = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase não configurado. Verifique as chaves API.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (supabaseError) {
        throw new Error(supabaseError.message || 'Erro ao carregar alunos');
      }
      
      setStudents(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = async (data: any) => {
    const loadingToast = toast.loading('Processando matrícula...');
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase não conectado.');

      const { error } = await supabase.from('students').insert([{
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        registration_number: data.registration || '',
        class_name: data.class || '',
        status: 'Ativo'
      }]);

      if (error) throw error;
      
      toast.success('Aluno matriculado com sucesso!', { id: loadingToast });
      fetchStudents();
      setShowForm(false);
    } catch (err: any) {
      console.error('[StudentsView] Erro completo na matrícula:', JSON.stringify(err, null, 2));
      const message = err.message || err.details || 'Verifique as permissões de acesso (RLS).';
      toast.error('Erro na matrícula: ' + message, { id: loadingToast });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Aluno removido.');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + (err.message || 'Verifique se você tem permissão de admin.'));
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-10">
      {showForm && <StudentForm onClose={() => setShowForm(false)} onSubmit={handleAddStudent} />}
      
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Gestão de Alunos</h1>
          <p className="text-gray-500 mt-2">Controle acadêmico, matrículas e frequência dos estudantes.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all">
            Relatório Geral
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-secondary text-black font-bold text-sm shadow-xl shadow-secondary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Matricular Aluno
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 p-12 rounded-[2.5rem] text-center">
          <UserCheck className="mx-auto text-red-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-red-900 mb-2">Erro ao carregar alunos</h3>
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(students || []).map(student => (
            <div key={student.id} className="glass-card rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-500 border border-primary/5">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                  <div className="relative">
                  <Avatar name={student.name} size={80} className="w-20 h-20 rounded-2xl group-hover:scale-110 transition-transform duration-500" />
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-white z-10 ${student.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <ShieldCheck size={14} />
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteStudent(student.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  title="Remover Aluno"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-secondary transition-colors">{student.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {student.class_name && (
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {student.class_name}
                    </span>
                  )}
                  {student.registration_number && (
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      Mat: {student.registration_number}
                    </span>
                  )}
                </div>
                <p className="text-secondary font-bold text-xs uppercase tracking-widest mt-2">{student.phone || 'Sem Telefone'}</p>
              </div>

              <div className="mt-8 pt-8 border-t border-primary/5 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Mail size={16} className="text-secondary/40" />
                  <span className="truncate">{student.email}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary/5 py-4 px-8 flex justify-between items-center group-hover:bg-secondary transition-colors">
              <button className="text-xs font-bold text-secondary group-hover:text-black transition-colors flex items-center gap-2">
                <GraduationCap size={14} /> Histórico Escolar
              </button>
              <button className="text-xs font-bold text-gray-500 group-hover:text-black/70 transition-colors uppercase tracking-widest">Painel Aluno</button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
