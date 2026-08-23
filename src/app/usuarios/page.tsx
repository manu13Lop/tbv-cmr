import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { EliminarUsuarioButton } from "@/components/eliminar-usuario-button"
import { ArrowLeft, Plus } from "lucide-react"
import { PaginationWrapper as Pagination } from "@/components/pagination-wrapper"
import {
  crearUsuario,
  cambiarRol,
  crearPermiso,
  crearRol,
  actualizarPermisosRol,
  eliminarPermiso,
  eliminarUsuario,
} from "@/lib/usuarios-actions"
import { getRoles } from "@/lib/roles"

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string; error?: string; page?: string; seccion?: string; editar_rol?: string }>
}) {
  const usuarioActual = await getUsuarioActual()
  if (
    !usuarioActual ||
    !(usuarioActual.esMaster || tienePermiso(usuarioActual.permisos, "usuarios.gestionar"))
  ) {
    redirect("/")
  }

  const { creado, error, page, seccion } = await searchParams

  const supabase = await createClient()
  const clienteQWeed = usuarioActual.esMaster ? createAdminClient() : supabase

  const [roles, { data: usuarios }, { data: permisosConRoles }] = await Promise.all([
    getRoles(),
    clienteQWeed
      .from("usuarios")
      .select(`
        id,
        nombre,
        apellidos,
        rol_id,
        es_master,
        usuario_permisos!left(
          permiso_id,
          permisos!inner(nombre)
        )
      `)
      .order("apellidos", { ascending: true }),
    usuarioActual.esMaster
      ? clienteQWeed
          .from("permisos")
          .select(`
            id,
            nombre,
            descripcion,
            rol_permiso!left(rol_id)
          `)
          .order("nombre")
      : Promise.resolve({ data: null }),
  ])

  const rolesMap = new Map(roles.map((r) => [r.id, r.nombre]))

  const allUsuarios = (usuarios ?? []).map((u) => ({
    id: u.id,
    nombre: u.nombre,
    apellidos: u.apellidos,
    rol_id: u.rol_id,
    es_master: u.es_master,
    permisosIndividuales: ((u.usuario_permisos ?? []) as any[]).map((up) => up.permisos?.nombre).filter(Boolean) as string[],
  }))

  const permisos = (permisosConRoles ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    rolesIds: (p.rol_permiso ?? []).map((rp) => rp.rol_id) as string[],
  }))

  const permisosPorRol: Record<string, string[]> = {}
  for (const p of permisos) {
    for (const rolId of p.rolesIds) {
      if (!permisosPorRol[rolId]) permisosPorRol[rolId] = []
      permisosPorRol[rolId].push(p.nombre)
    }
  }

  const permisosPorUsuario: Record<string, string[]> = {}
  for (const u of allUsuarios) {
    permisosPorUsuario[u.id] = u.permisosIndividuales
  }

  const itemsPerPage = 15
  const totalPages = Math.ceil(allUsuarios.length / itemsPerPage)
  const currentPage = Math.max(1, Math.min(Number(page) || 1, totalPages || 1))
  const paginatedUsuarios = allUsuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const mostrarPermisos = seccion === "permisos" || usuarioActual.esMaster

  return (
    <div className="p-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Usuarios</h1>

      {creado === "1" && (
        <div className="mb-4 rounded-md border border-primary bg-primary/10 p-3 text-sm text-primary">
          Usuario creado correctamente.
        </div>
      )}
      {error === "email_duplicado" && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          El email ya está registrado. Usa otro email o elimina el usuario existente.
        </div>
      )}
      {error === "1" && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          Hubo un error al crear el usuario. Revisa el email y vuelve a intentarlo.
        </div>
      )}

      <form
        action={crearUsuario}
        className="mb-8 max-w-lg space-y-4 rounded-lg border border-border bg-card p-4"
      >
        <p className="text-sm font-medium">Nuevo usuario</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              name="nombre"
              required
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Apellidos</label>
            <input
              name="apellidos"
              required
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Contraseña provisional</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Rol</label>
          <select
            name="rol_id"
            required
            defaultValue=""
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="" disabled>
              Selecciona un rol
            </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <FormSubmitButton>Crear usuario</FormSubmitButton>
      </form>

      <h2 className="mb-3 text-lg font-bold text-primary">Usuarios existentes</h2>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left font-medium">Nombre</th>
              <th className="p-3 text-left font-medium">Rol actual</th>
              <th className="p-3 text-left font-medium">Cambiar rol</th>
              {usuarioActual.esMaster && (
                <>
                  <th className="p-3 text-left font-medium">Permisos</th>
                  <th className="p-3 text-left font-medium">Acciones</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedUsuarios.map((u) => {
              const rolNombre = rolesMap.get(u.rol_id) ?? "Sin rol"
              const cambiarRolAction = cambiarRol.bind(null, u.id)

              return (
                   <tr key={u.id} className="border-t border-border">
                   <td className="p-3 font-medium">
                     {u.nombre} {u.apellidos}
                     <span className="ml-2 text-xs text-muted-foreground/40">[{u.id.slice(0, 8)}...]</span>
                   </td>
                  <td className="p-3">{u.es_master ? "Master" : rolNombre}</td>
                  <td className="p-3">
                    {u.es_master ? (
                      <span className="text-xs text-muted-foreground">No aplica</span>
                    ) : (
                      <form action={cambiarRolAction} className="flex gap-2">
                        <select
                          name="rol_id"
                          defaultValue={u.rol_id ?? ""}
                          className="rounded-md border border-border bg-background p-1 text-xs"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="text-xs text-primary hover:underline">
                          Guardar
                        </button>
                      </form>
                    )}
                  </td>
                  {usuarioActual.esMaster && (
                    <td className="p-3">
                      {u.es_master ? (
                        <span className="text-xs text-muted-foreground">Master (todos)</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          {permisos.map((p) => {
                            const tienePermisoUser = (permisosPorUsuario[u.id] ?? []).includes(p.nombre)
                            if (!tienePermisoUser) return null
                            return (
                              <span key={p.id} className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                {p.nombre}
                              </span>
                            )
                          })}
                          <span className="text-xs text-muted-foreground">
                            ({permisosPorUsuario[u.id]?.length ?? 0} de {permisos?.length ?? 0})
                          </span>
                        </div>
                      )}
                    </td>
                  )}
                  {usuarioActual.esMaster && (
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                         <Link
                           href={`/usuarios/editar?id=${encodeURIComponent(u.id)}`}
                           className="text-xs text-primary hover:underline"
                           title={`ID: ${u.id}`}
                         >
                          Gestionar
                        </Link>
                        <form action={eliminarUsuario.bind(null, u.id)} className="inline">
                          <EliminarUsuarioButton
                            className="text-xs text-destructive hover:text-red-700"
                            title="Eliminar usuario"
                          >
                            Eliminar
                          </EliminarUsuarioButton>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}
