import { createClient } from "@/lib/supabase-server"

export type Rol = {
  id: string
  nombre: string
}

let rolesCache: { data: Rol[]; timestamp: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

export async function getRoles(): Promise<Rol[]> {
  if (rolesCache && Date.now() - rolesCache.timestamp < CACHE_TTL_MS) {
    return rolesCache.data
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("roles")
    .select("id, nombre")
    .order("nombre")

  const roles = data ?? []
  rolesCache = { data: roles, timestamp: Date.now() }
  return roles
}

export function clearRolesCache() {
  rolesCache = null
}

export function getRolNombre(roles: Rol[], rolId: string | null): string {
  if (!rolId) return "Sin rol"
  return roles.find((r) => r.id === rolId)?.nombre ?? "Sin rol"
}
