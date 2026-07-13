'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Cake, Download } from 'lucide-react';

export default function TeacherBirthdayTab() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('teachers').select('*').order('name');
      setTeachers(data || []);
      setLoading(false);
    })();
  }, []);

  const mesAtual = new Date().getMonth();
  const aniversariantes = teachers.filter(t => {
    if (!t.birth_date) return false;
    return new Date(t.birth_date + 'T00:00:00').getMonth() === mesAtual;
  }).sort((a, b) => new Date(a.birth_date + 'T00:00:00').getDate() - new Date(b.birth_date + 'T00:00:00').getDate());

  const calcAge = (bd: string) => {
    if (!bd) return '-';
    const d = new Date(bd + 'T00:00:00');
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
    return age + ' anos';
  };

  const MESES = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

  const exportPDF = () => {
    const rows = aniversariantes.map(t => {
      const bd = new Date(t.birth_date + 'T00:00:00');
      return '<tr>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + (t.name || '') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + bd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) + '</td>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + calcAge(t.birth_date) + '</td>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + (t.phone || '-') + '</td>' +
        '</tr>';
    }).join('');
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Calibri,Arial,sans-serif;color:#1F2937}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>' +
      '<div style="background:#7C3AED;padding:20px 24px;color:#fff"><div style="font-size:18px;font-weight:700">Descomplica</div><div style="font-size:13px;opacity:.8;margin-top:2px">Aniversariantes de ' + MESES[mesAtual] + ' - Professoras</div></div>' +
      '<div style="display:flex;justify-content:space-between;padding:10px 24px;background:#F8F7FF;border-bottom:1px solid #EDE9FE;font-size:12px"><div><span style="color:#6B7280">Total: </span><span style="font-weight:600">' + aniversariantes.length + ' professoras</span></div><div><span style="color:#6B7280">Gerado em: </span><span style="font-weight:600">' + new Date().toLocaleDateString('pt-BR') + '</span></div></div>' +
      '<div style="padding:14px 24px"><table style="width:100%;border-collapse:collapse"><thead><tr>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Professora</th>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Data</th>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Idade</th>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Telefone</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div style="padding:10px 24px;background:#F9FAFB;border-top:.5px solid #E5E7EB;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF"><span>Descomplica</span><span>' + new Date().toLocaleDateString('pt-BR') + '</span></div>' +
      '</body></html>';
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Aniversariantes de {MESES[mesAtual]}</h2>
          <p className="text-sm text-gray-400">{aniversariantes.length} professora(s) fazem aniversário este mes</p>
        </div>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
          <Download size={14} /> Exportar PDF
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        {aniversariantes.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nenhuma aniversariante este mes</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {aniversariantes.map(t => {
              const bd = new Date(t.birth_date + 'T00:00:00');
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-10 h-10 rounded-xl bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm">
                    {bd.getDate()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-purple-600">{bd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - {calcAge(t.birth_date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
