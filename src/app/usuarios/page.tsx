import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearUsuarioSchema } from "@/lib/validations"
import { PaginationWrapper as Pagination } from "@/components/pagination-wrapper"

const ROLES = [
  { id: "d711e285-4948-4d4f-8dc9-d5dc9872a253", nombre: "auxiliar" },
  { id: "140e02da-1ff4-4d41-b419-552587262bac", nombre: "directiva" },
  { id: "5c1b0361-228d-4ef2-9a26-17ef77e88d58", nombre: "director_tecnico" },
  { id: "c0e7dca0-79ca-410b-8979-622a7e160407", nombre: "entrenador" },
  { id: "038300fd-a3cd-4b61-8ac7-fd12743a5982", nombre: "sanitario" },
]

async function crearUsuario(formData: FormData) {
  "use server"
  const usuarioActual = await getUsuarioActual()
  if (!usuarioActual || !(usuarioActual.esMaster || tienePermiso(usuarioActual.permisos, "usuarios.gestionar"))) {
    return
  }

  const validation = validateFormData(crearUsuarioSchema, formData)
  if (!validation.success) {
    return redirect(`/usuarios?error=1`)
  }

  const { email, password, nombre, apellidos, rol_id } = validation.data

  const admin = createAdminClient()

  const { data: nuevoAuthUser, error: errorAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (errorAuth || !nuevoAuthUser?.user) {
    console.error(errorAuth)
    return redirect("/usuarios?error=1")
  }

  const { error: errorTabla } = await admin.from("usuarios").insert({
    id: nuevoAuthUser.user.id,
    nombre,
    apellidos,
    rol_id,
    es_master: false,
  })

  if (errorTabla) {
    console.error(errorTabla)
    return redirect("/usuarios?error=1")
  }

  redirect("/usuarios?creado=1")
}

async function cambiarRol(usuarioId: string, formData: FormData) {
  "use server"
  const usuarioActual = await getUsuarioActual()
  if (!usuarioActual || !(usuarioActual.esMaster || tienePermiso(usuarioActual.permisos, "usuarios.gestionar"))) {
    return
  }

  const rolId = formData.get("rol_id") as string
  const supabase = await createClient()

  await supabase.from("usuarios").update({ rol_id: rolId }).eq("id", usuarioId)

  redirect("/usuarios")
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string; error?: string; page?: string }>
}) {
  const usuarioActual = await getUsuarioActual()
  if (
    !usuarioActual ||
    !(usuarioActual.esMaster || tienePermiso(usuarioActual.permisos, "usuarios.gestionar"))
  ) {
    redirect("/")
  }

  const { creado, error, page } = await searchParams

  const supabase = await createClient()
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre, apellidos, rol_id, es_master")
    .order("apellidos", { ascending: true })

  const allUsuarios = usuarios ?? []
  const itemsPerPage = 15
  const totalPages = Math.ceil(allUsuarios.length / itemsPerPage)
  const currentPage = Math.max(1, Math.min(Number(page) || 1, totalPages || 1))
  const paginatedUsuarios = allUsuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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
            {ROLES.map((r) => (
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
            </tr>
          </thead>
          <tbody>
            {paginatedUsuarios.map((u) => {
              const rolNombre = ROLES.find((r) => r.id === u.rol_id)?.nombre ?? "Sin rol"
              const cambiarRolAction = cambiarRol.bind(null, u.id)

              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-medium">{u.nombre} {u.apellidos}</td>
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
                          {ROLES.map((r) => (
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