import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // Database connectivity
  const dbStart = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('usuarios').select('id', { count: 'exact', head: true });
    checks.database = { ok: !error, latencyMs: Date.now() - dbStart, error: error?.message };
  } catch (e) {
    checks.database = { ok: false, latencyMs: Date.now() - dbStart, error: String(e) };
  }

  // Environment variables
  checks.env = {
    ok: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  };

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
