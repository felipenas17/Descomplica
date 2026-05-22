'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Upload, CheckCircle, Clock, XCircle, Eye, X, User, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:  { label: 'Pendente Assinatura', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  signed:   { label: 'Assinado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled:{ label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};


function generateContractHTML(contract: any): string {
  return [
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">',
    '<title>Contrato - ' + (contract.student_name || '') + '</title>',
    '<style>body{font-family:Arial,sans-serif;font-size:12pt;margin:2cm;color:#000;line-height:1.5}',
    'h1{text-align:center;font-size:14pt}h2{font-size:12pt;margin-top:20px;text-transform:uppercase}',
    '.bold{font-weight:bold}.signature{display:flex;justify-content:space-between;margin-top:60px}',
    '.signature-line{text-align:center;width:45%}.signature-line hr{border-top:1px solid #000}',
    'ul{margin:5px 0;padding-left:20px}li{margin-bottom:5px}',
    '.auth-box{border:1px solid #000;padding:5px;display:inline-block;margin:0 10px}',
    '@media print{body{margin:1.5cm}}</style></head><body>',
    '<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h1>',
    '<p><strong>CONTRATANTE:</strong> ' + (contract.responsible_name || '') + '</p>',
    '<p>CPF: ' + (contract.responsible_cpf || '___') + ' RG: ' + (contract.responsible_rg || '___') + '</p>',
    '<p>Endereço: ' + (contract.responsible_address || '___') + '</p>',
    '<p><strong>CONTRATADA:</strong> DESCOMPLICA EDUCACIONAL LTDA - CNPJ: 55.010.967/0001-46</p>',
    '<h2>Do Objeto do Contrato</h2>',
    '<p>Prestação de serviços educacionais ao(à) aluno(a): <strong>' + (contract.student_name || '') + '</strong></p>',
    '<h2>Do Valor e Forma de Pagamento</h2>',
    '<ul>',
    '<li>' + (contract.sessions_per_week || '') + ' atendimento(s)/semana - R$ ' + Number(contract.monthly_value || 0).toFixed(2).replace(".", ",") + '/mês</li>',
    '<li>Total: ' + (contract.total_months || '') + ' parcelas - vencimento dia ' + (contract.payment_day || '') + '</li>',
    '<li>Taxa de materiais: R$ ' + Number(contract.materials_fee || 0).toFixed(2).replace(".", ",") + '</li>',
    '</ul>',
    '<h2>Dos Atendimentos</h2>',
    '<p>Dias: ' + (contract.days_of_week || '___') + ' - Horário: ' + (contract.schedule_time || '___') + '</p>',
    '<h2>Do Direito ao Uso de Imagem</h2>',
    '<p>' + (contract.image_authorized ? '[X] AUTORIZO' : '[X] NÃO AUTORIZO') + ' o uso de imagem de ' + (contract.student_name || '') + ' em redes sociais.</p>',
    '<h2>Das Obrigações</h2>',
    '<ul>',
    '<li>Acompanhar o progresso do educando e efetuar pagamentos em dia.</li>',
    '<li>Desmarcar com 24h de antecedência ou apresentar atestado médico.</li>',
    '</ul>',
    '<p style="margin-top:30px;">Rio das Ostras, _____ de ' + (contract.start_month || '___') + ' de 2026.</p>',
    '<div class="signature">',
    '<div class="signature-line"><hr/><p><strong>CONTRATANTE</strong></p><p>' + (contract.responsible_name || '') + '</p></div>',
    '<div class="signature-line"><hr/><p><strong>CONTRATADA</strong></p><p>DESCOMPLICA EDUCACIONAL LTDA</p></div>',
    '</div></body></html>'
  ].join('');
}

