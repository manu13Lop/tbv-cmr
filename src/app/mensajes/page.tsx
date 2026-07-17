import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Plus, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { Button } from "@/components/button"
import { PaginationWrapper as Pagination } from "@/components/pagination-wrapper"

export default async function MensajesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "mensajes.leer")) {
    redirect("/")
  }

  const puedeEnviar = tienePermiso(usuario.permisos, "mensajes.enviar")

  const supabase = await createClient()

  const { data: mensajes } = await supabase
    .from("mensajes")
    .select(`
      id,
      asunto,
      created_at,
      requiere_confirmacion,
      enviado_por_nombre,
      equipos ( nombre, categoria ),
      mensajes_destinatarios ( id, leido_en )
    `)
    .order("created_at", { ascending: false })

  const params = (await searchParams) ?? {}
  const allMensajes = mensajes ?? []
  const itemsPerPage = 10
  const totalPages = Math.ceil(allMensajes.length / itemsPerPage)
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages || 1))
  const paginatedMensajes = allMensajes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Mensajes</h1>
          <p className="text-sm text-muted-foreground">
            {mensajes?.length ?? 0} mensaje(s) enviado(s)
          </p>
        </div>
        {puedeEnviar && (
          <Link href="/mensajes/nuevo">
            <Button>
              <Plus className="size-4" />
              Nuevo mensaje
            </Button>
          </Link>
        )}
      </div>

      {!mensajes || mensajes.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No se han enviado mensajes todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedMensajes.map((m: any) => {
            const total = m.mensajes_destinatarios?.length ?? 0
            const leidos =
              m.mensajes_destinatarios?.filter((d: any) => d.leido_en).length ?? 0

            return (
              <Link
                key={m.id}
                href={`/mensajes/${m.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {m.asunto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.equipos?.nombre} ({m.equipos?.categoria}) ·{" "}
                      {new Date(m.created_at).toLocaleString("es-ES")} ·{" "}
                      {m.enviado_por_nombre}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Destinatarios</p>
                  <p className="text-sm font-semibold">
                    {total}
                    {m.requiere_confirmacion && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({leidos} leídos)
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}