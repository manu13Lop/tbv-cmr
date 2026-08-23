import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { createChildLogger } from "@/lib/logger"

const log = createChildLogger("audit")

type AuditAccion = "crear" | "actualizar" | "eliminar" | "agregar" | "quitar"

export async function logCambio(
  tabla: string,
  registroId: string | null,
  accion: AuditAccion,
  datosAnteriores?: Record<string, unknown> | null,
  datosNuevos?: Record<string, unknown> | null
) {
  const admin = createAdminClient()

  const { data: { user: authUser } } = await admin.auth.getUser()
  const supabase = await createClient()
  const { data: { user: jwtUser } } = await supabase.auth.getUser()

  const userId = authUser?.id ?? jwtUser?.id ?? null

  try {
    await admin.from("audit_log").insert({
      usuario_id: userId,
      tabla,
      registro_id: registroId,
      accion,
      datos_anteriores: datosAnteriores ?? null,
      datos_nuevos: datosNuevos ?? null,
    })
    log.debug({ tabla, registroId, accion, userId }, "Audit log registrado")
  } catch (err) {
    log.error({ err, tabla, registroId, accion }, "Error al registrar audit log")
  }
}
