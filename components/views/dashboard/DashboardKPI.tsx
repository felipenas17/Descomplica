import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface DashboardKPIProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  color: string;
}

export const DashboardKPI = ({ label, value, change, trend, icon: Icon, color }: DashboardKPIProps) => (
  <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform`} />
    <div className="flex justify-between items-start relative z-10">
      <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg shadow-gray-200/50 group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className={`flex items-center gap-1 text-xs font-black ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'} bg-gray-50 px-2 py-1 rounded-full`}>
        {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}
      </div>
    </div>
    <div className="mt-8 relative z-10">
      <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-gray-900 tracking-tight font-display">{value}</h3>
    </div>
  </div>
);
