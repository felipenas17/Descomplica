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
    const em3dias = new Date(hoje); em3dias.setDate(hoje.getDate() + 3);
    const em7dias = new Date(hoje); em7dias.setDate(hoje.getDate() + 7);
    const hojeStr = hoje.toISOString().split('T')[0];
    const em3diasStr = em3dias.toISOString().split('T')[0];
    const em7diasStr = em7dias.toISOString().split('T')[0];

    // Busca admins
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    if (!admins || admins.length === 0) return NextResponse.json({ ok: true });

    // 1. Atualiza vencidas para overdue
    await supabase.from('monthly_payments').update({ status: 'overdue' })
      .lt('due_date', hojeStr).eq('status', 'pending');

    // 2. Mensalidades vencendo em 3 dias - com telefone do responsável
    const { data: vencendo3 } = await supabase
      .from('monthly_payments')
      .select('*, students(parent_name, parent_phone)')
      .eq('status', 'pending')
      .eq('due_date', em3diasStr);

    // 3. Mensalidades vencendo em 7 dias
    const { data: vencendo7 } = await supabase
      .from('monthly_payments')
      .select('*, students(parent_name, parent_phone)')
      .eq('status', 'pending')
      .eq('due_date', em7diasStr);

    // 4. Inadimplentes
    const { data: vencidas } = await supabase
      .from('monthly_payments')
      .select('*, students(parent_name, parent_phone)')
      .eq('status', 'overdue')
      .gte('due_date', new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]);

    // Monta notificações com links WhatsApp
    for (const admin of admins) {

      // Alerta vencendo em 3 dias
      if (vencendo3 && vencendo3.length > 0) {
        const links = vencendo3.map((p: any) => {
          const tel = p.students?.parent_phone?.replace(/\D/g, '');
          const valor = Number(p.final_amount || p.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const msg = encodeURIComponent(
            'Olá ' + (p.students?.parent_name || 'Responsável') + '! 😊\n\n' +
            'Sou da *Professora Descomplica*. ' +
            'A mensalidade de *' + p.student_name + '* ' +
            'no valor de *' + valor + '* vence em 3 dias.\n\n' +
            'Qualquer dúvida estamos à disposição! 🙏'
          );
          return tel
            ? p.student_name + ': https://wa.me/55' + tel + '?text=' + msg
            : p.student_name + ': (sem telefone cadastrado)';
        }).join('\n');

        await supabase.from('notifications').insert({
          user_id: admin.id,
          title: '⏰ ' + vencendo3.length + ' mensalidade(s) vencem em 3 dias',
          message: 'Clique para abrir o WhatsApp:\n' + links,
          type: 'warning',
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      // Alerta vencendo em 7 dias
      if (vencendo7 && vencendo7.length > 0) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          title: '📅 ' + vencendo7.length + ' mensalidade(s) vencem em 7 dias',
          message: vencendo7.map((p: any) => p.student_name + ' — ' + Number(p.final_amount || p.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })).join(', '),
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      // Alerta inadimplentes
      if (vencidas && vencidas.length > 0) {
        const links = vencidas.map((p: any) => {
          const tel = p.students?.parent_phone?.replace(/\D/g, '');
          const valor = Number(p.final_amount || p.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const msg = encodeURIComponent(
            'Olá ' + (p.students?.parent_name || 'Responsável') + '! 😊\n\n' +
            'Sou da *Professora Descomplica*. ' +
            'Identificamos que a mensalidade de *' + p.student_name + '* ' +
            'no valor de *' + valor + '* está em aberto.\n\n' +
            'Poderia nos informar quando será possível realizar o pagamento? 🙏'
          );
          return tel
            ? p.student_name + ': https://wa.me/55' + tel + '?text=' + msg
            : p.student_name + ': (sem telefone cadastrado)';
        }).join('\n');

        await supabase.from('notifications').insert({
          user_id: admin.id,
          title: '🚨 ' + vencidas.length + ' aluno(s) inadimplente(s)',
          message: links,
          type: 'danger',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      vencendo3: vencendo3?.length || 0,
      vencendo7: vencendo7?.length || 0,
      inadimplentes: vencidas?.length || 0,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
