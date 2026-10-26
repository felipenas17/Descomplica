// Cores das professoras: cada uma precisa ter uma cor diferente no quadro de aulas.
// Escuras o bastante para o nome ficar legivel sobre os fundos claros do calendario.
export const TEACHER_PALETTE = [
  '#7C3AED', // roxo
  '#2563EB', // azul
  '#047857', // verde
  '#C2410C', // laranja
  '#DB2777', // rosa
  '#0E7490', // ciano
  '#A16207', // dourado
  '#DC2626', // vermelho
  '#4D7C0F', // oliva
  '#78350F', // marrom
  '#475569', // ardosia
  '#1E3A8A', // azul-marinho
];

const HEX6 = /^#[0-9a-f]{6}$/i;

type TeacherLike = { id: string; color?: string | null };

// Mapa id -> cor sem repeticao. Respeita a cor ja salva da professora; se duas tem a mesma
// (ou a cor e invalida/vazia), a primeira (ordem estavel por id) fica com a dela e as outras
// recebem a proxima cor livre da paleta. Nao grava nada no banco.
export function buildTeacherColorMap(teachers: TeacherLike[]): Record<string, string> {
  const sorted = [...teachers].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const map: Record<string, string> = {};
  const used = new Set<string>();
  const pending: string[] = [];

  for (const t of sorted) {
    const c = (t.color || '').trim().toLowerCase();
    if (HEX6.test(c) && !used.has(c)) { map[t.id] = c; used.add(c); }
    else pending.push(t.id);
  }

  let extra = 0;
  for (const id of pending) {
    let pick = TEACHER_PALETTE.find(c => !used.has(c.toLowerCase()));
    if (!pick) { pick = TEACHER_PALETTE[extra % TEACHER_PALETTE.length]; extra++; } // paleta esgotada: repete so aqui
    map[id] = pick;
    used.add(pick.toLowerCase());
  }
  return map;
}

// Cor para uma professora nova: a primeira da paleta que nenhuma outra esta usando.
export function nextFreeTeacherColor(existing: (string | null | undefined)[]): string {
  const used = new Set(existing.map(c => (c || '').trim().toLowerCase()));
  return TEACHER_PALETTE.find(c => !used.has(c.toLowerCase())) || TEACHER_PALETTE[existing.length % TEACHER_PALETTE.length];
}
