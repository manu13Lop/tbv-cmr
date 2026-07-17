import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { actualizarSesionPsicologiaSchema } from "@/lib/validations"

async function actualizarSesion(sesionId: string, formData: FormData) {
  "use server"

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.editar")) {
    return redirect("/sanitario")
  }

  const validation = validateFormData(actualizarSesionPsicologiaSchema, formData)
  if (!validation.success) {
    return redirect(`/sanitario/psicologia/${sesionId}?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const supabase = await createClient()

  const { tema, objetivos, desarrollo, acuerdos, estado } = validation.data

  await supabase
    .from("psicologia_sesiones")
    .update({
      tema,
      objetivos,
      desarrollo,
      acuerdos,
      estado,
    })
    .eq("id", sesionId)

  redirect(`/sanitario/psicologia/${sesionId}`)
}

export default async function PsicologiaSesionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.leer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: sesion } = await supabase
    .from("psicologia_sesiones")
    .select(`
      *,
      jugadoras ( nombre, apellidos ),
      equipos ( nombre )
    `)
    .eq("id", id)
    .single()

  if (!sesion) notFound()

  const destino =
    sesion.tipo_sesion === "individual"
      ? `${sesion.jugadoras?.nombre ?? ""} ${sesion.jugadoras?.apellidos ?? ""}`.trim()
      : sesion.equipos?.nombre ?? "Equipo"

  const puedeEditar = tienePermiso(usuario.permisos, "sanitario.editar")

  return (
    <div className="p-6">
      <Link
        href="/sanitario/psicologia"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a psicología
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Sesión {sesion.tipo_sesion === "individual" ? "individual" : "grupal"} — {destino}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(sesion.fecha_hora).toLocaleString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            — estado: {sesion.estado}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <p className="mb-1 text-sm font-medium">Tema</p>
        <p className="text-sm text-muted-foreground">{sesion.tema}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Registrado por {sesion.autor_nombre_snapshot} ({sesion.autor_puesto_snapshot})
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {sesion.objetivos && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-sm font-medium">Objetivos trabajados</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {sesion.objetivos}
            </p>
          </div>
        )}
        {sesion.acuerdos && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-sm font-medium">Acuerdos / tareas</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {sesion.acuerdos}
            </p>
          </div>
        )}
      </div>

      {sesion.desarrollo && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="mb-1 text-sm font-medium">Desarrollo de la sesión</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {sesion.desarrollo}
          </p>
        </div>
      )}

      {puedeEditar && (
        <form
          action={actualizarSesion.bind(null, id)}
          className="max-w-2xl space-y-4 rounded-lg border border-border bg-card p-4"
        >
          <p className="text-sm font-medium">Editar sesión</p>

          <div>
            <label className="mb-1 block text-sm font-medium">Tema</label>
            <input
              name="tema"
              defaultValue={sesion.tema}
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
              defaultValue={sesion.objetivos ?? ""}
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
              defaultValue={sesion.desarrollo ?? ""}
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
              defaultValue={sesion.acuerdos ?? ""}
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Estado</label>
            <select
              name="estado"
              defaultValue={sesion.estado}
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            >
              <option value="abierta">Abierta</option>
              <option value="cerrada">Cerrada</option>
            </select>
          </div>

          <FormSubmitButton>Guardar cambios</FormSubmitButton>
        </form>
      )}
    </div>
  )
}