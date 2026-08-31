import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          email: 'kikemix@gmail.com',
          password: 'Test1234!',
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const data = await res.json();
    results.login = {
      status: res.status,
      ok: res.ok,
      hasToken: !!data.access_token,
      error: data.error || null,
      errorMessage: data.error_description || null,
    };
  } catch (e) {
    results.login = { error: e instanceof Error ? e.message : 'unknown' };
  }

  return NextResponse.json(results);
}
