import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { PaginationWrapper as Pagination } from '@/components/pagination-wrapper';

export default async function LogisticaArticulosPage({
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
    .from('logistica_articulos')
    .select(
      `
      *,
      logistica_stock_minimos (
        id,
        stock_minimo,
        observaciones,
        equipo_id
      )
    `
    )
    .order('nombre');

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,categoria.ilike.%${q}%,unidad.ilike.%${q}%`);
  }

  const [{ data: articulos }, { data: equipos }] = await Promise.all([
    query,
    supabase.from('equipos').select('id, nombre').order('nombre'),
  ]);

  const itemsPerPage = 20;
  const allArticulos = articulos ?? [];
  const totalPages = Math.ceil(allArticulos.length / itemsPerPage);
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages || 1));
  const paginatedArticulos = allArticulos.slice(
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
          <h1 className="text-primary text-2xl font-bold">Artículos</h1>
          <p className="text-muted-foreground text-sm">
            Catálogo ordenado de artículos y acceso al detalle.
          </p>
        </div>

        {tienePermiso(usuario.permisos, 'logistica.editar') && (
          <Link
            href="/logistica/articulos/nuevo"
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition hover:opacity-90"
          >
            <Plus className="size-4" />
            Nuevo artículo
          </Link>
        )}
      </div>

      <form className="border-border bg-card mb-6 rounded-xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, categoría o unidad"
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
              href="/logistica/articulos"
              className="border-border bg-background hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="border-border bg-muted/40 text-muted-foreground grid grid-cols-12 gap-3 border-b px-4 py-3 text-xs font-semibold tracking-wide uppercase">
          <div className="col-span-4">Artículo</div>
          <div className="col-span-2">Categoría</div>
          <div className="col-span-2">Stock</div>
          <div className="col-span-2">Mínimo</div>
          <div className="col-span-2">Estado</div>
        </div>

        {paginatedArticulos.length === 0 ? (
          <div className="text-muted-foreground px-4 py-6 text-sm">
            No hay artículos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="divide-border divide-y">
            {paginatedArticulos.map((articulo: Record<string, unknown>) => {
              const minimo =
                (
                  articulo.logistica_stock_minimos as unknown as Record<string, unknown>[] | null
                )?.[0] ?? null;
              const stockBajo =
                (articulo.stock_actual as number) <= ((minimo?.stock_minimo as number) ?? 0);
              const equipo = equipos?.find(
                (e: Record<string, unknown>) => e.id === minimo?.equipo_id
              );

              return (
                <Link
                  key={articulo.id as string}
                  href={`/logistica/articulos/${articulo.id as string}`}
                  className="hover:bg-muted/30 grid grid-cols-12 gap-3 px-4 py-4 text-sm transition"
                >
                  <div className="col-span-4 min-w-0">
                    <p className="text-foreground truncate font-medium">
                      {articulo.nombre as string}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {articulo.es_sanitario ? 'Sanitario' : 'General'}
                      {equipo ? ` · ${equipo.nombre as string}` : ''}
                    </p>
                  </div>

                  <div className="text-muted-foreground col-span-2">
                    {articulo.categoria as string}
                  </div>

                  <div className="text-foreground col-span-2">
                    {articulo.stock_actual as string} {articulo.unidad as string}
                  </div>

                  <div className="text-muted-foreground col-span-2">
                    {(minimo?.stock_minimo as string) ?? 0} {articulo.unidad as string}
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        stockBajo
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {stockBajo ? 'Stock bajo' : 'Correcto'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
