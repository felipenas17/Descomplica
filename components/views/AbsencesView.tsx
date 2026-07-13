'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, RefreshCw, Calendar, Search, User, Clock, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AbsencesView() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRemarcarModal, setShowRemarcarModal] = useState<any>(null);
  const [remarcarData, setRemarcarData] = useState({ date: '', start_time: '08:00', end_time: '09:00', notes: '' });
  const [savingRemarcar, setSavingRemarcar] = useState(false);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('schedules_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [schedulesRes, teachersRes] = await Promise.all([
      supabase.from('schedules').select('*').order('date', { ascending: false }),
      supabase.from('teachers').select('id, name').order('name'),
    ]);
    setSchedules(schedulesRes.data || []);
    setTeachers(teachersRes.data || []);
    setLoading(false);
  };

  const confirmLesson = async (id: string) => {
    await supabase.from('schedules').update({ status: 'concluido', admin_confirmed: true }).eq('id', id);
    // Se esta aula era uma reposição de outra, fecha o ciclo da aula original
    const lesson = schedules.find(s => s.id === id);
    if (lesson && (lesson as any).reposicao_de_id) {
      await supabase.from('schedules').update({ status: 'reposicao_concluida' }).eq('id', (lesson as any).reposicao_de_id);
    }
    fetchData();
    toast.success('Aula confirmada!');
  };

  const rejectLesson = async (id: string) => {
    await supabase.from('schedules').update({ status: 'cancelado', admin_confirmed: false }).eq('id', id);
    fetchData();
    toast.error('Aula recusada!');
  };

  const markNotified = async (id: string, current: boolean) => {
    await supabase.from('schedules').update({ attendance_status: current ? null : 'justificada' }).eq('id', id);
    fetchData();
    toast.success(current ? 'Marcado como falta' : 'Justificado!');
  };

  const markReposicao = async (id: string) => {
    // Marca como reposição pendente e abre modal para agendar nova data
    await supabase.from('schedules').update({ 
      reposicao_pendente: true,
      status: 'reposicao_marcada'
    }).eq('id', id);
    fetchData();
    toast.success('Reposição marcada! Agende a nova data.');
    const s = schedules.find(x => x.id === id);
    if (s) setShowRemarcarModal(s);
  };

  const remarcarAula = async () => {
    if (!showRemarcarModal || !remarcarData.date) { toast.error('Informe a nova data!'); return; }
    setSavingRemarcar(true);
    try {
      await supabase.from('schedules').insert({
        date: remarcarData.date,
        start_time: remarcarData.start_time,
        end_time: remarcarData.end_time,
        subject: showRemarcarModal.subject,
        student_name: showRemarcarModal.student_name,
        student_id: showRemarcarModal.student_id,
        teacher_id: (remarcarData as any).teacher_id || showRemarcarModal.teacher_id,
        teacher_name: teachers.find(t => t.id === ((remarcarData as any).teacher_id || showRemarcarModal.teacher_id))?.name || showRemarcarModal.teacher_name,
        notes: remarcarData.notes || 'Reposicao da aula de ' + showRemarcarModal.date,
        status: 'confirmado',
        reposicao_pendente: false,
        reposicao_de_id: showRemarcarModal.id,
        created_at: new Date().toISOString(),
      });
      await supabase.from('schedules').update({
        reposicao_pendente: false,
        notes: (showRemarcarModal.notes || '') + ' | Remarcado para ' + remarcarData.date,
      }).eq('id', showRemarcarModal.id);

      // Notificação para o professor
      const teacherId = (remarcarData as any).teacher_id || showRemarcarModal.teacher_id;
      if (teacherId) {
        await supabase.from('notifications').insert({
          user_id: teacherId,
          title: '📅 Reposição agendada: ' + (showRemarcarModal.subject || 'Aula'),
          message: 'Uma aula de reposição foi agendada para ' + new Date(remarcarData.date + 'T00:00:00').toLocaleDateString('pt-BR') + ' das ' + remarcarData.start_time + ' às ' + remarcarData.end_time + '.',
          type: 'info',
        });
      }
      toast.success('Aula remarcada!');

      // Abre WhatsApp para o responsável
      const { data: studentData } = await supabase
        .from('students')
        .select('parent_name, parent_phone')
        .ilike('name', showRemarcarModal.student_name)
        .limit(1)
        .single();

      if (studentData?.parent_phone) {
        const tel = studentData.parent_phone.replace(/\D/g, '');
        const dataFormatada = new Date(remarcarData.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
        const msgTexto = encodeURIComponent(
          'Olá, ' + (studentData.parent_name || 'Responsável') + '! 👋\n\n' +
          '📅 Informamos que a aula de *' + showRemarcarModal.subject + '* do(a) *' + showRemarcarModal.student_name + '* foi remarcada.\n\n' +
          '🗓️ *Nova data:* ' + dataFormatada + '\n' +
          '🕐 *Horário:* ' + remarcarData.start_time + ' às ' + remarcarData.end_time + '\n\n' +
          'Qualquer dúvida estamos à disposição! 🙏\n\n' +
          '_Professora Descomplica_'
        );
        (() => { const _a = document.createElement('a'); _a.href = 'https://wa.me/55' + tel + '?text=' + msgTexto; _a.target = '_blank'; _a.rel = 'noopener noreferrer'; document.body.appendChild(_a); _a.click(); document.body.removeChild(_a); })();
      }

      setShowRemarcarModal(null);
      setRemarcarData({ date: '', start_time: '08:00', end_time: '09:00', notes: '' });
      fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSavingRemarcar(false); }
  };

  const filtered = schedules.filter(s => {
    const matchSearch = !searchTerm ||
      s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTeacher = !filterTeacher || s.teacher_id === filterTeacher;
    const matchDate = !filterDate || s.date === filterDate;
    const matchDateRange = (!filterDateFrom && !filterDateTo) ||
      (filterDateFrom && filterDateTo ? s.date >= filterDateFrom && s.date <= filterDateTo :
        filterDateFrom ? s.date >= filterDateFrom : s.date <= filterDateTo);
    const matchStatus = filterStatus === 'all' ? true :
      filterStatus === 'concluido' ? (s.status === 'concluido' || s.status === 'reposicao_concluida') :
      filterStatus === 'confirmado' ? (s.status === 'confirmado' || s.status === 'agendado') :
      filterStatus === 'aguardando' ? s.status === 'aguardando_confirmacao' :
      filterStatus === 'falta' ? s.attendance_status === 'falta' || s.attendance_status === 'Ausente' :
      filterStatus === 'justificada' ? (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') && !s.reposicao_pendente && s.status !== 'reposicao_marcada' :
      filterStatus === 'reposicao' ? (s.reposicao_pendente === true || s.status === 'reposicao_marcada') :
      filterStatus === 'avulsa' ? s.lesson_type === 'avulsa' :
      s.status !== 'reposicao_concluida';
    return matchSearch && matchTeacher && matchDate && matchDateRange && matchStatus;
  });

  const baseKpi = schedules.filter(s => {
    const matchTeacher = !filterTeacher || s.teacher_id === filterTeacher;
    const matchDateRange = (!filterDateFrom && !filterDateTo) ||
      (filterDateFrom && filterDateTo ? s.date >= filterDateFrom && s.date <= filterDateTo :
        filterDateFrom ? s.date >= filterDateFrom : s.date <= filterDateTo);
    const matchDate = !filterDate || s.date === filterDate;
    return matchTeacher && matchDate && matchDateRange && s.status !== 'reposicao_concluida';
  });
  const base = baseKpi;
  const total = base.length;
  const concluidas = base.filter(s => (s.status === 'concluido' && s.admin_confirmed) || s.status === 'reposicao_concluida').length;
  const reposicoesConcluidas = base.filter(s => s.status === 'reposicao_concluida').length;
  const aguardando = base.filter(s => s.status === 'aguardando_confirmacao').length;
  const faltas = base.filter(s => s.attendance_status === 'falta' || s.attendance_status === 'Ausente').length;
  const justificadas = base.filter(s => (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') && !s.reposicao_pendente && s.status !== 'reposicao_marcada').length;
  const reposicoes = base.filter(s => s.reposicao_pendente || s.status === 'reposicao_marcada').length;
  const avulsas = base.filter(s => s.lesson_type === 'avulsa').length;

  const getStatusLabel = (s: any) => {
    if (s.status === 'concluido' && s.admin_confirmed) return { label: 'Concluida', color: 'bg-green-100 text-green-700' };
    if (s.status === 'aguardando_confirmacao') return { label: 'Aguard. Confirmacao', color: 'bg-orange-100 text-orange-700' };
    if (s.status === 'reposicao_marcada') return { label: 'Reposicao Marcada', color: 'bg-blue-100 text-blue-700' };
    if (s.status === 'reposicao_concluida') return { label: 'Reposicao Concluida', color: 'bg-green-100 text-green-600' };
    if (s.status === 'concluido') return { label: 'Concluida', color: 'bg-green-100 text-green-700' };
    if (s.status === 'cancelado') return { label: 'Cancelada', color: 'bg-red-100 text-red-700' };
    return { label: 'Agendada', color: 'bg-blue-100 text-blue-700' };
  };

  const getAttendanceLabel = (s: any) => {
    if (s.attendance_status === 'Presente' || s.attendance_status === 'presente') return { label: 'Presente', color: 'text-green-600' };
    if (s.status === 'falta_confirmada') return { label: 'Falta Confirmada', color: 'bg-red-100 text-red-700' };
    if (s.attendance_status === 'falta' || s.attendance_status === 'Ausente') return { label: 'Falta', color: 'text-red-600' };
    if (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') return { label: 'Justificada', color: 'text-yellow-600' };
    return null;
  };

  const exportarPDF = () => {
    const teacherName = filterTeacher ? teachers.find((t: any) => t.id === filterTeacher)?.name || '' : 'Todas';
    const fmtDate = (d: string) => { if(!d) return '---'; const [y,m,dd]=d.split('-'); return dd+'/'+m+'/'+y; };
    const periodo = fmtDate(filterDateFrom) + ' a ' + fmtDate(filterDateTo);
    const base2 = baseKpi.filter((s: any) => s.conta_pagamento !== false);
    const duracao = (start: string, end: string) => {
      const [sh,sm] = (start||'00:00').split(':').map(Number);
      const [eh,em] = (end||'00:00').split(':').map(Number);
      return ((eh*60+em)-(sh*60+sm));
    };
    const aulas1h = base2.filter((s: any) => duracao(s.start_time,s.end_time)===60).length;
    const aulas1h30 = base2.filter((s: any) => duracao(s.start_time,s.end_time)===90).length;
    const aulas2h = base2.filter((s: any) => duracao(s.start_time,s.end_time)===120).length;
    const totalHoras = base2.reduce((acc: number, s: any) => acc + duracao(s.start_time,s.end_time)/60, 0);
    const totalHorasStr = Math.floor(totalHoras) + 'h' + ((totalHoras % 1) * 60 > 0 ? String(Math.round((totalHoras % 1) * 60)).padStart(2, '0') : '00');
    const rows = base2.sort((a: any,b: any) => (a.date+a.start_time).localeCompare(b.date+b.start_time)).map((s: any) => {
      const mins = duracao(s.start_time,s.end_time);
      const durLabel = mins===60?'1h':mins===90?'1h30':mins===120?'2h':mins+'min';
      const st = s.status==='reposicao_concluida'?'Concluida':(s.status==='concluido'&&s.admin_confirmed)?'Concluida':s.attendance_status==='falta'?'Falta':(s.reposicao_pendente||s.status==='reposicao_marcada')?'Reposicao':(s.attendance_status==='justificada'||s.attendance_status==='Justificada')?'Justificada':s.lesson_type==='avulsa'?'Avulsa':'Aguardando';
      const stColor = st==='Concluida'?'#D1FAE5;color:#065F46':st==='Falta'?'#FEE2E2;color:#991B1B':st==='Justificada'?'#FEF3C7;color:#92400E':st==='Reposicao'?'#DBEAFE;color:#1E40AF':'#F3F4F6;color:#374151';
      const [y,m,d] = (s.date||'').split('-');
      return '<tr><td>'+(d||'')+'/'+( m||'')+'</td><td>'+(s.start_time||'')+'-'+(s.end_time||'')+'</td><td>'+(s.student_name||'')+'</td><td>'+durLabel+'</td><td><span style="display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;background:'+stColor+'">'+st+'</span></td></tr>';
    }).join('');
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Calibri,Arial,sans-serif;color:#1F2937}.hdr{background:#7C3AED;padding:20px 24px;color:#fff}.logo{font-size:18px;font-weight:700}.sub{font-size:13px;opacity:.8;margin-top:2px}.info{display:flex;justify-content:space-between;padding:12px 24px;background:#F8F7FF;border-bottom:1px solid #EDE9FE;font-size:12px}.info div{text-align:center}.info .l{color:#6B7280;margin-bottom:2px}.info .v{font-weight:600}.sec{padding:14px 24px}.sec-t{font-size:12px;font-weight:600;color:#7C3AED;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #EDE9FE}.mg{display:flex;gap:8px;margin-bottom:4px}.mc{flex:1;background:#F9FAFB;border-radius:6px;padding:10px;text-align:center}.mc .v{font-size:20px;font-weight:600;color:#7C3AED}.mc .lb{font-size:10px;color:#6B7280;margin-top:2px}.mc .s{font-size:10px;color:#9CA3AF}.sg{display:flex;gap:6px;flex-wrap:wrap}.sc{display:flex;align-items:center;gap:6px;padding:6px 10px;background:#F9FAFB;border-radius:6px;min-width:100px}.sc .d{width:6px;height:6px;border-radius:50%}.sc .v{font-size:16px;font-weight:600}.sc .lb{font-size:10px;color:#6B7280}table{width:100%;border-collapse:collapse;font-size:11px}th{text-align:left;padding:6px 8px;background:#F9FAFB;color:#6B7280;font-weight:600;border-bottom:1px solid #E5E7EB}td{padding:6px 8px;border-bottom:.5px solid #F3F4F6}.tot{padding:12px 24px;background:#F8F7FF;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #EDE9FE}.tot .lb{font-size:13px;color:#6B7280}.tot .v{font-size:20px;font-weight:600;color:#7C3AED}.ft{padding:10px 24px;background:#F9FAFB;border-top:.5px solid #E5E7EB;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="hdr"><div class="logo">Descomplica</div><div class="sub">Relat\u00f3rio de aulas \u2014 '+teacherName+'</div></div><div class="info"><div><div class="l">Per\u00edodo</div><div class="v">'+periodo+'</div></div><div><div class="l">Professora</div><div class="v">'+teacherName+'</div></div><div><div class="l">Gerado em</div><div class="v">'+new Date().toLocaleDateString('pt-BR')+'</div></div></div><div class="sec"><div class="sec-t">Aulas por dura\u00e7\u00e3o</div><div class="mg"><div class="mc"><div class="v">'+aulas1h+'</div><div class="lb">Aulas de 1 hora</div><div class="s">'+aulas1h+'h</div></div><div class="mc"><div class="v">'+aulas1h30+'</div><div class="lb">Aulas de 1h30</div><div class="s">'+aulas1h30+'h30</div></div><div class="mc"><div class="v">'+aulas2h+'</div><div class="lb">Aulas de 2 horas</div><div class="s">'+(aulas2h*2)+'h</div></div></div></div><div class="sec"><div class="sec-t">Status</div><div class="sg"><div class="sc"><div class="d" style="background:#16A34A"></div><div><div class="v">'+concluidas+'</div><div class="lb">Conclu\u00eddas</div></div></div><div class="sc"><div class="d" style="background:#DC2626"></div><div><div class="v">'+faltas+'</div><div class="lb">Faltas</div></div></div><div class="sc"><div class="d" style="background:#F59E0B"></div><div><div class="v">'+justificadas+'</div><div class="lb">Justificadas</div></div></div><div class="sc"><div class="d" style="background:#2563EB"></div><div><div class="v">'+reposicoes+'</div><div class="lb">Reposi\u00e7\u00f5es</div></div></div><div class="sc"><div class="d" style="background:#F97316"></div><div><div class="v">'+avulsas+'</div><div class="lb">Avulsas</div></div></div></div></div><div class="sec" style="padding-bottom:0"><div class="sec-t">Detalhamento</div><table><thead><tr><th>Data</th><th>Hor\u00e1rio</th><th>Aluno</th><th>Dura\u00e7\u00e3o</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="tot"><div class="lb">Total de horas-aula</div><div class="v">'+totalHorasStr+'</div></div><div class="ft"><span>Descomplica \u2014 Gest\u00e3o Escolar</span><span>'+new Date().toLocaleDateString('pt-BR')+'</span></div></body></html>';
    const w = window.open('','_blank');
    if(w){w.document.write(html);w.document.close();w.onload=()=>w.print();}
  };

  return (
    <div className="space-y-6 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: total, color: 'text-purple-600', bg: 'bg-purple-50', filter: 'all' },
          { label: 'Concluidas', value: concluidas, color: 'text-green-600', bg: 'bg-green-50', filter: 'concluido' },
          { label: 'Aguardando', value: aguardando, color: 'text-orange-600', bg: 'bg-orange-50', filter: 'aguardando' },
          { label: 'Faltas', value: faltas, color: 'text-red-600', bg: 'bg-red-50', filter: 'falta' },
          { label: 'Justificadas', value: justificadas, color: 'text-yellow-600', bg: 'bg-yellow-50', filter: 'justificada' },
          { label: 'Reposicao', value: reposicoes, color: 'text-blue-600', bg: 'bg-blue-50', filter: 'reposicao' },
          { label: 'Avulsas', value: avulsas, color: 'text-amber-600', bg: 'bg-amber-50', filter: 'avulsa' },
        ].map(kpi => (
          <button key={kpi.label} onClick={() => setFilterStatus(kpi.filter)}
            className={`bg-white rounded-2xl border shadow-sm p-4 text-left transition-all hover:shadow-md ${filterStatus === kpi.filter ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100'}`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none">
              <option value="">Todos professores</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} placeholder="De"
              className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} placeholder="Ate"
              className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <button onClick={() => { setFilterTeacher(''); setFilterDate(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterStatus('all'); setSearchTerm(''); }}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-bold transition-all">
            Limpar
          </button>
          <button onClick={exportarPDF}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <BookOpen size={18} className="text-purple-500" /> Todas as Aulas
          </h2>
          <span className="text-xs text-gray-400 font-bold">{filtered.length} resultado(s)</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Nenhuma aula encontrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(s => {
              const status = getStatusLabel(s);
              const attendance = getAttendanceLabel(s);
              return (
                <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-all flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{s.subject || 'Aula'}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                      {attendance && <span className={`text-[10px] font-black ${attendance.color}`}>{attendance.label}</span>}
                      {s.reposicao_pendente && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Reposicao Pendente</span>}
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap text-xs text-gray-400">
                      {s.date && <span className="flex items-center gap-1"><Calendar size={11} />{new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      {s.start_time && <span className="flex items-center gap-1"><Clock size={11} />{s.start_time}{s.end_time ? ' - ' + s.end_time : ''}</span>}
                      {s.student_name && <span className="flex items-center gap-1"><User size={11} />{s.student_name}</span>}
                      {s.teacher_name && <span>Prof: {s.teacher_name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap shrink-0">
                    {s.status === 'aguardando_confirmacao' && (
                      <>
                        <button onClick={() => confirmLesson(s.id)} className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all">Confirmar</button>
                        <button onClick={() => rejectLesson(s.id)} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-all">Recusar</button>
                      </>
                    )}
                    {(s.attendance_status === 'falta' || s.attendance_status === 'Ausente') && s.status !== 'falta_confirmada' && (
                      <>
                        <button onClick={async () => {
                          await supabase.from('schedules').update({ status: 'falta_confirmada' }).eq('id', s.id);
                          await supabase.from('absences').insert({ student_name: s.student_name, student_id: s.student_id, schedule_id: s.id, absence_date: s.date, notified_advance: false, created_at: new Date().toISOString() });
                          toast.success('Falta confirmada!');
                          fetchData();
                        }} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-all">
                          Confirmar Falta
                        </button>
                        <button onClick={() => markNotified(s.id, false)} className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-xs font-bold transition-all">
                          Justificar
                        </button>
                      </>
                    )}
                    {(s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') && !s.reposicao_pendente && s.status !== 'concluido' && s.status !== 'reposicao_concluida' && s.status !== 'reposicao_marcada' && (
                      <>
                        <button onClick={() => markNotified(s.id, true)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all">
                          Marcar Falta
                        </button>
                        {s.status !== 'reposicao_marcada' && <button onClick={() => markReposicao(s.id)} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all">
                          Reposicao
                        </button>}
                      </>
                    )}
                    {s.reposicao_pendente && (
                      <button onClick={() => { setShowRemarcarModal(s); setRemarcarData({ date: '', start_time: s.start_time || '08:00', end_time: s.end_time || '09:00', notes: 'Reposicao da aula de ' + (s.date || '') }); }}
                        className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold transition-all">
                        Remarcar
                      </button>
                    )}
                    <button onClick={async () => {
                      if (!confirm('Excluir esta aula do controle?')) return;
                      await supabase.from('schedules').delete().eq('id', s.id);
                      fetchData();
                    }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-bold transition-all">
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showRemarcarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Remarcar Aula</h2>
              <button onClick={() => setShowRemarcarModal(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl mb-4">
              <p className="font-black text-gray-900">{showRemarcarModal.subject}</p>
              <p className="text-sm text-gray-500">{showRemarcarModal.student_name} - Prof: {showRemarcarModal.teacher_name}</p>
              <p className="text-xs text-gray-400 mt-1">Aula original: {showRemarcarModal.date ? new Date(showRemarcarModal.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Professor</label>
                <select value={(remarcarData as any).teacher_id || showRemarcarModal.teacher_id || ''}
                  onChange={e => setRemarcarData(r => ({ ...r, teacher_id: e.target.value } as any))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Mesmo professor ({showRemarcarModal.teacher_name})</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Nova Data</label>
                <input type="date" value={remarcarData.date} onChange={e => setRemarcarData(r => ({ ...r, date: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Inicio</label>
                  <input type="time" value={remarcarData.start_time} onChange={e => setRemarcarData(r => ({ ...r, start_time: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Fim</label>
                  <input type="time" value={remarcarData.end_time} onChange={e => setRemarcarData(r => ({ ...r, end_time: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observacao</label>
                <textarea rows={3} value={remarcarData.notes} onChange={e => setRemarcarData(r => ({ ...r, notes: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRemarcarModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={remarcarAula} disabled={savingRemarcar || !remarcarData.date}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {savingRemarcar ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {savingRemarcar ? 'Salvando...' : 'Confirmar Remarcacao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
