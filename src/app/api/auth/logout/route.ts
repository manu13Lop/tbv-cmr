import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const response = NextResponse.json({ ok: true });

  response.cookies.set(cookieName, '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
