import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { CRITERIOS_SCOUTING } from "@/lib/scouting-criterios"
import { validateFormData, getFirstError } from "@/lib/validate"
import { z } from "zod"

const crearInformeStandaloneSchema = z.object({
  jugadora_id: z.string().uuid().nullable().optional(),
  jugadora_externa: z.string().nullable().optional(),
  equipo_id: z.string().uuid().nullable().optional(),
  rival: z.string().optional(),
  temporada: z.string().min(1, "La temporada es obligatoria"),
  posicion: z.string().optional(),
  edad: z.coerce.number().int().nullable().optional(),
  nota_global: z.coerce.number().int().min(1).max(5).nullable().optional(),
  observaciones: z.string().optional(),
})

async function crearInforme(formData: FormData) {
  "use server"

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.editar")) {
    return redirect("/scouting")
  }

  const validation = validateFormData(crearInformeStandaloneSchema, formData)
  if (!validation.success) {
    return redirect(`/scouting/informes/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const { jugadora_id, jugadora_externa, equipo_id, rival, temporada, posicion, edad, nota_global, observaciones } = validation.data

  const supabase = await createClient()

  const valoraciones: Record<string, number> = {}
  for (const criterio of CRITERIOS_SCOUTING) {
    const valor = formData.get(`criterio_${criterio.clave}`)
    if (valor) valoraciones[criterio.clave] = Number(valor)
  }

  const { data: informe, error } = await supabase
    .from("scouting_informes")
    .insert({
      jugadora_id: jugadora_id || null,
      jugadora_externa: jugadora_id ? null : (jugadora_externa || null),
      equipo_id: equipo_id || null,
      rival: rival || null,
      temporada,
      posicion: posicion || null,
      edad: edad ?? null,
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
    return redirect("/scouting")
  }

  redirect(`/scouting/informes/${informe.id}`)
}

export default async function NuevoInformeScoutingPage() {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.editar")) {
    redirect("/scouting")
  }

  const supabase = await createClient()

  const { data: jugadoras } = await supabase
    .from("jugadoras")
    .select("id, nombre, apellidos")
    .order("apellidos", { ascending: true })

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre")
    .order("nombre", { ascending: true })

  return (
    <div className="p-6">
      <Link
        href="/scouting"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a scouting
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Nuevo informe de scouting</h1>

      <form
        action={crearInforme}
        className="max-w-3xl space-y-6 rounded-lg border border-border bg-card p-4"
      >
        <div>
          <p className="mb-3 text-sm font-medium">Jugadora</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Jugadora del club
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
                O jugadora externa (rival)
              </label>
              <input
                name="jugadora_externa"
                placeholder="Nombre y apellidos"
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
          <div>
            <label className="mb-1 block text-sm font-medium">Posición</label>
            <input
              name="posicion"
              placeholder="Ej: Extremo, Central..."
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Edad</label>
            <input
              type="number"
              name="edad"
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
          <div className="grid grid-cols-2 gap-4">
            {CRITERIOS_SCOUTING.map((criterio) => (
              <div key={criterio.clave}>
                <label className="mb-1 block text-sm font-medium">
                  {criterio.etiqueta}
                </label>
                <select
                  name={`criterio_${criterio.clave}`}
                  defaultValue=""
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                >
                  <option value="">-</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
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