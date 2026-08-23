import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual } from "@/lib/auth-helpers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft, Save, Key, Shield } from "lucide-react"
import {
  actualizarUsuario,
  resetearPassword,
  togglePermisoUsuario,
} from "@/lib/usuarios-actions"
import { getRoles } from "@/lib/roles"

export default async function EditarUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ok?: string; error?: string; msg?: string }>
}) {
  const { id, ok, error, msg } = await searchParams

  if (!id) {
    redirect("/usuarios")
  }

  const usuarioActual = await getUsuarioActual()
  if (!usuarioActual || !usuarioActual.esMaster) {
    redirect("/")
  }

  const supabase = await createClient()

  const [roles, { data: usuarioEditar, error: errorUsuario }, { data: permisos }, { data: usuarioPermisosRaw }] = await Promise.all([
    getRoles(),
    supabase
      .from("usuarios")
      .select("id, nombre, apellidos, rol_id, es_master")
      .eq("id", id)
      .single(),
    supabase
      .from("permisos")
      .select("id, nombre, descripcion")
      .order("nombre"),
    supabase
      .from("usuario_permisos")
      .select("permisos!inner(nombre)")
      .eq("usuario_id", id),
  ])

  if (errorUsuario || !usuarioEditar) {
    notFound()
  }

  const permisosUsuario: string[] = ((usuarioPermisosRaw ?? []) as any[]).map((p) => p.permisos?.nombre)

  return (
    <div className="p-6">
      <Link
        href="/usuarios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Usuarios
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Editar usuario: {usuarioEditar.nombre} {usuarioEditar.apellidos}</h1>

      {ok === "1" && (
        <div className="mb-4 rounded-md border border-primary bg-primary/10 p-3 text-sm text-primary">
          Usuario actualizado correctamente.
        </div>
      )}
      {msg === "password_reseteado" && (
        <div className="mb-4 rounded-md border border-primary bg-primary/10 p-3 text-sm text-primary">
          Contraseña reseteada. Nueva password generada aleatoriamente.
        </div>
      )}
      {error === "1" && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          Hubo un error al actualizar el usuario.
        </div>
      )}

      <form
        action={actualizarUsuario.bind(null, id)}
        className="mb-8 max-w-lg space-y-4 rounded-lg border border-border bg-card p-4"
      >
        <p className="text-sm font-medium flex items-center gap-2">
          <Save className="size-4" />
          Información básica
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              name="nombre"
              required
              defaultValue={usuarioEditar.nombre}
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Apellidos</label>
            <input
              name="apellidos"
              required
              defaultValue={usuarioEditar.apellidos}
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            defaultValue=""
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Deja en blanco para no modificar el email
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Rol</label>
          <select
            name="rol_id"
            required
            defaultValue={usuarioEditar.rol_id ?? ""}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
            disabled={usuarioEditar.es_master}
          >
            <option value="">Selecciona un rol</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          {usuarioEditar.es_master && (
            <p className="mt-1 text-xs text-muted-foreground">
              Los usuarios master tienen todos los permisos
            </p>
          )}
        </div>

        <FormSubmitButton>Guardar cambios</FormSubmitButton>
      </form>

      <div className="mb-8 rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium flex items-center gap-2">
          <Shield className="size-4" />
          Permisos individuales
        </p>

        {usuarioEditar.es_master ? (
          <p className="text-xs text-muted-foreground">
            Este usuario es Master y tiene acceso a todos los permisos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(permisos ?? []).map((p) => {
              const tiene = permisosUsuario.includes(p.nombre)
              const toggleAction = togglePermisoUsuario.bind(null, id)
              return (
                <form key={p.id} action={toggleAction}>
                  <input type="hidden" name="permiso" value={p.nombre} />
                  <input type="hidden" name="accion" value={tiene ? "quitar" : "agregar"} />
                  <button
                    type="submit"
                    className={`text-xs px-3 py-1 rounded ${
                      tiene
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/50"
                    }`}
                    title={tiene ? `Quitar permiso ${p.nombre}` : `Dar permiso ${p.nombre}`}
                  >
                    {p.nombre}
                  </button>
                </form>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <form action={resetearPassword.bind(null, id)} className="inline">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-primary hover:bg-muted"
          >
            <Key className="size-4" />
            Resetear contraseña
          </button>
        </form>
      </div>
    </div>
  )
}
