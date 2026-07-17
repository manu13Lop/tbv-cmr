import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('convocatoria', 'lesion', 'mensaje', 'reconocimiento', 'general')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  enlace TEXT,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_no_leidas ON notificaciones(usuario_id) WHERE leida = FALSE;

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Usuarios ven sus propias notificaciones"
    ON notificaciones FOR SELECT
    USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios pueden insertar notificaciones"
    ON notificaciones FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios pueden marcar las suyas como leidas"
    ON notificaciones FOR UPDATE
    USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Check if user is master
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("es_master")
      .eq("id", user.id)
      .single()

    if (!usuario?.es_master) {
      return NextResponse.json({ error: "Solo usuarios master pueden ejecutar setup" }, { status: 403 })
    }

    // Try to query the table to see if it exists
    const { error: checkError } = await supabase
      .from("notificaciones")
      .select("id")
      .limit(1)

    if (!checkError) {
      return NextResponse.json({
        status: "already_exists",
        message: "La tabla notificaciones ya existe. No se necesita migración."
      })
    }

    if (checkError.code !== "42P01") {
      return NextResponse.json({
        status: "error",
        message: `Error inesperado: ${checkError.message}`,
        code: checkError.code
      })
    }

    // Table doesn't exist - we need to create it via SQL
    // Since we can't run DDL through PostgREST, we'll use the Management API
    // Actually, let's try using pg RPC

    return NextResponse.json({
      status: "needs_manual_migration",
      message: "La tabla notificaciones no existe. Por favor, ejecuta el SQL en el dashboard de Supabase.",
      sql: MIGRATION_SQL,
      instructions: [
        "1. Ve a https://supabase.com/dashboard/project/rjityxezckvvhfqcdsjt/sql/new",
        "2. Pega el SQL que aparece en el campo 'sql' de esta respuesta",
        "3. Haz clic en 'Run'",
        "4. Vuelve a esta página para verificar"
      ]
    })

  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message
    }, { status: 500 })
  }
}
