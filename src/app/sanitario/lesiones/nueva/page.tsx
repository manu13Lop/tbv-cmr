import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ArrowLeft } from 'lucide-react';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearLesionSchema } from '@/lib/validations';
import { InputField, SelectField, TextareaField } from '@/components/ui';
import { notificarUsuariosConPermiso } from '@/lib/notifications';

async function crearLesion(formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.editar')) return;

  const validation = validateFormData(crearLesionSchema, formData);
  if (!validation.success) {
    return redirect(
      `/sanitario/lesiones/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const supabase = await createClient();

  const { jugadora_id, tipo, fecha_lesion, gravedad, diagnostico_inicial, tipo_baja } =
    validation.data;

  const { data: lesion, error } = await supabase
    .from('lesiones')
    .insert({
      jugadora_id,
      tipo,
      fecha_lesion,
      gravedad,
      diagnostico_inicial,
      tipo_baja,
      medico_usuario_id: usuario?.id ?? null,
      autor_nombre_snapshot: usuario?.nombreCompleto ?? 'Desconocido',
      autor_puesto_snapshot: usuario?.puesto ?? 'Desconocido',
    })
    .select('id')
    .single();

  if (error || !lesion) {
    console.error(error);
    return;
  }

  try {
    const { data: jugadora } = await supabase
      .from('jugadoras')
      .select('nombre, apellidos')
      .eq('id', jugadora_id)
      .single();

    await notificarUsuariosConPermiso(
      'sanitario.leer',
      'lesion',
      `Nueva lesión: ${tipo}`,
      jugadora ? `Jugadora: ${jugadora.nombre} ${jugadora.apellidos}` : undefined,
      `/sanitario/lesiones/${lesion.id}`
    );
  } catch (err) {
    console.error('Error creando notificaciones:', err);
  }

  redirect(`/sanitario/lesiones/${lesion.id}`);
}

export default async function NuevaLesionPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.editar')) {
    redirect('/sanitario');
  }

  const supabase = await createClient();

  const { data: jugadoras } = await supabase
    .from('jugadoras')
    .select('id, nombre, apellidos')
    .eq('activa', true)
    .order('apellidos', { ascending: true });

  return (
    <div className="p-6">
      <Link
        href="/sanitario"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a sanitario
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">Registrar lesión</h1>

      <form action={crearLesion} className="max-w-lg space-y-4">
        <SelectField
          label="Jugadora"
          name="jugadora_id"
          required
          defaultValue=""
          placeholder="Selecciona una jugadora"
          options={(jugadoras ?? []).map((j) => ({
            value: j.id,
            label: `${j.nombre} ${j.apellidos}`,
          }))}
        />

        <InputField
          label="Tipo de lesión"
          name="tipo"
          required
          placeholder="Ej: Esguince de tobillo"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Fecha de la lesión" type="date" name="fecha_lesion" required />
          <SelectField
            label="Gravedad"
            name="gravedad"
            defaultValue=""
            options={[
              { value: '', label: '-' },
              { value: 'leve', label: 'Leve' },
              { value: 'moderada', label: 'Moderada' },
              { value: 'grave', label: 'Grave' },
            ]}
          />
        </div>

        <SelectField
          label="Tipo de baja"
          name="tipo_baja"
          defaultValue="baja_total"
          options={[
            { value: 'baja_total', label: 'Baja total' },
            { value: 'baja_parcial', label: 'Baja parcial (con adaptaciones)' },
            { value: 'sin_baja', label: 'Sin baja, en observación' },
          ]}
        />

        <TextareaField label="Diagnóstico inicial" name="diagnostico_inicial" rows={3} />

        <FormSubmitButton>Registrar lesión</FormSubmitButton>
      </form>
    </div>
  );
}
