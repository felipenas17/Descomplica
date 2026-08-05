fixes = [
    ("app/api/create-user/route.ts",
     """import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json();""",
     """import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll(list) { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: callerProfile } = await supabaseAuth.from('profiles').select('role').eq('id', user.id).single();
    if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });

    const { email, password, name, role } = await req.json();"""),
    ("app/api/assistant/route.ts",
     """import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';""",
     """import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';"""),
    ("app/api/assistant/route.ts",
     """export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();""",
     """export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll(list) { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ resposta: 'Nao autorizado.', acao: 'NENHUMA' }, { status: 401 });
    const { data: callerProfile } = await supabaseAuth.from('profiles').select('role').eq('id', user.id).single();
    if (callerProfile?.role !== 'admin') return NextResponse.json({ resposta: 'Acesso restrito a administradores.', acao: 'NENHUMA' }, { status: 403 });

    const { message } = await req.json();"""),
]

for path, old, new in fixes:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    n = content.count(old)
    if n == 0:
        raise SystemExit(f"NAO ENCONTROU em {path}, abortando (nada mudou nesse arquivo):\n{old}")
    if n > 1:
        raise SystemExit(f"ENCONTROU {n}x em {path}, ambiguo, abortando:\n{old}")
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK:", path)
