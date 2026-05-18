'use client';

import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Coffee, UserCheck, MessageSquare } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  status: 'teaching' | 'available' | 'on-break';
  currentTask?: string;
  timeRemaining?: string;
  avatar?: string;
}

interface TeacherScheduleProps {
  teachers: Teacher[];
}

export default function TeacherSchedule({ teachers }: TeacherScheduleProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 className="font-display font-black text-gray-900 leading-tight">Professores</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status do Corpo Docente</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {teachers.map((teacher, i) => (
          <motion.div
            key={teacher.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white transition-all group"
          >
            <div className="relative">
              {teacher.avatar ? (
                <img src={teacher.avatar} className="w-12 h-12 rounded-2xl object-cover" alt={teacher.name} />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                  {teacher.name[0]}
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                teacher.status === 'teaching' ? 'bg-emerald-500' : teacher.status === 'on-break' ? 'bg-amber-500' : 'bg-blue-500'
              }`}></div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-gray-900 truncate">{teacher.name}</h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase">{teacher.subject}</p>
            </div>

            <div className="text-right">
              {teacher.status === 'teaching' ? (
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mb-1">EM AULA</span>
                  <p className="text-[9px] font-bold text-gray-400">{teacher.timeRemaining} restantes</p>
                </div>
              ) : teacher.status === 'on-break' ? (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Coffee size={14} />
                  <span className="text-[8px] font-black">INTERVALO</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-blue-500">
                  <UserCheck size={14} />
                  <span className="text-[8px] font-black">LIVRE</span>
                </div>
              )}
            </div>

            <button className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:text-primary">
              <MessageSquare size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
