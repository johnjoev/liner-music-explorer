import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, serverClient } from '@/lib/supabase';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code && isConfigured()) {
    const client = await serverClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
