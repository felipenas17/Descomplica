import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const hoje = new Date();
    const amanha = new Date(hoje); amanha.setDate(hoje.getDate() + 1);
    const hojeStr = hoje.toISOString().split('T')[0];
    const amanhaStr = amanha.toISOString().split('T')[0];

    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');

    const { data: compromissosHoje } = await supabase.from('admin_agenda').select('*').eq('date', hojeStr);
    const { data: compromissosAmanha } = await supabase.from('admin_agenda').select('*').eq('date', amanhaStr);

    const notificarAdmins = async (lista: any[], quando: string, emoji: string, tipo: string) => {
      if (!admins || admins.length === 0 || !lista || lista.length === 0) return;
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          title: emoji + ' ' + lista.length + ' compromisso(s) ' + quando,
          message: lista.map((c: any) => c.title + ' às ' + (c.start_time || '?') + (c.teacher_name ? ' — ' + c.teacher_name : '')).join('\n'),
          type: tipo,
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    };

    const enviarParaProfessor = async (userId: string, compromisso: any, quando: string, emoji: string, tipo: string) => {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: emoji + ' Compromisso ' + quando + ': ' + compromisso.title,
        message: 'Às ' + (compromisso.start_time || '') + (compromisso.description ? ' — ' + compromisso.description : ''),
        type: tipo,
        read: false,
        created_at: new Date().toISOString(),
      });
    };

    const notificarProfessor = async (compromisso: any, quando: string, emoji: string, tipo: string) => {
      if (compromisso.notify_all_teachers) {
        const { data: todasProfessoras } = await supabase.from('teachers').select('id, email');
        for (const t of todasProfessoras || []) {
          if (!t.email) continue;
          const { data: prof } = await supabase.from('profiles').select('id').eq('email', t.email).single();
          await enviarParaProfessor(prof?.id || t.id, compromisso, quando, emoji, tipo);
        }
        return;
      }
      if (!compromisso.teacher_id) return;
      const { data: teacher } = await supabase.from('teachers').select('email').eq('id', compromisso.teacher_id).single();
      if (!teacher?.email) return;
      const { data: prof } = await supabase.from('profiles').select('id').eq('email', teacher.email).single();
      await enviarParaProfessor(prof?.id || compromisso.teacher_id, compromisso, quando, emoji, tipo);
    };

    await notificarAdmins(compromissosHoje || [], 'hoje', '⏰', 'warning');
    for (const c of compromissosHoje || []) { await notificarProfessor(c, 'hoje', '⏰', 'warning'); }

    await notificarAdmins(compromissosAmanha || [], 'amanhã', '📅', 'info');
    for (const c of compromissosAmanha || []) { await notificarProfessor(c, 'amanhã', '📅', 'info'); }

    return NextResponse.json({
      ok: true,
      hoje: compromissosHoje?.length || 0,
      amanha: compromissosAmanha?.length || 0,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
