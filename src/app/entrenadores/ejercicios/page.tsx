import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';

const CATEGORIAS = [
  { value: 'todos', label: 'Todos' },
  { value: 'táctico', label: 'Tácticos' },
  { value: 'técnica_individual', label: 'Técnica Individual' },
  { value: 'portero', label: 'Porteros' },
  { value: 'físico', label: 'Físicos' },
];

export default async function EjerciciosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'equipos.leer')) {
    redirect('/');
  }

  const puedeEditar = tienePermiso(usuario.permisos, 'equipos.editar');
  const params = await searchParams;
  const categoriaFiltro = params.categoria ?? 'todos';

  const supabase = await createClient();

  let query = supabase
    .from('ejercicios')
    .select(
      'id, categoria, titulo, descripcion, imagen_url, objetivo_principal, created_at, entrenadores ( nombre, apellidos )'
    )
    .order('created_at', { ascending: false });

  if (categoriaFiltro !== 'todos') {
    query = query.eq('categoria', categoriaFiltro);
  }

  const { data: ejercicios } = await query;

  return (
    <div className="p-6">
      <Link
        href="/entrenadores"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a entrenadores
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">Biblioteca de Ejercicios</h1>
          <p className="text-muted-foreground text-sm">
            {ejercicios?.length ?? 0} ejercicios en la biblioteca compartida
          </p>
        </div>
        {puedeEditar && (
          <Link href="/entrenadores/ejercicios/nuevo">
            <Button>
              <Plus className="size-4" />
              Nuevo ejercicio
            </Button>
          </Link>
        )}
      </div>

      {/* Filtro por categoría */}
      <div className="mb-6 flex gap-2">
        {CATEGORIAS.map((cat) => (
          <Link
            key={cat.value}
            href={
              cat.value === 'todos'
                ? '/entrenadores/ejercicios'
                : `/entrenadores/ejercicios?categoria=${cat.value}`
            }
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              categoriaFiltro === cat.value
                ? 'bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted border'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {!ejercicios || ejercicios.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          No hay ejercicios{categoriaFiltro !== 'todos' ? ' en esta categoría' : ''}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ejercicios.map((ej) => {
            const autor = ej.entrenadores as unknown as Record<string, unknown>;
            return (
              <Link
                key={ej.id}
                href={`/entrenadores/ejercicios/${ej.id}`}
                className="border-border bg-card hover:bg-muted/50 overflow-hidden rounded-lg border transition-colors"
              >
                {ej.imagen_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ej.imagen_url} alt={ej.titulo} className="h-40 w-full object-cover" />
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-40 w-full items-center justify-center text-sm">
                    Sin imagen
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">{ej.titulo}</h3>
                    <span className="bg-secondary/10 text-secondary rounded-full px-2 py-0.5 text-xs capitalize">
                      {ej.categoria.replace('_', ' ')}
                    </span>
                  </div>
                  {ej.objetivo_principal && (
                    <p className="text-muted-foreground mb-2 line-clamp-2 text-xs">
                      {ej.objetivo_principal}
                    </p>
                  )}
                  {autor && (
                    <p className="text-muted-foreground text-xs">
                      Creado por {autor.nombre as string} {autor.apellidos as string}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
