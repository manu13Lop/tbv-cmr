import { createClient } from "@/lib/supabase-server"

const ROLES_NOMBRE: Record<string, string> = {
  "d711e285-4948-4d4f-8dc9-d5dc9872a253": "auxiliar",
  "140e02da-1ff4-4d41-b419-552587262bac": "directiva",
  "5c1b0361-228d-4ef2-9a26-17ef77e88d58": "director_tecnico",
  "c0e7dca0-79ca-410b-8979-622a7e160407": "entrenador",
  "038300fd-a3cd-4b61-8ac7-fd12743a5982": "sanitario",
}

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

    permisos = (todosLosPermisos ?? []).map((p: any) => p.nombre).filter(Boolean)
  } else if (usuario.rol_id) {
    const { data: rolPermisos } = await supabase
      .from("rol_permiso")
      .select("permiso_id")
      .eq("rol_id", usuario.rol_id)

    const permisosIds = (rolPermisos ?? []).map((p: any) => p.permiso_id)

    if (permisosIds.length > 0) {
      const { data: permisosData } = await supabase
        .from("permisos")
        .select("id, nombre")
        .in("id", permisosIds)

      permisos = (permisosData ?? []).map((p: any) => p.nombre).filter(Boolean)
    }
  }

  return {
    id: usuario.id,
    nombreCompleto: `${usuario.nombre} ${usuario.apellidos}`,
    puesto: usuario.es_master ? "Master" : ROLES_NOMBRE[usuario.rol_id] ?? "Sin rol",
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