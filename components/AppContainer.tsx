import TeacherScheduleView from '@/components/views/TeacherScheduleView';
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  CalendarCheck,
  Activity, 
  Wallet, 
  GraduationCap, 
  Users,
  Menu,
  Search,
  MessageSquare,
  MessageSquareQuote,
  ShieldCheck,
  UserX,
  FileText,
  Lock,
  ChevronDown,
  LogOut,
  Bell,
  Loader2
} from 'lucide-react';

import { NotificationDropdown } from './NotificationDropdown';
import { Avatar } from './ui/Avatar';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useNotifications } from '@/hooks/useNotifications';

// --- Shared Types ---
export type View = 'dashboard' | 'schedule' | 'finance' | 'teachers' | 'students' | 'agenda' | 'feedbacks' | 'users' | 'materials' | 'messages' | 'notifications' | 'absences' | 'contracts' | 'teacher_feedbacks';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'student' | 'teacher' | 'schedule';
}

// --- Navbar Item Component ---
const NavItem = React.memo(({ 
  icon: Icon, 
  label, 
  active, 
  onClick,
  badge
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  badge?: number
}) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl transition-all duration-200 group relative ${
      active 
        ? 'bg-primary/10 text-primary border-l-4 border-primary' 
        : 'text-white/70 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={20} className={active ? 'text-primary' : 'text-white/50 group-hover:text-white'} />
    <span className="font-semibold text-sm">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
        {badge}
      </span>
    )}
  </button>
));

NavItem.displayName = 'NavItem';

// --- Sidebar Component ---
const Sidebar = ({ activeView, setView, user, onLogout, onOpenChangePassword, unreadCount, unreadMessages, setUnreadMessages }: { activeView: View, setView: (v: View) => void, user: any, onLogout: () => void, onOpenChangePassword?: () => void, unreadCount: number, unreadMessages: number, setUnreadMessages: (n: number) => void }) => (
  <aside className="hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 sidebar-dark p-6 z-50">
    <div className="mb-12">
      <h1 className="text-2xl font-bold text-white font-display">Gestão de Escolas</h1>
      <p className="text-xs text-white/40 uppercase tracking-widest mt-1">School Administration</p>
    </div>

    <nav className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
      {user?.role === 'admin' && (
        <>
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={Activity} label="Central Operacional" active={activeView === 'schedule'} onClick={() => setView('schedule')} />
          <NavItem icon={Wallet} label="Financeiro" active={activeView === 'finance'} onClick={() => setView('finance')} />
          <NavItem icon={GraduationCap} label="Professores" active={activeView === 'teachers'} onClick={() => setView('teachers')} />
          <NavItem icon={Users} label="Alunos" active={activeView === 'students'} onClick={() => setView('students')} />
          <NavItem icon={MessageSquareQuote} label="Feedbacks" active={activeView === 'feedbacks'} onClick={() => setView('feedbacks')} />
          <NavItem icon={UserX} label="Controle de Aulas" active={activeView === 'absences'} onClick={() => setView('absences')} />
          <NavItem icon={FileText} label="Contratos" active={activeView === 'contracts'} onClick={() => setView('contracts')} />
          <NavItem icon={ShieldCheck} label="Usuários" active={activeView === 'users'} onClick={() => setView('users')} />
        </>
      )}
      <NavItem icon={MessageSquare} label="Mensagens" active={activeView === 'messages'} onClick={() => { setView('messages'); setUnreadMessages(0); }} badge={unreadMessages} />
      <NavItem icon={Bell} label="Notificações" active={activeView === 'notifications'} onClick={() => setView('notifications')} badge={unreadCount} />
      <NavItem icon={CalendarCheck} label="Agenda & Compromissos" active={activeView === 'agenda'} onClick={() => setView('agenda')} />
      <NavItem icon={FileText} label="Material de Apoio" active={activeView === 'materials'} onClick={() => setView('materials')} />
      <NavItem icon={MessageSquareQuote} label="Meus Feedbacks" active={activeView === 'teacher_feedbacks'} onClick={() => setView('teacher_feedbacks')} />
    </nav>

    <div className="mt-auto pt-6 border-t border-white/10">
      <div className="flex items-center gap-4 mb-4">
        <Avatar name={user?.name} className="ring-2 ring-primary/20" />
        <div className="flex-1 truncate">
          <p className="text-sm font-bold text-white truncate">{user?.name}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-tighter">{user?.role}</p>
        </div>
      </div>
      <div className="space-y-2">
        <button 
          onClick={onOpenChangePassword}
          className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <Lock size={12} /> Alterar Senha
        </button>
        <button 
          onClick={onLogout}
          className="w-full py-3 bg-white/5 hover:bg-red-500/10 text-white/70 hover:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={12} /> Sair da Conta
        </button>
      </div>
    </div>
  </aside>
);

