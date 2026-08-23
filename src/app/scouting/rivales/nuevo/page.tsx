import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearRivalScoutingSchema } from "@/lib/validations"
import { VideoFields } from "@/components/video-fields"

async function crearRival(formData: FormData) {
  "use server"
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.editar")) {
    redirect("/scouting")
  }

  const validation = validateFormData(crearRivalScoutingSchema, formData)
  if (!validation.success) {
    return redirect(`/scouting/rivales/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const { videos, ...rivalData } = validation.data
  const supabase = await createClient()

  const { data: rival, error } = await supabase
    .from("scouting_rivales")
    .insert({
      ...rivalData,
      autor_usuario_id: usuario.id,
      autor_nombre_snapshot: usuario.nombreCompleto,
    })
    .select("id, nombre")
    .single()

  if (error || !rival) {
    return redirect("/scouting/rivales/nuevo?error=Error+al+crear+el+rival")
  }

  if (videos && videos.length > 0) {
    await supabase.from("scouting_rivales_videos").insert(
      videos.map((v, idx) => ({
        rival_id: rival.id,
        url: v.url,
        descripcion: v.descripcion,
        orden: idx,
      }))
    )
  }

  redirect(`/scouting/rivales/${rival.id}`)
}

export default async function NuevoRivalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.editar")) {
    redirect("/scouting")
  }

  const { error } = await searchParams

  return (
    <div className="p-6">
      <Link href="/scouting?tab=rivales" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver a equipos rivales
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Nuevo equipo rival</h1>

      {error && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={crearRival} className="max-w-2xl space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre del equipo</label>
            <input name="nombre" required className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Temporada</label>
            <input name="temporada" placeholder="2025-2026" className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Sistema defensivo habitual</label>
            <textarea name="sistema_defensivo" rows={3} placeholder="Ej: 6-0, 5-1..." className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sistema ofensivo habitual</label>
            <textarea name="sistema_ofensivo" rows={3} placeholder="Ej: Juego posicional, contraataque..." className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Puntos fuertes</label>
            <textarea name="puntos_fuertes" rows={3} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Puntos débiles</label>
            <textarea name="puntos_debiles" rows={3} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Jugadas de pizarra</label>
          <textarea name="jugadas_pizarra" rows={4} placeholder="Describe las jugadas habituales del rival..." className="w-full rounded-md border border-border bg-background p-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Notas adicionales</label>
          <textarea name="notas" rows={2} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
        </div>

        <VideoFields />

        <FormSubmitButton>Crear análisis de rival</FormSubmitButton>
      </form>
    </div>
  )
}
