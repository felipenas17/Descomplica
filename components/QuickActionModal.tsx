'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  UserPlus, 
  ChevronRight,
  Calendar,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent?: (event: any) => void;
  schedule?: any[];
}

export default function QuickActionModal({ isOpen, onClose, onAddEvent, schedule = [] }: QuickActionModalProps) {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [type, setType] = useState<'revenue' | 'expense' | 'student' | 'teacher' | 'schedule' | null>(null);
  
  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [formDate, setFormDate] = useState(today);
  const [formRecurrence, setFormRecurrence] = useState<'none' | 'weekly' | 'monthly'>('none');
  const [formSubject, setFormSubject] = useState('');
  const [formStudent, setFormStudent] = useState('');
  const [formTeacher, setFormTeacher] = useState('Ricardo Almeida');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState('60');
  const [formClassType, setFormClassType] = useState('Individual');
  const [formStatus, setFormStatus] = useState('Confirmado');
  const [formNotes, setFormNotes] = useState('');
  const [isTestWeek, setIsTestWeek] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [conflict, setConflict] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    async function loadTeachers() {
      const { data } = await supabase.from('teachers').select('*');
      if (data) setTeachers(data);
    }
    loadTeachers();
  }, []);

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');

  const actions = [
    { id: 'schedule', icon: Calendar, label: 'Agendar Aula', color: 'bg-primary', sub: 'Adicionar nova aula na agenda' },
    { id: 'revenue', icon: TrendingUp, label: 'Nova Receita', color: 'bg-green-500', sub: 'Mensalidade ou Aula Extra' },
    { id: 'expense', icon: TrendingDown, label: 'Nova Despesa', color: 'bg-red-500', sub: 'Pagamento ou Material' },
    { id: 'student', icon: UserPlus, label: 'Novo Aluno', color: 'bg-secondary', sub: 'Matricular no sistema' },
  ];

  const getDayFromDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00'); 
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    return days[date.getDay()];
  };

  const checkConflicts = (day: string, startTime: string, duration: string, teacher: string, student: string) => {
    const startMins = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMins = startMins + parseInt(duration);

    const hasConflict = schedule.some(event => {
      if (event.day !== day) return false;
      const eStartMins = parseInt(event.startTime.split(':')[0]) * 60 + parseInt(event.startTime.split(':')[1]);
      const eEndMins = parseInt(event.endTime.split(':')[0]) * 60 + parseInt(event.endTime.split(':')[1]);

      // Simple overlap check
      const overlaps = (startMins < eEndMins && endMins > eStartMins);
      
      if (overlaps) {
        if (event.teacherName === teacher) return true;
        if (event.studentName === student) return true;
      }
      return false;
    });

    return hasConflict;
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      if (type === 'schedule') {
        if (!formSubject || !formStudent || !formTime || !formDuration || !formDate) {
          setConflict('Por favor, preencha todos os campos obrigatórios.');
          setIsSaving(false);
          return;
        }

        const dayOfWeek = getDayFromDate(formDate);

        if (checkConflicts(dayOfWeek, formTime, formDuration, formTeacher, formStudent)) {
          setConflict(`Conflito de horário detectado para ${formTeacher} ou aluno(a) ${formStudent}.`);
          setIsSaving(false);
          return;
        }

        const endHours = Math.floor((parseInt(formTime.split(':')[0]) * 60 + parseInt(formTime.split(':')[1]) + parseInt(formDuration)) / 60);
        const endMins = (parseInt(formTime.split(':')[0]) * 60 + parseInt(formTime.split(':')[1]) + parseInt(formDuration)) % 60;
        const endTime = `${String(endHours % 24).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

        const selectedTeacherObj = teachers.find(t => t.name === formTeacher);

        const eventData = {
          subject: formSubject,
          student_name: formStudent,
          teacher_name: formTeacher,
          teacher_email: selectedTeacherObj?.email || null,
          teacher_id: selectedTeacherObj?.id || null,
          date: formDate,
          start_time: formTime,
          end_time: endTime,
          duration: parseInt(formDuration),
          class_type: formClassType,
          status: formStatus,
          notes: formNotes,
          is_test_week: isTestWeek,
        };

        const { error } = await supabase.from('schedules').insert([eventData]);
        if (error) throw error;

        onAddEvent?.({
          title: formSubject,
          subject: formSubject,
          studentName: formStudent,
          teacherName: formTeacher,
          day: dayOfWeek,
          date: formDate,
          startTime: formTime,
          endTime: endTime,
          room: 'A01', 
          isTestWeek,
          status: formStatus.toLowerCase().includes('confirm') ? 'confirmado' : 'pendente',
        });
      } else if (type === 'student') {
        if (!studentName) {
          alert('Nome do aluno é obrigatório');
          setIsSaving(false);
          return;
        }

        const { error } = await supabase.from('students').insert([{
          name: studentName,
          email: studentEmail,
          phone: studentPhone,
          status: 'ativo'
        }]);
        if (error) throw error;
        
        alert('Aluno cadastrado no Supabase com sucesso!');
      }

      onClose();
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar no Supabase: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setStep('select');
    setType(null);
    setFormSubject('');
    setFormStudent('');
    setFormTime('');
    setFormDate(today);
    setFormRecurrence('none');
    setFormNotes('');
    setConflict(null);
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
  };

  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggest = () => {
    setIsSuggesting(true);
    setTimeout(() => {
      setIsSuggesting(false);
      setFormSubject('Física Mecânica');
      setFormStudent('Ana Beatriz');
      setFormTeacher('Sandra Mendes');
      setFormTime('16:00');
      setFormDate('2026-05-12');
    }, 1500);
  };

  const getFormTitle = () => {
    switch(type) {
      case 'schedule': return 'Agendar Nova Aula';
      case 'revenue': return 'Lançar Receita';
      case 'student': return 'Novo Aluno';
      default: return 'Novo Registro';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[550px] bg-white rounded-[2.5rem] shadow-2xl z-[120] overflow-hidden border border-primary/5"
          >
            <div className="p-8 border-b border-primary/5 flex justify-between items-center bg-primary/5">
              <h2 className="text-2xl font-display font-black text-primary">Ação Rápida</h2>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-gray-400">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {step === 'select' ? (
                <div className="grid grid-cols-1 gap-4">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        setType(action.id as any);
                        setStep('form');
                      }}
                      className="flex items-center justify-between p-5 rounded-3xl border-2 border-primary/5 hover:border-primary/20 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
                          <action.icon size={28} />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-gray-900">{action.label}</p>
                          <p className="text-xs text-gray-400 font-bold">{action.sub}</p>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6 pb-4"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setStep('select')} className="text-primary font-bold text-sm hover:underline">← Voltar</button>
                    <span className="text-gray-300">|</span>
                    <span className="font-bold text-gray-900 uppercase text-xs tracking-widest">{getFormTitle()}</span>
                  </div>

                  <div className="space-y-5">
                    {type === 'schedule' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matéria</label>
                            <select 
                              value={formSubject}
                              onChange={(e) => setFormSubject(e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary appearance-none"
                            >
                              <option value="">Selecione...</option>
                              <option>Matemática</option>
                              <option>Física</option>
                              <option>Química</option>
                              <option>História</option>
                              <option>Geografia</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aluno</label>
                            <input 
                              value={formStudent}
                              onChange={(e) => setFormStudent(e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
                              placeholder="Nome do aluno" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Professor(a)</label>
                            <select 
                              value={formTeacher}
                              onChange={(e) => setFormTeacher(e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary appearance-none"
                            >
                              <option value="">Selecione...</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                              ))}
                              {teachers.length === 0 && (
                                <>
                                  <option>Ricardo Almeida</option>
                                  <option>Sandra Mendes</option>
                                  <option>Marcos Paulo</option>
                                </>
                              )}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</label>
                            <input 
                              type="date" 
                              value={formDate}
                              onChange={(e) => setFormDate(e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora Início</label>
                            <input 
                              type="time" 
                              value={formTime}
                              onChange={(e) => setFormTime(e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duração (min)</label>
                            <input 
                              type="number"
                              value={formDuration}
                              onChange={(e) => setFormDuration(e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
                              placeholder="Ex: 60"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Aula</label>
                            <select 
                              value={formClassType}
                              onChange={(e) => setFormClassType(e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary appearance-none"
                            >
                              <option>Individual</option>
                              <option>Grupo</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recorrência</label>
                            <select 
                              value={formRecurrence}
                              onChange={(e) => setFormRecurrence(e.target.value as any)}
                              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary appearance-none"
                            >
                              <option value="none">Nenhuma</option>
                              <option value="weekly">Semanal</option>
                              <option value="monthly">Mensal</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Inicial</label>
                          <select 
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary appearance-none"
                          >
                            <option>Confirmado</option>
                            <option>Pendente</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações</label>
                          <textarea 
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary resize-none h-24" 
                            placeholder="Alguma nota importante?"
                          />
                        </div>

                        {conflict && (
                          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                               <X size={20} />
                            </div>
                            <div className="flex-1">
                               <p className="text-xs font-black text-red-600">CONFLITO DETECTADO</p>
                               <p className="text-[10px] text-red-500 font-bold">{conflict}</p>
                            </div>
                          </div>
                        )}

                        <div className="pt-2 space-y-4">
                          <div className="flex items-center gap-4">
                            <input 
                              type="checkbox" 
                              id="test-week" 
                              checked={isTestWeek}
                              onChange={(e) => setIsTestWeek(e.target.checked)}
                              className="w-5 h-5 rounded-lg border-primary/20 text-primary focus:ring-primary" 
                            />
                            <label htmlFor="test-week" className="text-sm font-bold text-gray-700">🗓️ É Semana de Prova?</label>
                          </div>
                        </div>

                        <div className="bg-secondary/10 p-4 rounded-2xl border border-secondary/20 mt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black text-secondary uppercase">Inteligência Educacional</p>
                              <p className="text-xs font-bold text-gray-600">Encontramos 3 horários livres para este professor.</p>
                            </div>
                            <button 
                              onClick={handleSuggest}
                              disabled={isSuggesting}
                              className={`px-4 py-2 bg-secondary text-black text-[10px] font-black rounded-lg transition-all ${isSuggesting ? 'opacity-50 cursor-wait' : 'hover:scale-105'}`}
                            >
                              {isSuggesting ? 'PENSANDO...' : 'SUGERIR'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : type === 'student' ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                          <input 
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
                            placeholder="Nome do Aluno" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail</label>
                          <input 
                            type="email"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
                            placeholder="email@exemplo.com" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone / WhatsApp</label>
                          <input 
                            value={studentPhone}
                            onChange={(e) => setStudentPhone(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
                            placeholder="(00) 00000-0000" 
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</label>
                          <input 
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary transition-all" 
                            placeholder="Ex: Mensalidade Julho"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor (R$)</label>
                          <input 
                            type="number"
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary transition-all" 
                            placeholder="0,00"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <button 
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-6 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Salvando...
                      </>
                    ) : (
                      'Confirmar Registro'
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
