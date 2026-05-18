'use client';

import React from 'react';
import { motion } from 'motion/react';
import { DoorOpen, Monitor, Users } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  status: 'occupied' | 'free' | 'maintenance';
  currentClass?: string;
  nextClassTime?: string;
  capacity: number;
  currentStudents?: number;
}

interface ClassroomStatusProps {
  rooms: Room[];
}

export default function ClassroomStatus({ rooms }: ClassroomStatusProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
            <Monitor size={20} />
          </div>
          <div>
            <h3 className="font-display font-black text-gray-900 leading-tight">Salas e Infra</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ocupação de Espaços</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rooms.map((room, i) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-2xl border transition-all ${
              room.status === 'occupied' 
              ? 'bg-rose-50/30 border-rose-100' 
              : room.status === 'maintenance'
              ? 'bg-gray-50 border-gray-100 grayscale'
              : 'bg-emerald-50/30 border-emerald-100'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  room.status === 'occupied' ? 'bg-rose-500 text-white' : 'bg-white text-emerald-500 shadow-sm'
                }`}>
                  <DoorOpen size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">{room.name}</h4>
                  <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                    <Users size={10} /> {room.capacity} Lugares
                  </p>
                </div>
              </div>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${
                room.status === 'occupied' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {room.status === 'occupied' ? 'OCUPADA' : 'LIVRE'}
              </span>
            </div>

            {room.status === 'occupied' ? (
              <div className="bg-white/60 p-2 rounded-xl backdrop-blur-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Em aula agora:</p>
                <p className="text-xs font-bold text-gray-900 truncate">{room.currentClass}</p>
                <div className="mt-2 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500" 
                    style={{ width: `${((room.currentStudents || 0) / room.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="p-2">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">Disponível</p>
                <p className="text-[10px] font-bold text-gray-400">
                  {room.nextClassTime ? `Próxima aula: ${room.nextClassTime}` : 'Sem agendamentos próximos'}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
