import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { FormSubmitButton } from "@/components/form-submit-button"
import { enviarMensajeAction } from "../actions"

export default async function NuevoMensajePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "mensajes.enviar")) {
    redirect("/")
  }

  const { error } = await searchParams

  const supabase = await createClient()

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre, categoria")
    .order("nombre")

  return (
    <div className="p-6">
      <Link
        href="/mensajes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a mensajes
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Nuevo mensaje</h1>

      {error === "datos_invalidos" && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Revisa los campos, todos son obligatorios.
        </div>
      )}

      {error === "error_creacion" && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          No se ha podido crear el mensaje. Inténtalo de nuevo.
        </div>
      )}

      <form action={enviarMensajeAction} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Equipo / categoría destino
          </label>
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
                {eq.nombre} ({eq.categoria})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Asunto</label>
          <input
            name="asunto"
            required
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Mensaje</label>
          <textarea
            name="cuerpo"
            rows={6}
            required
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="requiere_confirmacion"
            id="requiere_confirmacion"
          />
          <label htmlFor="requiere_confirmacion" className="text-sm font-medium">
            Solicitar confirmación de lectura
          </label>
        </div>

        <FormSubmitButton>Enviar mensaje</FormSubmitButton>
      </form>
    </div>
  )
}