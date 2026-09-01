import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const tests: Record<string, unknown> = {};

  // Test 1: Basic connectivity from Vercel to Supabase
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key! },
      signal: AbortSignal.timeout(10000),
    });
    tests.reachability = { status: res.status, ok: res.ok };
  } catch (e) {
    tests.reachability = { error: e instanceof Error ? e.message : String(e) };
  }

  // Test 2: Direct IP resolution
  try {
    const hostname = new URL(url!).hostname;
    const res2 = await fetch(`https://dns.google/resolve?name=${hostname}`, {
      signal: AbortSignal.timeout(5000),
    });
    const dns = await res2.json();
    tests.dns = {
      hostname,
      answers: dns.Answer?.map((a: Record<string, unknown>) => `${a.type} ${a.data}`) || [],
    };
  } catch (e) {
    tests.dns = { error: e instanceof Error ? e.message : String(e) };
  }

  // Test 3: Environment variables present
  tests.env = {
    urlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    keySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  return NextResponse.json(tests);
}
