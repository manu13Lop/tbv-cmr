import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft, CalendarDays } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { actualizarEquipoSchema } from "@/lib/validations"

async function actualizarEquipo(id: string, formData: FormData) {
  "use server"
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "equipos.editar")) return

  const validation = validateFormData(actualizarEquipoSchema, formData)
  if (!validation.success) {
    return redirect(`/equipos/${id}?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }
  const { nombre, categoria, temporada, federada } = validation.data

  const supabase = await createClient()

  const { error } = await supabase
    .from("equipos")
    .update({
      nombre,
      categoria,
      temporada,
      federada: federada ?? false,
    })
    .eq("id", id)

  if (error) {
    console.error(error)
    return
  }

  redirect("/equipos")
}

export default async function EquipoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "equipos.leer")) {
    redirect("/")
  }
  const puedeEditar = tienePermiso(usuario.permisos, "equipos.editar")

  const supabase = await createClient()

  const { data: equipo } = await supabase
    .from("equipos")
    .select("*")
    .eq("id", id)
    .single()

  if (!equipo) notFound()

  // Historial de entrenamientos del equipo
  const { data: entrenamientosEquipo } = await supabase
    .from("eventos")
    .select("id, fecha_hora, lugar, tipo")
    .eq("equipo_id", id)
    .eq("tipo", "entrenamiento")
    .order("fecha_hora", { ascending: false })

  // Obtener datos de sesión para cada entrenamiento
  const entrenamientosConSesion: any[] = []
  for (const ev of (entrenamientosEquipo ?? [])) {
    const { data: sesion } = await supabase
      .from("sesion_entrenamiento")
      .select("id, objetivo_principal, objetivo_secundario_a, objetivo_secundario_b, observaciones_entrenador, valoracion_entrenamiento")
      .eq("evento_id", ev.id)
      .maybeSingle()

    entrenamientosConSesion.push({
      ...ev,
      sesion,
    })
  }

  const updateAction = actualizarEquipo.bind(null, id)

  return (
    <div className="p-6">
      <Link
        href="/equipos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a equipos
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">{equipo.nombre}</h1>

      <form action={updateAction} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            name="nombre"
            defaultValue={equipo.nombre}
            required
            disabled={!puedeEditar}
            className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <input
            name="categoria"
            list="categorias"
            defaultValue={equipo.categoria}
            required
            disabled={!puedeEditar}
            className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
          />
          <datalist id="categorias">
            <option value="Benjamín" />
            <option value="Alevín" />
            <option value="Infantil" />
            <option value="Cadete" />
            <option value="Juvenil" />
            <option value="Junior" />
            <option value="Senior" />
            <option value="Senior A" />
            <option value="Senior B" />
          </datalist>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Temporada</label>
          <input
            name="temporada"
            defaultValue={equipo.temporada}
            required
            disabled={!puedeEditar}
            className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="federada"
            id="federada"
            defaultChecked={equipo.federada}
            disabled={!puedeEditar}
          />
          <label htmlFor="federada" className="text-sm font-medium">
            Equipo federado
          </label>
        </div>

        {puedeEditar && <FormSubmitButton>Guardar cambios</FormSubmitButton>}
      </form>

      {/* Historial de entrenamientos */}
      <div className="mt-8 rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="size-5 text-primary" />
          <h2 className="text-sm font-medium text-primary">
            Historial de entrenamientos ({entrenamientosConSesion.length})
          </h2>
        </div>

        {entrenamientosConSesion.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay entrenamientos registrados para este equipo.
          </p>
        ) : (
          <div className="space-y-3">
            {entrenamientosConSesion.map((ev) => (
              <Link
                key={ev.id}
                href={`/convocatorias/${ev.id}`}
                className="block rounded-md border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {new Date(ev.fecha_hora).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {ev.lugar && (
                    <span className="text-xs text-muted-foreground">{ev.lugar}</span>
                  )}
                </div>
                {ev.sesion ? (
                  <div className="space-y-1">
                    {ev.sesion.objetivo_principal && (
                      <p className="text-sm">
                        <span className="font-medium">Objetivo:</span>{" "}
                        {ev.sesion.objetivo_principal}
                      </p>
                    )}
                    {(ev.sesion.objetivo_secundario_a || ev.sesion.objetivo_secundario_b) && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {ev.sesion.objetivo_secundario_a && (
                          <span>Sec. A: {ev.sesion.objetivo_secundario_a}</span>
                        )}
                        {ev.sesion.objetivo_secundario_b && (
                          <span>Sec. B: {ev.sesion.objetivo_secundario_b}</span>
                        )}
                      </div>
                    )}
                    {ev.sesion.observaciones_entrenador && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {ev.sesion.observaciones_entrenador}
                      </p>
                    )}
                    {ev.sesion.valoracion_entrenamiento && (
                      <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                        Valoración: {ev.sesion.valoracion_entrenamiento}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sin planificación registrada
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}