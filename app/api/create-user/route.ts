import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized: nenhum token foi enviado pelo app' }, { status: 401 });
    const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized: token invalido/expirado - ' + (tokenError?.message || 'motivo desconhecido') }, { status: 401 });
    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });

    const { email, password, name, role } = await req.json();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role }
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      full_name: name,
      email,
      role,
      needs_password_change: true,
    });

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
