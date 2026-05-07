'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Star, 
  Send, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: string;
    student_name: string;
    subject: string;
    teacher_name: string;
    date: string;
  };
  onSuccess?: () => void;
}

export default function FeedbackModal({ isOpen, onClose, classData, onSuccess }: FeedbackModalProps) {
  const [performance, setPerformance] = useState('Bom');
  const [participation, setParticipation] = useState('Média');
  const [content, setContent] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [observations, setObservations] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!content) {
      alert('Por favor, preencha o conteúdo abordado.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save feedback
      const { error: feedbackError } = await supabase.from('feedbacks').insert([{
        schedule_id: classData.id,
        student_name: classData.student_name,
        teacher_name: classData.teacher_name,
        subject: classData.subject,
        class_date: classData.date,
        performance,
        participation,
        content,
        difficulties,
        observations,
        rating
      }]);

      if (feedbackError) throw feedbackError;

      // 2. Update schedule status
      const { error: statusError } = await supabase
        .from('schedules')
        .update({ status: 'Concluída' })
        .eq('id', classData.id);

      if (statusError) throw statusError;

      setIsSuccess(true);
      onSuccess?.();
      
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        resetForm();
      }, 2000);

    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar feedback: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPerformance('Bom');
    setParticipation('Média');
    setContent('');
    setDifficulties('');
    setObservations('');
    setRating(5);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 bg-purple-600 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Feedback de Aula</h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
              Finalizando aula de {classData.subject}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-8">
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Feedback enviado com sucesso!</h3>
              <p className="text-gray-500 font-medium mt-2">A aula foi marcada como concluída.</p>
            </motion.div>
          ) : (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aluno(a)</p>
                  <p className="font-bold text-gray-900">{classData.student_name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data</p>
                  <p className="font-bold text-gray-900">{new Date(classData.date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Performance & Participation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desempenho do Aluno</label>
                  <div className="flex flex-wrap gap-2">
                    {['Excelente', 'Bom', 'Regular', 'Ruim'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setPerformance(lvl)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                          performance === lvl 
                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-purple-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Participação</label>
                  <div className="flex flex-wrap gap-2">
                    {['Alta', 'Média', 'Baixa'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setParticipation(lvl)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                          participation === lvl 
                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-purple-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nota da Aula (Avaliação Geral)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star 
                        size={32} 
                        fill={star <= rating ? "#FFD700" : "none"} 
                        stroke={star <= rating ? "#FFD700" : "#E5E7EB"}
                        className={star <= rating ? "drop-shadow-md" : ""}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Conteúdo Abordado</label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold min-h-[100px] focus:ring-2 focus:ring-purple-600"
                    placeholder="Quais tópicos foram vistos hoje?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Dificuldades Identificadas</label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold min-h-[100px] focus:ring-2 focus:ring-purple-600"
                    placeholder="O aluno teve dificuldade em algum ponto específico?"
                    value={difficulties}
                    onChange={(e) => setDifficulties(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Observações Gerais</label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold min-h-[100px] focus:ring-2 focus:ring-purple-600"
                    placeholder="Algo mais que o administrador ou pais devem saber?"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Enviando Feedback...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Finalizar Aula e Enviar Feedback
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
