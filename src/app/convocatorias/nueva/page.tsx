import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { FormSubmitButton } from "@/components/form-submit-button"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearEventoSchema } from "@/lib/validations"
import { notificarUsuariosConPermiso } from "@/lib/notifications"

async function crearEvento(formData: FormData) {
  "use server"

  const validation = validateFormData(crearEventoSchema, formData)
  if (!validation.success) {
    return redirect(`/convocatorias/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }
  const { equipo_id, tipo, fecha_hora, lugar, rival } = validation.data

  const supabase = await createClient()

  const { data: evento, error } = await supabase
    .from("eventos")
    .insert({
      equipo_id,
      tipo,
      fecha_hora,
      lugar: lugar ?? "",
      rival: rival ?? "",
    })
    .select("id")
    .single()

  if (error || !evento) {
    console.error(error)
    return
  }

  try {
    const fechaStr = new Date(fecha_hora).toLocaleDateString("es-ES")
    await notificarUsuariosConPermiso(
      "jugadoras.leer",
      "convocatoria",
      `Nuevo evento: ${tipo} el ${fechaStr}`,
      lugar || rival
        ? `${lugar ? "En " + lugar : ""}${lugar && rival ? " vs " : ""}${rival || ""}`
        : undefined,
      `/convocatorias/${evento.id}`
    )
  } catch (err) {
    console.error("Error creando notificaciones:", err)
  }

  redirect(`/convocatorias/${evento.id}`)
}

export default async function NuevoEventoPage() {
  const supabase = await createClient()

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre, categoria, temporada")
    .order("temporada", { ascending: false })

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-primary">Nuevo evento</h1>

      <form action={crearEvento} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Equipo</label>
          <select
            name="equipo_id"
            required
            defaultValue=""
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="" disabled>
              Selecciona un equipo
            </option>
            {equipos?.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nombre} ({eq.categoria}) - {eq.temporada}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tipo</label>
          <select
            name="tipo"
            required
            defaultValue=""
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="" disabled>
              Selecciona un tipo
            </option>
            <option value="entrenamiento">Entrenamiento</option>
            <option value="partido">Partido</option>
            <option value="concentracion">Concentración</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Fecha y hora</label>
          <input
            type="datetime-local"
            name="fecha_hora"
            required
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Lugar</label>
          <input
            name="lugar"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Rival</label>
          <input
            name="rival"
            placeholder="Solo si es partido"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <FormSubmitButton>Crear evento</FormSubmitButton>
      </form>
    </div>
  )
}