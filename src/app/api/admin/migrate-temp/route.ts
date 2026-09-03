import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // @ts-expect-error - pg is installed for migration only
    const { Client } = await import('pg');

    const client = new Client({
      host: 'aws-0-eu-west-1.pooler.supabase.com',
      port: 6543,
      user: 'postgres.ufhlipsfkzwsswmllfek',
      password: process.env.SUPABASE_DB_PASSWORD || 'TbvSupabase2026!',
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false,
        servername: 'db.ufhlipsfkzwsswmllfek.supabase.co',
      },
      connectionTimeoutMillis: 10000,
    });

    await client.connect();
    const result = await client.query('ALTER TABLE jugadoras ADD COLUMN IF NOT EXISTS dni TEXT');
    await client.end();

    return NextResponse.json({ ok: true, command: result.command });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown error' },
      { status: 500 }
    );
  }
}
