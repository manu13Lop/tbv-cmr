import { createClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { validateFormData, getFirstError } from '@/lib/validate';
import { actualizarEntrenadorSchema, asignarEquipoEntrenadorSchema } from '@/lib/validations';
import { ArrowLeft } from 'lucide-react';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { ConfirmActionButton } from '@/components/confirm-action-button';

async function actualizarEntrenador(id: string, formData: FormData) {
  'use server';

  const validation = validateFormData(actualizarEntrenadorSchema, formData);
  if (!validation.success) {
    return redirect(
      `/entrenadores/${id}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('entrenadores')
    .update({
      nombre: validation.data.nombre,
      apellidos: validation.data.apellidos,
      email: validation.data.email || null,
      telefono: validation.data.telefono || null,
      titulacion: validation.data.titulacion || null,
      especialidad: validation.data.especialidad || null,
      activo: validation.data.activo ?? true,
    })
    .eq('id', id);

  if (error)
    redirect(`/entrenadores/${id}?error=${encodeURIComponent('Error al guardar los cambios')}`);
  redirect(`/entrenadores/${id}`);
}

async function asignarEquipo(entrenadorId: string, formData: FormData) {
  'use server';

  const validation = validateFormData(asignarEquipoEntrenadorSchema, formData);
  if (!validation.success) {
    return redirect(
      `/entrenadores/${entrenadorId}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const supabase = await createClient();
  const rol = (formData.get('rol') as string) || 'entrenador';

  const { error } = await supabase.from('entrenador_equipo').insert({
    entrenador_id: entrenadorId,
    equipo_id: validation.data.equipo_id,
    temporada: validation.data.temporada,
    rol,
  });

  if (error)
    redirect(
      `/entrenadores/${entrenadorId}?error=${encodeURIComponent('Error al asignar equipo')}`
    );
  redirect(`/entrenadores/${entrenadorId}`);
}

async function desasignarEquipo(asignacionId: string, entrenadorId: string) {
  'use server';

  const supabase = await createClient();
  const { error } = await supabase.from('entrenador_equipo').delete().eq('id', asignacionId);
  if (error)
    redirect(
      `/entrenadores/${entrenadorId}?error=${encodeURIComponent('Error al desasignar equipo')}`
    );
  redirect(`/entrenadores/${entrenadorId}`);
}

export default async function EntrenadorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await getUsuarioActual();
  const puedeEditar = tienePermiso(usuario?.permisos, 'equipos.editar');

  const supabase = await createClient();

  const { data: entrenador } = await supabase
    .from('entrenadores')
    .select('*')
    .eq('id', id)
    .single();

  if (!entrenador) notFound();

  const { data: asignaciones } = await supabase
    .from('entrenador_equipo')
    .select('id, temporada, rol, equipos ( id, nombre, categoria, temporada )')
    .eq('entrenador_id', id);

  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre, categoria, temporada')
    .order('temporada', { ascending: false });

  const { data: ejercicios } = await supabase
    .from('ejercicios')
    .select('id, categoria, titulo, imagen_url')
    .eq('entrenador_creador_id', id)
    .order('created_at', { ascending: false });

  const updateAction = actualizarEntrenador.bind(null, id);
  const asignarAction = asignarEquipo.bind(null, id);

  const equiposNoAsignados = (equipos ?? []).filter(
    (eq) =>
      !(asignaciones ?? []).some(
        (a: Record<string, unknown>) => (a.equipos as Record<string, unknown>)?.id === eq.id
      )
  );

  return (
    <div className="p-6">
      <Link
        href="/entrenadores"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a entrenadores
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">
        {entrenador.nombre} {entrenador.apellidos}
      </h1>

      {/* Datos personales */}
      <details className="border-border bg-card mb-6 rounded-lg border" open>
        <summary className="text-primary cursor-pointer p-4 text-sm font-medium">
          Datos personales
        </summary>
        <form action={updateAction} className="space-y-4 p-4 pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                name="nombre"
                defaultValue={entrenador.nombre}
                required
                disabled={!puedeEditar}
                className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Apellidos</label>
              <input
                name="apellidos"
                defaultValue={entrenador.apellidos}
                required
                disabled={!puedeEditar}
                className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={entrenador.email ?? ''}
                disabled={!puedeEditar}
                className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono</label>
              <input
                name="telefono"
                defaultValue={entrenador.telefono ?? ''}
                disabled={!puedeEditar}
                className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Titulación</label>
            <input
              name="titulacion"
              defaultValue={entrenador.titulacion ?? ''}
              disabled={!puedeEditar}
              className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Especialidad</label>
            <select
              name="especialidad"
              defaultValue={entrenador.especialidad ?? ''}
              disabled={!puedeEditar}
              className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
            >
              <option value="">Sin especialidad</option>
              <option value="entrenador_general">Entrenador general</option>
              <option value="entrenador_porteros">Entrenador de porteros</option>
              <option value="preparador_fisico">Preparador físico</option>
              <option value="analista">Analista</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {puedeEditar && <FormSubmitButton>Guardar cambios</FormSubmitButton>}
        </form>
      </details>

      {/* Equipos asignados */}
      <div className="border-border bg-card mb-6 rounded-lg border p-4">
        <h2 className="text-primary mb-3 text-sm font-medium">Equipos asignados</h2>

        {!asignaciones || asignaciones.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Este entrenador no tiene equipos asignados.
          </p>
        ) : (
          <div className="mb-4 space-y-2">
            {asignaciones.map((a: Record<string, unknown>) => (
              <div
                key={a.id as string}
                className="border-border flex items-center justify-between rounded-md border p-3"
              >
                <Link
                  href={`/equipos/${(a.equipos as Record<string, unknown>)?.id as string}`}
                  className="text-sm font-medium hover:underline"
                >
                  {(a.equipos as Record<string, unknown>)?.nombre as string} (
                  {(a.equipos as Record<string, unknown>)?.categoria as string})
                </Link>
                <span className="text-muted-foreground text-xs capitalize">
                  {a.rol === 'entrenador'
                    ? 'Entrenador'
                    : a.rol === 'segundo_entrenador'
                      ? '2do Entrenador'
                      : a.rol === 'auxiliar'
                        ? 'Auxiliar'
                        : (a.rol as string)}{' '}
                  — {a.temporada as string}
                </span>
                {puedeEditar && (
                  <ConfirmActionButton
                    onConfirm={() => desasignarEquipo(a.id as string, id)}
                    label=""
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    }
                    confirmTitle="Desasignar equipo"
                    confirmDescription="¿Seguro que quieres desasignar este equipo al entrenador?"
                    className="text-destructive hover:bg-destructive/10 rounded-md p-1"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {puedeEditar && equiposNoAsignados.length > 0 && (
          <form action={asignarAction} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Asignar equipo</label>
              <select
                name="equipo_id"
                required
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              >
                <option value="" disabled>
                  Selecciona un equipo
                </option>
                {equiposNoAsignados.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre} ({eq.categoria}) - {eq.temporada}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="mb-1 block text-sm font-medium">Rol</label>
              <select
                name="rol"
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              >
                <option value="entrenador">Entrenador</option>
                <option value="segundo_entrenador">2do Entrenador</option>
                <option value="auxiliar">Auxiliar</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="w-32">
              <label className="mb-1 block text-sm font-medium">Temporada</label>
              <input
                name="temporada"
                defaultValue={new Date().getFullYear().toString()}
                required
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>
            <FormSubmitButton>Asignar</FormSubmitButton>
          </form>
        )}
      </div>

      {/* Ejercicios creados */}
      <div className="border-border bg-card rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-primary text-sm font-medium">Ejercicios creados</h2>
          <Link
            href="/entrenadores/ejercicios"
            className="text-muted-foreground hover:text-foreground text-sm hover:underline"
          >
            Ver biblioteca completa
          </Link>
        </div>

        {!ejercicios || ejercicios.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Este entrenador no ha creado ejercicios todavía.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ejercicios.map((ej) => (
              <Link
                key={ej.id}
                href={`/entrenadores/ejercicios/${ej.id}`}
                className="border-border hover:bg-muted/50 flex items-center gap-3 rounded-md border p-3"
              >
                {ej.imagen_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ej.imagen_url}
                    alt={ej.titulo}
                    className="size-12 rounded object-cover"
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded text-xs">
                    Sin foto
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{ej.titulo}</p>
                  <p className="text-muted-foreground text-xs capitalize">
                    {ej.categoria.replace('_', ' ')}
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
