import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearFichaScoutingSchema } from "@/lib/validations"

async function crearFicha(formData: FormData) {
  "use server"
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.editar")) return

  const validation = validateFormData(crearFichaScoutingSchema, formData)
  if (!validation.success) {
    return redirect(`/scouting/fichas/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const { jugadora_id, nombre_externo, club_actual, posicion, fecha_nacimiento, notas_generales } = validation.data

  const supabase = await createClient()

  const { data: ficha, error } = await supabase
    .from("scouting_fichas")
    .insert({
      jugadora_id: jugadora_id || null,
      nombre_externo: jugadora_id ? null : (nombre_externo || null),
      club_actual: club_actual || null,
      posicion: posicion || null,
      fecha_nacimiento: fecha_nacimiento || null,
      notas_generales: notas_generales || null,
      autor_usuario_id: usuario.id,
      autor_nombre_snapshot: usuario.nombreCompleto,
    })
    .select("id")
    .single()

  if (error || !ficha) {
    console.error(error)
    return redirect("/scouting")
  }

  redirect(`/scouting/fichas/${ficha.id}`)
}

export default async function NuevaFichaScoutingPage() {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.editar")) {
    redirect("/scouting")
  }

  const supabase = await createClient()
  const { data: jugadoras } = await supabase.from("jugadoras").select("id, nombre, apellidos").order("apellidos")

  return (
    <div className="p-6">
      <Link href="/scouting" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver a scouting
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Nueva ficha de seguimiento</h1>

      <form action={crearFicha} className="max-w-lg space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Jugadora del club</label>
            <select name="jugadora_id" defaultValue="" className="w-full rounded-md border border-border bg-background p-2 text-sm">
              <option value="">-</option>
              {jugadoras?.map((j) => (
                <option key={j.id} value={j.id}>{j.nombre} {j.apellidos}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">O jugadora externa</label>
            <input name="nombre_externo" placeholder="Nombre y apellidos" className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Club actual</label>
          <input name="club_actual" className="w-full rounded-md border border-border bg-background p-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Posición</label>
            <input name="posicion" placeholder="Ej: Extremo, Central..." className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha de nacimiento</label>
            <input type="date" name="fecha_nacimiento" className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notas generales</label>
          <textarea name="notas_generales" rows={3} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
        </div>

        <FormSubmitButton>Crear ficha</FormSubmitButton>
      </form>
    </div>
  )
}