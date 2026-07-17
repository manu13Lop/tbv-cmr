import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Plus, Search } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { PaginationWrapper as Pagination } from "@/components/pagination-wrapper"

export default async function LogisticaArticulosPage({
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
    .from("logistica_articulos")
    .select(`
      *,
      logistica_stock_minimos (
        id,
        stock_minimo,
        observaciones,
        equipo_id
      )
    `)
    .order("nombre")

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,categoria.ilike.%${q}%,unidad.ilike.%${q}%`)
  }

  const [{ data: articulos }, { data: equipos }] = await Promise.all([
    query,
    supabase.from("equipos").select("id, nombre").order("nombre"),
  ])

  const itemsPerPage = 20
  const allArticulos = articulos ?? []
  const totalPages = Math.ceil(allArticulos.length / itemsPerPage)
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages || 1))
  const paginatedArticulos = allArticulos.slice(
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
          <h1 className="text-2xl font-bold text-primary">Artículos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo ordenado de artículos y acceso al detalle.
          </p>
        </div>

        {tienePermiso(usuario.permisos, "logistica.editar") && (
          <Link
            href="/logistica/articulos/nuevo"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="size-4" />
            Nuevo artículo
          </Link>
        )}
      </div>

      <form className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, categoría o unidad"
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
              href="/logistica/articulos"
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-12 gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-4">Artículo</div>
          <div className="col-span-2">Categoría</div>
          <div className="col-span-2">Stock</div>
          <div className="col-span-2">Mínimo</div>
          <div className="col-span-2">Estado</div>
        </div>

        {paginatedArticulos.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No hay artículos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginatedArticulos.map((articulo: any) => {
              const minimo = articulo.logistica_stock_minimos?.[0] ?? null
              const stockBajo = articulo.stock_actual <= (minimo?.stock_minimo ?? 0)
              const equipo = equipos?.find((e: any) => e.id === minimo?.equipo_id)

              return (
                <Link
                  key={articulo.id}
                  href={`/logistica/articulos/${articulo.id}`}
                  className="grid grid-cols-12 gap-3 px-4 py-4 text-sm transition hover:bg-muted/30"
                >
                  <div className="col-span-4 min-w-0">
                    <p className="truncate font-medium text-foreground">{articulo.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {articulo.es_sanitario ? "Sanitario" : "General"}
                      {equipo ? ` · ${equipo.nombre}` : ""}
                    </p>
                  </div>

                  <div className="col-span-2 text-muted-foreground">{articulo.categoria}</div>

                  <div className="col-span-2 text-foreground">
                    {articulo.stock_actual} {articulo.unidad}
                  </div>

                  <div className="col-span-2 text-muted-foreground">
                    {minimo?.stock_minimo ?? 0} {articulo.unidad}
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        stockBajo
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {stockBajo ? "Stock bajo" : "Correcto"}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}