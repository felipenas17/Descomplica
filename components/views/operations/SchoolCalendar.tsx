'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';

export default function SchoolCalendar() {
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [currentDate] = useState(new Date());

  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-gray-900">Calendário Geral</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['day', 'week', 'month', 'year'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  view === v ? 'bg-white shadow-sm text-primary' : 'text-gray-400 opacity-60'
                }`}
              >
                {v === 'day' ? 'DIA' : v === 'week' ? 'SEMANA' : v === 'month' ? 'MÊS' : 'ANO'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-500">
              <ChevronLeft size={16} />
            </button>
            <button className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-500">
              <ChevronRight size={16} />
            </button>
          </div>

          <button className="p-2.5 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-all">
            <Filter size={18} />
          </button>
          <button className="p-2.5 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
            <Download size={18} />
          </button>
        </div>
      </header>

      <div className="min-h-[500px] border border-gray-100 rounded-3xl overflow-hidden bg-gray-50/30">
        {view === 'week' && (
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-8 border-b border-gray-100 bg-white">
              <div className="p-4 border-r border-gray-100"></div>
              {days.map((day, i) => (
                <div key={day} className="p-4 text-center border-r border-gray-100 last:border-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{day.slice(0,3)}</p>
                  <p className={`text-lg font-display font-black ${i === 4 ? 'text-primary' : 'text-gray-900'}`}>
                    {14 + i}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-hide">
              <div className="grid grid-cols-8">
                {/* Time labels */}
                <div className="flex flex-col">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="h-20 border-r border-b border-gray-100 p-2 text-right">
                      <span className="text-[10px] font-black text-gray-300">{8 + i}:00</span>
                    </div>
                  ))}
                </div>

                {/* Grid cells */}
                {days.map((_, dayIdx) => (
                  <div key={dayIdx} className="flex flex-col border-r border-gray-100 last:border-0 relative">
                    {Array.from({ length: 14 }).map((_, hourIdx) => (
                      <div key={hourIdx} className="h-20 border-b border-gray-50 last:border-0"></div>
                    ))}
                    
                    {/* Example Events */}
                    {dayIdx === 1 && (
                      <div className="absolute top-[160px] left-1 right-1 h-32 bg-primary/10 border-l-4 border-primary rounded-xl p-2 z-10 hover:shadow-lg transition-all cursor-pointer">
                        <p className="text-[9px] font-black text-primary uppercase">Matemática</p>
                        <p className="text-[10px] font-bold text-gray-900 leading-tight">Turma B • Sala 02</p>
                      </div>
                    )}
                    {dayIdx === 4 && (
                      <>
                        <div className="absolute top-[80px] left-1 right-1 h-20 bg-purple-500/10 border-l-4 border-purple-500 rounded-xl p-2 z-10 hover:shadow-lg transition-all cursor-pointer">
                          <p className="text-[9px] font-black text-purple-600 uppercase">Física</p>
                          <p className="text-[10px] font-bold text-gray-900 leading-tight">Emanuel • Sala 01</p>
                        </div>
                        <div className="absolute top-[320px] left-1 right-1 h-40 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-xl p-2 z-10 hover:shadow-lg transition-all cursor-pointer">
                          <p className="text-[9px] font-black text-emerald-600 uppercase">Química</p>
                          <p className="text-[10px] font-bold text-gray-900 leading-tight">Turma A • Lab 01</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view !== 'week' && (
          <div className="flex items-center justify-center h-[500px] text-gray-400">
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">Visualização em desenvolvimento...</p>
          </div>
        )}
      </div>
    </div>
  );
}
