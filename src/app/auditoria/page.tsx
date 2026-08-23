import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { History, Filter, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Auditoría - TBV Balonmano',
  description: 'Histórico de cambios realizados en la plataforma',
};

const ACCIONES_LABELS: Record<string, { label: string; color: string }> = {
  crear: { label: 'Crear', color: 'text-green-600' },
  actualizar: { label: 'Actualizar', color: 'text-blue-600' },
  eliminar: { label: 'Eliminar', color: 'text-red-600' },
};

const TABLAS_LABELS: Record<string, string> = {
  usuarios: 'Usuarios',
  equipos: 'Equipos',
  jugadoras: 'Jugadoras',
  entrenadores: 'Entrenadores',
  eventos: 'Convocatorias',
  sesion_entrenamiento: 'Sesiones',
  ejercicios: 'Ejercicios',
  scouting_rivales: 'Scouting - Rivales',
  scouting_criterios: 'Scouting - Criterios',
  logistica_articulos: 'Logística - Artículos',
  logistica_movimientos: 'Logística - Movimientos',
  formacion_cursos: 'Formación - Cursos',
  formacion_lecciones: 'Formación - Lecciones',
  formacion_quizzes: 'Formación - Quizzes',
  formacion_quiz_preguntas: 'Formación - Preguntas',
  formacion_progreso: 'Formación - Progreso',
  formacion_quiz_resultados: 'Formación - Resultados',
  formacion_certificados: 'Formación - Certificados',
  notificaciones: 'Notificaciones',
  audit_log: 'Auditoría',
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    tabla?: string;
    usuario?: string;
    accion?: string;
    desde?: string;
    hasta?: string;
    page?: string;
  }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || (!tienePermiso(usuario.permisos, 'auditoria.leer') && !usuario.esMaster)) {
    redirect('/');
  }

  const params = await searchParams;
  const tablaFilter = params.tabla;
  const usuarioFilter = params.usuario;
  const accionFilter = params.accion;
  const desdeFilter = params.desde;
  const hastaFilter = params.hasta;
  const currentPage = Number(params.page ?? '1');
  const limit = 50;
  const offset = (currentPage - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from('audit_log')
    .select(
      `
      id, usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos, created_at,
      usuarios!inner(nombre, apellidos)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (tablaFilter) query = query.eq('tabla', tablaFilter);
  if (usuarioFilter) query = query.eq('usuario_id', usuarioFilter);
  if (accionFilter) query = query.eq('accion', accionFilter);
  if (desdeFilter) query = query.gte('created_at', desdeFilter);
  if (hastaFilter) query = query.lt('created_at', hastaFilter);

  const { data: logs, count: totalCount } = await query;

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombre, apellidos')
    .order('nombre');

  const count = totalCount ?? 0;
  const totalPages = count > 0 ? Math.ceil(count / limit) : 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTablaLabel = (tabla: string) => TABLAS_LABELS[tabla] ?? tabla;

  const getDatosResumen = (datos: Record<string, unknown> | null, accion: string) => {
    if (!datos) return null;
    if (accion === 'eliminar') {
      const titulo = datos.titulo || datos.nombre || datos.nombre_completo || datos.enunciado;
      if (titulo) return ` "${titulo}" (${Object.keys(datos).length} campos)`;
      return `${Object.keys(datos).length} campos eliminados`;
    }
    const titulo = datos.titulo || datos.nombre || datos.nombre_completo;
    if (titulo) return ` "${titulo}"`;
    return null;
  };

  const activeFilters = [
    tablaFilter ? `Tabla: ${getTablaLabel(tablaFilter)}` : null,
    usuarioFilter
      ? `Usuario: ${usuarios?.find((u: Record<string, unknown>) => u.id === usuarioFilter)?.nombre ?? usuarioFilter}`
      : null,
    accionFilter ? `Acción: ${ACCIONES_LABELS[accionFilter]?.label ?? accionFilter}` : null,
    desdeFilter ? `Desde: ${desdeFilter}` : null,
    hastaFilter ? `Hasta: ${hastaFilter}` : null,
  ].filter(Boolean);

  return (
    <div className="p-6">
      <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-xs">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span>/</span>
        <span className="text-foreground">Auditoría</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-primary flex items-center gap-2 text-2xl font-bold">
            <History className="size-6" />
            Registro de auditoría
          </h1>
          <p className="text-muted-foreground text-sm">
            Histórico de todos los cambios realizados en la plataforma
          </p>
        </div>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activeFilters.map((f) => (
              <span key={f} className="bg-muted rounded-full px-2.5 py-0.5 text-xs">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <form method="GET" className="border-border bg-card mb-6 rounded-lg border p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Tabla</label>
            <select
              name="tabla"
              defaultValue={tablaFilter ?? ''}
              className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-1.5 text-sm outline-none focus-visible:ring-1"
            >
              <option value="">Todas</option>
              {Object.entries(TABLAS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Usuario</label>
            <select
              name="usuario"
              defaultValue={usuarioFilter ?? ''}
              className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-1.5 text-sm outline-none focus-visible:ring-1"
            >
              <option value="">Todos</option>
              {usuarios?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellidos}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Acción</label>
            <select
              name="accion"
              defaultValue={accionFilter ?? ''}
              className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-1.5 text-sm outline-none focus-visible:ring-1"
            >
              <option value="">Todas</option>
              {Object.entries(ACCIONES_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Desde</label>
            <input
              type="date"
              name="desde"
              defaultValue={desdeFilter ?? ''}
              className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-1.5 text-sm outline-none focus-visible:ring-1"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Hasta</label>
            <input
              type="date"
              name="hasta"
              defaultValue={hastaFilter ?? ''}
              className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-1.5 text-sm outline-none focus-visible:ring-1"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="border-border bg-card hover:bg-muted rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Aplicar filtros
          </button>
          <Link
            href="/auditoria"
            className="border-destructive bg-destructive/5 text-destructive hover:bg-destructive/10 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Limpiar
          </Link>
        </div>
      </form>

      {/* Results */}
      {!logs && (
        <div className="animate-pulse space-y-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="border-border bg-card h-12 rounded-md border"></div>
            ))}
        </div>
      )}

      {logs && logs.length === 0 && (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          No se encontraron registros de auditoría.
        </div>
      )}

      {logs && logs.length > 0 && (
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-muted/20 border-b">
                <th className="px-4 py-2 text-left font-medium">Fecha</th>
                <th className="px-4 py-2 text-left font-medium">Usuario</th>
                <th className="px-4 py-2 text-left font-medium">Tabla</th>
                <th className="px-4 py-2 text-left font-medium">Acción</th>
                <th className="px-4 py-2 text-left font-medium">Registro</th>
                <th className="px-4 py-2 text-left font-medium">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: Record<string, unknown>) => {
                const accionInfo = ACCIONES_LABELS[log.accion as string] ?? {
                  label: log.accion as string,
                  color: '',
                };
                const usuarioNombre =
                  (log.usuarios as Record<string, unknown>)?.nombre &&
                  (log.usuarios as Record<string, unknown>)?.apellidos
                    ? `${(log.usuarios as Record<string, unknown>).nombre} ${(log.usuarios as Record<string, unknown>).apellidos}`
                    : log.usuario_id
                      ? 'Usuario sin nombre'
                      : 'Sistema';

                const detalles = getDatosResumen(
                  log.accion === 'eliminar'
                    ? (log.datos_anteriores as Record<string, unknown>)
                    : (log.datos_nuevos as Record<string, unknown>),
                  log.accion as string
                );

                return (
                  <tr key={log.id as string} className="border-border border-b last:border-0">
                    <td className="text-muted-foreground px-4 py-2 text-xs whitespace-nowrap">
                      {formatDate(log.created_at as string)}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="size-3" />
                        {usuarioNombre}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="bg-secondary/10 rounded px-2 py-0.5 text-xs font-medium">
                        {getTablaLabel(log.tabla as string)}
                      </span>
                    </td>
                    <td className={`px-4 py-2 text-xs font-medium ${accionInfo.color}`}>
                      {accionInfo.label}
                    </td>
                    <td className="text-muted-foreground px-4 py-2 font-mono text-xs">
                      {(log.registro_id as string)?.slice(0, 8)}...
                    </td>
                    <td className="text-muted-foreground px-4 py-2 text-xs">{detalles ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {logs && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-1">
            {currentPage > 1 && (
              <Link
                href={`/auditoria?page=${currentPage - 1}${tablaFilter ? `&tabla=${tablaFilter}` : ''}${usuarioFilter ? `&usuario=${usuarioFilter}` : ''}${accionFilter ? `&accion=${accionFilter}` : ''}`}
                className="border-border bg-card hover:bg-muted rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
              >
                Anterior
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/auditoria?page=${currentPage + 1}${tablaFilter ? `&tabla=${tablaFilter}` : ''}${usuarioFilter ? `&usuario=${usuarioFilter}` : ''}${accionFilter ? `&accion=${accionFilter}` : ''}`}
                className="border-border bg-card hover:bg-muted rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
