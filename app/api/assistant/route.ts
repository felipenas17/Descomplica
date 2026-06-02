import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const hoje = new Date().toISOString().split('T')[0];
    const ano = new Date().getFullYear();
    const mesAtual = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][new Date().getMonth()];

    const [
      { data: students },
      { data: teachers },
      { data: schedules },
      { data: payments },
      { data: expenses },
      { data: agenda },
    ] = await Promise.all([
      supabase.from('profiles').select('id, name, monthly_value, responsible_name, responsible_phone').eq('role', 'student').limit(50),
      supabase.from('teachers').select('id, name').limit(20),
      supabase.from('schedules').select('*').gte('date', ano + '-01-01').limit(100),
      supabase.from('monthly_payments').select('*').eq('year', ano).limit(100),
      supabase.from('expenses').select('*').eq('year', ano).limit(50),
      supabase.from('admin_agenda').select('*').gte('date', hoje).limit(10),
    ]);

    const aulasHoje = schedules?.filter(s => s.date === hoje) || [];
    const receitaMes = payments?.filter(p => p.month === mesAtual)?.reduce((a: number, p: any) => a + (p.final_amount || p.amount || 0), 0) || 0;
    const recebidoMes = payments?.filter(p => p.month === mesAtual && p.status === 'paid')?.reduce((a: number, p: any) => a + (p.final_amount || p.amount || 0), 0) || 0;
    const despesasMes = expenses?.filter((e: any) => e.month === mesAtual)?.reduce((a: number, e: any) => a + (e.amount || 0), 0) || 0;
    const inadimplentes = payments?.filter(p => p.month === mesAtual && p.status === 'overdue') || [];
    const aulasPendentes = schedules?.filter(s => s.status === 'aguardando_confirmacao') || [];

    const systemPrompt = `Você é o assistente inteligente da Descomplica Educacional.
Ajuda o administrador a CONSULTAR dados e EXECUTAR ações no sistema.

DATA ATUAL: ${new Date().toLocaleString('pt-BR')}

DADOS DO SISTEMA:
- Total de alunos: ${students?.length || 0}
- Alunos: ${JSON.stringify(students?.map((s: any) => ({ id: s.id, nome: s.name, mensalidade: s.monthly_value, responsavel: s.responsible_name, tel: s.responsible_phone })))}
- Total de professores: ${teachers?.length || 0}
- Professores: ${JSON.stringify(teachers?.map((t: any) => ({ id: t.id, nome: t.name })))}
- Aulas hoje (${aulasHoje.length}): ${JSON.stringify(aulasHoje.map((s: any) => ({ aluno: s.student_name, professor: s.teacher_name, materia: s.subject, horario: s.start_time + '-' + s.end_time, status: s.status })))}
- Aulas aguardando confirmação (${aulasPendentes.length}): ${JSON.stringify(aulasPendentes.map((s: any) => ({ id: s.id, aluno: s.student_name, materia: s.subject, data: s.date })))}
- Receita prevista ${mesAtual}: R$ ${receitaMes.toFixed(2)}
- Recebido ${mesAtual}: R$ ${recebidoMes.toFixed(2)}
- Despesas ${mesAtual}: R$ ${despesasMes.toFixed(2)}
- Lucro/Prejuízo: R$ ${(recebidoMes - despesasMes).toFixed(2)}
- Inadimplentes (${inadimplentes.length}): ${JSON.stringify(inadimplentes.map((p: any) => ({ aluno: p.student_name, valor: p.final_amount || p.amount })))}
- Próximos compromissos: ${JSON.stringify(agenda?.map((a: any) => ({ titulo: a.title, data: a.date, hora: a.start_time, tipo: a.type })))}

RESPONDA SEMPRE EM JSON:
{
  "resposta": "mensagem clara com emojis",
  "acao": "NENHUMA | AGENDAR_AULA | AGENDAR_COMPROMISSO | LANCAR_DESPESA | CONFIRMAR_AULA",
  "dados": {},
  "confirmacao_necessaria": true | false
}

REGRAS:
- Perguntas sobre dados: acao = NENHUMA, responda com os dados acima
- Para CONFIRMAR_AULA: dados = { aula_id }
- Para AGENDAR_AULA: precisa de aluno_id, professor_id, materia, data (YYYY-MM-DD), hora_inicio, hora_fim
- Para AGENDAR_COMPROMISSO: titulo, data, hora, tipo (Reunião com Pais/Visita Escola/Reunião Admin/Financeiro/Pessoal/Outro)
- Para LANCAR_DESPESA: description e category_name = EXATAMENTE o que o admin disse
- Sempre peça confirmação antes de alterar dados
- Seja direto e simpático`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
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
