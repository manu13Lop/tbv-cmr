import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Boxes, TriangleAlert, ArrowRightLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';

export default async function LogisticaPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'logistica.leer')) {
    redirect('/');
  }

  const supabase = await createClient();

  const [{ count: totalArticulos }, { count: totalMovimientos }, { data: stockBajo }] =
    await Promise.all([
      supabase
        .from('logistica_articulos')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true),
      supabase.from('logistica_movimientos').select('*', { count: 'exact', head: true }),
      supabase.from('logistica_stock_minimos').select(`
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
    ]);

  const articulosConStockBajo = (stockBajo ?? []).filter((item: Record<string, unknown>) => {
    const articulo = item.logistica_articulos as Record<string, unknown>;
    if (!articulo || !articulo.activo) return false;
    return (articulo.stock_actual as number) <= (item.stock_minimo as number);
  });

  return (
    <div className="p-6">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <h1 className="text-primary mb-2 text-2xl font-bold">Logística</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Control de inventario, movimientos y stock mínimo.
      </p>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="text-primary mb-2 flex items-center gap-2">
            <Boxes className="size-4" />
            <p className="text-sm font-medium">Artículos activos</p>
          </div>
          <p className="text-3xl font-bold">{totalArticulos ?? 0}</p>
        </div>

        <div className="border-border bg-card rounded-xl border p-4">
          <div className="text-primary mb-2 flex items-center gap-2">
            <ArrowRightLeft className="size-4" />
            <p className="text-sm font-medium">Movimientos</p>
          </div>
          <p className="text-3xl font-bold">{totalMovimientos ?? 0}</p>
        </div>

        <div className="border-border bg-card rounded-xl border p-4">
          <div className="text-primary mb-2 flex items-center gap-2">
            <TriangleAlert className="size-4" />
            <p className="text-sm font-medium">Stock bajo</p>
          </div>
          <p className="text-3xl font-bold">{articulosConStockBajo.length}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/logistica/articulos"
          className="border-border bg-card hover:border-primary/40 hover:bg-muted/40 rounded-xl border p-5 transition"
        >
          <p className="text-foreground mb-1 text-base font-semibold">Artículos</p>
          <p className="text-muted-foreground text-sm">Catálogo, detalle y edición de artículos.</p>
        </Link>

        <Link
          href="/logistica/movimientos"
          className="border-border bg-card hover:border-primary/40 hover:bg-muted/40 rounded-xl border p-5 transition"
        >
          <p className="text-foreground mb-1 text-base font-semibold">Movimientos</p>
          <p className="text-muted-foreground text-sm">Entradas, salidas, ajustes e histórico.</p>
        </Link>

        <Link
          href="/logistica/stock-bajo"
          className="border-border bg-card hover:border-primary/40 hover:bg-muted/40 rounded-xl border p-5 transition"
        >
          <p className="text-foreground mb-1 text-base font-semibold">Stock bajo</p>
          <p className="text-muted-foreground text-sm">
            Artículos en mínimo o por debajo del mínimo.
          </p>
        </Link>
      </div>

      <div className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-primary mb-4 text-lg font-bold">Artículos con stock bajo</h2>

        {articulosConStockBajo.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay artículos por debajo del stock mínimo.
          </p>
        ) : (
          <div className="space-y-3">
            {articulosConStockBajo.map((item: Record<string, unknown>) => (
              <Link
                key={item.id as string}
                href={`/logistica/articulos/${(item.logistica_articulos as Record<string, unknown>).id as string}`}
                className="border-border bg-background hover:border-primary/30 hover:bg-muted/40 flex items-center justify-between rounded-lg border p-3 transition"
              >
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {(item.logistica_articulos as Record<string, unknown>).nombre as string}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Stock actual:{' '}
                    {(item.logistica_articulos as Record<string, unknown>).stock_actual as string}{' '}
                    {(item.logistica_articulos as Record<string, unknown>).unidad as string}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Mínimo</p>
                  <p className="text-destructive text-sm font-semibold">
                    {item.stock_minimo as string}{' '}
                    {(item.logistica_articulos as Record<string, unknown>).unidad as string}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
