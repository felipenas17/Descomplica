'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Wallet, 
  GraduationCap, 
  BookOpen, 
  Users,
  Menu,
  Search,
  Plus,
  MessageSquareQuote,
  ShieldCheck,
  FileText
} from 'lucide-react';

import { NotificationDropdown } from './NotificationDropdown';

// --- Shared Types ---
export type View = 'dashboard' | 'schedule' | 'finance' | 'teachers' | 'students' | 'agenda' | 'feedbacks' | 'users' | 'materials';

// --- Navbar Item Component ---
const NavItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-primary/10 text-primary border-l-4 border-primary' 
        : 'text-white/70 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={20} className={active ? 'text-primary' : 'text-white/50 group-hover:text-white'} />
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

// --- Sidebar Component ---
const Sidebar = ({ activeView, setView, user, onLogout }: { activeView: View, setView: (v: View) => void, user: any, onLogout: () => void }) => (
  <aside className="hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 sidebar-dark p-6 z-50">
    <div className="mb-12">
      <h1 className="text-2xl font-bold text-white font-display">Gestão de Escolas</h1>
      <p className="text-xs text-white/40 uppercase tracking-widest mt-1">School Administration</p>
    </div>

    <nav className="flex-1 flex flex-col gap-2">
      {user?.role === 'admin' && (
        <>
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={CalendarDays} label="Horários" active={activeView === 'schedule'} onClick={() => setView('schedule')} />
          <NavItem icon={Wallet} label="Financeiro" active={activeView === 'finance'} onClick={() => setView('finance')} />
          <NavItem icon={GraduationCap} label="Professores" active={activeView === 'teachers'} onClick={() => setView('teachers')} />
          <NavItem icon={Users} label="Alunos" active={activeView === 'students'} onClick={() => setView('students')} />
          <NavItem icon={MessageSquareQuote} label="Feedbacks" active={activeView === 'feedbacks'} onClick={() => setView('feedbacks')} />
          <NavItem icon={ShieldCheck} label="Usuários" active={activeView === 'users'} onClick={() => setView('users')} />
        </>
      )}
      <NavItem icon={BookOpen} label="Minha Agenda" active={activeView === 'agenda'} onClick={() => setView('agenda')} />
      <NavItem icon={FileText} label="Material de Apoio" active={activeView === 'materials'} onClick={() => setView('materials')} />
    </nav>

    <div className="mt-auto pt-6 border-t border-white/10">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden relative">
          <Image src="https://picsum.photos/seed/admin/200" alt="Admin" fill className="object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-1 truncate">
          <p className="text-sm font-bold text-white truncate">{user?.name}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-tighter">{user?.role}</p>
        </div>
      </div>
      <button 
        onClick={onLogout}
        className="w-full py-2 bg-white/5 hover:bg-red-500/10 text-white/70 hover:text-red-400 rounded-xl text-xs font-bold transition-all"
      >
        Sair da Conta
      </button>
    </div>
  </aside>
);

// --- TopBar Component ---
const TopBar = ({ title, user }: { title: string, user: any }) => (
  <header className="flex justify-between items-center px-8 py-4 w-full sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-primary/10">
    <div className="flex items-center gap-4">
      <button className="md:hidden text-primary">
        <Menu size={24} />
      </button>
      <h2 className="text-2xl font-bold text-primary font-display">{title}</h2>
    </div>
    <div className="flex items-center gap-6">
      {user?.role === 'admin' && (
        <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-4 py-2 border border-black/5">
          <Search size={16} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-48 text-gray-700"
          />
        </div>
      )}
      <NotificationDropdown />
      <div className="w-9 h-9 rounded-full bg-primary border-2 border-primary/20 overflow-hidden cursor-pointer active:scale-95 transition-all relative">
        <Image src="https://picsum.photos/seed/admin/200" alt="Avatar" fill className="object-cover" referrerPolicy="no-referrer" />
      </div>
    </div>
  </header>
);

