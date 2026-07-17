import { createClient } from "@/lib/supabase-server"

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

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id")
  if (!usuarios) return

  for (const u of usuarios) {
    if (u.id === authData.user.id) continue
    try {
      await crearNotificacion(u.id, tipo, titulo, descripcion, enlace)
    } catch (err) {
      console.error("Error creando notificación:", err)
    }
  }
}
