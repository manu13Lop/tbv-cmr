import { createClient } from "@/lib/supabase-server"

export async function getUsuarioActual() {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return null

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, nombre, apellidos, rol_id, es_master")
    .eq("id", authData.user.id)
    .single()

  if (!usuario) return null

  let permisos: string[] = []

  if (usuario.es_master) {
    const { data: todosLosPermisos } = await supabase
      .from("permisos")
      .select("nombre")

    permisos = (todosLosPermisos ?? []).map((p) => p.nombre).filter(Boolean)
  } else {
    const permisoIds: string[] = []

    if (usuario.rol_id) {
      const { data: rolPermisos } = await supabase
        .from("rol_permiso")
        .select("permiso_id")
        .eq("rol_id", usuario.rol_id)

      permisoIds.push(...(rolPermisos ?? []).map((p) => p.permiso_id))
    }

    const { data: permisosPropios } = await supabase
      .from("usuario_permisos")
      .select("permiso_id")
      .eq("usuario_id", usuario.id)

    permisoIds.push(...(permisosPropios ?? []).map((p) => p.permiso_id))

    if (permisoIds.length > 0) {
      const { data: permisosData } = await supabase
        .from("permisos")
        .select("id, nombre")
        .in("id", permisoIds)

      const seen = new Set<string>()
      for (const p of permisosData ?? []) {
        if (!seen.has(p.nombre)) {
          seen.add(p.nombre)
          permisos.push(p.nombre)
        }
      }
    }
  }

  let puesto = "Sin rol"
  if (usuario.es_master) {
    puesto = "Master"
  } else if (usuario.rol_id) {
    const { data: rol } = await supabase
      .from("roles")
      .select("nombre")
      .eq("id", usuario.rol_id)
      .single()
    puesto = rol?.nombre ?? "Sin rol"
  }

  return {
    id: usuario.id,
    nombreCompleto: `${usuario.nombre} ${usuario.apellidos}`,
    puesto,
    rolId: usuario.rol_id,
    esMaster: !!usuario.es_master,
    permisos,
  }
}

export function tienePermiso(
  permisos: string[] | undefined,
  permiso: string
) {
  return !!permisos?.includes(permiso)
}