// --- TopBar Component ---
const TopBar = ({ title, user, setView, onLogout, onOpenChangePassword }: { title: string, user: any, setView: (v: View) => void, onLogout: () => void, onOpenChangePassword?: () => void }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const debouncedSearch = useDebounce(searchTerm, 400);

  React.useEffect(() => {
    async function performSearch() {
      if (debouncedSearch.length < 3) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const [students, teachers, schedules] = await Promise.all([
          supabase.from('students').select('id, name, class_name').ilike('name', `%${debouncedSearch}%`).limit(3),
          supabase.from('teachers').select('id, name, subject').ilike('name', `%${debouncedSearch}%`).limit(3),
          supabase.from('schedules').select('id, subject, student_name').ilike('subject', `%${debouncedSearch}%`).limit(3)
        ]);

        const combined: SearchResult[] = [
          ...(students.data?.map(s => ({ id: s.id, title: s.name, subtitle: (s as any).class_name || 'Estudante', type: 'student' as const })) || []),
          ...(teachers.data?.map(t => ({ id: t.id, title: t.name, subtitle: (t as any).subject || 'Professor', type: 'teacher' as const })) || []),
          ...(schedules.data?.map(s => ({ id: s.id, title: (s as any).subject, subtitle: (s as any).student_name, type: 'schedule' as const })) || [])
        ];

        setResults(combined);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }

    performSearch();
  }, [debouncedSearch]);

  const handleResultClick = (result: SearchResult) => {
    const viewMap: Record<SearchResult['type'], View> = {
      student: 'students',
      teacher: 'teachers',
      schedule: 'schedule'
    };
    setView(viewMap[result.type]);
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <header className="flex justify-between items-center px-8 py-4 w-full sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-primary/10">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-primary">
          <Menu size={24} />
        </button>
        <h2 className="text-2xl font-bold text-primary font-display">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        {user?.role === 'admin' && (
          <div className="hidden sm:block relative">
            <div className="flex items-center bg-gray-100 rounded-full px-5 py-2.5 border border-black/5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              {isSearching ? <Loader2 className="animate-spin text-primary mr-2" size={16} /> : <Search size={16} className="text-gray-400 mr-2" />}
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                className="bg-transparent border-none focus:ring-0 text-sm w-48 text-gray-700 outline-none"
              />
            </div>
            
            {showResults && searchTerm.length >= 3 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resultados</span>
                    {results.length > 0 && <span className="text-[10px] font-bold text-primary">{results.length} itens</span>}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {results.length > 0 ? (
                      results.map((res) => (
                        <button
                          key={`${res.type}-${res.id}`}
                          onClick={() => handleResultClick(res)}
                          className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-none group"
                        >
                          <Avatar name={res.title} size={32} />
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate group-hover:text-primary transition-colors">{res.title}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{res.subtitle} • {res.type}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-xs font-bold text-gray-400">Nenhum resultado encontrado para "{searchTerm}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        <NotificationDropdown />
        
        {/* User Menu Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 group p-1.5 rounded-2xl hover:bg-primary/5 transition-all outline-none"
          >
            <Avatar name={user?.name} className="ring-2 ring-primary/20 group-hover:scale-105 transition-all" />
            <div className="hidden lg:block text-left mr-2">
              <p className="text-xs font-black text-gray-900 leading-none">{user?.name}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{user?.role}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-2"
                >
                  <div className="p-4 border-b border-gray-50 mb-2">
                    <p className="text-xs font-black text-gray-900">{user?.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 truncate">{user?.email}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenChangePassword?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-primary/5 hover:text-primary transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center text-gray-400 group-hover:text-primary">
                      <Lock size={16} />
                    </div>
                    <span>Alterar Senha</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 group-hover:text-red-500">
                      <LogOut size={16} />
                    </div>
                    <span>Sair da Conta</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

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
      <CalendarCheck size={20} />
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
export function AppContainer({ children, activeView, setView, user, onLogout, onOpenChangePassword }: { children: React.ReactNode, activeView: View, setView: (v: View) => void, user: any, onLogout: () => void, onOpenChangePassword?: () => void }) {
  const { unreadCount } = useNotifications(user?.id);
  const [unreadMessages, setUnreadMessages] = React.useState(0);

  React.useEffect(() => {
    if (!user?.id) return;
    const fetchUnread = async () => {
      const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false);
      setUnreadMessages(count || 0);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);
  const viewTitles: Record<View, string> = {
    dashboard: 'Gestão de Escolas',
    schedule: 'Central Operacional Escolar',
    finance: 'Painel Financeiro',
    teachers: 'Corpo Docente',
    students: 'Gestão de Alunos',
    agenda: 'Agenda & Compromissos',
    feedbacks: 'Feedback das Aulas',
    users: 'Usuários & Acessos',
    materials: 'Material de Apoio',
    messages: 'Mensagens',
    notifications: 'Notificações',
    absences: 'Controle de Aulas',
    contracts: 'Contratos',
    teacher_feedbacks: 'Meus Feedbacks',
    contracts: 'Contratos',
    teacher_feedbacks: 'Meus Feedbacks'
  };

  return (
    <div className="min-h-screen bg-background-app flex selection:bg-primary/30 selection:text-primary">
      <Sidebar activeView={activeView} setView={setView} user={user} onLogout={onLogout} onOpenChangePassword={onOpenChangePassword} unreadCount={unreadCount} unreadMessages={unreadMessages} setUnreadMessages={setUnreadMessages} />
      
      <main className="flex-1 md:ml-[280px] min-h-screen relative pb-32 md:pb-12">
        <TopBar title={viewTitles[activeView]} user={user} setView={setView} onLogout={onLogout} onOpenChangePassword={onOpenChangePassword} />
        
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

