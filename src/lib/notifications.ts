import { createClient } from "@/lib/supabase-server"
import { createChildLogger } from "@/lib/logger"

const log = createChildLogger("notifications")

export type Notificacion = {
  id: string
  tipo: string
  titulo: string
  descripcion: string | null
  enlace: string | null
  leida: boolean
  created_at: string
}

export async function getNotificacionesUsuario(
  usuarioId: string
): Promise<Notificacion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("created_at", { ascending: false })
    .limit(20)
  return data ?? []
}

export async function getNotificacionesNoLeidas(
  usuarioId: string
): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("notificaciones")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .eq("leida", false)
  return count ?? 0
}

export async function crearNotificacion(
  usuarioId: string,
  tipo: string,
  titulo: string,
  descripcion?: string,
  enlace?: string
) {
  const supabase = await createClient()
  await supabase.from("notificaciones").insert({
    usuario_id: usuarioId,
    tipo,
    titulo,
    descripcion: descripcion ?? null,
    enlace: enlace ?? null,
  })
}

export async function notificarUsuariosConPermiso(
  permiso: string,
  tipo: string,
  titulo: string,
  descripcion?: string,
  enlace?: string
) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return

  const { data: usuariosConPermiso } = await supabase
    .from("usuarios")
    .select("id")
    .neq("id", authData.user.id)

  if (!usuariosConPermiso) return

  const usuarioIds = usuariosConPermiso.map((u) => u.id)
  if (usuarioIds.length === 0) return

  const { data: usuarioPermisos } = await supabase
    .from("usuario_permisos")
    .select("usuario_id")
    .in("usuario_id", usuarioIds)

  const { data: rolesConPermiso } = await supabase
    .from("rol_permiso")
    .select("rol_id, permisos!inner(nombre)")
    .eq("permisos.nombre", permiso)

  const rolesIds = [...new Set((rolesConPermiso ?? []).map((rp) => rp.rol_id))]

  let usuariosARol: string[] = []
  if (rolesIds.length > 0) {
    const { data: usuariosRoles } = await supabase
      .from("usuarios")
      .select("id")
      .in("rol_id", rolesIds)
      .neq("id", authData.user.id)
    usuariosARol = (usuariosRoles ?? []).map((u) => u.id)
  }

  const usuariosDirectos = new Set(
    (usuarioPermisos ?? []).map((up) => up.usuario_id)
  )

  const todosLosUsuarios = new Set([...usuariosARol, ...usuariosDirectos])

  for (const uid of todosLosUsuarios) {
    try {
      await crearNotificacion(uid, tipo, titulo, descripcion, enlace)
    } catch (err) {
      log.error({ err, uid, tipo, titulo }, "Error creando notificación")
    }
  }
}
