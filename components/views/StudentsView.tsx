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
  const [prefillData, setPrefillData] = React.useState<any>(null);
  const [editingStudent, setEditingStudent] = React.useState<any>(null);
  const [showEditForm, setShowEditForm] = React.useState(false);
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
    // Verifica se veio da lista de espera
    const prefill = sessionStorage.getItem('prefill_student');
    if (prefill) {
      try {
        const data = JSON.parse(prefill);
        sessionStorage.removeItem('prefill_student');
        setPrefillData(data);
        setTimeout(() => {
          setShowForm(true);
        }, 300);
        toast.success('Dados do interessado carregados! Complete o cadastro.');
      } catch (e) {}
    }
    const channel = supabase
      .channel('students_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStudents();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchStudents]);

  const handleEditStudent = async (data: any) => {
    if (!editingStudent) return;
    const loadingToast = toast.loading('Salvando alteracoes...');
    try {
      const { error } = await supabase.from('students').update({
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        registration_number: data.registration || '',
        status: 'Ativo',
        enrollment_type: data.enrollment_type || 'nova',
        monthly_value: data.monthly_value ? parseFloat(data.monthly_value) : null,
        parent_name: data.parent_name || '',
        parent_phone: data.parent_phone || '',
        parent_email: data.parent_email || '',
        parent_cpf: data.parent_cpf || '',
        parent_rg: data.parent_rg || '',
        parent_profession: data.parent_profession || '',
        age: data.age || null,
        birth_date: data.birth_date || null,
        sex: data.sex || '',
        school: data.school || '',
        grade: data.grade || '',
        segment: data.segment || '',
        school_shift: data.school_shift || '',
        special_needs: data.special_needs || [],
        has_allergy: data.has_allergy || '',
        allergy_details: data.allergy_details || '',
        lesson_type: data.lesson_type || 'individual',
        lesson_duration: data.lesson_duration || '60',
        notes: data.notes || '',
        day_schedules: data.weekly_frequency ? JSON.stringify({ frequencia: data.weekly_frequency }) : null,
      }).eq('id', editingStudent.id);
      if (error) throw error;
      toast.success('Aluno atualizado!', { id: loadingToast });
      setShowEditForm(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (err: any) {
      toast.error('Erro: ' + err.message, { id: loadingToast });
    }
  };

  const handleAddStudent = async (data: any) => {
    const loadingToast = toast.loading('Processando matrícula...');
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase não conectado.');

      const { error } = await supabase.from('students').insert([{
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        registration_number: data.registration || '',
        status: 'Ativo',
        enrollment_type: data.enrollment_type || 'nova',
        monthly_value: data.monthly_value ? parseFloat(data.monthly_value) : null,
        parent_name: data.parent_name || '',
        parent_phone: data.parent_phone || '',
        parent_email: data.parent_email || '',
        parent_cpf: data.parent_cpf || '',
        parent_rg: data.parent_rg || '',
        parent_profession: data.parent_profession || '',
        age: data.age || null,
        birth_date: data.birth_date || null,
        sex: data.sex || '',
        school: data.school || '',
        grade: data.grade || '',
        segment: data.segment || '',
        school_shift: data.school_shift || '',
        special_needs: data.special_needs || [],
        has_allergy: data.has_allergy || '',
        allergy_details: data.allergy_details || '',
        lesson_type: data.lesson_type || 'individual',
        lesson_duration: data.lesson_duration || '60',
        notes: data.notes || '',

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
      {showForm && <StudentForm onClose={() => { setShowForm(false); setPrefillData(null); }} onSubmit={handleAddStudent} prefill={prefillData} />}
      {historyStudent && (
        <StudentHistoryModal
          student={historyStudent}
          historyData={historyData}
          loading={loadingHistory}
          onClose={() => setHistoryStudent(null)}
        />
      )}

      {/* Modal Editar Aluno */}
      {showEditForm && editingStudent && (
        <StudentForm
          onClose={() => { setShowEditForm(false); setEditingStudent(null); }}
          onSubmit={handleEditStudent}
          prefill={{
            name: editingStudent.name || '',
            email: editingStudent.email || '',
            phone: editingStudent.phone || '',
            registration: editingStudent.registration_number || '',
            enrollment_type: editingStudent.enrollment_type || 'nova',
            monthly_value: editingStudent.monthly_value || '',
            parent_name: editingStudent.parent_name || '',
            parent_phone: editingStudent.parent_phone || '',
            parent_email: editingStudent.parent_email || '',
            parent_cpf: editingStudent.parent_cpf || '',
            parent_rg: editingStudent.parent_rg || '',
            parent_profession: editingStudent.parent_profession || '',
            age: editingStudent.age || '',
            birth_date: editingStudent.birth_date || '',
            sex: editingStudent.sex || '',
            school: editingStudent.school || '',
            grade: editingStudent.grade || '',
            segment: editingStudent.segment || '',
            school_shift: editingStudent.school_shift || '',
            special_needs: editingStudent.special_needs || [],
            has_allergy: editingStudent.has_allergy || '',
            allergy_details: editingStudent.allergy_details || '',
            lesson_type: editingStudent.lesson_type || 'individual',
            lesson_duration: editingStudent.lesson_duration || '60',
            notes: editingStudent.notes || '',
            weekly_frequency: editingStudent.day_schedules ? JSON.parse(editingStudent.day_schedules || '{}').frequencia || '' : '',
          }}
          isEditing={true}
        />
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
                    onClick={() => { setEditingStudent(student); setShowEditForm(true); }}
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

    {painelAluno && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white rounded-t-3xl p-5 border-b border-gray-100 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black text-lg">
                {painelAluno.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">{painelAluno.name}</h2>
                <p className="text-xs text-gray-400">MAT: {painelAluno.registration_number || painelAluno.id?.slice(0,8)}</p>
              </div>
            </div>
            <button onClick={() => setPainelAluno(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">✕</button>
          </div>
          <div className="p-5 space-y-4">
            {/* Matrícula */}
            <div className="bg-purple-50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-3">📋 Matrícula</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Tipo', value: painelAluno.enrollment_type },
                  { label: 'Status', value: painelAluno.status },
                  { label: 'Turno', value: painelAluno.school_shift },
                  { label: 'Segmento', value: painelAluno.segment },
                  { label: 'Série', value: painelAluno.grade },
                  { label: 'Escola', value: painelAluno.school },
                  { label: 'Turma', value: painelAluno.class_name },
                  { label: 'N° Matrícula', value: painelAluno.registration_number },
                ].map(item => item.value ? (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-400 font-bold">{item.label}</p>
                    <p className="font-bold text-gray-900">{item.value}</p>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Dados Pessoais */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">👤 Dados Pessoais</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Email', value: painelAluno.email },
                  { label: 'Telefone', value: painelAluno.phone },
                  { label: 'Nascimento', value: painelAluno.birth_date ? new Date(painelAluno.birth_date + 'T00:00:00').toLocaleDateString('pt-BR') : null },
                  { label: 'Sexo', value: painelAluno.sex },
                  { label: 'Necessidades', value: painelAluno.special_needs },
                  { label: 'Endereço', value: painelAluno.address },
                  { label: 'Bairro', value: painelAluno.neighborhood },
                  { label: 'Cidade', value: painelAluno.city },
                  { label: 'CEP', value: painelAluno.cep },
                ].map(item => item.value ? (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-400 font-bold">{item.label}</p>
                    <p className="font-bold text-gray-900">{item.value}</p>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Aulas */}
            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3">📚 Aulas</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Tipo de Aula', value: painelAluno.lesson_type },
                  { label: 'Dias', value: painelAluno.days_of_week },
                  { label: 'Horário', value: painelAluno.preferred_time },
                  { label: 'Duração', value: painelAluno.lesson_duration },
                  { label: 'Mensalidade', value: painelAluno.monthly_value ? 'R$ ' + Number(painelAluno.monthly_value).toLocaleString('pt-BR', {minimumFractionDigits:2}) : null },
                  { label: 'Como nos encontrou', value: painelAluno.how_found },
                ].map(item => item.value ? (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-400 font-bold">{item.label}</p>
                    <p className="font-bold text-gray-900">{item.value}</p>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Responsável */}
            <div className="bg-orange-50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">👨‍👩‍👧 Responsável</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Nome', value: painelAluno.parent_name },
                  { label: 'Telefone', value: painelAluno.parent_phone },
                  { label: 'Celular', value: painelAluno.parent_cell },
                  { label: 'Email', value: painelAluno.parent_email },
                  { label: 'CPF', value: painelAluno.parent_cpf },
                  { label: 'RG', value: painelAluno.parent_rg },
                  { label: 'Profissão', value: painelAluno.parent_profession },
                ].map(item => item.value ? (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-400 font-bold">{item.label}</p>
                    <p className="font-bold text-gray-900">{item.value}</p>
                  </div>
                ) : null)}
              </div>
              {painelAluno.parent_phone && (
                <a href={'https://wa.me/55' + painelAluno.parent_phone.replace(/\D/g,'')}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold w-fit hover:bg-green-600 transition-all">
                  💬 WhatsApp do Responsável
                </a>
              )}
            </div>

            {/* Observações */}
            {painelAluno.notes && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">📝 Observações</p>
                <p className="text-sm text-gray-700">{painelAluno.notes}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setPainelAluno(null); setEditingStudent(painelAluno); }}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all">
                ✏️ Editar Dados
              </button>
              <button onClick={() => setPainelAluno(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}