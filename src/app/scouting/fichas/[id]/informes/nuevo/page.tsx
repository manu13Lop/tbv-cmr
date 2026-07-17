import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearInformeScoutingSchema } from "@/lib/validations"

async function crearInforme(fichaId: string, formData: FormData) {
  "use server"
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.editar")) return

  const validation = validateFormData(crearInformeScoutingSchema, formData)
  if (!validation.success) {
    return redirect(`/scouting/fichas/${fichaId}/informes/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const { fecha, equipo_id, rival, temporada, minutos_jugados, nota_global, observaciones } = validation.data

  const supabase = await createClient()

  const { data: criterios } = await supabase
    .from("scouting_criterios")
    .select("clave")
    .eq("activo", true)

  const valoraciones: Record<string, string> = {}
  for (const c of (criterios ?? []) as any[]) {
    const valor = formData.get(`criterio_${c.clave}`) as string | null
    if (valor && valor.trim() !== "") valoraciones[c.clave] = valor.trim()
  }

  const { data: informe, error } = await supabase
    .from("scouting_informes")
    .insert({
      ficha_id: fichaId,
      fecha,
      equipo_id: equipo_id || null,
      rival: rival || null,
      temporada,
      minutos_jugados: minutos_jugados ?? null,
      nota_global: nota_global ?? null,
      valoraciones,
      observaciones: observaciones || null,
      autor_usuario_id: usuario.id,
      autor_nombre_snapshot: usuario.nombreCompleto,
      autor_puesto_snapshot: usuario.puesto,
    })
    .select("id")
    .single()

  if (error || !informe) {
    console.error(error)
    return redirect(`/scouting/fichas/${fichaId}`)
  }

  redirect(`/scouting/fichas/${fichaId}`)
}

export default async function NuevoInformeFichaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.editar")) {
    redirect("/scouting")
  }

  const supabase = await createClient()

  const { data: fichaData } = await supabase
    .from("scouting_fichas")
    .select("id, jugadoras ( nombre, apellidos ), nombre_externo")
    .eq("id", id)
    .single()

  if (!fichaData) notFound()

  const ficha = fichaData as any

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre")
    .order("nombre")

  const { data: criterios } = await supabase
    .from("scouting_criterios")
    .select("*")
    .eq("activo", true)
    .order("orden")

  const nombre = ficha.jugadoras
    ? `${ficha.jugadoras.nombre} ${ficha.jugadoras.apellidos}`
    : ficha.nombre_externo

  const crearAction = crearInforme.bind(null, id)

  return (
    <div className="p-6">
      <Link
        href={`/scouting/fichas/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a la ficha
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">
        Nuevo informe — {nombre}
      </h1>

      <form
        action={crearAction}
        className="max-w-3xl space-y-6 rounded-lg border border-border bg-card p-4"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha</label>
            <input
              type="date"
              name="fecha"
              required
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Equipo propio</label>
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
          <div>
            <label className="mb-1 block text-sm font-medium">Rival</label>
            <input
              name="rival"
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Temporada</label>
            <input
              name="temporada"
              required
              placeholder="2025-2026"
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Minutos jugados</label>
            <input
              type="number"
              name="minutos_jugados"
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Nota global (1-5)</label>
            <input
              type="number"
              name="nota_global"
              min={1}
              max={5}
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Valoración detallada</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {criterios?.map((c) => (
              <div key={c.id}>
                <label className="mb-1 block text-sm font-medium">{c.etiqueta}</label>
                <input
                  type="text"
                  name={`criterio_${c.clave}`}
                  placeholder="Escribe tu valoración..."
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Observaciones</label>
          <textarea
            name="observaciones"
            rows={4}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <FormSubmitButton>Guardar informe</FormSubmitButton>
      </form>
    </div>
  )
}