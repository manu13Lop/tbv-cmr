import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"

export default async function MensajeDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aviso?: string }>
}) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "mensajes.leer")) {
    redirect("/")
  }

  const { id } = await params
  const { aviso } = await searchParams

  const supabase = await createClient()

  const { data: mensaje } = await supabase
    .from("mensajes")
    .select(`
      *,
      equipos ( nombre, categoria ),
      mensajes_destinatarios ( id, nombre, tipo, email, leido_en, enviado )
    `)
    .eq("id", id)
    .single()

  if (!mensaje) notFound()

  return (
    <div className="p-6">
      <Link
        href="/mensajes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a mensajes
      </Link>

      {aviso === "sin_destinatarios" && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          El mensaje se creó pero no se encontraron destinatarios con email para ese equipo.
        </div>
      )}

      <h1 className="mb-1 text-2xl font-bold text-primary">{mensaje.asunto}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {mensaje.equipos?.nombre} ({mensaje.equipos?.categoria}) ·{" "}
        {new Date(mensaje.created_at).toLocaleString("es-ES")} ·{" "}
        {mensaje.enviado_por_nombre}
      </p>

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <p className="whitespace-pre-wrap text-sm text-foreground">
          {mensaje.cuerpo}
        </p>
      </div>

      <h2 className="mb-4 text-lg font-bold text-primary">Destinatarios</h2>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left font-medium">Nombre</th>
              <th className="p-3 text-left font-medium">Tipo</th>
              <th className="p-3 text-left font-medium">Email</th>
              <th className="p-3 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(mensaje.mensajes_destinatarios ?? []).map((d: any) => (
              <tr key={d.id} className="border-t border-border">
                <td className="p-3">{d.nombre}</td>
                <td className="p-3 capitalize">{d.tipo}</td>
                <td className="p-3">{d.email}</td>
                <td className="p-3">
                  {mensaje.requiere_confirmacion ? (
                    d.leido_en ? (
                      <span className="text-primary">
                        Leído el {new Date(d.leido_en).toLocaleString("es-ES")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sin confirmar</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">
                      {d.enviado ? "Enviado" : "Pendiente"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}