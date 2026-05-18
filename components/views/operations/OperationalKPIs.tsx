'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Users, Clock, House, UserCheck, AlertTriangle, RefreshCcw } from 'lucide-react';

interface KPIProps {
  stats: {
    totalToday: number;
    liveCount: number;
    occupancyRate: number;
    activeTeachers: number;
    presentStudents: number;
    absences: number;
    pendingRepositions: number;
  };
}

export default function OperationalKPIs({ stats }: KPIProps) {
  const kpiData = [
    { label: 'Hoje', value: stats.totalToday, icon: Clock, color: 'text-primary' },
    { label: 'Ao Vivo', value: stats.liveCount, icon: RefreshCcw, color: 'text-emerald-500' },
    { label: 'Ocupação', value: `${stats.occupancyRate}%`, icon: House, color: 'text-blue-500' },
    { label: 'Professores', value: stats.activeTeachers, icon: UserCheck, color: 'text-purple-500' },
    { label: 'Alunos', value: stats.presentStudents, icon: Users, color: 'text-amber-500' },
    { label: 'Faltas', value: stats.absences, icon: AlertTriangle, color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpiData.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
        >
          <div className={`p-2.5 rounded-xl bg-gray-50/50 w-fit mb-3 ${kpi.color}`}>
            <kpi.icon size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-xl font-display font-black text-gray-900">{kpi.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
