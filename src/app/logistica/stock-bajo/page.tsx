import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, TriangleAlert } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { ExportCSVButton } from "@/components/export-csv-button"
import { ExportPDFButton } from "@/components/export-pdf-button"

export default async function LogisticaStockBajoPage() {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.leer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const [{ data: stockMinimos }, { data: equipos }] = await Promise.all([
    supabase
      .from("logistica_stock_minimos")
      .select(`
        id,
        stock_minimo,
        observaciones,
        equipo_id,
        logistica_articulos (
          id,
          nombre,
          categoria,
          unidad,
          stock_actual,
          es_sanitario,
          activo
        )
      `),
    supabase
      .from("equipos")
      .select("id, nombre")
      .order("nombre"),
  ])

  const items = (stockMinimos ?? [])
    .filter((item: any) => {
      const articulo = item.logistica_articulos
      if (!articulo || !articulo.activo) return false
      return articulo.stock_actual <= item.stock_minimo
    })
    .sort((a: any, b: any) => {
      const aDiff = a.stock_minimo - a.logistica_articulos.stock_actual
      const bDiff = b.stock_minimo - b.logistica_articulos.stock_actual
      return bDiff - aDiff
    })

  return (
    <div className="p-6">
      <Link
        href="/logistica"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a logística
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-destructive" />
          <h1 className="text-2xl font-bold text-primary">Stock bajo</h1>
        </div>
        <ExportCSVButton
          filename="stock-bajo"
          headers={["Articulo", "Categoria", "Stock Actual", "Stock Minimo", "Equipo"]}
          rows={items.map((item: any) => {
            const articulo = item.logistica_articulos
            const equipo = equipos?.find((e: any) => e.id === item.equipo_id)
            return [
              articulo.nombre,
              articulo.categoria,
              articulo.stock_actual,
              item.stock_minimo,
              equipo?.nombre ?? "General",
            ]
          })}
        />
        <ExportPDFButton
          filename="stock-bajo"
          title="Alerta de Stock Bajo"
          columns={[
            { header: "Artículo", key: "articulo" },
            { header: "Categoría", key: "categoria" },
            { header: "Stock Actual", key: "stock_actual" },
            { header: "Stock Mínimo", key: "stock_minimo" },
            { header: "Equipo", key: "equipo" },
          ]}
          rows={items.map((item: any) => {
            const articulo = item.logistica_articulos
            const equipo = equipos?.find((e: any) => e.id === item.equipo_id)
            return {
              articulo: articulo.nombre,
              categoria: articulo.categoria,
              stock_actual: articulo.stock_actual,
              stock_minimo: item.stock_minimo,
              equipo: equipo?.nombre ?? "General",
            }
          })}
        />
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Artículos cuyo stock actual está en el mínimo o por debajo de él.
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            No hay artículos en situación de stock bajo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => {
            const articulo = item.logistica_articulos
            const equipo = equipos?.find((e: any) => e.id === item.equipo_id)
            const diferencia = item.stock_minimo - articulo.stock_actual

            return (
              <Link
                key={item.id}
                href={`/logistica/articulos/${articulo.id}`}
                className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {articulo.nombre}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {articulo.categoria}
                      {articulo.es_sanitario ? " · Material sanitario" : ""}
                    </p>
                  </div>

                  <div className="rounded-lg bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                    Falta {diferencia > 0 ? diferencia : 0} {articulo.unidad}
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Stock actual</p>
                    <p className="text-base font-semibold">
                      {articulo.stock_actual} {articulo.unidad}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Stock mínimo</p>
                    <p className="text-base font-semibold">
                      {item.stock_minimo} {articulo.unidad}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Equipo</p>
                    <p className="text-base font-semibold">
                      {equipo?.nombre ?? "General"}
                    </p>
                  </div>
                </div>

                {item.observaciones && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {item.observaciones}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}