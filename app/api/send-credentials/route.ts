import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResend() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = token ? await supabase.auth.getUser(token) : { data: { user: null }, error: null };

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o usuário é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, password, role } = body;

    if (!email || !password || !name) {
      return Response.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    const resend = getResend();
    
    const roleLabel = role === 'admin' ? 'Administrador' : 'Professor';

    const { data, error } = await resend.emails.send({
      from: 'Sistema de Gestão <onboarding@resend.dev>', // Resend trial domain
      to: [email],
      subject: `Seu acesso ao Portal do Aluno foi criado!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #111; font-weight: 800;">Olá, ${name}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Seu acesso como <strong>${roleLabel}</strong> foi criado com sucesso em nossa plataforma.
          </p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #444;"><strong>Login:</strong> ${email}</p>
            <p style="margin: 0; color: #444;"><strong>Senha Temporária:</strong> ${password}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            Recomendamos trocar sua senha no primeiro acesso para garantir a segurança da sua conta.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            Este é um e-mail automático, por favor não responda.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, data });
  } catch (err: any) {
    console.error('API Error:', err);
    return Response.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
