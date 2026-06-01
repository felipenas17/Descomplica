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
    const em3dias = new Date(hoje);
    em3dias.setDate(hoje.getDate() + 3);
    const em3diasStr = em3dias.toISOString().split('T')[0];
    const hojeStr = hoje.toISOString().split('T')[0];

    // Busca mensalidades vencendo em 3 dias
    const { data: vencendo } = await supabase
      .from('monthly_payments')
      .select('*')
      .eq('status', 'pending')
      .eq('due_date', em3diasStr);

    // Busca mensalidades vencidas hoje
    const { data: vencidas } = await supabase
      .from('monthly_payments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', hojeStr);

    // Atualiza status das vencidas para overdue
    if (vencidas && vencidas.length > 0) {
      await supabase
        .from('monthly_payments')
        .update({ status: 'overdue' })
        .lt('due_date', hojeStr)
        .eq('status', 'pending');
    }

    // Busca admins para notificar
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      return NextResponse.json({ ok: true, msg: 'Sem admins' });
    }

    // Notifica sobre vencimentos em 3 dias
    if (vencendo && vencendo.length > 0) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          title: `⏰ ${vencendo.length} mensalidade(s) vencem em 3 dias`,
          message: vencendo.map((p: any) => `${p.student_name}: R$ ${Number(p.final_amount || p.amount).toFixed(2)}`).join(', '),
          type: 'warning',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Notifica sobre inadimplentes
    if (vencidas && vencidas.length > 0) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          title: `🚨 ${vencidas.length} aluno(s) em atraso`,
          message: vencidas.map((p: any) => `${p.student_name}: venceu em ${new Date(p.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}`).join(', '),
          type: 'danger',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      vencendo: vencendo?.length || 0,
      vencidas: vencidas?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
