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
      toast.success('Contrato assinado salvo!');
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
    const months: Record<string, string> = {
      'janeiro': 'janeiro', 'fevereiro': 'fevereiro', 'março': 'março',
      'abril': 'abril', 'maio': 'maio', 'junho': 'junho',
      'julho': 'julho', 'agosto': 'agosto', 'setembro': 'setembro',
      'outubro': 'outubro', 'novembro': 'novembro', 'dezembro': 'dezembro'
    };

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato - ${contract.student_name}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12pt; margin: 2cm; color: #000; line-height: 1.5; }
    h1 { text-align: center; font-size: 14pt; margin-bottom: 5px; }
    h2 { font-size: 12pt; margin-top: 20px; margin-bottom: 5px; text-transform: uppercase; }
    .header { text-align: right; margin-bottom: 20px; font-size: 10pt; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .signature { display: flex; justify-content: space-between; margin-top: 60px; }
    .signature-line { text-align: center; width: 45%; }
    .signature-line hr { border-top: 1px solid #000; margin-bottom: 5px; }
    ul { margin: 5px 0; padding-left: 20px; }
    li { margin-bottom: 5px; }
    .auth-box { border: 1px solid #000; padding: 5px; display: inline-block; margin: 0 10px; }
    @media print { body { margin: 1.5cm; } }
  </style>
</head>
<body>
  <div class="header">
    <p>Rua Vicente Viana, 293 – Novo Rio das Ostras – Rio das Ostras - RJ</p>
    <p>CNPJ: 55.010.967/0001-46</p>
  </div>

  <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - 2026</h1>

  <h2>Responsável Contratante</h2>
  <p><span class="bold">${contract.responsible_name?.toUpperCase()}</span></p>
  <p>CPF nº ${contract.responsible_cpf || '___________________'}, Carteira de Identidade nº ${contract.responsible_rg || '___________________'}</p>
  <p>Logradouro: ${contract.responsible_address || '___________________'}</p>

  <h2>Contratada</h2>
  <p><span class="bold">DESCOMPLICA EDUCACIONAL LTDA - CNPJ: 55.010.967/0001-46</span></p>
  <p>Com sede no endereço: Rua Vicente Viana, 293 – Novo Rio das Ostras – Rio das Ostras / RJ.</p>

  <p style="margin-top:15px;">As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços Educacionais para o período do ano letivo de 2026, em benefício do(a) aluno(a) <span class="bold">${contract.student_name?.toUpperCase()}</span>, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.</p>

  <h2>Da Documentação</h2>
  <p>Solicita-se que no ato da contratação sejam anexadas ao contrato cópias dos seguintes documentos:</p>
  <ul>
    <li>CPF do responsável;</li>
    <li>RG do responsável;</li>
    <li>Certidão de Nascimento ou RG do(a) aluno(a);</li>
    <li>Comprovante de residência atualizado.</li>
  </ul>

  <h2>Do Preço e Forma de Pagamento</h2>
  <p>O responsável contratante optou pela seguinte modalidade referente aos serviços oferecidos pela CONTRATADA.</p>
  <p>Mensalidade referente a quantidade de atendimentos:</p>
  <ul>
    <li>${contract.sessions_per_week} atendimento(s) por semana com duração de ${contract.session_duration} minutos – R$ ${Number(contract.monthly_value).toFixed(2).replace('.', ',')}.</li>
  </ul>
  <p>O CONTRATANTE deverá usufruir dos serviços prestados da CONTRATADA por ${contract.total_months} meses, divididas em ${contract.total_months} parcelas.</p>
  <ul>
    <li>No ato da matrícula o responsável contratante deve efetuar o pagamento da taxa única de materiais no valor de R$ ${Number(contract.materials_fee).toFixed(2).replace('.', ',')}.</li>
    <li>As mensalidades deverão ser pagas no mês vigente, somando um total de ${contract.total_months} parcelas iguais e consecutivas referente aos meses de ${contract.start_month} à dezembro, vencíveis, respectivamente, no dia ${contract.payment_day} (${contract.payment_day === 7 ? 'sete' : contract.payment_day}) de cada mês do ano letivo de 2026. O pagamento será efetuado via boleto bancário.</li>
    <li>Aulas avulsas são ofertadas para situações esporádicas. Não reservamos horário fixo para atendimentos avulsos.</li>
    <li>Aos responsáveis que optarem pelo pagamento anual terão desconto de 8% no valor total.</li>
    <li>Será concedido um desconto de 5% na mensalidade do 2º(segundo) irmão.</li>
  </ul>

  <h2>Do Dia e Horário de Atendimento</h2>
  <ul>
    <li>Os atendimentos serão realizados ${contract.days_of_week ? 'nas ' + contract.days_of_week : '___________________'}, no horário ${contract.schedule_time || '___________________'}.</li>
    <li>Cada atendimento terá ${contract.session_duration} minutos de duração.</li>
    <li>Os atendimentos que coincidirem com feriados e recessos escolares não serão repostos e não haverá estorno de valores.</li>
    <li>Não será permitida a redução da carga horária do aluno durante a vigência deste contrato.</li>
  </ul>

  <h2>São Obrigações do Contratante</h2>
  <ul>
    <li>Acompanhar o progresso dos estudos do(a) educando(a).</li>
    <li>Efetuar os pagamentos dentro do prazo conforme disposto neste contrato.</li>
    <li>Os atendimentos deverão ser desmarcados com no mínimo de <span class="bold">24 horas</span> de antecedência ou mediante a apresentação de <span class="bold">atestado e declaração médica</span>.</li>
    <li>A reposição dos atendimentos, previamente justificados, serão remarcados de acordo com a disponibilidade de horário na agenda da CONTRATADA.</li>
  </ul>

  <h2>São Obrigações da Contratada</h2>
  <ul>
    <li>Ofertar serviço educacional de qualidade.</li>
    <li>Atender o educando com pontualidade.</li>
    <li>Orientar, monitorar e auxiliar o educando durante os atendimentos.</li>
    <li>Atender o educando nos horários e dias estabelecidos em contrato.</li>
  </ul>

  <h2>Do Trabalho Pedagógico</h2>
  <p>A CONTRATADA busca desenvolver um trabalho de qualidade, sério, personalizado e individualizado com todos os educandos matriculados.</p>

  <h2>Do Direito ao Uso de Imagem</h2>
  <p>
    <span class="auth-box">${contract.image_authorized ? 'X' : '&nbsp;&nbsp;'}</span> AUTORIZO &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <span class="auth-box">${!contract.image_authorized ? 'X' : '&nbsp;&nbsp;'}</span> NÃO AUTORIZO
  </p>
  <p>A CONTRATADA usar a imagem do meu filho(a) <span class="bold">${contract.student_name?.toUpperCase()}</span> em redes sociais e demais mídias digitais.</p>

  <h2>Da Inadimplência, Desistência e Rescisão</h2>
  <ul>
    <li>No caso de desistência, o CONTRATANTE se obriga a pagar multa equivalente a 3 (três) meses de atendimento.</li>
    <li>Em caso de inadimplência por 90 dias ou mais, a CONTRATADA poderá utilizar meios administrativos e judiciais para cobrança.</li>
    <li>Após 30 dias de inadimplência, as aulas serão suspensas até regularização dos débitos.</li>
  </ul>

  <p style="margin-top:30px;">Rio das Ostras, _____ de ${contract.start_month || '_______________'} de 2026.</p>

  <div class="signature">
    <div class="signature-line">
      <hr/>
      <p><span class="bold">RESPONSÁVEL CONTRATANTE</span></p>
      <p>${contract.responsible_name?.toUpperCase()}</p>
    </div>
    <div class="signature-line">
      <hr/>
      <p><span class="bold">CONTRATADA</span></p>
      <p>DESCOMPLICA EDUCACIONAL LTDA</p>
    </div>
  </div>
</body>
</html>`;

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
                      className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all">
                      Ver Assinado
                    </a>
                  )}
                  {contract.status === 'signed' && !contract.signed_file_url && (
                    <button onClick={() => setShowUploadModal(contract)}
                      className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all">
                      Anexar PDF
                    </button>
                  )}
                  {contract.status === 'pending' && (
                    <button onClick={() => markAsSigned(contract.id)}
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

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Anexar Contrato Assinado</h2>
              <button onClick={() => setShowUploadModal(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">X</button>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl mb-4">
              <p className="font-black text-gray-900">{showUploadModal.student_name}</p>
            </div>
            <label className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-purple-300 transition-all block">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
              <span className="text-3xl">{uploadFile ? '📄' : '📎'}</span>
              <p className="text-sm font-bold text-gray-700">{uploadFile ? uploadFile.name : 'Clique para selecionar'}</p>
              <p className="text-xs text-gray-400">PDF, JPG ou PNG</p>
            </label>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowUploadModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={uploadSignedContract} disabled={uploading || !uploadFile}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {uploading ? 'Enviando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}