import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { secret } = await request.json();

  if (secret !== 'tbv-run-migration-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE jugadoras ADD COLUMN IF NOT EXISTS dni TEXT',
    });

    if (error) {
      return NextResponse.json({ error: error.message, step: 'exec_sql' });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
}
