'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Download, Cake } from 'lucide-react';

export default function StudentListTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [tab, setTab] = useState<'lista' | 'aniversarios'>('lista');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('*').order('name');
      setStudents(data || []);
      setLoading(false);
    })();
  }, []);

  const schools = [...new Set(students.map(s => s.school).filter(Boolean))];
  const grades = [...new Set(students.map(s => s.grade).filter(Boolean))];

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase());
    const matchSchool = !filterSchool || s.school === filterSchool;
    const matchGrade = !filterGrade || s.grade === filterGrade;
    return matchSearch && matchSchool && matchGrade;
  });

  const mesAtual = new Date().getMonth();
  const aniversariantes = students.filter(s => {
    if (!s.birth_date) return false;
    return new Date(s.birth_date).getMonth() === mesAtual;
  }).sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());

  const calcAge = (bd: string) => {
    if (!bd) return '-';
    const d = new Date(bd);
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
    return age + ' anos';
  };

  const MESES = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

  const exportPDF = () => {
    const lista = tab === 'aniversarios' ? aniversariantes : filtered;
    const titulo = tab === 'aniversarios' ? 'Aniversariantes de ' + MESES[mesAtual] : 'Lista de Alunos';
    const rows = lista.map(s => {
      const bd = s.birth_date ? new Date(s.birth_date + 'T00:00:00') : null;
      return '<tr>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + (s.name || '') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + calcAge(s.birth_date) + '</td>' +
        (tab === 'aniversarios' ? '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + (bd ? bd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : '-') + '</td>' : '') +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + (s.school || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + (s.grade || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + (s.school_shift || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + (s.has_allergy === 'sim' ? s.allergy_details || 'Sim' : '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:.5px solid #E5E7EB;font-size:11px">' + (s.parent_name || '-') + '</td>' +
        '</tr>';
    }).join('');
    const thExtra = tab === 'aniversarios' ? '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Data</th>' : '';
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Calibri,Arial,sans-serif;color:#1F2937}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>' +
      '<div style="background:#7C3AED;padding:20px 24px;color:#fff"><div style="font-size:18px;font-weight:700">Descomplica</div><div style="font-size:13px;opacity:.8;margin-top:2px">' + titulo + '</div></div>' +
      '<div style="display:flex;justify-content:space-between;padding:10px 24px;background:#F8F7FF;border-bottom:1px solid #EDE9FE;font-size:12px"><div><span style="color:#6B7280">Total: </span><span style="font-weight:600">' + lista.length + ' alunos</span></div><div><span style="color:#6B7280">Gerado em: </span><span style="font-weight:600">' + new Date().toLocaleDateString('pt-BR') + '</span></div></div>' +
      '<div style="padding:14px 24px"><table style="width:100%;border-collapse:collapse"><thead><tr>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Aluno</th>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Idade</th>' +
      thExtra +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Escola</th>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Serie</th>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Turno</th>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Alergia</th>' +
      '<th style="padding:6px 8px;background:#F8F7FF;color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #E5E7EB">Responsavel</th>' +
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
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setTab('lista')} className={`px-4 py-2 rounded-lg text-xs font-bold ${tab === 'lista' ? 'bg-white shadow text-purple-600' : 'text-gray-400'}`}>Todos os alunos</button>
          <button onClick={() => setTab('aniversarios')} className={`px-4 py-2 rounded-lg text-xs font-bold ${tab === 'aniversarios' ? 'bg-white shadow text-purple-600' : 'text-gray-400'}`}>Aniversariantes do mes</button>
        </div>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
          <Download size={14} /> Exportar PDF
        </button>
      </div>

      {tab === 'lista' && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar aluno..."
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="">Todas as escolas</option>
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="">Todas as series</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Aluno</th>
                  <th className="text-left px-3 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Idade</th>
                  <th className="text-left px-3 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Escola</th>
                  <th className="text-left px-3 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Serie</th>
                  <th className="text-left px-3 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Turno</th>
                  <th className="text-left px-3 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Alergia</th>
                  <th className="text-left px-3 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Responsavel</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-t border-gray-50 hover:bg-purple-50/30">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{calcAge(s.birth_date)}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{s.school || '-'}</td>
                    <td className="px-3 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{s.grade || '-'}</span></td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{s.school_shift || '-'}</td>
                    <td className="px-3 py-3">{s.has_allergy === 'sim' ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{s.allergy_details || 'Sim'}</span> : <span className="text-gray-300">-</span>}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{s.parent_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-400 font-bold">{filtered.length} aluno(s)</div>
          </div>
        </>
      )}

      {tab === 'aniversarios' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Cake size={18} className="text-amber-500" />
              <h3 className="font-bold text-gray-900">Aniversariantes de {MESES[mesAtual]}</h3>
              <span className="text-xs text-gray-400 ml-auto">{aniversariantes.length} aluno(s)</span>
            </div>
            {aniversariantes.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Nenhum aniversariante este mes</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {aniversariantes.map(s => {
                  const bd = new Date(s.birth_date + 'T00:00:00');
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm">
                        {bd.getDate()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-amber-600">{bd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} — {calcAge(s.birth_date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
