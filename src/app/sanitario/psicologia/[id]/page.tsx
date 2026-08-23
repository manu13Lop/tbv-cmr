import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ArrowLeft } from 'lucide-react';
import { validateFormData, getFirstError } from '@/lib/validate';
import { actualizarSesionPsicologiaSchema } from '@/lib/validations';
import { InputField, SelectField, TextareaField } from '@/components/ui';

async function actualizarSesion(sesionId: string, formData: FormData) {
  'use server';

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.editar')) {
    return redirect('/sanitario');
  }

  const validation = validateFormData(actualizarSesionPsicologiaSchema, formData);
  if (!validation.success) {
    return redirect(
      `/sanitario/psicologia/${sesionId}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const supabase = await createClient();

  const { tema, objetivos, desarrollo, acuerdos, estado } = validation.data;

  await supabase
    .from('psicologia_sesiones')
    .update({
      tema,
      objetivos,
      desarrollo,
      acuerdos,
      estado,
    })
    .eq('id', sesionId);

  redirect(`/sanitario/psicologia/${sesionId}`);
}

export default async function PsicologiaSesionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.leer')) {
    redirect('/');
  }

  const supabase = await createClient();

  const { data: sesion } = await supabase
    .from('psicologia_sesiones')
    .select(
      `
      *,
      jugadoras ( nombre, apellidos ),
      equipos ( nombre )
    `
    )
    .eq('id', id)
    .single();

  if (!sesion) notFound();

  const destino =
    sesion.tipo_sesion === 'individual'
      ? `${sesion.jugadoras?.nombre ?? ''} ${sesion.jugadoras?.apellidos ?? ''}`.trim()
      : (sesion.equipos?.nombre ?? 'Equipo');

  const puedeEditar = tienePermiso(usuario.permisos, 'sanitario.editar');

  return (
    <div className="p-6">
      <Link
        href="/sanitario/psicologia"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a psicología
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">
            Sesión {sesion.tipo_sesion === 'individual' ? 'individual' : 'grupal'} — {destino}
          </h1>
          <p className="text-muted-foreground text-sm">
            {new Date(sesion.fecha_hora).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            — estado: {sesion.estado}
          </p>
        </div>
      </div>

      <div className="border-border bg-card mb-6 rounded-lg border p-4">
        <p className="mb-1 text-sm font-medium">Tema</p>
        <p className="text-muted-foreground text-sm">{sesion.tema}</p>
        <p className="text-muted-foreground mt-2 text-xs">
          Registrado por {sesion.autor_nombre_snapshot} ({sesion.autor_puesto_snapshot})
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {sesion.objetivos && (
          <div className="border-border bg-card rounded-lg border p-4">
            <p className="mb-1 text-sm font-medium">Objetivos trabajados</p>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{sesion.objetivos}</p>
          </div>
        )}
        {sesion.acuerdos && (
          <div className="border-border bg-card rounded-lg border p-4">
            <p className="mb-1 text-sm font-medium">Acuerdos / tareas</p>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{sesion.acuerdos}</p>
          </div>
        )}
      </div>

      {sesion.desarrollo && (
        <div className="border-border bg-card mb-6 rounded-lg border p-4">
          <p className="mb-1 text-sm font-medium">Desarrollo de la sesión</p>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{sesion.desarrollo}</p>
        </div>
      )}

      {puedeEditar && (
        <form
          action={actualizarSesion.bind(null, id)}
          className="border-border bg-card max-w-2xl space-y-4 rounded-lg border p-4"
        >
          <p className="text-sm font-medium">Editar sesión</p>

          <InputField label="Tema" name="tema" defaultValue={sesion.tema} />

          <TextareaField
            label="Objetivos trabajados"
            name="objetivos"
            rows={3}
            defaultValue={sesion.objetivos ?? ''}
          />

          <TextareaField
            label="Desarrollo de la sesión"
            name="desarrollo"
            rows={4}
            defaultValue={sesion.desarrollo ?? ''}
          />

          <TextareaField
            label="Acuerdos / tareas"
            name="acuerdos"
            rows={3}
            defaultValue={sesion.acuerdos ?? ''}
          />

          <SelectField
            label="Estado"
            name="estado"
            defaultValue={sesion.estado}
            options={[
              { value: 'abierta', label: 'Abierta' },
              { value: 'cerrada', label: 'Cerrada' },
            ]}
          />

          <FormSubmitButton>Guardar cambios</FormSubmitButton>
        </form>
      )}
    </div>
  );
}
