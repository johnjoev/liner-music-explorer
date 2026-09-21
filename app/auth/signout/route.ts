import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, serverClient } from '@/lib/supabase';
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  if (isConfigured()) {
    const client = await serverClient();
    await client.auth.signOut();
  }
  return NextResponse.redirect(new URL('/login', request.url), 303);
}
