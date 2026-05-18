'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, User, MapPin, Clock, Users as UsersIcon } from 'lucide-react';

interface Class {
  id: string;
  subject: string;
  teacher_name: string;
  room: string;
  start_time: string;
  end_time: string;
  student_count: number;
  status: 'em andamento' | 'atrasado' | 'finalizado' | 'cancelado';
}

interface LiveClassesPanelProps {
  classes: Class[];
}

const STATUS_MAP = {
  'em andamento': { label: 'AO VIVO', color: 'bg-emerald-500', text: 'text-emerald-500' },
  'atrasado': { label: 'ATRASADO', color: 'bg-amber-500', text: 'text-amber-500' },
  'finalizado': { label: 'CONCLUÍDO', color: 'bg-blue-500', text: 'text-blue-500' },
  'cancelado': { label: 'CANCELADO', color: 'bg-red-500', text: 'text-red-500' },
};

export default function LiveClassesPanel({ classes }: LiveClassesPanelProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 relative">
            <Activity size={20} />
            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
          </div>
          <div>
            <h3 className="font-display font-black text-gray-900 leading-tight">Ao Vivo</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atividade em Tempo Real</p>
          </div>
        </div>
        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-lg">
          {classes.length} EM AULA
        </span>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {classes.length > 0 ? (
            classes.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group p-4 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-lg rounded-2xl transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_MAP[cls.status].color} animate-pulse`}></span>
                    <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{cls.subject}</h4>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md bg-white border border-gray-100 ${STATUS_MAP[cls.status].text}`}>
                    {STATUS_MAP[cls.status].label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      <User size={14} className="text-primary" />
                      {cls.teacher_name}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      <MapPin size={14} className="text-primary" />
                      {cls.room || 'Sem sala'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      <Clock size={14} className="text-primary" />
                      {cls.start_time} - {cls.end_time}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      <UsersIcon size={14} className="text-primary" />
                      {cls.student_count} Alunos
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Activity size={40} className="mb-2 opacity-20" />
              <p className="text-xs font-bold">Nenhuma aula acontecendo</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
