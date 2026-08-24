import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ArrowLeft } from 'lucide-react';
import { validateFormData, getFirstError } from '@/lib/validate';
import { seguimientoLesionSchema } from '@/lib/validations';
import { TimelineLesion } from '@/components/sanitario/timeline-lesion';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('sanitario');

async function añadirSeguimiento(lesionId: string, formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.editar')) return;

  const validation = validateFormData(seguimientoLesionSchema, formData);
  if (!validation.success) {
    return redirect(
      `/sanitario/lesiones/${lesionId}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const supabase = await createClient();

  const { tipo_entrada, tratamiento_aplicado, evolucion, tipo_baja, es_alta } = validation.data;

  const { error } = await supabase.from('seguimientos_lesion').insert({
    lesion_id: lesionId,
    tipo_entrada,
    tratamiento_aplicado,
    evolucion,
    tipo_baja,
    es_alta: es_alta ?? false,
    autor_usuario_id: usuario?.id ?? null,
    autor_nombre_snapshot: usuario?.nombreCompleto ?? 'Desconocido',
    autor_puesto_snapshot: usuario?.puesto ?? 'Desconocido',
  });

  if (error) {
    log.error({ err: error }, 'Error creating seguimiento lesion');
    return;
  }

  if (es_alta) {
    await supabase.from('lesiones').update({ estado: 'alta' }).eq('id', lesionId);
  }

  redirect(`/sanitario/lesiones/${lesionId}`);
}

async function reabrirLesion(lesionId: string) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.editar')) return;

  const supabase = await createClient();

  await supabase.from('lesiones').update({ estado: 'activa' }).eq('id', lesionId);

  redirect(`/sanitario/lesiones/${lesionId}`);
}

const gravedadColor: Record<string, string> = {
  leve: 'text-primary',
  moderada: 'text-yellow-600',
  grave: 'text-destructive',
};

export default async function LesionDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.leer')) {
    redirect('/');
  }
  const puedeEditar = tienePermiso(usuario.permisos, 'sanitario.editar');

  const supabase = await createClient();

  const { data: lesion } = await supabase
    .from('lesiones')
    .select('*, jugadoras ( id, nombre, apellidos )')
    .eq('id', id)
    .single();

  if (!lesion) notFound();

  const { data: seguimientos } = await supabase
    .from('seguimientos_lesion')
    .select('*')
    .eq('lesion_id', id)
    .order('fecha_hora', { ascending: false });

  const jugadora = lesion.jugadoras as Record<string, unknown>;
  const seguimientoAction = añadirSeguimiento.bind(null, id);
  const reabrirAction = reabrirLesion.bind(null, id);

  return (
    <div className="p-6">
      <Link
        href="/sanitario"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a sanitario
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">
            {jugadora?.nombre as string} {jugadora?.apellidos as string}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lesion.tipo} — {new Date(lesion.fecha_lesion).toLocaleDateString('es-ES')} —{' '}
            <span className={gravedadColor[lesion.gravedad] ?? ''}>
              {lesion.gravedad ?? 'sin gravedad'}
            </span>
          </p>
        </div>

        <span
          className={
            lesion.estado === 'activa'
              ? 'bg-destructive/10 text-destructive rounded-md px-3 py-1 text-xs font-medium'
              : 'bg-primary/10 text-primary rounded-md px-3 py-1 text-xs font-medium'
          }
        >
          {lesion.estado === 'activa' ? 'Lesión activa' : 'Dada de alta'}
        </span>
      </div>

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      {lesion.diagnostico_inicial && (
        <div className="border-border bg-card mb-6 rounded-lg border p-4">
          <p className="mb-1 text-sm font-medium">Diagnóstico inicial</p>
          <p className="text-muted-foreground text-sm">{lesion.diagnostico_inicial}</p>
          <p className="text-muted-foreground mt-2 text-xs">
            Registrado por {lesion.autor_nombre_snapshot} ({lesion.autor_puesto_snapshot})
          </p>
        </div>
      )}

      {puedeEditar && lesion.estado !== 'activa' && (
        <form action={reabrirAction} className="mb-6">
          <button type="submit" className="text-destructive text-sm hover:underline">
            Reabrir lesión (revocar alta)
          </button>
        </form>
      )}

      <h2 className="text-primary mb-3 text-lg font-bold">Seguimiento y evolución</h2>

      <TimelineLesion seguimientos={seguimientos ?? []} />

      {puedeEditar && (
        <form
          action={seguimientoAction}
          className="border-border bg-card max-w-lg space-y-4 rounded-lg border p-4"
        >
          <p className="text-sm font-medium">Añadir entrada de seguimiento</p>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de entrada</label>
            <select
              name="tipo_entrada"
              required
              defaultValue=""
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            >
              <option value="" disabled>
                Selecciona un tipo
              </option>
              <option value="revision">Revisión</option>
              <option value="tratamiento">Tratamiento</option>
              <option value="prueba_diagnostica">Prueba diagnóstica</option>
              <option value="alta">Alta médica</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tratamiento aplicado</label>
            <textarea
              name="tratamiento_aplicado"
              rows={2}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Evolución</label>
            <textarea
              name="evolucion"
              rows={2}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de baja actual</label>
            <select
              name="tipo_baja"
              defaultValue={lesion.tipo_baja}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            >
              <option value="baja_total">Baja total</option>
              <option value="baja_parcial">Baja parcial (con adaptaciones)</option>
              <option value="sin_baja">Sin baja, en observación</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="es_alta" id="es_alta" />
            <label htmlFor="es_alta" className="text-sm font-medium">
              Esta entrada da el alta médica definitiva
            </label>
          </div>

          <FormSubmitButton>Guardar entrada</FormSubmitButton>
        </form>
      )}
    </div>
  );
}
