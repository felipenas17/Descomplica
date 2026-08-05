path = "components/views/FeedbacksView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

fixes = [
    (
        """  X,
  Zap,
  Loader2
} from 'lucide-react';""",
        """  X,
  Zap,
  Loader2,
  Trash2
} from 'lucide-react';"""
    ),
    (
        """                  <td className="px-8 py-6 text-right">
                    <button className="p-2 hover:bg-white rounded-xl text-gray-400 group-hover:text-purple-600 transition-all border border-transparent group-hover:border-purple-100 shadow-sm">
                      <Eye size={18} />
                    </button>
                  </td>""",
        """                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-white rounded-xl text-gray-400 group-hover:text-purple-600 transition-all border border-transparent group-hover:border-purple-100 shadow-sm">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Excluir este feedback? Essa acao nao pode ser desfeita.')) return;
                          await supabase.from('feedbacks').delete().eq('id', f.id);
                          fetchFeedbacks();
                        }}
                        className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 shadow-sm">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>"""
    ),
]

for old, new in fixes:
    n = content.count(old)
    if n == 0:
        raise SystemExit("NAO ENCONTROU, abortando (nada mudou):\n" + old)
    if n > 1:
        raise SystemExit(f"ENCONTROU {n}x, ambiguo, abortando:\n" + old)
    content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: botao de excluir adicionado.")
