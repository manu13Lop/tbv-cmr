import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { PaginationWrapper as Pagination } from '@/components/pagination-wrapper';
import { FilterBar, FilterOption } from '@/components/filter-bar';
import { Suspense } from 'react';

export default async function EquiposPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; categoria?: string; temporada?: string }>;
}) {
  const usuario = await getUsuarioActual();

  if (!usuario || !tienePermiso(usuario.permisos, 'equipos.leer')) {
    redirect('/');
  }

  const puedeEditar = tienePermiso(usuario.permisos, 'equipos.editar');

  const supabase = await createClient();
  const params = (await searchParams) ?? {};

  let query = supabase
    .from('equipos')
    .select('*')
    .order('temporada', { ascending: false })
    .order('nombre', { ascending: true });

  if (params.categoria) {
    query = query.eq('categoria', params.categoria);
  }
  if (params.temporada) {
    query = query.eq('temporada', params.temporada);
  }

  const { data: equipos } = await query;

  // Obtener categorías y temporadas únicas para los filtros
  const { data: allEquipos } = await supabase.from('equipos').select('categoria, temporada');
  const categorias = [...new Set((allEquipos ?? []).map((e) => e.categoria))].sort();
  const temporadas = [...new Set((allEquipos ?? []).map((e) => e.temporada))].sort().reverse();

  const filters: FilterOption[] = [
    {
      key: 'categoria',
      label: 'Categoría',
      options: categorias.map((c) => ({ value: c, label: c })),
    },
    {
      key: 'temporada',
      label: 'Temporada',
      options: temporadas.map((t) => ({ value: t, label: t })),
    },
  ];

  const allEquiposList = equipos ?? [];
  const itemsPerPage = 15;
  const totalPages = Math.ceil(allEquiposList.length / itemsPerPage);
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages || 1));
  const paginatedEquipos = allEquiposList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">Equipos</h1>
          <p className="text-muted-foreground text-sm">
            {allEquiposList.length} equipos registrados
          </p>
        </div>
        {puedeEditar && (
          <Link href="/equipos/nuevo">
            <Button>
              <Plus className="size-4" />
              Nuevo equipo
            </Button>
          </Link>
        )}
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!allEquiposList || allEquiposList.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          {params.categoria || params.temporada
            ? 'No hay equipos con estos filtros.'
            : 'Todavía no hay equipos registrados.'}
        </div>
      ) : (
        <div className="border-border rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Nombre</th>
                  <th className="p-3 text-left font-medium">Categoría</th>
                  <th className="p-3 text-left font-medium">Temporada</th>
                  <th className="p-3 text-left font-medium">Federada</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEquipos.map((e) => (
                  <tr key={e.id} className="border-border hover:bg-muted/50 border-t">
                    <td className="p-3 font-medium">
                      <Link href={`/equipos/${e.id}`} className="hover:underline">
                        {e.nombre}
                      </Link>
                    </td>
                    <td className="p-3">{e.categoria}</td>
                    <td className="p-3">{e.temporada}</td>
                    <td className="p-3">
                      <span className={e.federada ? 'text-primary' : 'text-muted-foreground'}>
                        {e.federada ? 'Sí' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
