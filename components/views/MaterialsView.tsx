'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  BookOpen, 
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  FileBox,
  Folder,
  FolderOpen,
  ChevronRight,
  Grid
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface Material {
  id: string;
  title: string;
  subject: string;
  description: string;
  file_url: string;
  uploaded_by: string;
  uploader_name: string;
  created_at: string;
  type: 'Revisão' | 'Exercícios' | 'Teoria';
  level: string;
  grade: string;
  file_size?: number;
}

interface MaterialsViewProps {
  user: {
    role: 'admin' | 'professor';
    name: string;
    id?: string;
    email?: string;
  };
}

export default function MaterialsView({ user }: MaterialsViewProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('Todas');
  const [filterType, setFilterType] = useState('Todos');
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'folders' | 'grid'>('folders');
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newType, setNewType] = useState<'Revisão' | 'Exercícios' | 'Teoria'>('Exercícios');
  const [newLevel, setNewLevel] = useState('');
  const [newGrade, setNewGrade] = useState('1º Ano - Fundamental');
  const [newDescription, setNewDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const fetchMaterials = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase não configurado. Verifique as variáveis de ambiente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[MaterialsView] Iniciando busca de materiais...');
      const { data, error: supabaseError } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (supabaseError) {
        console.error('[MaterialsView] Erro na query do Supabase:', JSON.stringify(supabaseError, null, 2));
        throw new Error(supabaseError.message || 'Erro ao carregar materiais do banco de dados.');
      }
      
      if (!data) {
        console.warn('[MaterialsView] Resposta do banco veio vazia (null)');
        setMaterials([]);
      } else {
        console.log(`[MaterialsView] ${data.length} materiais carregados com sucesso.`);
        setMaterials(data as Material[]);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Ocorreu um erro inesperado ao buscar materiais.';
      console.error('[MaterialsView] Erro fatal no fetch:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const controller = new AbortController();
    
    fetchMaterials();

    return () => {
      controller.abort();
    };
  }, [fetchMaterials]);

  const validateBucket = async () => {
    try {
      const { data, error } = await supabase.storage.getBucket('materials');
      if (error) {
        console.warn('[MaterialsView] Balde "materials" não encontrado ou inacessível:', error.message);
        return false;
      }
      return !!data;
    } catch {
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    // Limite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus({ type: 'error', message: 'Arquivo muito grande. O limite é 10MB.' });
      return;
    }

    if (!validTypes.includes(file.type)) {
      setUploadStatus({ type: 'error', message: 'Formato inválido. Use PDF, Word ou Imagens.' });
      return;
    }

    setSelectedFile(file);
    setUploadStatus(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !isSupabaseConfigured) {
      setUploadStatus({ type: 'error', message: 'Certifique-se de que o arquivo foi selecionado e o banco está configurado.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      console.log('[MaterialsView] Iniciando upload:', selectedFile.name);
      
      // Validar bucket antes de tentar o upload
      let publicUrl = '';
      
      if (true) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `materials/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);
          
        publicUrl = urlData.publicUrl;
      } else {
        console.warn('[MaterialsView] Bucket não configurado. Usando URL temporária para fins de demonstração.');
        publicUrl = '#'; // Fallback se o storage não estiver provisionado
      }

      // 2. Save metadata to DB
      const materialData = {
        title: newTitle.trim(),
        subject: newSubject.trim(),
        type: newType,
        level: newLevel.trim(),
        grade: newGrade,
        description: newDescription.trim(),
        file_url: publicUrl,
        uploader_name: user?.name || 'Sistema',
        uploaded_by: user?.id || null,
        file_size: selectedFile.size
      };

      const { error: dbError } = await supabase.from('materials').insert([materialData]);

      if (dbError) throw dbError;

      console.log('[MaterialsView] Material cadastrado com sucesso.');
      setUploadStatus({ type: 'success', message: 'Material enviado com sucesso!' });
      setShowUploadModal(false);
      resetForm();
      await fetchMaterials();
      
      setTimeout(() => setUploadStatus(null), 5000);

    } catch (err: any) {
      console.error('[MaterialsView] Erro durante o processo de upload:', err);
      setUploadStatus({ 
        type: 'error', 
        message: `Falha no envio: ${err.message || 'Erro desconhecido'}` 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewSubject('');
    setNewType('Exercícios');
    setNewLevel('');
    setNewDescription('');
    setSelectedFile(null);
  };

  const handleDelete = async (id: string, uploadedBy: string) => {
    const isOwner = user.id && uploadedBy === user.id;
    const isAdmin = user.role === 'admin';
    
    if (!isAdmin && !isOwner) {
      setUploadStatus({ type: 'error', message: 'Você só pode excluir seus próprios materiais.' });
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este material?')) return;

    try {
      console.log(`[MaterialsView] Excluindo material ${id}...`);
      const { error: deleteError } = await supabase.from('materials').delete().eq('id', id);
      
      if (deleteError) {
        console.error('[MaterialsView] Erro ao excluir do banco:', deleteError);
        throw new Error(deleteError.message || 'Erro ao remover material.');
      }
      
      console.log('[MaterialsView] Material excluído com sucesso.');
      setUploadStatus({ type: 'success', message: 'Material removido.' });
      await fetchMaterials();
    } catch (err: any) {
      console.error('[MaterialsView] Erro fatal na exclusão:', err);
      setUploadStatus({ type: 'error', message: 'Erro ao excluir: ' + (err.message || 'Erro desconhecido') });
    }
  };

  const handleDownload = async (fileUrl: string, title: string) => {
    if (!fileUrl || fileUrl === '#') {
      setUploadStatus({ type: 'error', message: 'URL do arquivo inválida.' });
      return;
    }
    
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Falha ao baixar arquivo do servidor.');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Get extension from URL
      const extension = fileUrl.split('.').pop()?.split('?')[0] || '';
      const fullFileName = extension && !title.toLowerCase().endsWith(`.${extension.toLowerCase()}`) 
        ? `${title}.${extension}` 
        : title;
      
      a.href = url;
      a.download = fullFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Erro no download:', err);
      // Fallback to simple open if blob fails
      const a = document.createElement('a');
      a.href = fileUrl;
      a.target = '_blank';
      a.download = title;
      a.click();
    }
  };

  const filteredMaterials = (materials || []).filter(m => {
    const matchesSearch = (m.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (m.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (m.uploader_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'Todas' || m.subject === filterSubject;
    const matchesType = filterType === 'Todos' || m.type === filterType;
    return matchesSearch && matchesSubject && matchesType;
  });

  const subjects = ['Todas', ...Array.from(new Set((materials || []).map(m => m.subject).filter(Boolean)))];

  if (!isMounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Material de Apoio</h1>
          <p className="text-gray-500 font-bold mt-1">Biblioteca compartilhada de recursos pedagógicos</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Upload size={20} /> Enviar Material
        </button>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {uploadStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
              uploadStatus.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}
          >
            {uploadStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {uploadStatus.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-gray-900 font-black text-sm uppercase tracking-widest">
              <Filter size={16} /> Filtros
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Matéria</label>
                <select 
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  <option value="Todos">Todos</option>
                  <option value="Revisão">Revisão</option>
                  <option value="Exercícios">Exercícios</option>
                  <option value="Teoria">Teoria</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
            <FileBox className="text-primary mb-6" size={32} />
            <h3 className="text-xl font-black mb-2 tracking-tight">Biblioteca Digital</h3>
            <p className="text-white/60 text-sm font-bold leading-relaxed">
              Base centralizada para compartilhamento de conhecimento entre todos os professores.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar materiais por título ou matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-none rounded-3xl py-6 pl-16 pr-8 text-lg font-bold shadow-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Toggle modo */}
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setViewMode('folders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'folders' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <Folder size={14} /> Pastas
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <Grid size={14} /> Grade
            </button>
          </div>

          {viewMode === 'folders' && !loading && (() => {
            const byGrade: Record<string, Record<string, Material[]>> = {};
            filteredMaterials.forEach(m => {
              const grade = m.grade || m.level || 'Sem Série';
              const subject = m.subject || 'Sem Matéria';
              if (!byGrade[grade]) byGrade[grade] = {};
              if (!byGrade[grade][subject]) byGrade[grade][subject] = [];
              byGrade[grade][subject].push(m);
            });
            if (Object.keys(byGrade).length === 0) return (
              <div className="py-20 text-center">
                <Folder size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">Nenhum material encontrado.</p>
              </div>
            );
            return (
              <div className="space-y-3">
                {Object.entries(byGrade).sort(([a],[b]) => a.localeCompare(b)).map(([grade, subjects]) => (
                  <div key={grade} className="border border-gray-100 rounded-2xl overflow-hidden">
                    <button onClick={() => setExpandedGrade(expandedGrade === grade ? null : grade)}
                      className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-purple-50 transition-all text-left">
                      {expandedGrade === grade ? <FolderOpen size={20} className="text-primary shrink-0" /> : <Folder size={20} className="text-gray-400 shrink-0" />}
                      <span className="font-black text-gray-800 flex-1">{grade}</span>
                      <span className="text-xs text-gray-400 font-bold mr-2">{Object.values(subjects).flat().length} material(is)</span>
                      <ChevronRight size={16} className={`text-gray-400 transition-transform ${expandedGrade === grade ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedGrade === grade && (
                      <div className="p-3 space-y-2 bg-white">
                        {Object.entries(subjects).sort(([a],[b]) => a.localeCompare(b)).map(([subject, mats]) => {
                          const key = grade + '__' + subject;
                          return (
                            <div key={subject} className="border border-gray-100 rounded-xl overflow-hidden">
                              <button onClick={() => setExpandedSubject(expandedSubject === key ? null : key)}
                                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-purple-50 transition-all text-left">
                                {expandedSubject === key ? <FolderOpen size={16} className="text-purple-400 shrink-0" /> : <Folder size={16} className="text-gray-300 shrink-0" />}
                                <span className="font-bold text-gray-700 flex-1 text-sm">{subject}</span>
                                <span className="text-[10px] text-gray-400 font-bold mr-2">{mats.length} arquivo(s)</span>
                                <ChevronRight size={14} className={`text-gray-400 transition-transform ${expandedSubject === key ? 'rotate-90' : ''}`} />
                              </button>
                              {expandedSubject === key && (
                                <div className="divide-y divide-gray-50">
                                  {mats.map(material => (
                                    <div key={material.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-all">
                                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <FileText size={18} className="text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">{material.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] text-gray-400 font-bold">{material.type}</span>
                                          <span className="text-gray-200">•</span>
                                          <span className="text-[10px] text-gray-400">{new Date(material.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => handleDownload(material.file_url, material.title)}
                                          className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-primary transition-colors">
                                          <Download size={11} /> Baixar
                                        </button>
                                        {user.role === 'admin' && (
                                          <button onClick={() => handleDelete(material.id, material.uploaded_by)}
                                            className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                            <Trash2 size={13} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          {viewMode === 'grid' && loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-white rounded-[2rem] animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 p-12 rounded-[2.5rem] text-center">
              <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
              <h3 className="text-xl font-black text-red-900 mb-2">Erro ao carregar materiais</h3>
              <p className="text-red-600 font-bold mb-6">{error}</p>
              <button 
                onClick={() => fetchMaterials()}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all uppercase tracking-widest text-xs"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(filteredMaterials || []).map((material) => (
                <motion.div 
                  key={material.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-4 rounded-2xl ${
                        material.type === 'Revisão' ? 'bg-orange-50 text-orange-600' :
                        material.type === 'Exercícios' ? 'bg-blue-50 text-blue-600' :
                        'bg-purple-50 text-purple-600'
                      }`}>
                        <FileText size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {material.level}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {material.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {material.subject}
                      </span>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {material.type}
                      </span>
                    </div>

                    <p className="text-gray-400 text-xs font-bold line-clamp-2 mb-6 h-8">
                      {material.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                          {material.uploader_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-900">{material.uploader_name}</p>
                          <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                            <Calendar size={10} /> {new Date(material.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleDownload(material.file_url, material.title)}
                          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors"
                        >
                          <Download size={12} /> Baixar
                        </button>
                        {(user.role === 'admin' || material.uploaded_by === (user.id || user.email)) && (
                          <button 
                            onClick={() => handleDelete(material.id, material.uploaded_by)}
                            className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredMaterials.length === 0 && (
                <div className="col-span-full py-20 text-center">
                    <p className="text-gray-400 font-bold text-lg">Nenhum material encontrado com esses filtros.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-2xl w-full bg-white rounded-[2.5rem] p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Enviar Novo Material</h2>
                    <p className="text-xs text-gray-400 font-bold">PDF, Word (Máx 10MB)</p>
                  </div>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título do Material</label>
                    <input 
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-300"
                      placeholder="Ex: Lista de Equações Resolvidas"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Matéria</label>
                    <input 
                      required
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-300"
                      placeholder="Ex: Matemática"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Conteúdo</label>
                    <select 
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                    >
                      <option value="Lista de Exercícios">Lista de Exercícios</option>
                      <option value="Apostila">Apostila</option>
                      <option value="Resumo">Resumo</option>
                      <option value="Template">Template</option>
                      <option value="Jogos">Jogos</option>
                      <option value="Revisão">Revisão</option>
                      <option value="Teoria">Teoria</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano / Série</label>
                    <select
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                    >
                      <optgroup label="Ensino Fundamental">
                        {['1º Ano','2º Ano','3º Ano','4º Ano','5º Ano','6º Ano','7º Ano','8º Ano','9º Ano'].map(g => (
                          <option key={g} value={g + ' - Fundamental'}>{g} - Fundamental</option>
                        ))}
                      </optgroup>
                      <optgroup label="Ensino Médio">
                        {['1º Ano','2º Ano','3º Ano'].map(g => (
                          <option key={g} value={g + ' - Médio'}>{g} - Médio</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição (Opcional)</label>
                  <textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-300 resize-none"
                    placeholder="Descreva brevemente o conteúdo..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Arquivo (PDF ou Word)</label>
                  <label className={`w-full border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                    selectedFile ? 'border-primary/40 bg-primary/5' : 'border-gray-100 hover:border-primary/20 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                    />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedFile ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {selectedFile ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="text-center">
                      <p className="font-black text-gray-900">
                        {selectedFile ? selectedFile.name : 'Clique para selecionar seu arquivo'}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF ou Word de até 10MB'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50 disabled:grayscale"
                  >
                    {isUploading ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Upload size={18} /></motion.div>
                        Enviando Material...
                      </>
                    ) : (
                      <>
                        <BookOpen size={18} />
                        Confirmar Envio do Material
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
