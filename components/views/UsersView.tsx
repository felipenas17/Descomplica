'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  Trash2, 
  Search,
  Key,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { motion } from 'motion/react';

export default function UsersView() {
  const [activeTab, setActiveTab] = useState<'staff' | 'students'>('staff');
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Staff Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'professor'>('admin');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      if (activeTab === 'staff') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setUsers(data || []);
      } else {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setStudents(data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
  };

  const handleOpenForm = () => {
    if (activeTab === 'staff') {
      setNewName('');
      setNewEmail('');
      setNewRole('admin');
      generatePassword();
      setShowForm(true);
    } else {
      setStudentName('');
      setStudentEmail('');
      setStudentPhone('');
      setShowStudentForm(true);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').insert([{
        full_name: newName,
        email: newEmail,
        role: newRole,
        needs_password_change: true
      }]);

      if (error) throw error;

      // Send email via API
      try {
        await fetch('/api/send-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            email: newEmail,
            role: newRole,
            password: generatedPassword
          })
        });
      } catch (err) {
        console.error('Failed to send email:', err);
        // We don't fail the whole operation if email fails, but we might want to warn
      }

      setLastCreated({
        name: newName,
        email: newEmail,
        role: newRole,
        password: generatedPassword
      });
      
      setShowForm(false);
      setShowSuccess(true);
      fetchData();
    } catch (err: any) {
      alert('Erro ao cadastrar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('students').insert([{
        name: studentName,
        email: studentEmail,
        phone: studentPhone,
        status: 'ativo'
      }]);

      if (error) throw error;

      alert('Aluno matriculado com sucesso!');
      setShowStudentForm(false);
      fetchData();
    } catch (err: any) {
      alert('Erro ao matricular: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const table = activeTab === 'staff' ? 'profiles' : 'students';
    const label = activeTab === 'staff' ? 'usuário' : 'aluno';
    
    if (window.confirm(`Tem certeza que deseja excluir este ${label}?`)) {
      try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        alert(`${label.charAt(0).toUpperCase() + label.slice(1)} excluído com sucesso!`);
        fetchData();
      } catch (err: any) {
        alert(`Erro ao excluir: ${err.message}`);
      }
    }
  };

  const filteredItems = activeTab === 'staff' 
    ? users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    : students.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Centro de Usuários</h1>
          <p className="text-gray-500 font-bold mt-1">Gerencie acessos de staff e matrículas de alunos.</p>
        </div>
        <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
          <button 
            onClick={() => setActiveTab('staff')}
            className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'staff' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Staff / Acessos
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'students' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Alunos / Matrículas
          </button>
        </div>
        <button 
          onClick={handleOpenForm}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all"
        >
          <UserPlus size={20} /> {activeTab === 'staff' ? 'Adicionar Staff' : 'Matricular Aluno'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder={`Buscar em ${activeTab === 'staff' ? 'staff' : 'alunos'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-none rounded-3xl py-6 pl-16 pr-8 text-lg font-bold shadow-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Nome / E-mail</th>
                  <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest font-mono">{activeTab === 'staff' ? 'Cargo' : 'Telefone'}</th>
                  <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Status</th>
                  <th className="px-8 py-6 text-right text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-8 py-8"><div className="h-12 bg-gray-100 rounded-2xl" /></td>
                    </tr>
                  ))
                ) : filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                          activeTab === 'staff' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                        }`}>
                          {(item.full_name || item.name)?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 group-hover:text-primary transition-colors">{item.full_name || item.name}</p>
                          <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                            <Mail size={12} /> {item.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {activeTab === 'staff' ? (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.role === 'admin' ? 'bg-secondary/20 text-gray-900' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {item.role}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-600">{item.phone || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-green-600">
                        <ShieldCheck size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Ativo</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && !loading && (
              <div className="p-20 text-center text-gray-400 font-bold">
                Nenhum registro encontrado.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
            <Users className="text-secondary mb-6" size={32} />
            <h3 className="text-xl font-black mb-2 tracking-tight">Gestão Central</h3>
            <p className="text-white/60 text-sm font-bold leading-relaxed">
              Use esta área para centralizar todos os cadastros. Deixe o Dashboard apenas para análise de números e lucros.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 text-primary mb-4 font-black text-xs uppercase tracking-widest">
              <AlertCircle size={16} /> Dica de Fluxo
            </div>
            <p className="text-gray-500 text-sm font-bold leading-relaxed">
              Matricule novos alunos e gere acessos para professores em um só lugar. Rapidez e segurança na palma da mão.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Staff */}
      {showForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">Novo Staff</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <Trash2 size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cargo / Função</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`flex-1 py-3 rounded-xl border-2 font-black text-xs transition-all ${
                      newRole === 'admin' ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    Administrador
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewRole('professor')}
                    className={`flex-1 py-3 rounded-xl border-2 font-black text-xs transition-all ${
                      newRole === 'professor' ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    Professor
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                <input 
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="exemplo@escola.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Senha Gerada</label>
                <div className="relative">
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
                  <div className="w-full bg-secondary/10 border-2 border-secondary/20 rounded-2xl py-4 pl-12 pr-12 text-sm font-mono font-bold text-gray-900 overflow-hidden truncate">
                    {generatedPassword}
                  </div>
                  <button 
                    type="button"
                    onClick={handleCopyPassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? 'Salvando...' : `Criar Acesso Staff`}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Adicionar Aluno */}
      {showStudentForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">Matricular Aluno</h2>
              <button onClick={() => setShowStudentForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <Trash2 size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Nome do aluno"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                <input 
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="aluno@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                <input 
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? 'Matriculando...' : 'Confirmar Matrícula'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Sucesso Cadastro Staff */}
      {showSuccess && lastCreated && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
            
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Check size={48} strokeWidth={3} />
            </div>

            <h2 className="text-3xl font-black text-gray-900 mb-2 mt-4 tracking-tight">Acesso Criado!</h2>
            <p className="text-gray-500 font-bold mb-10 leading-relaxed italic">
              As credenciais foram enviadas para o e-mail: <br/> 
              <span className="text-primary not-italic font-black">{lastCreated.email}</span>
            </p>

            <div className="bg-gray-50 rounded-[2rem] p-8 mb-10 text-left space-y-4 border border-gray-100">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nome do Staff</p>
                <p className="font-black text-gray-800">{lastCreated.name}</p>
              </div>
              <div className="pt-4 border-t border-gray-200/50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Senha Gerada</p>
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                  <code className="font-mono font-bold text-secondary">{lastCreated.password}</code>
                  <button onClick={handleCopyPassword} className="text-primary hover:scale-110 transition-transform">
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black shadow-2xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all text-lg"
            >
              Concluir & Voltar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
