import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Users } from 'lucide-react';
import { PaginationWrapper as Pagination } from '@/components/pagination-wrapper';
import { EmptyState } from '@/components/empty-state';

export default async function SociosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; consentimiento?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.leer')) redirect('/');
  const puedeEditar = tienePermiso(usuario.permisos, 'socios.editar');

  const supabase = await createClient();
  const params = (await searchParams) ?? {};

  let query = supabase
    .from('socios')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params.q) {
    query = query.or(
      `nombre.ilike.%${params.q}%,apellidos.ilike.%${params.q}%,dni.ilike.%${params.q}%`
    );
  }
  if (params.consentimiento) {
    query = query.eq('consentimiento_estado', params.consentimiento);
  }

  const { data: socios, count } = await query;

  const allSocios = socios ?? [];
  const itemsPerPage = 15;
  const totalPages = Math.ceil((count ?? 0) / itemsPerPage);
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages || 1));
  const paginatedSocios = allSocios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalActivos = allSocios.filter((s) => s.activo).length;
  const pendientesConsentimiento = allSocios.filter(
    (s) => s.consentimiento_estado === 'pendiente'
  ).length;

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
          <h1 className="text-primary text-2xl font-bold">Socios</h1>
          <p className="text-muted-foreground text-sm">
            {count ?? 0} socios registrados · {totalActivos} activos
            {pendientesConsentimiento > 0 && (
              <span className="text-yellow-600">
                {' '}
                · {pendientesConsentimiento} pendientes de consentimiento
              </span>
            )}
          </p>
        </div>
        {puedeEditar && (
          <Link href="/socios/nuevo">
            <Button>
              <Plus className="size-4" />
              Nuevo socio
            </Button>
          </Link>
        )}
      </div>

      {allSocios.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay socios"
          description="Aún no se ha registrado ningún socio en el club."
          actionLabel="Dar de alta socio"
          actionHref="/socios/nuevo"
        />
      ) : (
        <div className="border-border rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3 text-left font-medium">
                    N.º Socio
                  </th>
                  <th scope="col" className="p-3 text-left font-medium">
                    Nombre
                  </th>
                  <th scope="col" className="p-3 text-left font-medium">
                    DNI
                  </th>
                  <th scope="col" className="p-3 text-left font-medium">
                    Teléfono
                  </th>
                  <th scope="col" className="p-3 text-left font-medium">
                    Consentimiento
                  </th>
                  <th scope="col" className="p-3 text-left font-medium">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSocios.map((s) => (
                  <tr key={s.id} className="border-border hover:bg-muted/50 border-t">
                    <td className="p-3 font-medium">{s.numero_socio}</td>
                    <td className="p-3">
                      <Link href={`/socios/${s.id}`} className="hover:underline">
                        {s.nombre} {s.apellidos}
                      </Link>
                    </td>
                    <td className="text-muted-foreground p-3">{s.dni || '—'}</td>
                    <td className="text-muted-foreground p-3">{s.telefono || '—'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          s.consentimiento_estado === 'aceptado'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : s.consentimiento_estado === 'rechazado'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                      >
                        {s.consentimiento_estado === 'aceptado'
                          ? 'Aceptado'
                          : s.consentimiento_estado === 'rechazado'
                            ? 'Rechazado'
                            : 'Pendiente'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          s.activo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={count ?? 0} />
    </div>
  );
}
