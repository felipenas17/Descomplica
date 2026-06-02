'use client';

import React from 'react';
import { Plus, Trash2, Pencil, Mail, UserCheck, GraduationCap, ShieldCheck, History, X, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateStudentReportHTML } from './studentReportHelper';
import { Avatar } from '@/components/ui/Avatar';
import StudentForm from '@/components/forms/StudentForm';
import StudentHistoryModal from '@/components/views/StudentHistoryModal';

export default function StudentsView() {
  const [students, setStudents] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<any>(null);
  const [painelAluno, setPainelAluno] = React.useState<any>(null);
  const [historyStudent, setHistoryStudent] = React.useState<any>(null);
  const [historyData, setHistoryData] = React.useState<any>({ schedules: [], payments: [], feedbacks: [] });
  const [loadingHistory, setLoadingHistory] = React.useState(false);
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
    const channel = supabase
      .channel('students_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStudents();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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

  const generateReport = async (student: any) => {
    const now = new Date();
    const month = now.toLocaleString('pt-BR', { month: 'long' });
    const year = now.getFullYear();
    const startOfMonth = year + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
    const endOfMonth = year + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-31';
    const [schedulesRes, paymentsRes, feedbacksRes] = await Promise.all([
      supabase.from('schedules').select('*').eq('student_id', student.id).gte('date', startOfMonth).lte('date', endOfMonth),
      supabase.from('monthly_payments').select('*').eq('student_id', student.id),
      supabase.from('feedbacks').select('*').eq('student_id', student.id).gte('created_at', startOfMonth).lte('created_at', endOfMonth + 'T23:59:59'),
    ]);
    const html = generateStudentReportHTML(student, schedulesRes.data || [], paymentsRes.data || [], feedbacksRes.data || [], month.charAt(0).toUpperCase() + month.slice(1), year);
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  const fetchStudentHistory = async (student: any) => {
    setHistoryStudent(student);
    setLoadingHistory(true);
    try {
      const { data: schedules } = await supabase.from('schedules').select('*').eq('student_id', student.id).order('date', { ascending: false }).limit(20);
      const { data: payments } = await supabase.from('monthly_payments').select('*').eq('student_id', student.id).order('created_at', { ascending: false });
      const { data: feedbacks } = await supabase.from('feedbacks').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(10);
      setHistoryData({ schedules: schedules || [], payments: payments || [], feedbacks: feedbacks || [] });
    } catch(e) { console.error(e); }
    finally { setLoadingHistory(false); }
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
      {historyStudent && (
        <StudentHistoryModal
          student={historyStudent}
          historyData={historyData}
          loading={loadingHistory}
          onClose={() => setHistoryStudent(null)}
        />
      )}

      {/* Modal Editar Aluno */}
      {editingStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Editar Aluno</h2>
              <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">✕</button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Nome', field: 'name', type: 'text' },
                { label: 'Email', field: 'email', type: 'email' },
                { label: 'Telefone', field: 'phone', type: 'text' },
                { label: 'Nome do Responsável', field: 'parent_name', type: 'text' },
                { label: 'Telefone do Responsável', field: 'parent_phone', type: 'text' },
                { label: 'CPF do Responsável', field: 'parent_cpf', type: 'text' },
                { label: 'Turma', field: 'class_name', type: 'text' },
                { label: 'Série/Ano', field: 'grade', type: 'text' },
                { label: 'Escola', field: 'school', type: 'text' },
                { label: 'Valor Mensalidade (R$)', field: 'monthly_value', type: 'number' },
                { label: 'Endereço', field: 'address', type: 'text' },
                { label: 'Dias da Semana', field: 'days_of_week', type: 'text' },
                { label: 'Horário', field: 'preferred_time', type: 'text' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
                  <input type={type} value={editingStudent[field] || ''}
                    onChange={e => setEditingStudent((prev: any) => ({ ...prev, [field]: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Observações</label>
                <textarea value={editingStudent.notes || ''}
                  onChange={e => setEditingStudent((prev: any) => ({ ...prev, notes: e.target.value }))}
                  rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingStudent(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={async () => {
                const { error } = await supabase.from('students').update({
                  name: editingStudent.name,
                  email: editingStudent.email,
                  phone: editingStudent.phone,
                  parent_name: editingStudent.parent_name,
                  parent_phone: editingStudent.parent_phone,
                  parent_cpf: editingStudent.parent_cpf,
                  class_name: editingStudent.class_name,
                  grade: editingStudent.grade,
                  school: editingStudent.school,
                  monthly_value: editingStudent.monthly_value,
                  address: editingStudent.address,
                  days_of_week: editingStudent.days_of_week,
                  preferred_time: editingStudent.preferred_time,
                  notes: editingStudent.notes,
                }).eq('id', editingStudent.id);
                if (!error) {
                  setEditingStudent(null);
                  fetchStudents();
                } else {
                  alert('Erro ao salvar: ' + error.message);
                }
              }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                <div className="flex gap-1">
                  <button
                    onClick={() => fetchStudentHistory(student)}
                    className="p-2 text-gray-300 hover:text-purple-500 transition-colors"
                    title="Ver Histórico"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    onClick={() => setEditingStudent(student)}
                    className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                    title="Editar Aluno"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteStudent(student.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    title="Remover Aluno"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
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
              <button onClick={() => fetchStudentHistory(student)} className="text-xs font-bold text-secondary group-hover:text-black transition-colors flex items-center gap-2">
                <History size={14} /> Histórico
              </button>
              <button onClick={() => generateReport(student)} className="text-xs font-bold text-purple-500 group-hover:text-purple-700 transition-colors uppercase tracking-widest">📄 Relatório</button>
              <button onClick={() => setPainelAluno(student)} className="text-xs font-bold text-gray-500 group-hover:text-black/70 transition-colors uppercase tracking-widest">Painel Aluno</button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );

}
