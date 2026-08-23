import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { ExportCSVButton } from '@/components/export-csv-button';
import { ExportPDFButton } from '@/components/export-pdf-button';
import { formatDateTimeForCSV } from '@/lib/export-csv';
import { PaginationWrapper as Pagination } from '@/components/pagination-wrapper';

export default async function LogisticaMovimientosPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'logistica.leer')) {
    redirect('/');
  }

  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? '';

  const supabase = await createClient();

  let query = supabase
    .from('logistica_movimientos')
    .select(
      `
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
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(`motivo.ilike.%${q}%,usuario_nombre_snapshot.ilike.%${q}%`);
  }

  const { data: movimientos } = await query;

  const movimientosFiltrados = (movimientos ?? []).filter((movimiento: Record<string, unknown>) => {
    if (!q) return true;
    const texto = q.toLowerCase();
    return (
      ((movimiento.logistica_articulos as unknown as Record<string, unknown>)?.nombre as string)
        ?.toLowerCase()
        .includes(texto) ||
      (movimiento.motivo as string)?.toLowerCase().includes(texto) ||
      (movimiento.usuario_nombre_snapshot as string)?.toLowerCase().includes(texto) ||
      ((movimiento.equipos as unknown as Record<string, unknown>)?.nombre as string)
        ?.toLowerCase()
        .includes(texto)
    );
  });

  const itemsPerPage = 20;
  const totalPages = Math.ceil(movimientosFiltrados.length / itemsPerPage);
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages || 1));
  const paginatedMovimientos = movimientosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      <Link
        href="/logistica"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a logística
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-primary text-2xl font-bold">Movimientos</h1>
          <p className="text-muted-foreground text-sm">Entradas, salidas y ajustes registrados.</p>
        </div>

        <div className="flex gap-2">
          <ExportCSVButton
            filename="movimientos"
            headers={[
              'Fecha',
              'Articulo',
              'Tipo',
              'Cantidad',
              'Equipo',
              'Motivo',
              'Registrado por',
            ]}
            rows={movimientosFiltrados.map((movimiento: Record<string, unknown>) => [
              formatDateTimeForCSV(movimiento.created_at as string),
              ((movimiento.logistica_articulos as unknown as Record<string, unknown>)
                ?.nombre as string) ?? '',
              movimiento.tipo as string,
              `${movimiento.tipo === 'salida' ? '-' : '+'}${movimiento.cantidad} ${((movimiento.logistica_articulos as unknown as Record<string, unknown>)?.unidad as string) ?? ''}`,
              ((movimiento.equipos as unknown as Record<string, unknown>)?.nombre as string) ??
                'General',
              (movimiento.motivo as string) ?? '',
              (movimiento.usuario_nombre_snapshot as string) ?? '',
            ])}
          />
          <ExportPDFButton
            filename="movimientos"
            title="Movimientos de Logística"
            columns={[
              { header: 'Fecha', key: 'fecha' },
              { header: 'Artículo', key: 'articulo' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Cantidad', key: 'cantidad' },
              { header: 'Equipo', key: 'equipo' },
              { header: 'Motivo', key: 'motivo' },
              { header: 'Registrado por', key: 'usuario' },
            ]}
            rows={movimientosFiltrados.map((m: Record<string, unknown>) => ({
              fecha: formatDateTimeForCSV(m.created_at as string),
              articulo:
                ((m.logistica_articulos as unknown as Record<string, unknown>)?.nombre as string) ??
                '-',
              tipo: m.tipo as string,
              cantidad: `${m.tipo === 'salida' ? '-' : '+'}${m.cantidad} ${((m.logistica_articulos as unknown as Record<string, unknown>)?.unidad as string) ?? ''}`,
              equipo:
                ((m.equipos as unknown as Record<string, unknown>)?.nombre as string) ?? 'General',
              motivo: (m.motivo as string) ?? '-',
              usuario: (m.usuario_nombre_snapshot as string) ?? '-',
            }))}
          />
          {tienePermiso(usuario.permisos, 'logistica.movimientos') && (
            <Link
              href="/logistica/movimientos/nuevo"
              className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition hover:opacity-90"
            >
              <Plus className="size-4" />
              Nuevo movimiento
            </Link>
          )}
        </div>
      </div>

      <form className="border-border bg-card mb-6 rounded-xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por artículo, motivo, equipo o usuario"
              className="border-border bg-background w-full rounded-md border py-2 pr-3 pl-9 text-sm"
            />
          </div>

          <button
            type="submit"
            className="border-border bg-background hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium"
          >
            Buscar
          </button>

          {q && (
            <Link
              href="/logistica/movimientos"
              className="border-border bg-background hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="border-border bg-muted/40 text-muted-foreground grid grid-cols-12 gap-3 border-b px-4 py-3 text-xs font-semibold tracking-wide uppercase">
          <div className="col-span-3">Fecha</div>
          <div className="col-span-3">Artículo</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2">Cantidad</div>
          <div className="col-span-2">Equipo</div>
        </div>

        {paginatedMovimientos.length === 0 ? (
          <div className="text-muted-foreground px-4 py-6 text-sm">
            No hay movimientos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="divide-border divide-y">
            {paginatedMovimientos.map((movimiento: Record<string, unknown>) => (
              <Link
                key={movimiento.id as string}
                href={`/logistica/movimientos/${movimiento.id as string}`}
                className="hover:bg-muted/30 grid grid-cols-12 gap-3 px-4 py-4 text-sm transition"
              >
                <div className="text-muted-foreground col-span-3">
                  {new Date(movimiento.created_at as string).toLocaleString('es-ES')}
                </div>

                <div className="col-span-3 min-w-0">
                  <p className="text-foreground truncate font-medium">
                    {((movimiento.logistica_articulos as unknown as Record<string, unknown>)
                      ?.nombre as string) ?? 'Artículo'}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {(movimiento.usuario_nombre_snapshot as string) ?? 'Sin usuario'}
                  </p>
                </div>

                <div className="col-span-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      movimiento.tipo === 'salida'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {movimiento.tipo as string}
                  </span>
                </div>

                <div className="text-foreground col-span-2">
                  {movimiento.tipo === 'salida' ? '-' : '+'}
                  {movimiento.cantidad as string}{' '}
                  {((movimiento.logistica_articulos as unknown as Record<string, unknown>)
                    ?.unidad as string) ?? ''}
                </div>

                <div className="text-muted-foreground col-span-2">
                  {((movimiento.equipos as unknown as Record<string, unknown>)?.nombre as string) ??
                    'General'}
                </div>

                {movimiento.motivo ? (
                  <div className="text-muted-foreground col-span-12 text-xs">
                    Motivo: {movimiento.motivo as string}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
