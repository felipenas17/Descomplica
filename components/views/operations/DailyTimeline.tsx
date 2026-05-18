'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Bookmark, Info } from 'lucide-react';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  responsible: string;
  type: string;
  duration: string;
  notes?: string;
  category: 'individual' | 'grupo' | 'reforco' | 'preparatorio';
}

interface DailyTimelineProps {
  events: TimelineEvent[];
}

const CAT_COLORS = {
  individual: 'bg-blue-500',
  grupo: 'bg-purple-500',
  reforco: 'bg-amber-500',
  preparatorio: 'bg-emerald-500',
};

export default function DailyTimeline({ events }: DailyTimelineProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-display font-black text-gray-900 leading-tight">Timeline do Dia</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cronograma Sequencial</p>
          </div>
        </div>
      </div>

      <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
        {events.sort((a,b) => a.time.localeCompare(b.time)).map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-transform hover:scale-150 z-10 ${CAT_COLORS[event.category] || 'bg-gray-400'}`}></div>
            
            <div className="flex gap-4">
              <div className="min-w-[50px] pt-1">
                <span className="text-xs font-black text-gray-900">{event.time}</span>
              </div>
              
              <div className="flex-1 glass-card p-5 rounded-[1.5rem] border border-gray-100 hover:border-primary/20 transition-all bg-gray-50/30">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-0.5">{event.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Bookmark size={10} className="text-primary" />
                      {event.type} • {event.duration}
                    </p>
                  </div>
                  <span className="text-[9px] font-black px-2 py-1 bg-white rounded-lg text-gray-500 shadow-sm">
                    {event.category.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black uppercase">
                      {event.responsible[0]}
                    </div>
                    <span className="text-[11px] font-bold text-gray-600">{event.responsible}</span>
                  </div>
                  {event.notes && (
                    <div className="group relative">
                      <Info size={14} className="text-gray-300 hover:text-primary cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {event.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
