'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, Clock, X, Upload, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { generateTeacherContractHTML } from './teacherContractHelper';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente Assinatura', color: 'bg-yellow-100 text-yellow-700' },
  signed: { label: 'Assinado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function TeacherContractsView() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    teacher_id: '',
    contract_start: '',
    contract_end: '',
    weekly_lessons: 5,
    monthly_value: 650,
    payment_day: 10,
    payment_method: 'PIX',
    notes: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [contractsRes, teachersRes] = await Promise.all([
      supabase.from('teacher_contracts').select('*').order('created_at', { ascending: false }),
      supabase.from('teachers').select('*').order('name'),
    ]);
    setContracts(contractsRes.data || []);
    setTeachers(teachersRes.data || []);
    setLoading(false);
  };

  const deleteContract = async (id: string) => {
    if (!confirm('Excluir este contrato?')) return;
    await supabase.from('teacher_contracts').delete().eq('id', id);
    fetchData();
    toast.success('Contrato excluído!');
  };

  const generateContract = async () => {
    if (!form.teacher_id) { toast.error('Selecione um professor!'); return; }
    setSaving(true);
    try {
      const teacher = teachers.find(t => t.id === form.teacher_id);
      const { data, error } = await supabase.from('teacher_contracts').insert({
        ...form,
        teacher_name: teacher?.name || '',
        teacher_cpf: teacher?.cpf || '',
        teacher_rg: teacher?.rg || '',
        teacher_address: teacher?.address || '',
        status: 'pending',
        created_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      toast.success('Contrato gerado!');
      setShowForm(false);
      fetchData();
      if (data) printContract(data, teacher);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  const printContract = (contract: any, teacherData?: any) => {
    const teacher = teacherData || teachers.find(t => t.id === contract.teacher_id) || {};
    const html = generateTeacherContractHTML(contract, teacher);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const uploadSignedContract = async () => {
    if (!showUploadModal || !uploadFile) return;
    setUploading(true);
    try {
      const ext = uploadFile.name.split('.').pop();
      const path = 'contratos-professores/' + showUploadModal.id + '.' + ext;
      const { error: upErr } = await supabase.storage.from('materials').upload(path, uploadFile, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('materials').getPublicUrl(path);
      const { error: updateErr } = await supabase.from('teacher_contracts').update({ status: 'signed', signed_file_url: data.publicUrl }).eq('id', showUploadModal.id);
      if (updateErr) throw updateErr;
      toast.success('Contrato assinado salvo!');
      setShowUploadModal(null);
      setUploadFile(null);
      fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Contratos de Professores</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie os contratos da equipe pedagógica</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-200">
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: contracts.length, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Pendentes', value: contracts.filter(c => c.status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Assinados', value: contracts.filter(c => c.status === 'signed').length, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-3xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-purple-500" /> Contratos
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Nenhum contrato gerado ainda.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold">
              Gerar primeiro contrato
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {contracts.map(contract => {
              const status = STATUS_CONFIG[contract.status] || STATUS_CONFIG.pending;
              return (
                <div key={contract.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-all flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black shrink-0">
                    {contract.teacher_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{contract.teacher_name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap text-xs text-gray-400">
                      {contract.contract_start && <span>Início: {new Date(contract.contract_start + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      {contract.contract_end && <span>Fim: {new Date(contract.contract_end + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      <span>{contract.weekly_lessons} aulas/sem — R$ {Number(contract.monthly_value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <button onClick={() => deleteContract(contract.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-all">
                      🗑
                    </button>
                    <button onClick={() => printContract(contract)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all">
                      <Eye size={12} /> Visualizar
                    </button>
                    {contract.signed_file_url ? (
                      <a href={contract.signed_file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all">
                        Ver Assinado
                      </a>
                    ) : (
                      <button onClick={() => setShowUploadModal(contract)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all">
                        <Upload size={12} /> Anexar Assinado
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Novo Contrato */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <h2 className="text-xl font-black text-gray-900">Novo Contrato de Professor</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Professor *</label>
                <select value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Selecione...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Início</label>
                  <input type="date" value={form.contract_start} onChange={e => setForm(f => ({ ...f, contract_start: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Fim</label>
                  <input type="date" value={form.contract_end} onChange={e => setForm(f => ({ ...f, contract_end: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Aulas por semana</label>
                  <select value={form.weekly_lessons} onChange={e => setForm(f => ({ ...f, weekly_lessons: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                    <option value={5}>5 aulas/sem — 20/mês</option>
                    <option value={10}>10 aulas/sem — 40/mês</option>
                    <option value={15}>15 aulas/sem — 60/mês</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Valor Mensal (R$)</label>
                  <input type="number" value={form.monthly_value} onChange={e => setForm(f => ({ ...f, monthly_value: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Dia Pagamento</label>
                  <input type="number" value={form.payment_day} onChange={e => setForm(f => ({ ...f, payment_day: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Forma de Pagamento</label>
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                    <option value="PIX">PIX</option>
                    <option value="Transferencia">Transferência</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observações</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Cláusulas adicionais..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={generateContract} disabled={saving || !form.teacher_id}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileText size={16} />}
                {saving ? 'Gerando...' : 'Gerar e Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Assinado */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Anexar Contrato Assinado</h2>
              <button onClick={() => { setShowUploadModal(null); setUploadFile(null); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl mb-4">
              <p className="font-black text-gray-900">{showUploadModal.teacher_name}</p>
              <p className="text-sm text-gray-500">Contrato #{showUploadModal.id?.slice(-8)}</p>
            </div>
            <label className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-purple-300 transition-all block">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
              <span className="text-3xl">{uploadFile ? '📄' : '📎'}</span>
              <p className="text-sm font-bold text-gray-700">{uploadFile ? uploadFile.name : 'Clique para selecionar'}</p>
              <p className="text-xs text-gray-400">PDF, JPG ou PNG</p>
            </label>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowUploadModal(null); setUploadFile(null); }} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={uploadSignedContract} disabled={uploading || !uploadFile}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅'}
                {uploading ? 'Enviando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
