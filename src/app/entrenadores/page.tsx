import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { FilterBar, FilterOption } from '@/components/filter-bar';
import { Suspense } from 'react';

export default async function EntrenadoresPage({
  searchParams,
}: {
  searchParams?: Promise<{ especialidad?: string; activo?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'equipos.leer')) {
    redirect('/');
  }

  const puedeEditar = tienePermiso(usuario.permisos, 'equipos.editar');
  const params = (await searchParams) ?? {};

  const supabase = await createClient();

  let query = supabase.from('entrenadores').select('*').order('apellidos', { ascending: true });

  if (params.especialidad) {
    query = query.eq('especialidad', params.especialidad);
  }
  if (params.activo) {
    query = query.eq('activo', params.activo === 'true');
  }

  const { data: entrenadores } = await query;

  const filters: FilterOption[] = [
    {
      key: 'especialidad',
      label: 'Especialidad',
      options: [
        { value: 'entrenador_general', label: 'General' },
        { value: 'entrenador_porteros', label: 'Porteros' },
        { value: 'preparador_fisico', label: 'Preparador físico' },
        { value: 'analista', label: 'Analista' },
      ],
    },
    {
      key: 'activo',
      label: 'Estado',
      options: [
        { value: 'true', label: 'Activos' },
        { value: 'false', label: 'Inactivos' },
      ],
    },
  ];

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
          <h1 className="text-primary text-2xl font-bold">Entrenadores</h1>
          <p className="text-muted-foreground text-sm">
            {entrenadores?.length ?? 0} entrenadores registrados
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/entrenadores/ejercicios">
            <Button variant="outline">Biblioteca de Ejercicios</Button>
          </Link>
          {puedeEditar && (
            <Link href="/entrenadores/nuevo">
              <Button>
                <Plus className="size-4" />
                Nuevo entrenador
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!entrenadores || entrenadores.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          {params.especialidad || params.activo
            ? 'No hay entrenadores con estos filtros.'
            : 'Todavía no hay entrenadores registrados.'}
        </div>
      ) : (
        <div className="border-border rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Nombre</th>
                  <th className="p-3 text-left font-medium">Apellidos</th>
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Especialidad</th>
                  <th className="p-3 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {entrenadores.map((e) => (
                  <tr key={e.id} className="border-border hover:bg-muted/50 border-t">
                    <td className="p-3 font-medium">
                      <Link href={`/entrenadores/${e.id}`} className="hover:underline">
                        {e.nombre}
                      </Link>
                    </td>
                    <td className="p-3">{e.apellidos}</td>
                    <td className="p-3">{e.email ?? '-'}</td>
                    <td className="p-3">{e.especialidad ?? '-'}</td>
                    <td className="p-3">
                      <span className={e.activo ? 'text-primary' : 'text-muted-foreground'}>
                        {e.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
