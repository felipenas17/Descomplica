'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

const CONTACTS = [
  { id: 1, name: 'Prof. Ana Silva', lastMessage: 'Bom dia! Sobre a aula de amanhã...', time: '09:30', unread: 2, online: true },
  { id: 2, name: 'João Santos', lastMessage: 'Obrigado pela ajuda!', time: '08:15', unread: 0, online: false },
  { id: 3, name: 'Coordenação', lastMessage: 'Reunião às 14h confirmada', time: 'Ontem', unread: 1, online: true },
];

const MESSAGES: Record<number, { id: number; text: string; sent: boolean; time: string }[]> = {
  1: [
    { id: 1, text: 'Bom dia! Sobre a aula de amanhã...', sent: false, time: '09:30' },
    { id: 2, text: 'Claro, pode confirmar o horário?', sent: true, time: '09:31' },
    { id: 3, text: 'Será às 10h na sala 3', sent: false, time: '09:32' },
  ],
  2: [
    { id: 1, text: 'Preciso de ajuda com a tarefa', sent: false, time: '08:10' },
    { id: 2, text: 'Claro! Qual é a dificuldade?', sent: true, time: '08:12' },
    { id: 3, text: 'Obrigado pela ajuda!', sent: false, time: '08:15' },
  ],
  3: [
    { id: 1, text: 'Reunião às 14h confirmada', sent: false, time: 'Ontem' },
    { id: 2, text: 'Ok, estarei lá!', sent: true, time: 'Ontem' },
  ],
};

export default function MessagesView() {
  const [selected, setSelected] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const contact = CONTACTS.find(c => c.id === selected);
  const messages = selected ? MESSAGES[selected] || [] : [];

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      <div className="w-80 bg-white/70 backdrop-blur rounded-2xl border border-purple-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-purple-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Mensagens
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {CONTACTS.map(c => (
            <div key={c.id} onClick={() => setSelected(c.id)}
              className={`p-4 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-100 ${selected === c.id ? 'bg-purple-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {c.name[0]}
                  </div>
                  {c.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{c.name}</span>
                    <span className="text-xs text-gray-400">{c.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">{c.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white/70 backdrop-blur rounded-2xl border border-purple-100 flex flex-col overflow-hidden">
        {contact ? (
          <>
            <div className="p-4 border-b border-purple-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm">{contact.name[0]}</div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{contact.name}</p>
                <p className="text-xs text-green-500">{contact.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${m.sent ? 'bg-purple-600 text-white' : 'bg-white border border-purple-100 text-gray-800'}`}>
                    {m.text}
                    <p className={`text-xs mt-1 ${m.sent ? 'text-purple-200' : 'text-gray-400'}`}>{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-purple-100 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="flex-1 px-4 py-2 rounded-xl border border-purple-100 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              <button onClick={() => setInput('')}
                className="w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Selecione uma conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