export default function ContractsView() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    student_name: '',
    responsible_name: '',
    responsible_cpf: '',
    responsible_rg: '',
    responsible_address: '',
    sessions_per_week: 1,
    session_duration: 60,
    monthly_value: 240,
    materials_fee: 200,
    payment_day: 7,
    start_month: 'maio',
    total_months: 8,
    days_of_week: '',
    schedule_time: '',
    image_authorized: false,
  });

  useEffect(() => {
    fetchContracts();
    fetchStudents();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    const { data } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
    setContracts(data || []);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('id, name, parent_name, parent_phone, address, days_of_week, preferred_time').order('name');
    setStudents(data || []);
  };

  const selectStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setForm(f => ({
        ...f,
        student_id: student.id,
        student_name: student.name,
        responsible_name: student.parent_name || '',
        responsible_address: student.address || '',
        days_of_week: student.days_of_week || '',
        schedule_time: student.preferred_time || '',
      }));
    }
  };

  const generateContract = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.from('contracts').insert({
        ...form,
        status: 'pending',
        created_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      toast.success('Contrato gerado! ✅');
      setShowForm(false);
      fetchContracts();
      // Abre o contrato para visualizar/imprimir
      setSelectedContract(data);
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally { setSaving(false); }
  };

  const uploadSignedContract = async () => {
    if (!showUploadModal || !uploadFile) return;
    setUploading(true);
    try {
      const ext = uploadFile.name.split('.').pop();
      const path = 'contratos/' + showUploadModal.id + '.' + ext;
      const { error: upErr } = await supabase.storage.from('materials').upload(path, uploadFile, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('materials').getPublicUrl(path);
      await supabase.from('contracts').update({ status: 'signed', signed_file_url: data.publicUrl }).eq('id', showUploadModal.id);
      toast.success('Contrato assinado salvo! ✅');
      setShowUploadModal(null);
      setUploadFile(null);
      fetchContracts();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setUploading(false); }
  };

  const markAsSigned = async (id: string) => {
    await supabase.from('contracts').update({ status: 'signed' }).eq('id', id);
    fetchContracts();
    toast.success('Contrato marcado como assinado! ✅');
  };

  const printContract = (contract: any) => {
    const html = generateContractHTML(contract);

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: contracts.length, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Pendentes', value: contracts.filter(c => c.status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Assinados', value: contracts.filter(c => c.status === 'signed').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Cancelados', value: contracts.filter(c => c.status === 'cancelled').length, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-3xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-purple-500" /> Contratos
          </h2>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
            <Plus size={16} /> Novo Contrato
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">Nenhum contrato gerado ainda.</p>
              <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all">
                Gerar primeiro contrato
              </button>
            </div>
          ) : contracts.map(contract => {
            const status = STATUS_CONFIG[contract.status] || STATUS_CONFIG.pending;
            return (
              <div key={contract.id} className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-all flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 font-black text-lg shrink-0">
                    {contract.student_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{contract.student_name}</p>
                    <p className="text-xs text-gray-400">{contract.responsible_name} • R$ {Number(contract.monthly_value).toFixed(2).replace('.', ',')}/mês</p>
                    <p className="text-xs text-gray-400">{contract.days_of_week} • {contract.schedule_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
                  <button onClick={() => printContract(contract)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all">
                    <Download size={12} /> Imprimir
                  </button>
                  {contract.signed_file_url && (
                    <a href={contract.signed_file_url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                      📄 Ver Contrato
                    </a>
                  )}
                  {contract.status === 'signed' && !contract.signed_file_url && (
                    <button onClick={() => setShowUploadModal(contract)}
                      className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all">
                      📎 Anexar Assinado
                    </button>
                  )}
                  {contract.status === 'pending' && (
                    <button onClick={() => setShowUploadModal(contract)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all">
                      <CheckCircle size={12} /> Marcar Assinado
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Novo Contrato */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <h2 className="text-xl font-black text-gray-900">Novo Contrato</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Aluno */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Aluno</label>
                <select value={form.student_id} onChange={e => selectStudent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Selecione o aluno...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Responsável */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Nome do Responsável', field: 'responsible_name' },
                  { label: 'CPF do Responsável', field: 'responsible_cpf' },
                  { label: 'RG do Responsável', field: 'responsible_rg' },
                  { label: 'Endereço', field: 'responsible_address' },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
                    <input type="text" value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </div>
                ))}
              </div>

              {/* Financeiro */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Valor Mensal (R$)', field: 'monthly_value', type: 'number' },
                  { label: 'Taxa de Material (R$)', field: 'materials_fee', type: 'number' },
                  { label: 'Dia de Vencimento', field: 'payment_day', type: 'number' },
                  { label: 'Total de Meses', field: 'total_months', type: 'number' },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
                    <input type={type} value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </div>
                ))}
              </div>

              {/* Aulas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Aulas por Semana</label>
                  <input type="number" value={form.sessions_per_week} onChange={e => setForm(f => ({ ...f, sessions_per_week: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Dias da Semana</label>
                  <input type="text" value={form.days_of_week} onChange={e => setForm(f => ({ ...f, days_of_week: e.target.value }))}
                    placeholder="Ex: Seg, Qua, Sex"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Horário</label>
                  <input type="text" value={form.schedule_time} onChange={e => setForm(f => ({ ...f, schedule_time: e.target.value }))}
                    placeholder="Ex: 14h às 15h"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>

              {/* Mês início */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Mês de Início</label>
                  <select value={form.start_month} onChange={e => setForm(f => ({ ...f, start_month: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300">
                    {['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'].map(m => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <input type="checkbox" id="imageAuth" checked={form.image_authorized} onChange={e => setForm(f => ({ ...f, image_authorized: e.target.checked }))}
                    className="w-5 h-5 accent-purple-600" />
                  <label htmlFor="imageAuth" className="text-sm font-bold text-gray-700">Autoriza uso de imagem</label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={generateContract} disabled={saving || !form.student_id}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileText size={16} />}
                {saving ? 'Gerando...' : 'Gerar Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Contrato Assinado */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Anexar Contrato Assinado</h2>
              <button onClick={() => { setShowUploadModal(null); setUploadFile(null); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">✕</button>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl mb-4">
              <p className="font-black text-gray-900">{showUploadModal.student_name}</p>
              <p className="text-sm text-gray-500">Contrato #{showUploadModal.id?.slice(-8)}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Arquivo do Contrato Assinado</label>
              <label className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all ${uploadFile ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="hidden" />
                <span className="text-3xl">{uploadFile ? '📄' : '📎'}</span>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">{uploadFile ? uploadFile.name : 'Clique para selecionar'}</p>
                  <p className="text-xs text-gray-400">{uploadFile ? (uploadFile.size / 1024).toFixed(0) + ' KB' : 'PDF, JPG ou PNG'}</p>
                </div>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowUploadModal(null); setUploadFile(null); }} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={uploadSignedContract} disabled={uploading || !uploadFile}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅'}
                {uploading ? 'Enviando...' : 'Salvar Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}
  );
}