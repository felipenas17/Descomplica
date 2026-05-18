import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface KPIProps {
  label: string;
  value: string;
  trend: string;
  trendValue: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
}

export const FinanceKPI = ({ label, value, trend, trendValue, subtitle, icon: Icon, color }: KPIProps) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.01 }}
    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {trendValue}
      </div>
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{value}</h3>
      <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
    </div>
  </motion.div>
);
