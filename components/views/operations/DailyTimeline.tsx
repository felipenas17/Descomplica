'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Bookmark } from 'lucide-react';
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
const CAT_BORDER: Record<string, string> = {
  individual: 'border-l-purple-500',
  grupo: 'border-l-blue-500',
  reforco: 'border-l-amber-500',
  preparatorio: 'border-l-emerald-500',
};
const CAT_BG: Record<string, string> = {
  individual: 'bg-purple-500',
  grupo: 'bg-blue-500',
  reforco: 'bg-amber-500',
  preparatorio: 'bg-emerald-500',
};
const CAT_DOT: Record<string, string> = {
  individual: 'bg-purple-500',
  grupo: 'bg-blue-500',
  reforco: 'bg-amber-500',
  preparatorio: 'bg-emerald-500',
};
export default function DailyTimeline({ events }: DailyTimelineProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-display font-black text-gray-900 leading-tight">Timeline do Dia</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cronograma Sequencial</p>
          </div>
        </div>
        <span className="text-xs font-bold text-gray-400">{events.length} aulas</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {events.sort((a,b) => a.time.localeCompare(b.time)).map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`w-[calc(25%-6px)] min-w-[150px] border border-gray-100 rounded-xl p-3 border-l-[3px] ${CAT_BORDER[event.category] || 'border-l-gray-400'} hover:shadow-sm transition-all`}
          >
            <div className="flex items-center gap-1 mb-1.5">
              <div className={`w-[5px] h-[5px] rounded-full ${CAT_DOT[event.category] || 'bg-gray-400'}`} />
              <span className="text-[11px] font-black text-purple-600">{event.time}</span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Bookmark size={8} className="text-purple-400" />
                {event.type} - {event.duration}
              </p>
              <span className="text-[7px] font-black px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                {event.category.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-black ${CAT_BG[event.category] || 'bg-gray-400'}`}>
                {event.responsible[0]}
              </div>
              <span className="text-[10px] font-bold text-gray-700 truncate">{event.responsible}</span>
            </div>
            {event.notes && (
              <p className="text-[9px] text-gray-400 mt-1 truncate">{event.notes}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
