import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearLesionSchema } from "@/lib/validations"
import { notificarUsuariosConPermiso } from "@/lib/notifications"

async function crearLesion(formData: FormData) {
  "use server"
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.editar")) return

  const validation = validateFormData(crearLesionSchema, formData)
  if (!validation.success) {
    return redirect(`/sanitario/lesiones/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const supabase = await createClient()

  const { jugadora_id, tipo, fecha_lesion, gravedad, diagnostico_inicial, tipo_baja } = validation.data

  const { data: lesion, error } = await supabase
    .from("lesiones")
    .insert({
      jugadora_id,
      tipo,
      fecha_lesion,
      gravedad,
      diagnostico_inicial,
      tipo_baja,
      medico_usuario_id: usuario?.id ?? null,
      autor_nombre_snapshot: usuario?.nombreCompleto ?? "Desconocido",
      autor_puesto_snapshot: usuario?.puesto ?? "Desconocido",
    })
    .select("id")
    .single()

  if (error || !lesion) {
    console.error(error)
    return
  }

  try {
    const { data: jugadora } = await supabase
      .from("jugadoras")
      .select("nombre, apellidos")
      .eq("id", jugadora_id)
      .single()

    await notificarUsuariosConPermiso(
      "sanitario.leer",
      "lesion",
      `Nueva lesión: ${tipo}`,
      jugadora
        ? `Jugadora: ${jugadora.nombre} ${jugadora.apellidos}`
        : undefined,
      `/sanitario/lesiones/${lesion.id}`
    )
  } catch (err) {
    console.error("Error creando notificaciones:", err)
  }

  redirect(`/sanitario/lesiones/${lesion.id}`)
}

export default async function NuevaLesionPage() {
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

  return (
    <div className="p-6">
      <Link
        href="/sanitario"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a sanitario
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Registrar lesión</h1>

      <form action={crearLesion} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Jugadora</label>
          <select
            name="jugadora_id"
            required
            defaultValue=""
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="" disabled>
              Selecciona una jugadora
            </option>
            {jugadoras?.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nombre} {j.apellidos}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tipo de lesión</label>
          <input
            name="tipo"
            required
            placeholder="Ej: Esguince de tobillo"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha de la lesión</label>
            <input
              type="date"
              name="fecha_lesion"
              required
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Gravedad</label>
            <select
              name="gravedad"
              defaultValue=""
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            >
              <option value="">-</option>
              <option value="leve">Leve</option>
              <option value="moderada">Moderada</option>
              <option value="grave">Grave</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tipo de baja</label>
          <select
            name="tipo_baja"
            defaultValue="baja_total"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="baja_total">Baja total</option>
            <option value="baja_parcial">Baja parcial (con adaptaciones)</option>
            <option value="sin_baja">Sin baja, en observación</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Diagnóstico inicial</label>
          <textarea
            name="diagnostico_inicial"
            rows={3}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <FormSubmitButton>Registrar lesión</FormSubmitButton>
      </form>
    </div>
  )
}