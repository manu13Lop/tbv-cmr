import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { validateFormData, getFirstError } from '@/lib/validate';
import { actualizarEquipoSchema } from '@/lib/validations';
import { logCambio } from '@/lib/audit';

async function actualizarEquipo(id: string, formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'equipos.editar')) return;

  const validation = validateFormData(actualizarEquipoSchema, formData);
  if (!validation.success) {
    return redirect(`/equipos/${id}?error=${encodeURIComponent(getFirstError(validation.errors))}`);
  }
  const { nombre, categoria, temporada, federada } = validation.data;

  const supabase = await createClient();

  // Obtener datos anteriores para audit
  const { data: anterior } = await supabase.from('equipos').select('*').eq('id', id).single();

  const { error } = await supabase
    .from('equipos')
    .update({
      nombre,
      categoria,
      temporada,
      federada: federada ?? false,
    })
    .eq('id', id);

  if (error) {
    console.error(error);
    return;
  }

  await logCambio('equipos', id, 'actualizar', anterior, {
    nombre,
    categoria,
    temporada,
    federada,
  });

  redirect('/equipos');
}

export default async function EquipoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'equipos.leer')) {
    redirect('/');
  }
  const puedeEditar = tienePermiso(usuario.permisos, 'equipos.editar');

  const supabase = await createClient();

  const { data: equipo } = await supabase.from('equipos').select('*').eq('id', id).single();

  if (!equipo) notFound();

  // Entrenadores del equipo
  const { data: entrenadoresEquipo } = await supabase
    .from('entrenador_equipo')
    .select('id, rol, entrenadores ( id, nombre, apellidos )')
    .eq('equipo_id', id);

  // Historial de entrenamientos del equipo
  const { data: entrenamientosEquipo } = await supabase
    .from('eventos')
    .select('id, fecha_hora, lugar, tipo')
    .eq('equipo_id', id)
    .eq('tipo', 'entrenamiento')
    .order('fecha_hora', { ascending: false });

  // Obtener datos de sesión para cada entrenamiento
  const entrenamientosConSesion: Record<string, unknown>[] = [];
  for (const ev of entrenamientosEquipo ?? []) {
    const { data: sesion } = await supabase
      .from('sesion_entrenamiento')
      .select(
        'id, objetivo_principal, objetivo_secundario_a, objetivo_secundario_b, observaciones_entrenador, valoracion_entrenamiento'
      )
      .eq('evento_id', ev.id)
      .maybeSingle();

    entrenamientosConSesion.push({
      ...ev,
      sesion,
    });
  }

  const updateAction = actualizarEquipo.bind(null, id);

  return (
    <div className="p-6">
      <Link
        href="/equipos"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a equipos
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">{equipo.nombre}</h1>

      <form action={updateAction} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            name="nombre"
            defaultValue={equipo.nombre}
            required
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <input
            name="categoria"
            list="categorias"
            defaultValue={equipo.categoria}
            required
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
          <datalist id="categorias">
            <option value="Benjamín" />
            <option value="Alevín" />
            <option value="Infantil" />
            <option value="Cadete" />
            <option value="Juvenil" />
            <option value="Junior" />
            <option value="Senior" />
            <option value="Senior A" />
            <option value="Senior B" />
          </datalist>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Temporada</label>
          <input
            name="temporada"
            defaultValue={equipo.temporada}
            required
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="federada"
            id="federada"
            defaultChecked={equipo.federada}
            disabled={!puedeEditar}
          />
          <label htmlFor="federada" className="text-sm font-medium">
            Equipo federado
          </label>
        </div>

        {puedeEditar && <FormSubmitButton>Guardar cambios</FormSubmitButton>}
      </form>

      {/* Cuerpo técnico */}
      <div className="border-border bg-card mt-8 rounded-lg border p-4">
        <h2 className="text-primary mb-3 text-sm font-medium">Cuerpo técnico</h2>

        {!entrenadoresEquipo || entrenadoresEquipo.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay entrenadores asignados a este equipo.
          </p>
        ) : (
          <div className="space-y-2">
            {entrenadoresEquipo.map((ae: Record<string, unknown>) => {
              const ent = ae.entrenadores as unknown as Record<string, unknown>;
              const rolLabel =
                ae.rol === 'entrenador'
                  ? 'Entrenador'
                  : ae.rol === 'segundo_entrenador'
                    ? '2do Entrenador'
                    : ae.rol === 'auxiliar'
                      ? 'Auxiliar'
                      : (ae.rol as string);
              return (
                <div
                  key={ae.id as string}
                  className="border-border flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <Link
                      href={`/entrenadores/${ent?.id as string}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {ent?.nombre as string} {ent?.apellidos as string}
                    </Link>
                    <span className="text-muted-foreground ml-2 text-xs capitalize">
                      {rolLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de entrenamientos */}
      <div className="border-border bg-card mt-8 rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="text-primary size-5" />
          <h2 className="text-primary text-sm font-medium">
            Historial de entrenamientos ({entrenamientosConSesion.length})
          </h2>
        </div>

        {entrenamientosConSesion.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay entrenamientos registrados para este equipo.
          </p>
        ) : (
          <div className="space-y-3">
            {entrenamientosConSesion.map((ev) => {
              const sesion = ev.sesion as Record<string, unknown> | null;
              return (
                <Link
                  key={ev.id as string}
                  href={`/convocatorias/${ev.id as string}`}
                  className="border-border hover:bg-muted/50 block rounded-md border p-4 transition-colors"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {new Date(ev.fecha_hora as string).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {ev.lugar ? (
                      <span className="text-muted-foreground text-xs">{ev.lugar as string}</span>
                    ) : null}
                  </div>
                  {sesion ? (
                    <div className="space-y-1">
                      {sesion.objetivo_principal ? (
                        <p className="text-sm">
                          <span className="font-medium">Objetivo:</span>{' '}
                          {sesion.objetivo_principal as string}
                        </p>
                      ) : null}
                      {sesion.objetivo_secundario_a || sesion.objetivo_secundario_b ? (
                        <div className="text-muted-foreground flex gap-4 text-xs">
                          {sesion.objetivo_secundario_a ? (
                            <span>Sec. A: {sesion.objetivo_secundario_a as string}</span>
                          ) : null}
                          {sesion.objetivo_secundario_b ? (
                            <span>Sec. B: {sesion.objetivo_secundario_b as string}</span>
                          ) : null}
                        </div>
                      ) : null}
                      {sesion.observaciones_entrenador ? (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {sesion.observaciones_entrenador as string}
                        </p>
                      ) : null}
                      {sesion.valoracion_entrenamiento ? (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs italic">
                          Valoración: {sesion.valoracion_entrenamiento as string}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">Sin planificación registrada</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
