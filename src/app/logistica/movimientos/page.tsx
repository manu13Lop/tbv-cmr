import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Plus, Search } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { ExportCSVButton } from "@/components/export-csv-button"
import { ExportPDFButton } from "@/components/export-pdf-button"
import { formatDateTimeForCSV } from "@/lib/export-csv"
import { PaginationWrapper as Pagination } from "@/components/pagination-wrapper"

export default async function LogisticaMovimientosPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string }>
}) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.leer")) {
    redirect("/")
  }

  const params = (await searchParams) ?? {}
  const q = params.q?.trim() ?? ""

  const supabase = await createClient()

  let query = supabase
    .from("logistica_movimientos")
    .select(`
      *,
      logistica_articulos (
        id,
        nombre,
        unidad,
        es_sanitario
      ),
      equipos (
        nombre
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (q) {
    query = query.or(`motivo.ilike.%${q}%,usuario_nombre_snapshot.ilike.%${q}%`)
  }

  const { data: movimientos } = await query

  const movimientosFiltrados = (movimientos ?? []).filter((movimiento: any) => {
    if (!q) return true
    const texto = q.toLowerCase()
    return (
      movimiento.logistica_articulos?.nombre?.toLowerCase().includes(texto) ||
      movimiento.motivo?.toLowerCase().includes(texto) ||
      movimiento.usuario_nombre_snapshot?.toLowerCase().includes(texto) ||
      movimiento.equipos?.nombre?.toLowerCase().includes(texto)
    )
  })

  const itemsPerPage = 20
  const totalPages = Math.ceil(movimientosFiltrados.length / itemsPerPage)
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages || 1))
  const paginatedMovimientos = movimientosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-6">
      <Link
        href="/logistica"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a logística
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Movimientos</h1>
          <p className="text-sm text-muted-foreground">
            Entradas, salidas y ajustes registrados.
          </p>
        </div>

        <div className="flex gap-2">
          <ExportCSVButton
            filename="movimientos"
            headers={["Fecha", "Articulo", "Tipo", "Cantidad", "Equipo", "Motivo", "Registrado por"]}
            rows={movimientosFiltrados.map((movimiento: any) => [
              formatDateTimeForCSV(movimiento.created_at),
              movimiento.logistica_articulos?.nombre ?? "",
              movimiento.tipo,
              `${movimiento.tipo === "salida" ? "-" : "+"}${movimiento.cantidad} ${movimiento.logistica_articulos?.unidad ?? ""}`,
              movimiento.equipos?.nombre ?? "General",
              movimiento.motivo ?? "",
              movimiento.usuario_nombre_snapshot ?? "",
            ])}
          />
          <ExportPDFButton
            filename="movimientos"
            title="Movimientos de Logística"
            columns={[
              { header: "Fecha", key: "fecha" },
              { header: "Artículo", key: "articulo" },
              { header: "Tipo", key: "tipo" },
              { header: "Cantidad", key: "cantidad" },
              { header: "Equipo", key: "equipo" },
              { header: "Motivo", key: "motivo" },
              { header: "Registrado por", key: "usuario" },
            ]}
            rows={movimientosFiltrados.map((m: any) => ({
              fecha: formatDateTimeForCSV(m.created_at),
              articulo: m.logistica_articulos?.nombre ?? "-",
              tipo: m.tipo,
              cantidad: `${m.tipo === "salida" ? "-" : "+"}${m.cantidad} ${m.logistica_articulos?.unidad ?? ""}`,
              equipo: m.equipos?.nombre ?? "General",
              motivo: m.motivo ?? "-",
              usuario: m.usuario_nombre_snapshot ?? "-",
            }))}
          />
          {tienePermiso(usuario.permisos, "logistica.movimientos") && (
            <Link
              href="/logistica/movimientos/nuevo"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="size-4" />
              Nuevo movimiento
            </Link>
          )}
        </div>
      </div>

      <form className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por artículo, motivo, equipo o usuario"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Buscar
          </button>

          {q && (
            <Link
              href="/logistica/movimientos"
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-12 gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-3">Fecha</div>
          <div className="col-span-3">Artículo</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2">Cantidad</div>
          <div className="col-span-2">Equipo</div>
        </div>

        {paginatedMovimientos.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No hay movimientos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginatedMovimientos.map((movimiento: any) => (
              <Link
                key={movimiento.id}
                href={`/logistica/movimientos/${movimiento.id}`}
                className="grid grid-cols-12 gap-3 px-4 py-4 text-sm transition hover:bg-muted/30"
              >
                <div className="col-span-3 text-muted-foreground">
                  {new Date(movimiento.created_at).toLocaleString("es-ES")}
                </div>

                <div className="col-span-3 min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {movimiento.logistica_articulos?.nombre ?? "Artículo"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {movimiento.usuario_nombre_snapshot ?? "Sin usuario"}
                  </p>
                </div>

                <div className="col-span-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      movimiento.tipo === "salida"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {movimiento.tipo}
                  </span>
                </div>

                <div className="col-span-2 text-foreground">
                  {movimiento.tipo === "salida" ? "-" : "+"}
                  {movimiento.cantidad} {movimiento.logistica_articulos?.unidad ?? ""}
                </div>

                <div className="col-span-2 text-muted-foreground">
                  {movimiento.equipos?.nombre ?? "General"}
                </div>

                {movimiento.motivo && (
                  <div className="col-span-12 text-xs text-muted-foreground">
                    Motivo: {movimiento.motivo}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}