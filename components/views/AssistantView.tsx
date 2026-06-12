'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  acao?: string;
  dados?: any;
  pendente?: boolean;
  acoes_multiplas?: any[];
}

interface AssistantViewProps {
  user: { id?: string; name: string; role: string };
}

export default function AssistantView({ user }: AssistantViewProps) {
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [messages, setMessages]       = useState<Message[]>([
    { role: 'assistant', text: '👋 Olá, ' + user.name + '! Sou seu assistente. Posso agendar aulas, compromissos, lançar despesas e muito mais. Como posso ajudar?' }
  ]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [recording, setRecording]     = useState(false);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const mediaRef                      = useRef<MediaRecorder | null>(null);
  const chunksRef                     = useRef<Blob[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user.id || historyLoaded) return;
      const { data } = await supabase
        .from('assistant_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data && data.length > 0) {
        setMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', text: m.content })));
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, [user.id, historyLoaded]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    await supabase.from('assistant_messages').insert({ user_id: user.id, role: 'user', content: text });

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        role: 'assistant',
        text: data.resposta,
        acao: data.acao,
        dados: data.dados,
        pendente: data.confirmacao_necessaria,
      };
      setMessages(prev => [...prev, assistantMsg]);
      await supabase.from('assistant_messages').insert({ user_id: user.id, role: 'assistant', content: data.resposta });
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: '❌ Erro ao processar. Tente novamente.' }]);
    }
    setLoading(false);
  };

  const confirmarAcao = async (msg: Message) => {
    // Suporte a múltiplas ações
    if (msg.acoes_multiplas && msg.acoes_multiplas.length > 0) {
      setLoading(true);
      let resultados = [];
      for (const acao_item of msg.acoes_multiplas) {
        const fakeMsg = { ...msg, acao: acao_item.acao, dados: acao_item.dados, pendente: false };
        await confirmarAcao(fakeMsg);
      }
      setMessages(prev => prev.map(m => m === msg ? { ...m, pendente: false } : m));
      setLoading(false);
      return;
    }
    if (!msg.acao || !msg.dados) return;
    setLoading(true);

    try {
      let resultado = '';

      if (msg.acao === 'AGENDAR_COMPROMISSO') {
        const { error } = await supabase.from('admin_agenda').insert({
          title:       msg.dados.titulo || msg.dados.title || 'Reunião com Pais',
          type:        msg.dados.tipo || msg.dados.type || 'Outro',
          date:        msg.dados.data || msg.dados.date,
          start_time:  msg.dados.hora || msg.dados.start_time || msg.dados.hora_inicio || '08:00',
          end_time:    msg.dados.hora_fim || msg.dados.end_time || '09:00',
          description: msg.dados.descricao || msg.dados.description || '',
          user_id:     user.id,
        });
        resultado = error ? '❌ Erro ao agendar: ' + error.message : '✅ Compromisso agendado com sucesso!';
      }

      else if (msg.acao === 'LANCAR_DESPESA') {
        const { error } = await supabase.from('expenses').insert({
          description: msg.dados.descricao,
          amount:      msg.dados.valor,
          category_name: msg.dados.categoria || 'Outros',
          month:         new Date().getMonth() + 1,
          year:          new Date().getFullYear(),
          status:        'paid',
          paid_date:     new Date().toISOString().split('T')[0],
          due_date:      msg.dados.data || new Date().toISOString().split('T')[0],
        });
        resultado = error ? '❌ Erro ao lançar despesa: ' + error.message : '✅ Despesa lançada no financeiro!';
      }

      else if (msg.acao === 'AGENDAR_AULA') {
        const { error } = await supabase.from('schedules').insert({
          student_id:  msg.dados.aluno_id,
          teacher_id:  msg.dados.professor_id,
          subject:     msg.dados.materia,
          day_of_week: msg.dados.dia_semana,
          start_time:  msg.dados.hora_inicio,
          end_time:    msg.dados.hora_fim,
        });
        resultado = error ? '❌ Erro ao agendar aula: ' + error.message : '✅ Aula agendada com sucesso!';
      }

      else if (msg.acao === 'ALTERAR_AULA') {
        const { error } = await supabase.from('schedules').update({
          start_time:  msg.dados.hora_inicio,
          end_time:    msg.dados.hora_fim,
          day_of_week: msg.dados.dia_semana,
        }).eq('id', msg.dados.aula_id);
        resultado = error ? '❌ Erro ao alterar aula: ' + error.message : '✅ Aula alterada com sucesso!';
      }

      else if (msg.acao === 'CANCELAR_AULA') {
        const { error } = await supabase.from('schedules').update({
          status: 'cancelado'
        }).eq('id', msg.dados.aula_id);
        resultado = error ? '❌ Erro ao cancelar aula: ' + error.message : '✅ Aula cancelada com sucesso!';
      }

      else if (msg.acao === 'CONFIRMAR_AULA') {
        const { error } = await supabase.from('schedules').update({
          status: 'concluido',
          admin_confirmed: true,
        }).eq('id', msg.dados.aula_id);
        resultado = error ? '❌ Erro ao confirmar aula: ' + error.message : '✅ Aula confirmada e marcada como concluída!';
      }

      else if (msg.acao === 'MARCAR_PAGO') {
        const { error } = await supabase.from('monthly_payments').update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
        }).eq('id', msg.dados.pagamento_id);
        resultado = error ? '❌ Erro ao marcar como pago: ' + error.message : '✅ Mensalidade marcada como paga!';
      }

      else if (msg.acao === 'EXCLUIR_DESPESA') {
        const { error } = await supabase.from('expenses').delete().eq('id', msg.dados.despesa_id);
        resultado = error ? '❌ Erro ao excluir despesa: ' + error.message : '✅ Despesa excluída com sucesso!';
      }

      else if (msg.acao === 'ENVIAR_MENSAGEM') {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase.from('messages').insert({
          sender_id:   userData.user?.id,
          receiver_id: msg.dados.destinatario_id,
          text:        msg.dados.texto,
          read:        false,
          created_at:  new Date().toISOString(),
        });
        resultado = error ? '❌ Erro ao enviar mensagem: ' + error.message : '✅ Mensagem enviada para ' + msg.dados.destinatario_nome + '!';
      }

      else if (msg.acao === 'APROVAR_MATERIAL') {
        const { error } = await supabase.from('materials').update({
          approval_status: 'approved',
          reviewed_by_id: user.id,
          reviewed_at: new Date().toISOString(),
        }).eq('id', msg.dados.material_id);
        resultado = error ? '❌ Erro ao aprovar: ' + error.message : '✅ Material "' + msg.dados.material_titulo + '" aprovado e publicado na biblioteca!';
      }

      else if (msg.acao === 'REPROVAR_MATERIAL') {
        const { error } = await supabase.from('materials').update({
          approval_status: 'rejected',
          rejection_reason: msg.dados.motivo,
          reviewed_by_id: user.id,
          reviewed_at: new Date().toISOString(),
        }).eq('id', msg.dados.material_id);
        resultado = error ? '❌ Erro ao reprovar: ' + error.message : '❌ Material "' + msg.dados.material_titulo + '" reprovado. Professor será notificado.';
      }

      else if (msg.acao === 'MENSAGEM_MASSA') {
        const destinatarios = msg.dados.destinatarios || [];
        let enviados = 0;
        for (const dest of destinatarios) {
          const tel = dest.telefone?.replace(/\D/g, '');
          if (tel) {
            const texto = msg.dados.texto_template
              .replace('{nome}', dest.nome || '')
              .replace('{responsavel}', dest.responsavel || '');
            const msgUrl = encodeURIComponent(texto);
            (() => { const _a = document.createElement('a'); _a.href = 'https://wa.me/55' + tel + '?text=' + msgUrl; _a.target = '_blank'; _a.rel = 'noopener noreferrer'; document.body.appendChild(_a); _a.click(); document.body.removeChild(_a); })();
            await new Promise(r => setTimeout(r, 1000));
            enviados++;
          }
        }
        resultado = '✅ WhatsApp aberto para ' + enviados + ' responsável(is)!';
      }

      else if (msg.acao === 'PARABENIZAR') {
        const destinatarios = msg.dados.destinatarios || [];
        let enviados = 0;
        for (const dest of destinatarios) {
          const tel = dest.telefone?.replace(/\D/g, '');
          if (tel) {
            const msgTexto = encodeURIComponent('Olá ' + (dest.responsavel || 'Responsável') + '! 🎉\n' + 'Hoje é aniversário de *' + dest.nome + '*! 🎂🎈\n' + 'A equipe da *Professora Descomplica* deseja um feliz aniversário cheio de conquistas e aprendizados! 🌟\n' + 'Parabéns! 🥳');
            (() => { const _a = document.createElement('a'); _a.href = 'https://wa.me/55' + tel + '?text=' + msgTexto; _a.target = '_blank'; _a.rel = 'noopener noreferrer'; document.body.appendChild(_a); _a.click(); document.body.removeChild(_a); })();
            await new Promise(r => setTimeout(r, 1000));
            enviados++;
          }
        }
        resultado = '🎉 Parabéns enviado para ' + enviados + ' responsável(is)!';
      }

      else if (msg.acao === 'ENVIAR_NOTIFICACAO') {
        const { error } = await supabase.from('notifications').insert({
          user_id:    msg.dados.destinatario_id,
          title:      msg.dados.titulo,
          message:    msg.dados.texto,
          type:       'info',
          read:       false,
          created_at: new Date().toISOString(),
        });
        resultado = error ? '❌ Erro ao enviar notificação: ' + error.message : '✅ Notificação enviada para ' + msg.dados.destinatario_nome + '!';
      }

      // Marca como executado e adiciona resultado
      setMessages(prev => prev.map(m =>
        m === msg ? { ...m, pendente: false } : m
      ));
      setMessages(prev => [...prev, { role: 'assistant', text: resultado }]);

    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: '❌ Erro: ' + e.message }]);
    }
    setLoading(false);
  };

  const cancelarAcao = (msg: Message) => {
    setMessages(prev => prev.map(m =>
      m === msg ? { ...m, pendente: false } : m
    ));
    setMessages(prev => [...prev, { role: 'assistant', text: '↩️ Ação cancelada. Posso ajudar com mais alguma coisa?' }]);
  };

  const startRecording = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Seu navegador não suporta reconhecimento de voz. Use o Chrome ou Edge.');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setRecording(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setRecording(false);
        sendMessage(text);
      };
      recognition.onerror = () => {
        setRecording(false);
        alert('Erro ao reconhecer voz. Tente novamente.');
      };
      recognition.onend = () => {
        setRecording(false);
      };
      mediaRef.current = recognition;
    } catch {
      setRecording(false);
      alert('Erro ao iniciar reconhecimento de voz.');
    }
  };

  const stopRecording = () => {
    (mediaRef.current as any)?.stop();
    setRecording(false);
  };

  const sugestoes = [
    'Agendar reunião com pais amanhã às 10h',
    'Lançar despesa de R$50 com material',
    'Quais aulas tem hoje?',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>

      {/* Header */}
      <div style={{ padding: '20px 0 12px', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e1b4b' }}>🤖 Assistente Descomplica</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>Digite ou fale para gerenciar o sistema</p>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#f3f4f6',
              color: msg.role === 'user' ? '#fff' : '#1e1b4b',
              fontSize: '14px', lineHeight: 1.5,
            }}>
              {msg.text}
            </div>

            {/* Botões de confirmação */}
            {msg.role === 'assistant' && msg.pendente && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => confirmarAcao(msg)}
                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '9px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                >
                  ✅ Confirmar
                </button>
                <button
                  onClick={() => cancelarAcao(msg)}
                  style={{ background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '9px', padding: '8px 16px', fontWeight: 500, cursor: 'pointer', fontSize: '13px' }}
                >
                  ✕ Cancelar
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ background: '#f3f4f6', borderRadius: '18px 18px 18px 4px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'bounce 1s infinite', animationDelay: i * 0.2 + 's' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Sugestões */}
      {messages.length === 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '12px' }}>
          {sugestoes.map(s => (
            <button key={s} onClick={() => sendMessage(s)} style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ paddingBottom: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Digite um comando..."
            disabled={loading}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', background: loading ? '#f9fafb' : '#fff' }}
          />
          <button
            onClick={recording ? stopRecording : startRecording}
            style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: recording ? '#ef4444' : '#f3f4f6', color: recording ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {recording ? '⏹' : '🎤'}
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#f3f4f6', color: input.trim() ? '#fff' : '#9ca3af', cursor: input.trim() ? 'pointer' : 'default', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
