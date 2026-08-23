import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { ExportCSVButton } from '@/components/export-csv-button';
import { ExportPDFButton } from '@/components/export-pdf-button';

export default async function LogisticaStockBajoPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'logistica.leer')) {
    redirect('/');
  }

  const supabase = await createClient();

  const [{ data: stockMinimos }, { data: equipos }] = await Promise.all([
    supabase.from('logistica_stock_minimos').select(`
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
    supabase.from('equipos').select('id, nombre').order('nombre'),
  ]);

  const items = (stockMinimos ?? [])
    .filter((item: Record<string, unknown>) => {
      const articulo = item.logistica_articulos as unknown as Record<string, unknown>;
      if (!articulo || !articulo.activo) return false;
      return (articulo.stock_actual as number) <= (item.stock_minimo as number);
    })
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const aDiff =
        (a.stock_minimo as number) -
        ((a.logistica_articulos as unknown as Record<string, unknown>).stock_actual as number);
      const bDiff =
        (b.stock_minimo as number) -
        ((b.logistica_articulos as unknown as Record<string, unknown>).stock_actual as number);
      return bDiff - aDiff;
    });

  return (
    <div className="p-6">
      <Link
        href="/logistica"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a logística
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TriangleAlert className="text-destructive size-5" />
          <h1 className="text-primary text-2xl font-bold">Stock bajo</h1>
        </div>
        <ExportCSVButton
          filename="stock-bajo"
          headers={['Articulo', 'Categoria', 'Stock Actual', 'Stock Minimo', 'Equipo']}
          rows={items.map((item: Record<string, unknown>) => {
            const articulo = item.logistica_articulos as unknown as Record<string, unknown>;
            const equipo = equipos?.find((e: Record<string, unknown>) => e.id === item.equipo_id);
            return [
              articulo.nombre as string,
              articulo.categoria as string,
              articulo.stock_actual as string,
              item.stock_minimo as string,
              equipo?.nombre ?? 'General',
            ];
          })}
        />
        <ExportPDFButton
          filename="stock-bajo"
          title="Alerta de Stock Bajo"
          columns={[
            { header: 'Artículo', key: 'articulo' },
            { header: 'Categoría', key: 'categoria' },
            { header: 'Stock Actual', key: 'stock_actual' },
            { header: 'Stock Mínimo', key: 'stock_minimo' },
            { header: 'Equipo', key: 'equipo' },
          ]}
          rows={items.map((item: Record<string, unknown>) => {
            const articulo = item.logistica_articulos as unknown as Record<string, unknown>;
            const equipo = equipos?.find((e: Record<string, unknown>) => e.id === item.equipo_id);
            return {
              articulo: articulo.nombre as string,
              categoria: articulo.categoria as string,
              stock_actual: articulo.stock_actual as string,
              stock_minimo: item.stock_minimo as string,
              equipo: equipo?.nombre ?? 'General',
            };
          })}
        />
      </div>

      <p className="text-muted-foreground mb-6 text-sm">
        Artículos cuyo stock actual está en el mínimo o por debajo de él.
      </p>

      {items.length === 0 ? (
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">
            No hay artículos en situación de stock bajo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: Record<string, unknown>) => {
            const articulo = item.logistica_articulos as unknown as Record<string, unknown>;
            const equipo = equipos?.find((e: Record<string, unknown>) => e.id === item.equipo_id);
            const diferencia = (item.stock_minimo as number) - (articulo.stock_actual as number);

            return (
              <Link
                key={item.id as string}
                href={`/logistica/articulos/${articulo.id as string}`}
                className="border-border bg-card hover:border-primary/40 hover:bg-muted/40 block rounded-xl border p-4 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-foreground text-lg font-semibold">
                      {articulo.nombre as string}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {articulo.categoria as string}
                      {articulo.es_sanitario ? ' · Material sanitario' : ''}
                    </p>
                  </div>

                  <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-1 text-sm font-medium">
                    Falta {diferencia > 0 ? diferencia : 0} {articulo.unidad as string}
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="border-border bg-background rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Stock actual</p>
                    <p className="text-base font-semibold">
                      {articulo.stock_actual as string} {articulo.unidad as string}
                    </p>
                  </div>

                  <div className="border-border bg-background rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Stock mínimo</p>
                    <p className="text-base font-semibold">
                      {item.stock_minimo as string} {articulo.unidad as string}
                    </p>
                  </div>

                  <div className="border-border bg-background rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Equipo</p>
                    <p className="text-base font-semibold">{equipo?.nombre ?? 'General'}</p>
                  </div>
                </div>

                {item.observaciones ? (
                  <p className="text-muted-foreground mt-3 text-sm">
                    {item.observaciones as string}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
