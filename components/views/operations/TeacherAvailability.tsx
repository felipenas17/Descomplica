'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DAYS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DAYS_SHORT: Record<string,string> = { 'Segunda':'Seg','Terça':'Ter','Quarta':'Qua','Quinta':'Qui','Sexta':'Sex','Sábado':'Sáb' };

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('').toUpperCase();
}

function minutesToStr(min: number) {
  const h = Math.floor(min/60).toString().padStart(2,'0');
  const m = (min%60).toString().padStart(2,'0');
  return h+':'+m;
}

function strToMinutes(t: string) {
  const [h,m] = t.split(':').map(Number);
  return h*60+(m||0);
}

export default function TeacherAvailability() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [filterDay, setFilterDay] = useState<string>('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      // Busca todos os agendamentos futuros para cruzar por dia da semana
      const h = new Date(); const hoje = h.getFullYear() + '-' + String(h.getMonth()+1).padStart(2,'0') + '-' + String(h.getDate()).padStart(2,'0');

      const [{ data: tData }, { data: sData }] = await Promise.all([
        supabase.from('teachers').select('id,name,color,availability,availability_schedule').order('name'),
        supabase.from('schedules').select('teacher_id,date,start_time,end_time').gte('date', hoje).limit(5000),
      ]);
      setTeachers(tData || []);
      setSchedules(sData || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const DAY_MAP: Record<string,number> = { 'Segunda':1,'Terça':2,'Quarta':3,'Quinta':4,'Sexta':5,'Sábado':6 };

  const getVagos = (teacher: any) => {
    const avail = teacher.availability || [];
    const sched = teacher.availability_schedule ? (typeof teacher.availability_schedule === 'string' ? JSON.parse(teacher.availability_schedule) : teacher.availability_schedule) : {};
    const vagos: {day:string, slots:string[]}[] = [];

    for (const day of avail) {
      if (filterDay !== 'Todos' && day !== filterDay) continue;
      const dayConfig = sched[day];
      if (!dayConfig) continue;
      const startMin = strToMinutes(dayConfig.start);
      const endMin = strToMinutes(dayConfig.end);

      // Aulas da professora nesse dia da semana
      const dayNum = DAY_MAP[day];
      const busySlots = schedules.filter(s => {
        if (s.teacher_id !== teacher.id) return false;
        // Calcula dia da semana sem fuso: pega direto da string YYYY-MM-DD
        const [y, m, d] = s.date.split('-').map(Number);
        const dateLocal = new Date(y, m - 1, d);
        return dateLocal.getDay() === dayNum;
      }).map(s => ({
        start: strToMinutes(s.start_time || '00:00'),
        end: strToMinutes(s.end_time || '00:00'),
      }));

      // Gera slots de 1h e verifica se está livre
      const freeSlots: string[] = [];
      for (let t = startMin; t < endMin; t += 60) {
        const slotEnd = t + 60;
        const busy = busySlots.some(b => b.start < slotEnd && b.end > t);
        if (!busy) freeSlots.push(minutesToStr(t) + ' – ' + minutesToStr(slotEnd));
      }
      if (freeSlots.length > 0) vagos.push({ day, slots: freeSlots });
    }
    return vagos;
  };

  const totalVagos = teachers.reduce((acc, t) => acc + getVagos(t).reduce((a,v) => a+v.slots.length, 0), 0);
  const comVaga = teachers.filter(t => getVagos(t).length > 0).length;
  const semVaga = teachers.filter(t => getVagos(t).length === 0 && (t.availability||[]).length > 0).length;

  if (loading) return null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center">
            <span style={{fontSize:20}}>🕐</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Horários vagos</h3>
            <p className="text-xs text-gray-400">Disponibilidade não preenchida esta semana</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-purple-600">{totalVagos}</div>
          <div className="text-xs text-gray-400 mt-1">Slots vagos</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-green-600">{comVaga}</div>
          <div className="text-xs text-gray-400 mt-1">Com disponibilidade</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-gray-400">{semVaga}</div>
          <div className="text-xs text-gray-400 mt-1">Agenda cheia</div>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['Todos',...DAYS].map(d => (
          <button key={d} onClick={() => setFilterDay(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${filterDay === d ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
            {d === 'Todos' ? 'Todos' : DAYS_SHORT[d] || d}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teachers.map(teacher => {
          const vagos = getVagos(teacher);
          const totalSlots = vagos.reduce((a,v) => a+v.slots.length, 0);
          const hex = teacher.color || '#7C3AED';
          return (
            <div key={teacher.id} className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{background: hex}}>
                  {getInitials(teacher.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{teacher.name.split(' ')[0]} {teacher.name.split(' ').slice(-1)[0]}</div>
                  <div className="text-xs text-gray-400">{totalSlots > 0 ? totalSlots+' slot'+(totalSlots>1?'s':'')+' vago'+(totalSlots>1?'s':'') : 'Agenda cheia'}</div>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                {vagos.length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-300">✓ Sem horários vagos</div>
                ) : vagos.map(v => (
                  <div key={v.day}>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{v.day}</div>
                    {v.slots.map(slot => (
                      <div key={slot} className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-1.5 mb-1">
                        <span className="text-xs font-bold text-gray-700">{slot}</span>
                        <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Vago</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
