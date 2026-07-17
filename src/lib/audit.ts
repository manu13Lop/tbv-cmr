import { createClient } from "@/lib/supabase-server"

type AuditAccion = "crear" | "actualizar" | "eliminar"

export async function logCambio(
  tabla: string,
  registroId: string | null,
  accion: AuditAccion,
  datosAnteriores?: Record<string, any> | null,
  datosNuevos?: Record<string, any> | null
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("audit_log").insert({
      usuario_id: user?.id ?? null,
      tabla,
      registro_id: registroId,
      accion,
      datos_anteriores: datosAnteriores ?? null,
      datos_nuevos: datosNuevos ?? null,
    })
  } catch {
    // Silent fail — audit should never break the main flow
  }
}
