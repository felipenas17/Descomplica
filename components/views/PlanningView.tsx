'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, Search, Notebook, Trash2, Edit3, Check, X, Bell, BookOpen, User } from 'lucide-react';

const CATEGORIES = [
  { value: 'plano', label: 'Plano de aula', color: 'bg-purple-100 text-purple-700', border: 'border-l-purple-500' },
  { value: 'lembrete', label: 'Lembrete', color: 'bg-amber-100 text-amber-700', border: 'border-l-amber-500' },
  { value: 'aluno', label: 'Observação de aluno', color: 'bg-green-100 text-green-700', border: 'border-l-green-500' },
  { value: 'nota', label: 'Nota geral', color: 'bg-gray-100 text-gray-600', border: 'border-l-gray-400' },
];

const CAT_ICON: Record<string, any> = { plano: BookOpen, lembrete: Bell, aluno: User, nota: Notebook };

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  checklist: { text: string; done: boolean }[];
  created_at: string;
  updated_at: string;
}

export default function PlanningView({ user }: { user?: any }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'nota', tags: '', checklist: [{ text: '', done: false }] });
  const [saving, setSaving] = useState(false);

  const fetchNotes = async () => {
    const { data } = await supabase.from('teacher_notes').select('*').eq('teacher_id', user?.id).order('updated_at', { ascending: false });
    setNotes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, []);

  const openNew = () => {
    setEditingNote(null);
    setForm({ title: '', content: '', category: 'nota', tags: '', checklist: [{ text: '', done: false }] });
    setShowModal(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setForm({
      title: note.title,
      content: note.content || '',
      category: note.category || 'nota',
      tags: (note.tags || []).join(', '),
      checklist: note.checklist?.length ? note.checklist : [{ text: '', done: false }],
    });
    setShowModal(true);
  };

  const saveNote = async () => {
    if (!form.title.trim()) { toast.error('Título é obrigatório'); return; }
    setSaving(true);
    const payload = {
      teacher_id: user?.id,
      title: form.title,
      content: form.content,
      category: form.category,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      checklist: form.checklist.filter(c => c.text.trim()),
      updated_at: new Date().toISOString(),
    };
    if (editingNote) {
      await supabase.from('teacher_notes').update(payload).eq('id', editingNote.id);
      toast.success('Nota atualizada!');
    } else {
      await supabase.from('teacher_notes').insert(payload);
      toast.success('Nota criada!');
    }
    setShowModal(false);
    setSaving(false);
    fetchNotes();
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Excluir esta nota?')) return;
    await supabase.from('teacher_notes').delete().eq('id', id);
    toast.success('Nota excluída');
    fetchNotes();
  };

  const toggleCheck = async (noteId: string, idx: number) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.checklist) return;
    const updated = [...note.checklist];
    updated[idx].done = !updated[idx].done;
    await supabase.from('teacher_notes').update({ checklist: updated, updated_at: new Date().toISOString() }).eq('id', noteId);
    setNotes(notes.map(n => n.id === noteId ? { ...n, checklist: updated } : n));
  };

  const filtered = notes.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'todas' || n.category === filterCat;
    return matchSearch && matchCat;
  });

  const getCat = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[3];
  const Icon = (cat: string) => CAT_ICON[cat] || Notebook;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Notebook size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Meu Planejamento</h1>
            <p className="text-xs text-gray-400">Notas, lembretes e planos de aula</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
          <Plus size={16} /> Nova nota
        </button>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl">
        {[{ value: 'todas', label: 'Todas' }, ...CATEGORIES].map(c => (
          <button key={c.value} onClick={() => setFilterCat(c.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterCat === c.value ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nas notas..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Notebook size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma nota encontrada</p>
          <p className="text-sm text-gray-300 mt-1">Clique em "Nova nota" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => {
            const cat = getCat(note.category);
            const NoteIcon = Icon(note.category);
            return (
              <div key={note.id} className={`bg-white rounded-xl border border-gray-100 p-4 border-l-[3px] ${cat.border} hover:shadow-sm transition-all`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                      <NoteIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm">{note.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                      </div>
                      {note.content && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.content}</p>}
                      {note.checklist && note.checklist.length > 0 && note.checklist[0].text && (
                        <div className="mt-2 space-y-1">
                          {note.checklist.map((item, idx) => item.text && (
                            <button key={idx} onClick={() => toggleCheck(note.id, idx)}
                              className={`flex items-center gap-2 text-xs ${item.done ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${item.done ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                                {item.done && <Check size={10} className="text-white" />}
                              </div>
                              {item.text}
                            </button>
                          ))}
                        </div>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {note.tags.map(tag => (
                            <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-gray-300 mr-2">{new Date(note.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    <button onClick={() => openEdit(note)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><Edit3 size={14} /></button>
                    <button onClick={() => deleteNote(note.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">{editingNote ? 'Editar nota' : 'Nova nota'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">Categoria</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.category === c.value ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Plano semana 11/06"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">Conteúdo</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Escreva aqui..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">Checklist</label>
                <div className="space-y-2">
                  {form.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input value={item.text} onChange={e => {
                        const updated = [...form.checklist];
                        updated[idx].text = e.target.value;
                        setForm(f => ({ ...f, checklist: updated }));
                      }} placeholder="Item..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                      <button onClick={() => setForm(f => ({ ...f, checklist: f.checklist.filter((_, i) => i !== idx) }))} className="p-1 text-gray-300 hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => setForm(f => ({ ...f, checklist: [...f.checklist, { text: '', done: false }] }))}
                    className="text-xs text-purple-600 font-bold hover:text-purple-700">+ Adicionar item</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">Tags (separadas por vírgula)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Ex: Matemática, Kauã Ramos"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={saveNote} disabled={saving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">
                {saving ? 'Salvando...' : editingNote ? 'Salvar alterações' : 'Criar nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
