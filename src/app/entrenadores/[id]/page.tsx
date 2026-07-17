import { createClient } from "@/lib/supabase-server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { validateFormData, getFirstError } from "@/lib/validate"
import { actualizarEntrenadorSchema, asignarEquipoEntrenadorSchema } from "@/lib/validations"
import { ArrowLeft, Trash2 } from "lucide-react"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"

async function actualizarEntrenador(id: string, formData: FormData) {
  "use server"

  const validation = validateFormData(actualizarEntrenadorSchema, formData)
  if (!validation.success) {
    return redirect(`/entrenadores/${id}?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const supabase = await createClient()

  await supabase
    .from("entrenadores")
    .update({
      nombre: validation.data.nombre,
      apellidos: validation.data.apellidos,
      email: validation.data.email || null,
      telefono: validation.data.telefono || null,
      titulacion: validation.data.titulacion || null,
      especialidad: validation.data.especialidad || null,
      activo: validation.data.activo ?? true,
    })
    .eq("id", id)

  redirect(`/entrenadores/${id}`)
}

async function asignarEquipo(entrenadorId: string, formData: FormData) {
  "use server"

  const validation = validateFormData(asignarEquipoEntrenadorSchema, formData)
  if (!validation.success) {
    return redirect(`/entrenadores/${entrenadorId}?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const supabase = await createClient()

  await supabase.from("entrenador_equipo").insert({
    entrenador_id: entrenadorId,
    equipo_id: validation.data.equipo_id,
    temporada: validation.data.temporada,
  })

  redirect(`/entrenadores/${entrenadorId}`)
}

async function desasignarEquipo(asignacionId: string, entrenadorId: string) {
  "use server"

  const supabase = await createClient()
  await supabase.from("entrenador_equipo").delete().eq("id", asignacionId)
  redirect(`/entrenadores/${entrenadorId}`)
}

export default async function EntrenadorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const usuario = await getUsuarioActual()
  const puedeEditar = tienePermiso(usuario?.permisos, "equipos.editar")

  const supabase = await createClient()

  const { data: entrenador } = await supabase
    .from("entrenadores")
    .select("*")
    .eq("id", id)
    .single()

  if (!entrenador) notFound()

  const { data: asignaciones } = await supabase
    .from("entrenador_equipo")
    .select("id, temporada, equipos ( id, nombre, categoria, temporada )")
    .eq("entrenador_id", id)

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre, categoria, temporada")
    .order("temporada", { ascending: false })

  const { data: ejercicios } = await supabase
    .from("ejercicios")
    .select("id, categoria, titulo, imagen_url")
    .eq("entrenador_creador_id", id)
    .order("created_at", { ascending: false })

  const updateAction = actualizarEntrenador.bind(null, id)
  const asignarAction = asignarEquipo.bind(null, id)

  const equiposNoAsignados = (equipos ?? []).filter(
    (eq) => !(asignaciones ?? []).some((a: any) => a.equipos?.id === eq.id)
  )

  return (
    <div className="p-6">
      <Link
        href="/entrenadores"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a entrenadores
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">
        {entrenador.nombre} {entrenador.apellidos}
      </h1>

      {/* Datos personales */}
      <details className="mb-6 rounded-lg border border-border bg-card" open>
        <summary className="cursor-pointer p-4 text-sm font-medium text-primary">
          Datos personales
        </summary>
        <form action={updateAction} className="space-y-4 p-4 pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                name="nombre"
                defaultValue={entrenador.nombre}
                required
                disabled={!puedeEditar}
                className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Apellidos</label>
              <input
                name="apellidos"
                defaultValue={entrenador.apellidos}
                required
                disabled={!puedeEditar}
                className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={entrenador.email ?? ""}
                disabled={!puedeEditar}
                className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono</label>
              <input
                name="telefono"
                defaultValue={entrenador.telefono ?? ""}
                disabled={!puedeEditar}
                className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Titulación</label>
            <input
              name="titulacion"
              defaultValue={entrenador.titulacion ?? ""}
              disabled={!puedeEditar}
              className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Especialidad</label>
            <select
              name="especialidad"
              defaultValue={entrenador.especialidad ?? ""}
              disabled={!puedeEditar}
              className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
            >
              <option value="">Sin especialidad</option>
              <option value="entrenador_general">Entrenador general</option>
              <option value="entrenador_porteros">Entrenador de porteros</option>
              <option value="preparador_fisico">Preparador físico</option>
              <option value="analista">Analista</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {puedeEditar && <FormSubmitButton>Guardar cambios</FormSubmitButton>}
        </form>
      </details>

      {/* Equipos asignados */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-primary">Equipos asignados</h2>

        {!asignaciones || asignaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este entrenador no tiene equipos asignados.
          </p>
        ) : (
          <div className="mb-4 space-y-2">
            {asignaciones.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <Link
                  href={`/equipos/${a.equipos?.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {a.equipos?.nombre} ({a.equipos?.categoria}) — {a.temporada}
                </Link>
                {puedeEditar && (
                  <form action={desasignarEquipo.bind(null, a.id, id)}>
                    <button
                      type="submit"
                      className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {puedeEditar && equiposNoAsignados.length > 0 && (
          <form action={asignarAction} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Asignar equipo</label>
              <select
                name="equipo_id"
                required
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              >
                <option value="" disabled>
                  Selecciona un equipo
                </option>
                {equiposNoAsignados.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre} ({eq.categoria}) - {eq.temporada}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="mb-1 block text-sm font-medium">Temporada</label>
              <input
                name="temporada"
                defaultValue={new Date().getFullYear().toString()}
                required
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
            <FormSubmitButton>Asignar</FormSubmitButton>
          </form>
        )}
      </div>

      {/* Ejercicios creados */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-primary">Ejercicios creados</h2>
          <Link
            href="/entrenadores/ejercicios"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Ver biblioteca completa
          </Link>
        </div>

        {!ejercicios || ejercicios.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este entrenador no ha creado ejercicios todavía.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ejercicios.map((ej) => (
              <Link
                key={ej.id}
                href={`/entrenadores/ejercicios/${ej.id}`}
                className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-muted/50"
              >
                {ej.imagen_url ? (
                  <img
                    src={ej.imagen_url}
                    alt={ej.titulo}
                    className="size-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                    Sin foto
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{ej.titulo}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {ej.categoria.replace("_", " ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
