'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface Material {
  id: string;
  title: string;
  type: string;
  subject: string;
  grade: string;
  file_url: string;
  created_at: string;
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  uploaded_by_role?: string;
  uploaded_by_id?: string;
  reviewed_at?: string;
  resubmitted_at?: string;
}

interface MaterialsViewProps {
  userRole: 'admin' | 'teacher';
  userId: string;
}

const TYPES = ['Lista de Exercícios', 'Apostila', 'Resumo', 'Template', 'Jogos', 'Revisão', 'Teoria'];
const GRADES = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', 'Ensino Médio'];
const SUBJECTS = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Física', 'Química', 'Biologia', 'Artes'];

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'Aguardando',  color: '#d97706', bg: '#fef3c7', icon: '⏳' },
  approved: { label: 'Aprovado',    color: '#059669', bg: '#d1fae5', icon: '✅' },
  rejected: { label: 'Reprovado',   color: '#dc2626', bg: '#fee2e2', icon: '❌' },
};

export default function MaterialsView({ userRole, userId }: MaterialsViewProps) {
  const [materials, setMaterials]             = useState<Material[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [activeTab, setActiveTab]             = useState<'biblioteca' | 'meus_envios' | 'pendentes'>('biblioteca');
  const [viewMode, setViewMode]               = useState<'pastas' | 'grade'>('pastas');
  const [selectedGrade, setSelectedGrade]     = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [showUpload, setShowUpload]           = useState(false);
  const [uploadForm, setUploadForm]           = useState({ title: '', type: '', subject: '', grade: '' });
  const [uploadFile, setUploadFile]           = useState<File | null>(null);
  const [uploading, setUploading]             = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [reviewModal, setReviewModal]         = useState<{ material: Material | null; action: 'approve' | 'reject' | null }>({ material: null, action: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewLoading, setReviewLoading]     = useState(false);
  const [resubmitModal, setResubmitModal]     = useState<Material | null>(null);
  const [resubmitFile, setResubmitFile]       = useState<File | null>(null);
  const resubmitFileRef = useRef<HTMLInputElement>(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [previewUrl, setPreviewUrl]           = useState<string | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setMaterials(data as Material[]);
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  const biblioteca = materials.filter(m =>
    m.approval_status === 'approved' &&
    (!searchTerm || m.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!selectedGrade   || m.grade   === selectedGrade) &&
    (!selectedSubject || m.subject === selectedSubject)
  );

  const meusEnvios = materials.filter(m => m.uploaded_by_id === userId);
  const pendentes  = materials.filter(m => m.approval_status === 'pending');

  const handleUpload = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user?.id).single();
    const uploaderName = profile?.name || user?.email || 'Professor';
    if (!uploadFile || !uploadForm.title || !uploadForm.type || !uploadForm.subject || !uploadForm.grade) {
      alert('Preencha todos os campos e selecione um arquivo.');
      return;
    }
    setUploading(true);
    const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = "materials/" + Date.now() + "_" + safeName;
    const { error: storageError } = await supabase.storage.from('materials').upload(path, uploadFile);
    if (storageError) { alert('Erro ao enviar arquivo.'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
    const status: ApprovalStatus = userRole === 'teacher' ? 'pending' : 'approved';
    const { error: dbError } = await supabase.from('materials').insert({
      title: uploadForm.title, type: uploadForm.type, subject: uploadForm.subject,
      grade: uploadForm.grade, file_url: urlData.publicUrl,
      approval_status: status, uploaded_by_role: userRole, uploaded_by_id: userId, uploader_name: uploaderName,
    });
    if (dbError) { alert('Erro INSERT: ' + dbError.message + ' | ' + dbError.details + ' | code: ' + dbError.code); }
    else {
      alert(userRole === 'teacher' ? '✅ Enviado! Aguardando aprovação.' : '✅ Material publicado!');
      setShowUpload(false);
      setUploadForm({ title: '', type: '', subject: '', grade: '' });
      setUploadFile(null);
      fetchMaterials();
    }
    setUploading(false);
  };

  const handleReview = async () => {
    if (!reviewModal.material) return;
    if (reviewModal.action === 'reject' && !rejectionReason.trim()) {
      alert('Informe o motivo da reprovação.');
      return;
    }
    setReviewLoading(true);
    const { error } = await supabase.from('materials').update({
      approval_status:  reviewModal.action === 'approve' ? 'approved' : 'rejected',
      reviewed_by_id:   userId,
      reviewed_at:      new Date().toISOString(),
      rejection_reason: reviewModal.action === 'reject' ? rejectionReason : null,
    }).eq('id', reviewModal.material.id);
    if (error) { alert('Erro ao revisar.'); }
    else {
      await supabase.from('notifications').insert({
        user_id: reviewModal.material.uploaded_by_id,
        title:   reviewModal.action === 'approve'
          ? '✅ Material "' + reviewModal.material.title + '" aprovado!'
          : '❌ Material "' + reviewModal.material.title + '" reprovado',
        message: reviewModal.action === 'approve'
          ? 'Seu material foi aprovado e já está na biblioteca.'
          : 'Motivo: ' + rejectionReason,
        type: reviewModal.action === 'approve' ? 'success' : 'warning',
      });
      setReviewModal({ material: null, action: null });
      setRejectionReason('');
      fetchMaterials();
    }
    setReviewLoading(false);
  };

  const handleResubmit = async () => {
    if (!resubmitModal || !resubmitFile) { alert('Selecione o arquivo corrigido.'); return; }
    setResubmitLoading(true);
    const safeName2 = resubmitFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = "materials/" + Date.now() + "_" + safeName2;
    const { error: storageError } = await supabase.storage.from('materials').upload(path, resubmitFile);
    if (storageError) { alert('Erro ao enviar arquivo.'); setResubmitLoading(false); return; }
    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
    const { error } = await supabase.from('materials').update({
      file_url: urlData.publicUrl, approval_status: 'pending',
      rejection_reason: null, resubmitted_at: new Date().toISOString(),
    }).eq('id', resubmitModal.id);
    if (error) { alert('Erro ao reenviar.'); }
    else {
      await supabase.from('notifications').insert({
        title:   '📤 Material reenviado: "' + resubmitModal.title + '"',
        message: 'Professor corrigiu o material e aguarda sua aprovação.',
        type:    'info',
      });
      alert('✅ Reenviado! Aguardando aprovação.');
      setResubmitModal(null);
      setResubmitFile(null);
      fetchMaterials();
    }
    setResubmitLoading(false);
  };

  const gradeGroups    = Array.from(new Set(biblioteca.map(m => m.grade))).sort();
  const subjectsForGrade = selectedGrade
    ? Array.from(new Set(biblioteca.filter(m => m.grade === selectedGrade).map(m => m.subject))).sort()
    : [];
  const materialsForView = selectedGrade && selectedSubject
    ? biblioteca.filter(m => m.grade === selectedGrade && m.subject === selectedSubject)
    : biblioteca;

  const isImage = (url: string) => /\.(jpg|jpeg|png|webp)$/i.test(url);
  const isPDF   = (url: string) => /\.pdf$/i.test(url);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e1b4b' }}>📚 Material de Apoio</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            {userRole === 'teacher' ? 'Envie materiais para aprovação do admin' : 'Gerencie e aprove materiais da equipe'}
          </p>
        </div>
        <button onClick={() => setShowUpload(true)} style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
          + Enviar Material
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'biblioteca',  label: '📖 Biblioteca', show: true },
          { key: 'meus_envios', label: '📤 Meus Envios' + (meusEnvios.length > 0 ? ' (' + meusEnvios.length + ')' : ''), show: true },
          { key: 'pendentes',   label: '⏳ Pendentes',  show: userRole === 'admin' },
        ].filter(t => t.show).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: activeTab === tab.key ? '#fff' : 'transparent', color: activeTab === tab.key ? '#7c3aed' : '#6b7280', boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {tab.label}
            {tab.key === 'pendentes' && pendentes.length > 0 && (
              <span style={{ marginLeft: '6px', background: '#ef4444', color: '#fff', borderRadius: '9999px', padding: '1px 7px', fontSize: '11px' }}>{pendentes.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'biblioteca' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="🔍 Buscar material..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '9px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' }} />
            <button onClick={() => setViewMode(v => v === 'pastas' ? 'grade' : 'pastas')} style={{ padding: '9px 16px', borderRadius: '9px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#374151' }}>
              {viewMode === 'pastas' ? '⊞ Grade' : '📁 Pastas'}
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Carregando...</div>
          ) : viewMode === 'pastas' ? (
            <div>
              {!selectedGrade ? (
                <div>
                  <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>Selecione uma série:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                    {gradeGroups.length === 0
                      ? <p style={{ color: '#9ca3af' }}>Nenhum material aprovado ainda.</p>
                      : gradeGroups.map(grade => (
                          <div key={grade} onClick={() => setSelectedGrade(grade)} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '20px 16px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e1b4b' }}>{grade}</div>
                            <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>{biblioteca.filter(m => m.grade === grade).length} material(is)</div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              ) : !selectedSubject ? (
                <div>
                  <button onClick={() => setSelectedGrade(null)} style={{ color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, marginBottom: '12px', fontSize: '14px' }}>← Voltar</button>
                  <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>Matérias em <strong>{selectedGrade}</strong>:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                    {subjectsForGrade.map(subject => (
                      <div key={subject} onClick={() => setSelectedSubject(subject)} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '20px 16px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e1b4b' }}>{subject}</div>
                        <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>{biblioteca.filter(m => m.grade === selectedGrade && m.subject === subject).length} material(is)</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button onClick={() => setSelectedSubject(null)} style={{ color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>← {selectedGrade}</button>
                    <span style={{ color: '#9ca3af' }}>/</span>
                    <span style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>{selectedSubject}</span>
                  </div>
                  <MaterialGrid materials={materialsForView} userRole={userRole} onPreview={setPreviewUrl} onDelete={userRole === 'admin' ? async (id) => { if (!confirm('Excluir?')) return; await supabase.from('materials').delete().eq('id', id); fetchMaterials(); } : undefined} />
                </div>
              )}
            </div>
          ) : (
            <MaterialGrid materials={biblioteca} userRole={userRole} onPreview={setPreviewUrl} onDelete={userRole === 'admin' ? async (id) => { if (!confirm('Excluir?')) return; await supabase.from('materials').delete().eq('id', id); fetchMaterials(); } : undefined} />
          )}
        </div>
      )}

      {activeTab === 'meus_envios' && (
        <div>
          {meusEnvios.length === 0 ? <EmptyState message="Você ainda não enviou nenhum material." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {meusEnvios.map(m => {
                const cfg = STATUS_CONFIG[m.approval_status];
                return (
                  <div key={m.id} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '18px' }}>{getTypeIcon(m.type)}</span>
                          <span style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '15px' }}>{m.title}</span>
                          <span style={{ background: cfg.bg, color: cfg.color, borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 }}>{cfg.icon} {cfg.label}</span>
                        </div>
                        <div style={{ marginTop: '6px', color: '#6b7280', fontSize: '13px' }}>{m.grade} · {m.subject} · {m.type}</div>
                        <div style={{ marginTop: '4px', color: '#9ca3af', fontSize: '12px' }}>Enviado em {new Date(m.created_at).toLocaleDateString('pt-BR')}{m.resubmitted_at && ' · Reenviado em ' + new Date(m.resubmitted_at).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setPreviewUrl(m.file_url)} style={btnOutline}>👁 Ver</button>
                        {m.approval_status === 'rejected' && <button onClick={() => setResubmitModal(m)} style={{ ...btnPrimary, background: '#dc2626' }}>🔁 Corrigir e Reenviar</button>}
                      </div>
                    </div>
                    {m.approval_status === 'rejected' && m.rejection_reason && (
                      <div style={{ marginTop: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#dc2626', fontSize: '13px', marginBottom: '4px' }}>❌ Motivo da reprovação:</div>
                        <div style={{ color: '#7f1d1d', fontSize: '14px', lineHeight: 1.5 }}>{m.rejection_reason}</div>
                      </div>
                    )}
                    {m.approval_status === 'pending' && (
                      <div style={{ marginTop: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px' }}>
                        <div style={{ color: '#92400e', fontSize: '13px' }}>⏳ Aguardando avaliação do administrador. Você receberá uma notificação.</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pendentes' && userRole === 'admin' && (
        <div>
          {pendentes.length === 0 ? <EmptyState message="Nenhum material aguardando aprovação. 🎉" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 4px' }}>{pendentes.length} material(is) aguardando sua avaliação</p>
              {pendentes.map(m => (
                <div key={m.id} style={{ background: '#fff', border: '1.5px solid #fde68a', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '18px' }}>{getTypeIcon(m.type)}</span>
                        <span style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '15px' }}>{m.title}</span>
                        <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 }}>⏳ Aguardando</span>
                        {m.resubmitted_at && <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 }}>🔁 Reenviado</span>}
                      </div>
                      <div style={{ marginTop: '6px', color: '#6b7280', fontSize: '13px' }}>{m.grade} · {m.subject} · {m.type}</div>
                      <div style={{ marginTop: '4px', color: '#9ca3af', fontSize: '12px' }}>Enviado em {new Date(m.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => setPreviewUrl(m.file_url)} style={btnOutline}>👁 Visualizar</button>
                      <button onClick={() => setReviewModal({ material: m, action: 'approve' })} style={{ ...btnPrimary, background: '#059669' }}>✅ Aprovar</button>
                      <button onClick={() => setReviewModal({ material: m, action: 'reject' })} style={{ ...btnPrimary, background: '#dc2626' }}>❌ Reprovar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showUpload && (
        <Modal title="📤 Enviar Material" onClose={() => setShowUpload(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Título *</label>
              <input placeholder="Ex: Lista de Exercícios — Frações" value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Série *</label>
                <select value={uploadForm.grade} onChange={e => setUploadForm(f => ({ ...f, grade: e.target.value }))} style={inputStyle}>
                  <option value="">Selecione...</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Matéria *</label>
                <select value={uploadForm.subject} onChange={e => setUploadForm(f => ({ ...f, subject: e.target.value }))} style={inputStyle}>
                  <option value="">Selecione...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                <option value="">Selecione...</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Arquivo * (PDF, Word, Imagem — máx 10MB)</label>
              <input type="file" ref={fileRef} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={e => setUploadFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
              <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', color: '#6b7280', fontSize: '14px' }}>
                {uploadFile ? '📎 ' + uploadFile.name : '📁 Clique para selecionar o arquivo'}
              </div>
            </div>
            {userRole === 'teacher' && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#92400e' }}>
                ⚠️ Seu material será enviado para aprovação do administrador antes de aparecer na biblioteca.
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowUpload(false)} style={btnOutline}>Cancelar</button>
              <button onClick={handleUpload} disabled={uploading} style={btnPrimary}>{uploading ? 'Enviando...' : userRole === 'teacher' ? '📤 Enviar para Aprovação' : '✅ Publicar'}</button>
            </div>
          </div>
        </Modal>
      )}

      {reviewModal.material && (
        <Modal title={reviewModal.action === 'approve' ? '✅ Aprovar Material' : '❌ Reprovar Material'} onClose={() => { setReviewModal({ material: null, action: null }); setRejectionReason(''); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '15px' }}>{reviewModal.material.title}</div>
              <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>{reviewModal.material.grade} · {reviewModal.material.subject} · {reviewModal.material.type}</div>
            </div>
            {reviewModal.action === 'approve' ? (
              <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '14px 16px', color: '#065f46', fontSize: '14px' }}>
                ✅ Ao aprovar, o material ficará visível na biblioteca imediatamente.
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Motivo da reprovação * <span style={{ color: '#9ca3af', fontWeight: 400 }}>(será enviado ao professor)</span></label>
                <textarea placeholder="Descreva o que precisa ser corrigido..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setReviewModal({ material: null, action: null }); setRejectionReason(''); }} style={btnOutline}>Cancelar</button>
              <button onClick={handleReview} disabled={reviewLoading} style={{ ...btnPrimary, background: reviewModal.action === 'approve' ? '#059669' : '#dc2626' }}>
                {reviewLoading ? 'Salvando...' : reviewModal.action === 'approve' ? '✅ Confirmar Aprovação' : '❌ Confirmar Reprovação'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {resubmitModal && (
        <Modal title="🔁 Corrigir e Reenviar Material" onClose={() => { setResubmitModal(null); setResubmitFile(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 600, color: '#dc2626', fontSize: '13px', marginBottom: '6px' }}>❌ Motivo da reprovação:</div>
              <div style={{ color: '#7f1d1d', fontSize: '14px', lineHeight: 1.5 }}>{resubmitModal.rejection_reason}</div>
            </div>
            <div>
              <label style={labelStyle}>Arquivo Corrigido *</label>
              <input type="file" ref={resubmitFileRef} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={e => setResubmitFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
              <div onClick={() => resubmitFileRef.current?.click()} style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', color: '#6b7280', fontSize: '14px' }}>
                {resubmitFile ? '📎 ' + resubmitFile.name : '📁 Clique para selecionar o arquivo corrigido'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setResubmitModal(null); setResubmitFile(null); }} style={btnOutline}>Cancelar</button>
              <button onClick={handleResubmit} disabled={resubmitLoading} style={btnPrimary}>{resubmitLoading ? 'Enviando...' : '🔁 Reenviar para Aprovação'}</button>
            </div>
          </div>
        </Modal>
      )}

      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', maxWidth: '900px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontWeight: 600, color: '#1e1b4b' }}>Visualizar Material</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnOutline, textDecoration: 'none', display: 'inline-block' }}>↗ Abrir</a>
                <button onClick={() => setPreviewUrl(null)} style={btnOutline}>✕ Fechar</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {isImage(previewUrl) ? <img src={previewUrl} alt="Preview" style={{ width: '100%', objectFit: 'contain' }} />
                : isPDF(previewUrl) ? <iframe src={previewUrl} style={{ width: '100%', height: '70vh', border: 'none' }} title="PDF" />
                : <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                    <p>Prévia não disponível.</p>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', fontWeight: 600 }}>Clique aqui para baixar</a>
                  </div>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialGrid({ materials, userRole, onPreview, onDelete }: { materials: Material[]; userRole: 'admin' | 'teacher'; onPreview: (url: string) => void; onDelete?: (id: string) => void; }) {
  if (materials.length === 0) return <EmptyState message="Nenhum material encontrado." />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
      {materials.map(m => (
        <div key={m.id} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>{getTypeIcon(m.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e1b4b', lineHeight: 1.3 }}>{m.title}</div>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>{m.type}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ background: '#4f46e518', color: '#4f46e5', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{m.grade}</span>
            <span style={{ background: '#0891b218', color: '#0891b2', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{m.subject}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button onClick={() => onPreview(m.file_url)} style={{ ...btnOutline, flex: 1, fontSize: '12px', padding: '7px 8px' }}>👁 Ver</button>
            {userRole === 'admin' && onDelete && <button onClick={() => onDelete(m.id)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>🗑</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
      <p style={{ fontSize: '15px', margin: 0 }}>{message}</p>
    </div>
  );
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = { 'Lista de Exercícios': '📝', 'Apostila': '📖', 'Resumo': '📋', 'Template': '📐', 'Jogos': '🎮', 'Revisão': '🔍', 'Teoria': '💡' };
  return icons[type] || '📄';
}

const btnPrimary: React.CSSProperties = { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };
const btnOutline: React.CSSProperties = { background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '9px', padding: '9px 14px', fontWeight: 500, cursor: 'pointer', fontSize: '13px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '9px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#f9fafb' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' };
