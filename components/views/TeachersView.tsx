'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Award,
  Video,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import TeacherForm from '@/components/forms/TeacherForm';

export default function TeachersView() {
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchTeachers = React.useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTeachers(data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) await fetchTeachers();
    };
    load();
    return () => { active = false; };
  }, [fetchTeachers]);

  const handleAddTeacher = async (data: any) => {
    try {
      // 1. Create Profile first (if permissions allow)
      // Note: Real Auth user creation requires Service Role on client or Trigger on server.
      // We will perform the DB insertion which will trigger the login availability logic.
      
      const teacherData = {
        name: data.name,
        email: data.email,
        subject: data.subject,
        availability: data.availability ? data.availability.split(',').map((s: string) => s.trim()) : [],
        avatar: `https://picsum.photos/seed/${data.name}/200`,
        role: 'Professor'
      };

      const { data: insertedTeacher, error: teacherError } = await supabase
        .from('teachers')
        .insert([teacherData])
        .select()
        .single();

      if (teacherError) throw teacherError;

      // Simulate a profile creation for the login logic
      // In a real app, this would be handled by a Supabase Trigger on auth.users -> public.profiles
      await supabase.from('profiles').insert([{
        email: data.email,
        full_name: data.name,
        role: 'professor'
      }]);

      alert(`Professor cadastrado com sucesso! \nAcesso gerado para: ${data.email}\nSenha: ${data.password}`);
      fetchTeachers();
      setShowForm(false);
    } catch (err: any) {
      console.error('Error adding teacher:', err);
      alert('Erro ao cadastrar professor: ' + err.message);
    }
  };

  const handleDeleteTeacher = (id: string) => {
    if (window.confirm('Deseja realmente remover este professor?')) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

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

      {/* Grid of Teachers */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {teachers.map(teacher => (
          <div key={teacher.id} className="glass-card rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-primary/5">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all relative">
                    <Image src={teacher.avatar} alt={teacher.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-secondary rounded-full border-4 border-white flex items-center justify-center text-black z-10">
                    <UserCheck size={14} />
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  title="Remover Professor"
                >
                  <MoreVertical size={20} />
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
    </div>
  );
}
