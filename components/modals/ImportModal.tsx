'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Database,
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'validation' | 'executing' | 'result';

interface ColumnMapping {
  [key: string]: string; // system field -> spreadsheet column
}

const SYSTEM_FIELDS = {
  finances: [
    { key: 'description', label: 'Descrição/Nome', required: true },
    { key: 'type', label: 'Tipo (Receita/Despesa)', required: true },
    { key: 'value', label: 'Valor (Numérico)', required: true },
    { key: 'category', label: 'Categoria', required: true },
    { key: 'due_date', label: 'Data de Vencimento', required: true },
    { key: 'payment_method', label: 'Forma de Pagamento', required: false },
    { key: 'status', label: 'Status (Pago/Pendente)', required: false },
  ],
  students: [
    { key: 'name', label: 'Nome Completo', required: true },
    { key: 'email', label: 'E-mail', required: false },
    { key: 'phone', label: 'Telefone/WhatsApp', required: false },
  ],
  schedules: [
    { key: 'subject', label: 'Matéria/Assunto', required: true },
    { key: 'student_name', label: 'Nome do Aluno', required: true },
    { key: 'teacher_name', label: 'Nome do Professor', required: true },
    { key: 'date', label: 'Data da Aula', required: true },
    { key: 'start_time', label: 'Hora Início', required: true },
    { key: 'duration', label: 'Duração (minutos)', required: true },
  ]
};

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [importType, setImportType] = useState<keyof typeof SYSTEM_FIELDS>('finances');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validatedData, setValidatedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState({ success: 0, failed: 0, duplicates: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setRawRows([]);
    setColumns([]);
    setMapping({});
    setValidatedData([]);
    setErrors([]);
    setProgress(0);
    setResult({ success: 0, failed: 0, duplicates: 0 });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      
      if (json.length > 0) {
        const firstRow = json[0] as object;
        const cols = Object.keys(firstRow);
        setColumns(cols);
        setRawRows(json);
        
        // Smart Mapping Attempt
        const initialMapping: ColumnMapping = {};
        const systemFields = SYSTEM_FIELDS[importType];
        
        systemFields.forEach(field => {
          const match = cols.find(c => 
            c.toLowerCase().includes(field.key.toLowerCase()) || 
            c.toLowerCase().includes(field.label.toLowerCase()) ||
            (field.key === 'value' && (c.toLowerCase().includes('valor') || c.toLowerCase().includes('preço'))) ||
            (field.key === 'due_date' && (c.toLowerCase().includes('data') || c.toLowerCase().includes('vencimento')))
          );
          if (match) initialMapping[field.key] = match;
        });
        
        setMapping(initialMapping);
        setStep('mapping');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleValidate = () => {
    const targetFields = SYSTEM_FIELDS[importType];
    const newValidated: any[] = [];
    const newErrors: any[] = [];

    rawRows.forEach((row, index) => {
      const item: any = {};
      const rowErrors: string[] = [];

      targetFields.forEach(field => {
        const colName = mapping[field.key];
        const val = colName ? row[colName] : undefined;

        if (field.required && (val === undefined || val === '')) {
          rowErrors.push(`Campo obrigatório "${field.label}" está faltando.`);
        }

        // Specific validatons
        if (field.key === 'value') {
          const num = parseFloat(String(val).replace('R$', '').replace('.', '').replace(',', '.').trim());
          if (isNaN(num)) rowErrors.push('Valor numérico inválido.');
          item[field.key] = num;
        } else if (field.key === 'due_date' || field.key === 'date') {
          // Attempt to parse date
          const d = new Date(val);
          if (isNaN(d.getTime())) {
             // Handle Excel date serials if needed, or string formats
             rowErrors.push('Formato de data inválido.');
          } else {
            item[field.key] = d.toISOString().split('T')[0];
          }
        } else {
          item[field.key] = val;
        }
      });

      if (rowErrors.length > 0) {
        newErrors.push({ row: index + 1, errors: rowErrors, data: row });
      } else {
        newValidated.push(item);
      }
    });

    setValidatedData(newValidated);
    setErrors(newErrors);
    setStep('validation');
  };

  const handleExecuteImport = async () => {
    setStep('executing');
    let successCount = 0;
    let failedCount = 0;
    const duplicateCount = 0;

    const total = validatedData.length;
    
    for (let i = 0; i < total; i++) {
      try {
        const item = { ...validatedData[i] };
        
        if (importType === 'finances') {
          item.type = (String(item.type).toLowerCase() === 'receita' || String(item.type).toLowerCase() === 'revenue') ? 'revenue' : 'expense';
          if (!item.status) item.status = 'Pendente';
          if (!item.payment_method) item.payment_method = 'Pix';
        }

        if (importType === 'students' && item.email) {
          // Check for existing student
          const { data: existing } = await supabase
            .from('students')
            .select('id')
            .eq('email', item.email)
            .single();
          
          if (existing) {
            // Update or ignore - let's update for now
            const { error } = await supabase.from('students').update(item).eq('id', existing.id);
            if (!error) successCount++;
            else failedCount++;
            continue;
          }
        }

        const { error } = await supabase.from(importType).insert([item]);
        if (error) {
          console.error('Row insert error:', error);
          failedCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error('Import Error Row', i, err);
        failedCount++;
      }
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setResult({ success: successCount, failed: failedCount, duplicates: duplicateCount });
    setStep('result');
    onSuccess();
  };

  const downloadTemplate = () => {
    const fields = SYSTEM_FIELDS[importType].map(f => f.label);
    const ws = XLSX.utils.aoa_to_sheet([fields]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, `modelo_importacao_${importType}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                <Upload size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Importar Dados</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sincronização em Massa</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {step === 'upload' && (
              <div className="space-y-8">
                <div className="flex gap-4 p-2 bg-gray-100 rounded-2xl">
                  {(['finances', 'students', 'schedules'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setImportType(t)}
                      className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${importType === t ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {t === 'finances' ? 'Financeiro' : t === 'students' ? 'Alunos' : 'Agenda'}
                    </button>
                  ))}
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-gray-100 rounded-[2.5rem] p-12 text-center hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    hidden 
                    accept=".xlsx,.csv"
                  />
                  <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                    <FileText size={32} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Selecione sua planilha</h3>
                  <p className="text-sm text-gray-500 font-bold mb-6">Arraste um arquivo .xlsx ou .csv aqui</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-[10px] font-black text-gray-600 uppercase">
                    <Database size={14} /> Suporta Excel e CSV
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-primary/5 rounded-3xl border border-primary/10">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary border border-primary/10">
                       <Download size={20} />
                     </div>
                     <div>
                       <p className="text-sm font-black text-gray-900">Precisa de ajuda?</p>
                       <p className="text-xs font-bold text-gray-500">Baixe nosso modelo padrão para facilitar.</p>
                     </div>
                   </div>
                   <button 
                    onClick={downloadTemplate}
                    className="px-6 py-3 bg-white text-primary border border-primary/10 rounded-xl text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all"
                   >
                     Baixar Modelo
                   </button>
                </div>
              </div>
            )}

            {step === 'mapping' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6 p-4 bg-secondary/10 rounded-2xl border border-secondary/20">
                  <RefreshCw size={20} className="text-secondary" />
                  <p className="text-xs font-bold text-gray-700">Detectamos {columns.length} colunas. Mapeie os campos abaixo.</p>
                </div>

                <div className="space-y-4">
                  {SYSTEM_FIELDS[importType].map((field) => (
                    <div key={field.key} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-48 shrink-0">
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400">Campo do sistema</p>
                      </div>
                      <div className="hidden md:block">
                        <ArrowRight size={16} className="text-gray-300" />
                      </div>
                      <div className="flex-1">
                        <select
                          value={mapping[field.key] || ''}
                          onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary appearance-none"
                        >
                          <option value="">Ignorar este campo</option>
                          {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleValidate}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-8"
                >
                  Validar Dados →
                </button>
              </div>
            )}

            {step === 'validation' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-green-50 rounded-3xl border border-green-100 text-center">
                    <p className="text-3xl font-black text-green-600">{validatedData.length}</p>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Registros Válidos</p>
                  </div>
                  <div className={`p-6 rounded-3xl border text-center ${errors.length > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-3xl font-black ${errors.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{errors.length}</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Com Inconsistência</p>
                  </div>
                </div>

                {errors.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Detalhes dos Erros</p>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {errors.map((err, i) => (
                        <div key={i} className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50 flex items-start gap-3">
                          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-black text-red-600">Linha {err.row}</p>
                            <p className="text-[10px] font-bold text-gray-600">{err.errors.join(', ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Info size={18} className="text-primary" />
                    <p className="text-[11px] font-bold text-gray-600">Um preview dos seus dados prontos para importar:</p>
                  </div>
                  <div className="space-y-2">
                    {validatedData.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <p className="text-xs font-bold text-gray-900">{item.description || item.name || item.subject}</p>
                        <p className="text-[10px] font-black text-gray-400">{item.value ? `R$ ${item.value}` : item.date || item.email}</p>
                      </div>
                    ))}
                    {validatedData.length > 3 && (
                      <p className="text-center text-[10px] font-bold text-gray-400 pt-2">... e mais {validatedData.length - 3} itens</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('mapping')}
                    className="flex-1 py-4 bg-gray-100 rounded-2xl text-xs font-black text-gray-600"
                  >
                    AJUSTAR MAPEAMENTO
                  </button>
                  <button 
                    onClick={handleExecuteImport}
                    disabled={validatedData.length === 0}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-xs font-black shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    INICIAR IMPORTAÇÃO
                  </button>
                </div>
              </div>
            )}

            {step === 'executing' && (
              <div className="py-12 space-y-8 text-center">
                <div className="relative inline-block">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-gray-100"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * progress) / 100}
                      className="text-primary transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-2xl font-black text-gray-900">{progress}%</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Sincronizando com Supabase</h3>
                  <p className="text-sm text-gray-500 font-bold mt-2">Por favor, não feche esta janela.</p>
                </div>
                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100 inline-flex mx-auto">
                   <Loader2 size={16} className="animate-spin text-primary" />
                   <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Processando registros...</span>
                </div>
              </div>
            )}

            {step === 'result' && (
              <div className="text-center py-8 space-y-8">
                <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-green-500/30">
                  <CheckCircle2 size={48} />
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Importação Concluída!</h2>
                  <p className="text-gray-500 font-bold mt-2">Seus dados foram processados com sucesso.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-2xl font-black text-green-600">{result.success}</p>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Sucesso</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-2xl font-black text-red-600">{result.failed}</p>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Falhas</p>
                    </div>
                </div>

                <button 
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-6"
                >
                  CONCLUIR E FECHAR
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
