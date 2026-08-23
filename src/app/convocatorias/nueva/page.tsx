import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { FormSubmitButton } from '@/components/form-submit-button';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearEventoSchema } from '@/lib/validations';
import { InputField, SelectField } from '@/components/ui';
import { notificarUsuariosConPermiso } from '@/lib/notifications';

async function crearEvento(formData: FormData) {
  'use server';

  const validation = validateFormData(crearEventoSchema, formData);
  if (!validation.success) {
    return redirect(
      `/convocatorias/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }
  const { equipo_id, tipo, fecha_hora, lugar, rival } = validation.data;

  const supabase = await createClient();

  const { data: evento, error } = await supabase
    .from('eventos')
    .insert({
      equipo_id,
      tipo,
      fecha_hora,
      lugar: lugar ?? '',
      rival: rival ?? '',
    })
    .select('id')
    .single();

  if (error || !evento) {
    console.error(error);
    return;
  }

  try {
    const fechaStr = new Date(fecha_hora).toLocaleDateString('es-ES');
    await notificarUsuariosConPermiso(
      'jugadoras.leer',
      'convocatoria',
      `Nuevo evento: ${tipo} el ${fechaStr}`,
      lugar || rival
        ? `${lugar ? 'En ' + lugar : ''}${lugar && rival ? ' vs ' : ''}${rival || ''}`
        : undefined,
      `/convocatorias/${evento.id}`
    );
  } catch (err) {
    console.error('Error creando notificaciones:', err);
  }

  redirect(`/convocatorias/${evento.id}`);
}

export default async function NuevoEventoPage() {
  const supabase = await createClient();

  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre, categoria, temporada')
    .order('temporada', { ascending: false });

  return (
    <div className="p-6">
      <h1 className="text-primary mb-6 text-2xl font-bold">Nuevo evento</h1>

      <form action={crearEvento} className="max-w-lg space-y-4">
        <SelectField
          label="Equipo"
          name="equipo_id"
          required
          defaultValue=""
          placeholder="Selecciona un equipo"
          options={(equipos ?? []).map((eq) => ({
            value: eq.id,
            label: `${eq.nombre} (${eq.categoria}) - ${eq.temporada}`,
          }))}
        />

        <SelectField
          label="Tipo"
          name="tipo"
          required
          defaultValue=""
          placeholder="Selecciona un tipo"
          options={[
            { value: 'entrenamiento', label: 'Entrenamiento' },
            { value: 'partido', label: 'Partido' },
            { value: 'concentracion', label: 'Concentración' },
            { value: 'otro', label: 'Otro' },
          ]}
        />

        <InputField label="Fecha y hora" type="datetime-local" name="fecha_hora" required />

        <InputField label="Lugar" name="lugar" />

        <InputField label="Rival" name="rival" placeholder="Solo si es partido" />

        <FormSubmitButton>Crear evento</FormSubmitButton>
      </form>
    </div>
  );
}
