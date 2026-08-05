import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
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

    const { message } = await req.json();

    const hoje = new Date().toISOString().split('T')[0];
    const ano = new Date().getFullYear();
    const mesAtual = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][new Date().getMonth()];
    const semanaInicio = new Date(); semanaInicio.setDate(semanaInicio.getDate() - semanaInicio.getDay());
    const semanaFim = new Date(semanaInicio); semanaFim.setDate(semanaInicio.getDate() + 6);

    const [
      { data: students },
      { data: teachers },
      { data: schedules },
      { data: payments },
      { data: expenses },
      { data: agenda },
      { data: feedbacks },
      { data: expensesList },
      { data: materials },
      { data: contracts },
    ] = await Promise.all([
      supabase.from('students').select('id, name, monthly_value, parent_name, parent_phone, enrollment_type, status').limit(50),
      supabase.from('teachers').select('id, name').limit(20),
      supabase.from('schedules').select('*').gte('date', ano + '-01-01').limit(200),
      supabase.from('monthly_payments').select('*').eq('year', ano).limit(100),
      supabase.from('expenses').select('*').eq('year', ano).limit(50),
      supabase.from('admin_agenda').select('*').gte('date', hoje).limit(10),
      supabase.from('feedbacks').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('expenses').select('id, description, category_name, amount, status, month').eq('year', ano).limit(30),
      supabase.from('materials').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('contracts').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    // Métricas calculadas
    const aulasHoje = schedules?.filter(s => s.date === hoje) || [];
    const aulasSemana = schedules?.filter(s => s.date >= semanaInicio.toISOString().split('T')[0] && s.date <= semanaFim.toISOString().split('T')[0]) || [];
    const receitaMes = payments?.filter(p => p.month === mesAtual)?.reduce((a: number, p: any) => a + (p.final_amount || p.amount || 0), 0) || 0;
    const recebidoMes = payments?.filter(p => p.month === mesAtual && p.status === 'paid')?.reduce((a: number, p: any) => a + (p.final_amount || p.amount || 0), 0) || 0;
    const despesasMes = expenses?.filter((e: any) => e.month === mesAtual)?.reduce((a: number, e: any) => a + (e.amount || 0), 0) || 0;
    const inadimplentes = payments?.filter(p => p.month === mesAtual && p.status === 'overdue') || [];
    const aulasPendentes = schedules?.filter(s => s.status === 'aguardando_confirmacao') || [];
    const materiaisPendentes = materials?.filter((m: any) => m.approval_status === 'pending') || [];

    // Análise por professor
    const rankingProfessores = teachers?.map((t: any) => ({
      id: t.id,
      nome: t.name,
      aulasTotal: schedules?.filter(s => s.teacher_id === t.id).length || 0,
      aulasConcluidas: schedules?.filter(s => s.teacher_id === t.id && s.status === 'concluido').length || 0,
      aulasMes: schedules?.filter(s => s.teacher_id === t.id && s.date?.startsWith(ano + '-' + String(new Date().getMonth() + 1).padStart(2,'0'))).length || 0,
      feedbacks: feedbacks?.filter((f: any) => f.teacher_id === t.id).length || 0,
    })) || [];

    // Análise por aluno
    const analiseAlunos = students?.map((s: any) => ({
      id: s.id,
      nome: s.name,
      faltas: schedules?.filter(sc => sc.student_id === s.id && (sc.attendance_status === 'falta' || sc.attendance_status === 'Ausente')).length || 0,
      presencas: schedules?.filter(sc => sc.student_id === s.id && (sc.attendance_status === 'Presente' || sc.attendance_status === 'presente')).length || 0,
      totalAulas: schedules?.filter(sc => sc.student_id === s.id).length || 0,
      inadimplente: payments?.some(p => p.student_id === s.id && p.status === 'overdue') || false,
      mensalidade: s.monthly_value,
      responsavel: s.parent_name,
      telefone: s.parent_phone,
    })) || [];

    // Aniversários próximos 7 dias
    const aniversarios = students?.filter((s: any) => {
      if (!s.birth_date) return false;
      const bday = new Date(s.birth_date);
      const hoje2 = new Date();
      const diff = new Date(hoje2.getFullYear(), bday.getMonth(), bday.getDate()).getTime() - hoje2.getTime();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }) || [];

    const systemPrompt = `Você é o assistente inteligente da Descomplica Educacional — um sistema de gestão escolar.
Você é proativo, analítico e executa ações. Responda SEMPRE em JSON.

DATA/HORA: ${new Date().toLocaleString('pt-BR')}
MÊS ATUAL: ${mesAtual}/${ano}

═══ DADOS COMPLETOS DO SISTEMA ═══

👥 ALUNOS (${students?.length || 0}):
${JSON.stringify(analiseAlunos)}

👨‍🏫 PROFESSORES (${teachers?.length || 0}):
${JSON.stringify(rankingProfessores)}

📅 AULAS HOJE (${aulasHoje.length}):
${JSON.stringify(aulasHoje.map((s: any) => ({ id: s.id, aluno: s.student_name, professor: s.teacher_name, materia: s.subject, horario: s.start_time + '-' + s.end_time, status: s.status })))}

📅 AULAS ESSA SEMANA (${aulasSemana.length}):
${JSON.stringify(aulasSemana.map((s: any) => ({ data: s.date, aluno: s.student_name, materia: s.subject, status: s.status })))}

⏳ AGUARDANDO CONFIRMAÇÃO (${aulasPendentes.length}):
${JSON.stringify(aulasPendentes.map((s: any) => ({ id: s.id, aluno: s.student_name, materia: s.subject, data: s.date, professor: s.teacher_name })))}

💰 FINANCEIRO ${mesAtual}/${ano}:
- Receita prevista: R$ ${receitaMes.toFixed(2)}
- Recebido: R$ ${recebidoMes.toFixed(2)}
- Despesas: R$ ${despesasMes.toFixed(2)}
- Resultado: R$ ${(recebidoMes - despesasMes).toFixed(2)}
- Inadimplentes (${inadimplentes.length}): ${JSON.stringify(inadimplentes.map((p: any) => ({ id: p.id, aluno: p.student_name, valor: p.final_amount || p.amount, vencimento: p.due_date, responsavel: analiseAlunos.find(a => a.id === p.student_id)?.responsavel, telefone: analiseAlunos.find(a => a.id === p.student_id)?.telefone })))}
- Pagamentos pendentes: ${JSON.stringify(payments?.filter(p => p.status === 'pending' && p.month === mesAtual)?.map((p: any) => ({ id: p.id, aluno: p.student_name, valor: p.final_amount || p.amount, vencimento: p.due_date })))}

📚 MATERIAIS PENDENTES DE APROVAÇÃO (${materiaisPendentes.length}):
${JSON.stringify(materiaisPendentes.map((m: any) => ({ id: m.id, titulo: m.title, professor: m.uploader_name, enviado_em: m.created_at })))}

📋 FEEDBACKS RECENTES (${feedbacks?.length || 0}):
${JSON.stringify(feedbacks?.slice(0,10).map((f: any) => ({ aluno: f.student_name, professor: f.teacher_name, materia: f.subject, data: f.class_date, presenca: f.attendance, conteudo: f.content, obs: f.observations, enviado_pai: f.sent_to_parent })))}

🗓️ PRÓXIMOS COMPROMISSOS:
${JSON.stringify(agenda?.map((a: any) => ({ id: a.id, titulo: a.title, data: a.date, hora: a.start_time, tipo: a.type })))}

🎂 ANIVERSÁRIOS PRÓXIMOS 7 DIAS:
${JSON.stringify(aniversarios.map((s: any) => ({ nome: s.name, nascimento: s.birth_date, responsavel: s.parent_name, telefone: s.parent_phone })))}

═══ AÇÕES DISPONÍVEIS ═══
Responda SEMPRE em JSON:
{
  "resposta": "mensagem clara com emojis",
  "acao": "NENHUMA | AGENDAR_AULA | CANCELAR_AULA | CONFIRMAR_AULA | ALTERAR_AULA | AGENDAR_COMPROMISSO | LANCAR_DESPESA | MARCAR_PAGO | EXCLUIR_DESPESA | ENVIAR_MENSAGEM | ENVIAR_NOTIFICACAO | COBRAR_INADIMPLENTE | ALERTAR_VENCIMENTO | APROVAR_MATERIAL | REPROVAR_MATERIAL | MENSAGEM_MASSA | PARABENIZAR",
  "dados": {},
  "confirmacao_necessaria": true | false,
  "acoes_multiplas": [] 
}

═══ REGRAS POR AÇÃO ═══
- CONFIRMAR_AULA: { aula_id }
- CANCELAR_AULA: { aula_id }
- AGENDAR_AULA: { aluno_id, professor_id, materia, data (YYYY-MM-DD), hora_inicio, hora_fim }
- AGENDAR_COMPROMISSO: { titulo, data, hora, tipo (Reunião com Pais/Visita Escola/Reunião Admin/Financeiro/Pessoal/Outro), descricao? }
- LANCAR_DESPESA: { description, category_name (exatamente o que disse), valor, data? }
- MARCAR_PAGO: { pagamento_id }
- COBRAR_INADIMPLENTE: { aluno, responsavel, telefone, mes, valor }
- ALERTAR_VENCIMENTO: { aluno, responsavel, telefone, mes, valor, dias_para_vencer }
- ENVIAR_MENSAGEM: { destinatario_id (teacher.id), destinatario_nome, texto }
- ENVIAR_NOTIFICACAO: { destinatario_id, destinatario_nome, titulo, texto }
- APROVAR_MATERIAL: { material_id, material_titulo }
- REPROVAR_MATERIAL: { material_id, material_titulo, motivo }
- MENSAGEM_MASSA: { destinatarios: [{telefone, nome, responsavel}], texto_template } — abre WhatsApp para cada um
- PARABENIZAR: { destinatarios: [{telefone, nome, responsavel, nascimento}] } — mensagem de aniversário
- Para MÚLTIPLAS ações iguais (ex: cobrar vários inadimplentes), use acoes_multiplas: [{ acao, dados }]

═══ ANÁLISES INTELIGENTES ═══
- Quando perguntado sobre desempenho de professor: analise aulas dadas, feedbacks e taxa de conclusão
- Quando perguntado sobre alunos que precisam de atenção: considere faltas > 2 E/OU inadimplência
- Quando pedido resumo do mês: receita, despesas, aulas, feedbacks, inadimplentes
- Quando perguntado sobre horários livres: analise schedules e sugira horários não ocupados
- Sempre seja proativo e sugira ações quando identificar problemas`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { resposta: text, acao: 'NENHUMA', confirmacao_necessaria: false };
    }
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ resposta: 'Erro: ' + error.message, acao: 'NENHUMA' }, { status: 500 });
  }
}