// --- Bottom Navigation (Mobile) ---
const BottomNav = ({ activeView, setView, user }: { activeView: View, setView: (v: View) => void, user: any }) => (
  <nav className="md:hidden fixed bottom-6 left-4 right-4 h-16 bg-white/70 backdrop-blur-xl border border-primary/10 shadow-2xl rounded-2xl flex justify-around items-center px-4 z-50">
    {user?.role === 'admin' && (
      <>
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${activeView === 'dashboard' ? 'text-primary' : 'text-gray-400 opacity-60'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setView('users')} className={`flex flex-col items-center gap-1 ${activeView === 'users' ? 'text-primary' : 'text-gray-400 opacity-60'}`}>
          <ShieldCheck size={20} />
          <span className="text-[10px] font-bold">Usuários</span>
        </button>
      </>
    )}
    <button onClick={() => setView('agenda')} className={`flex flex-col items-center gap-1 ${activeView === 'agenda' ? 'text-primary' : 'text-gray-400 opacity-60'}`}>
      <BookOpen size={20} />
      <span className="text-[10px] font-bold">Agenda</span>
    </button>
    <button onClick={() => setView('materials')} className={`flex flex-col items-center gap-1 ${activeView === 'materials' ? 'text-primary' : 'text-gray-400 opacity-60'}`}>
      <FileText size={20} />
      <span className="text-[10px] font-bold">Materiais</span>
    </button>
    {user?.role === 'admin' && (
      <>
        <button onClick={() => setView('finance')} className={`flex flex-col items-center gap-1 ${activeView === 'finance' ? 'text-primary' : 'text-gray-400 opacity-60'}`}>
          <Wallet size={20} />
          <span className="text-[10px] font-bold">Dinheiro</span>
        </button>
        <button onClick={() => setView('teachers')} className={`flex flex-col items-center gap-1 ${activeView === 'teachers' ? 'text-primary' : 'text-gray-400 opacity-60'}`}>
          <GraduationCap size={20} />
          <span className="text-[10px] font-bold">Profs</span>
        </button>
      </>
    )}
  </nav>
);

// --- Main Layout ---
export function AppContainer({ children, activeView, setView, user, onLogout }: { children: React.ReactNode, activeView: View, setView: (v: View) => void, user: any, onLogout: () => void }) {
  const viewTitles: Record<View, string> = {
    dashboard: 'Gestão de Escolas',
    schedule: 'Horários e Aulas',
    finance: 'Painel Financeiro',
    teachers: 'Corpo Docente',
    students: 'Gestão de Alunos',
    agenda: 'Minha Agenda',
    feedbacks: 'Feedback das Aulas',
    users: 'Usuários & Acessos',
    materials: 'Material de Apoio'
  };

  return (
    <div className="min-h-screen bg-background-app flex selection:bg-primary/30 selection:text-primary">
      <Sidebar activeView={activeView} setView={setView} user={user} onLogout={onLogout} />
      
      <main className="flex-1 md:ml-[280px] min-h-screen relative pb-32 md:pb-12">
        <TopBar title={viewTitles[activeView]} user={user} />
        
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav activeView={activeView} setView={setView} user={user} />

    {user?.role === 'admin' && (
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                const event = new CustomEvent('global-plus-click');
                window.dispatchEvent(event);
              }
            }}
            className="fixed bottom-24 right-8 md:bottom-12 md:right-12 w-16 h-16 rounded-2xl bg-secondary text-on-surface shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Plus size={32} className="text-black" />
          </button>
        )}
      </main>

      <footer className="hidden md:block absolute bottom-4 right-12 text-[10px] text-gray-400">
        <p>&copy; 2026 Gestão de Escolas. Todos os direitos reservados.</p>
        <div className="flex gap-4 justify-end mt-1">
          <a href="#" className="hover:text-primary transition-colors">Termos</a>
          <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
          <a href="#" className="hover:text-primary transition-colors">Contato</a>
        </div>
      </footer>
    </div>
  );
}
