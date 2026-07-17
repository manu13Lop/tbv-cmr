import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearSesionPsicologiaSchema } from "@/lib/validations"

async function crearSesion(formData: FormData) {
  "use server"

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.editar")) {
    return redirect("/sanitario")
  }

  const validation = validateFormData(crearSesionPsicologiaSchema, formData)
  if (!validation.success) {
    return redirect(`/sanitario/psicologia/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const supabase = await createClient()

  const { tipo_sesion, jugadora_id, equipo_id, fecha_hora, tema, objetivos, desarrollo, acuerdos } = validation.data

  const { data: sesion, error } = await supabase
    .from("psicologia_sesiones")
    .insert({
      tipo_sesion,
      jugadora_id: tipo_sesion === "individual" ? jugadora_id ?? null : null,
      equipo_id: tipo_sesion === "grupal" ? equipo_id ?? null : null,
      fecha_hora,
      tema,
      objetivos,
      desarrollo,
      acuerdos,
      estado: "abierta",
      autor_usuario_id: usuario.id,
      autor_nombre_snapshot: usuario.nombreCompleto,
      autor_puesto_snapshot: usuario.puesto,
    })
    .select("id")
    .single()

  if (error || !sesion) {
    console.error(error)
    return redirect("/sanitario/psicologia")
  }

  redirect(`/sanitario/psicologia/${sesion.id}`)
}

export default async function NuevaSesionPsicologiaPage() {
  const usuario = await getUsuarioActual()

  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.editar")) {
    redirect("/sanitario")
  }

  const supabase = await createClient()

  const { data: jugadoras } = await supabase
    .from("jugadoras")
    .select("id, nombre, apellidos")
    .eq("activa", true)
    .order("apellidos", { ascending: true })

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre")
    .order("nombre", { ascending: true })

  return (
    <div className="p-6">
      <Link
        href="/sanitario/psicologia"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a psicología
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">
        Nueva sesión de psicología
      </h1>

      <form
        action={crearSesion}
        className="max-w-2xl space-y-4 rounded-lg border border-border bg-card p-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Tipo de sesión
            </label>
            <select
              name="tipo_sesion"
              required
              defaultValue="individual"
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            >
              <option value="individual">Individual</option>
              <option value="grupal">Grupal / de equipo</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              name="fecha_hora"
              required
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Jugadora (si es individual)
            </label>
            <select
              name="jugadora_id"
              defaultValue=""
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            >
              <option value="">-</option>
              {jugadoras?.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nombre} {j.apellidos}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Equipo (si es grupal)
            </label>
            <select
              name="equipo_id"
              defaultValue=""
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            >
              <option value="">-</option>
              {equipos?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tema</label>
          <input
            name="tema"
            required
            placeholder="Ej: Ansiedad competitiva, cohesión de equipo, adaptación a lesión..."
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Objetivos trabajados
          </label>
          <textarea
            name="objetivos"
            rows={3}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Desarrollo de la sesión
          </label>
          <textarea
            name="desarrollo"
            rows={4}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Acuerdos / tareas
          </label>
          <textarea
            name="acuerdos"
            rows={3}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <FormSubmitButton>Guardar sesión</FormSubmitButton>
      </form>
    </div>
  )
}