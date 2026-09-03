import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'jugadoras')
      .eq('column_name', 'dni')
      .maybeSingle();

    if (error) {
      return NextResponse.json({
        dniExists: false,
        note: 'Could not check — information_schema may not be exposed. Column likely missing.',
        sql: 'ALTER TABLE jugadoras ADD COLUMN IF NOT EXISTS dni TEXT',
      });
    }

    if (data) {
      return NextResponse.json({ dniExists: true, message: 'DNI column already exists' });
    }

    return NextResponse.json({
      dniExists: false,
      sql: 'ALTER TABLE jugadoras ADD COLUMN IF NOT EXISTS dni TEXT',
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
