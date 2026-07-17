import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowLeft,
  Boxes,
  TriangleAlert,
  ArrowRightLeft,
} from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"

export default async function LogisticaPage() {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.leer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const [{ count: totalArticulos }, { count: totalMovimientos }, { data: stockBajo }] =
    await Promise.all([
      supabase
        .from("logistica_articulos")
        .select("*", { count: "exact", head: true })
        .eq("activo", true),
      supabase
        .from("logistica_movimientos")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("logistica_stock_minimos")
        .select(`
          id,
          stock_minimo,
          logistica_articulos (
            id,
            nombre,
            stock_actual,
            unidad,
            activo
          )
        `),
    ])

  const articulosConStockBajo = (stockBajo ?? []).filter((item: any) => {
    const articulo = item.logistica_articulos
    if (!articulo || !articulo.activo) return false
    return articulo.stock_actual <= item.stock_minimo
  })

  return (
    <div className="p-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-primary">Logística</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Control de inventario, movimientos y stock mínimo.
      </p>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Boxes className="size-4" />
            <p className="text-sm font-medium">Artículos activos</p>
          </div>
          <p className="text-3xl font-bold">{totalArticulos ?? 0}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <ArrowRightLeft className="size-4" />
            <p className="text-sm font-medium">Movimientos</p>
          </div>
          <p className="text-3xl font-bold">{totalMovimientos ?? 0}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <TriangleAlert className="size-4" />
            <p className="text-sm font-medium">Stock bajo</p>
          </div>
          <p className="text-3xl font-bold">{articulosConStockBajo.length}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/logistica/articulos"
          className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="mb-1 text-base font-semibold text-foreground">Artículos</p>
          <p className="text-sm text-muted-foreground">
            Catálogo, detalle y edición de artículos.
          </p>
        </Link>

        <Link
          href="/logistica/movimientos"
          className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="mb-1 text-base font-semibold text-foreground">Movimientos</p>
          <p className="text-sm text-muted-foreground">
            Entradas, salidas, ajustes e histórico.
          </p>
        </Link>

        <Link
          href="/logistica/stock-bajo"
          className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="mb-1 text-base font-semibold text-foreground">Stock bajo</p>
          <p className="text-sm text-muted-foreground">
            Artículos en mínimo o por debajo del mínimo.
          </p>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-lg font-bold text-primary">Artículos con stock bajo</h2>

        {articulosConStockBajo.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay artículos por debajo del stock mínimo.
          </p>
        ) : (
          <div className="space-y-3">
            {articulosConStockBajo.map((item: any) => (
              <Link
                key={item.id}
                href={`/logistica/articulos/${item.logistica_articulos.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition hover:border-primary/30 hover:bg-muted/40"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.logistica_articulos.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock actual: {item.logistica_articulos.stock_actual}{" "}
                    {item.logistica_articulos.unidad}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Mínimo</p>
                  <p className="text-sm font-semibold text-destructive">
                    {item.stock_minimo} {item.logistica_articulos.unidad}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}