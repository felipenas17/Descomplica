import React from 'react';
import { AlertCircle, MessageSquare, CheckCircle2 } from 'lucide-react';

interface Inadimplente {
  id: string;
  name: string;
  amount: string;
  daysLate: number;
  status: string;
}

interface FinanceInadimplenciaProps {
  data: Inadimplente[];
}

export const FinanceInadimplencia = ({ data }: FinanceInadimplenciaProps) => (
  <div className="lg:col-span-4 glass-card p-10 rounded-[2.5rem] shadow-sm flex flex-col border border-red-100">
    <div className="flex justify-between items-start mb-8">
      <div>
        <h3 className="text-xl font-bold font-display text-red-500">Inadimplência</h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ações de Cobrança</p>
      </div>
      <div className="p-3 bg-red-100 text-red-500 rounded-2xl">
        <AlertCircle size={20} />
      </div>
    </div>
    
    <div className="flex-1 space-y-6">
      {data.map(item => (
        <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 group">
          <div>
            <p className="text-sm font-bold text-gray-900">{item.name}</p>
            <div className="flex items-center gap-2 mt-1">
               <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${item.status === 'Crítico' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {item.status}
               </span>
               <span className="text-[10px] text-gray-400 font-bold">-{item.daysLate} dias</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-900">R$ {item.amount}</p>
            <div className="flex gap-2 mt-2">
               <button onClick={() => alert("Função de contato em breve!")} className="p-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all">
                  <MessageSquare size={14} />
               </button>
               <button onClick={() => alert("Função de validar em breve!")} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                  <CheckCircle2 size={14} />
               </button>
            </div>
          </div>
        </div>
      ))}
    </div>
    
    <button onClick={() => alert("Relatório em breve!")} className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-bold shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-95 transition-all mt-8">
      Visualizar Relatório Completo (Em breve)
    </button>
  </div>
);
