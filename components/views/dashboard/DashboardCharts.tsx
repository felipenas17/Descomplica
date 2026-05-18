import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

interface DashboardChartsProps {
  revenueData: any[];
  occupancyData: any[];
}

const DashboardCharts = ({ revenueData, occupancyData }: DashboardChartsProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div className="lg:col-span-8 glass-card p-10 rounded-[2.5rem] border border-white/50 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight font-display">Receita & Crescimento</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Estimativa em Tempo Real</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] font-black text-gray-600 uppercase">Atual</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-[10px] font-black text-gray-400 uppercase">Anterior</span>
          </div>
        </div>
      </div>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorCur" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={15} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} tickFormatter={(val) => `R$ ${val}`} />
            <Tooltip 
              contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '1.5rem' }}
              itemStyle={{ fontWeight: 800, fontSize: '0.75rem' }}
            />
            <Area type="monotone" dataKey="prev" stroke="#E2E8F0" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
            <Area type="monotone" dataKey="cur" stroke="#8B5CF6" strokeWidth={5} fillOpacity={1} fill="url(#colorCur)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="lg:col-span-4 glass-card p-10 rounded-[2.5rem] border border-white/50 shadow-sm flex flex-col">
      <div className="mb-10">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight font-display">Ocupação das Salas</h3>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Eficiência de Turmas</p>
      </div>
      <div className="flex-1 min-h-[300px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={occupancyData}
              innerRadius={80}
              outerRadius={120}
              paddingAngle={10}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#8B5CF6" />
              <Cell fill="#10B981" />
              <Cell fill="#F59E0B" />
              {occupancyData.length > 3 && <Cell fill="#EC4899" />}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-black text-gray-900 font-display">
            {Math.round(occupancyData.reduce((acc, v) => acc + v.value, 0) / occupancyData.length)}%
          </span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Média</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-8">
        {occupancyData.map((item, idx) => (
          <div key={idx} className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[8px] font-black text-gray-400 uppercase mb-1">{item.name}</span>
            <span className="text-xl font-black text-gray-900 font-display">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DashboardCharts;
