import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[API] Missing Supabase environment variables');
      return Response.json({ error: 'Supabase configuration missing on server' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (error) {
      console.error('[API] Error confirming user:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, user: data.user });
  } catch (err: any) {
    console.error('[API] Unexpected error in confirm-user:', err);
    return Response.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
