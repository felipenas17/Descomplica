import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { subscription, title, body, url } = await req.json();
    
    const webpush = await import('web-push');
    
    webpush.default.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@descomplica.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    );

    await webpush.default.sendNotification(
      subscription,
      JSON.stringify({ title, body, url: url || '/' })
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
