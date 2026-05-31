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
    const { message, context } = await req.json();

    // Busca dados do banco para o contexto da IA
    const [{ data: students }, { data: teachers }, { data: schedules }] = await Promise.all([
      supabase.from('profiles').select('id, name').eq('role', 'student').limit(50),
      supabase.from('teachers').select('id, name').limit(20),
      supabase.from('schedules').select('id, student_id, teacher_id, day_of_week, start_time, end_time, subject').limit(100),
    ]);

    const systemPrompt = `Você é o assistente da Descomplica Educacional, um sistema de gestão escolar.
Você ajuda o administrador a gerenciar alunos, professores, aulas, agenda e financeiro.

DADOS ATUAIS DO SISTEMA:
Alunos: ${JSON.stringify(students?.map(s => ({ id: s.id, nome: s.name })))}
Professores: ${JSON.stringify(teachers?.map(t => ({ id: t.id, nome: t.name })))}
Aulas agendadas: ${JSON.stringify(schedules?.slice(0, 20))}

AÇÕES QUE VOCÊ PODE EXECUTAR:
Sempre responda em JSON com este formato:
{
  "resposta": "mensagem amigável para o admin",
  "acao": "NENHUMA | AGENDAR_AULA | CANCELAR_AULA | ALTERAR_AULA | AGENDAR_COMPROMISSO | LANCAR_DESPESA",
  "dados": { ... dados necessários para executar a ação ... },
  "confirmacao_necessaria": true | false
}

REGRAS:
- Se a ação envolver alterar dados, sempre peça confirmação antes (confirmacao_necessaria: true)
- Se não entender o comando, peça mais detalhes
- Seja sempre simpático e conciso
- Use os IDs corretos dos alunos e professores da lista acima
- Datas no formato YYYY-MM-DD, horários no formato HH:MM
- Para AGENDAR_AULA, você SEMPRE precisa de: aluno_id, professor_id, materia, dia_semana (0=Dom,1=Seg,2=Ter,3=Qua,4=Qui,5=Sex,6=Sab), hora_inicio (HH:MM), hora_fim (HH:MM). Se faltar qualquer um desses dados, NAO gere a acao — pergunte antes
- Para AGENDAR_COMPROMISSO, os tipos válidos são: 'Reunião com Pais', 'Visita Escola', 'Reunião Admin', 'Financeiro', 'Pessoal', 'Outro'
- Para LANCAR_DESPESA, as categorias são: 'Salário Professor', 'Material', 'Aluguel', 'Contas', 'Outros'`;

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
    return NextResponse.json({ resposta: 'Erro ao processar: ' + error.message, acao: 'NENHUMA' }, { status: 500 });
  }
}
