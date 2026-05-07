'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Trash2,
  Mail, 
  UserCheck,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import StudentForm from '@/components/forms/StudentForm';

export default function StudentsView() {
  const [students, setStudents] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchStudents = React.useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = async (data: any) => {
    try {
      const { error } = await supabase.from('students').insert([{
        name: data.name,
        email: data.email,
        phone: data.phone || data.registration,
        status: 'Ativo'
      }]);
      if (error) throw error;
      
      alert('Aluno matriculado com sucesso!');
      fetchStudents();
      setShowForm(false);
    } catch (err: any) {
      alert('Erro ao matricular: ' + err.message);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Deseja realmente remover este aluno?')) {
      try {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) throw error;
        setStudents(students.filter(s => s.id !== id));
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message);
      }
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {students.map(student => (
          <div key={student.id} className="glass-card rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-500 border border-primary/5">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                  <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-secondary/10 group-hover:ring-secondary/30 transition-all relative bg-gray-100 flex items-center justify-center">
                    <Image 
                      src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} 
                      alt={student.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
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
                <p className="text-secondary font-bold text-xs uppercase tracking-widest">{student.phone || 'Sem Telefone'}</p>
                <p className="text-gray-400 text-xs">ID: {student.id.slice(0, 8)}</p>
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
    </div>
  );
}
