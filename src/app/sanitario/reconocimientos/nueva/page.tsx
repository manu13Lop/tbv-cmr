import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearReconocimientoSchema } from "@/lib/validations"
import { notificarUsuariosConPermiso } from "@/lib/notifications"

async function crearConvocatoria(formData: FormData) {
  "use server"
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.editar")) return

  const validation = validateFormData(crearReconocimientoSchema, formData)
  if (!validation.success) {
    return redirect(`/sanitario/reconocimientos/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const supabase = await createClient()

  const { temporada, fecha_hora, lugar, notas, mensaje_instrucciones, jugadora_id } = validation.data

  const { data: convocatoria, error } = await supabase
    .from("reconocimientos_medicos_convocatoria")
    .insert({
      temporada,
      fecha_hora,
      lugar,
      notas,
      mensaje_instrucciones,
      medico_usuario_id: usuario?.id ?? null,
    })
    .select("id")
    .single()

  if (error || !convocatoria) {
    console.error(error)
    return
  }

  const jugadoraIds = jugadora_id ?? []

  if (jugadoraIds.length > 0) {
    await supabase.from("reconocimientos_medicos_jugadora").insert(
      jugadoraIds.map((jid) => ({
        convocatoria_id: convocatoria.id,
        jugadora_id: jid,
        resultado: "pendiente",
      }))
    )
  }

  try {
    await notificarUsuariosConPermiso(
      "sanitario.leer",
      "reconocimiento",
      "Nuevo reconocimiento médico",
      `Programado para ${new Date(fecha_hora).toLocaleDateString("es-ES")}`,
      `/sanitario/reconocimientos/${convocatoria.id}`
    )
  } catch (err) {
    console.error("Error creando notificaciones:", err)
  }

  redirect(`/sanitario/reconocimientos/${convocatoria.id}`)
}

export default async function NuevaConvocatoriaReconocimientoPage() {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.editar")) {
    redirect("/sanitario/reconocimientos")
  }

  const supabase = await createClient()

  const { data: jugadoras } = await supabase
    .from("jugadoras")
    .select("id, nombre, apellidos")
    .eq("activa", true)
    .order("apellidos", { ascending: true })

  return (
    <div className="p-6">
      <Link
        href="/sanitario/reconocimientos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a reconocimientos
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">
        Nueva convocatoria de reconocimiento médico
      </h1>

      <form action={crearConvocatoria} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Temporada</label>
            <input
              name="temporada"
              required
              placeholder="Ej: 2025-2026"
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
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

        <div>
          <label className="mb-1 block text-sm font-medium">Lugar</label>
          <input
            name="lugar"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Mensaje de instrucciones (se incluye en el email)
          </label>
          <textarea
            name="mensaje_instrucciones"
            rows={2}
            placeholder="Ej: Traer ropa deportiva y venir en ayunas"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Notas internas
          </label>
          <textarea
            name="notas"
            rows={2}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">
            Jugadoras a citar ({jugadoras?.length ?? 0} activas)
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {jugadoras?.map((j) => (
              <label key={j.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="jugadora_id"
                  value={j.id}
                  defaultChecked
                />
                {j.nombre} {j.apellidos}
              </label>
            ))}
          </div>
        </div>

        <FormSubmitButton>Crear convocatoria</FormSubmitButton>
      </form>
    </div>
  )
}