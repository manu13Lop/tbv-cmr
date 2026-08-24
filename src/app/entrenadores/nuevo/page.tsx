import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { FormSubmitButton } from '@/components/form-submit-button';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearEntrenadorSchema } from '@/lib/validations';
import { InputField, SelectField } from '@/components/ui';
import { logCambio } from '@/lib/audit';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AsignarEquipoEntrenador } from '@/components/asignar-equipo-entrenador';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('entrenadores');

async function crearEntrenador(formData: FormData) {
  'use server';

  const validation = validateFormData(crearEntrenadorSchema, formData);
  if (!validation.success) {
    return redirect(
      `/entrenadores/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const supabase = await createClient();

  const { data: entrenador, error } = await supabase
    .from('entrenadores')
    .insert({
      nombre: validation.data.nombre,
      apellidos: validation.data.apellidos,
      email: validation.data.email || null,
      telefono: validation.data.telefono || null,
      titulacion: validation.data.titulacion || null,
      especialidad: validation.data.especialidad || null,
    })
    .select('id')
    .single();

  if (error || !entrenador) {
    log.error({ err: error }, 'Error creating entrenador');
    return redirect(
      `/entrenadores/nuevo?error=${encodeURIComponent('Error al crear el entrenador')}`
    );
  }

  await logCambio('entrenadores', entrenador.id, 'crear', null, {
    nombre: validation.data.nombre,
    apellidos: validation.data.apellidos,
    email: validation.data.email,
    especialidad: validation.data.especialidad,
  });

  // Asignar equipos si se seleccionaron
  const equipos = formData.getAll('equipo_id') as string[];
  const roles = formData.getAll('equipo_rol') as string[];

  for (let i = 0; i < equipos.length; i++) {
    if (equipos[i]) {
      await supabase.from('entrenador_equipo').insert({
        entrenador_id: entrenador.id,
        equipo_id: equipos[i],
        temporada: new Date().getFullYear().toString(),
        rol: roles[i] || 'entrenador',
      });
    }
  }

  redirect('/entrenadores');
}

export default async function NuevoEntrenadorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre, categoria, temporada')
    .order('temporada', { ascending: false })
    .order('nombre');

  return (
    <div className="p-6">
      <Link
        href="/entrenadores"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a entrenadores
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">Nuevo entrenador</h1>

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={crearEntrenador} className="max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Nombre" name="nombre" required />
          <InputField label="Apellidos" name="apellidos" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Email" name="email" type="email" />
          <InputField label="Teléfono" name="telefono" />
        </div>

        <InputField
          label="Titulación"
          name="titulacion"
          placeholder="Ej: Nivel II, Nivel III, etc."
        />

        <SelectField
          label="Especialidad"
          name="especialidad"
          options={[
            { value: '', label: 'Sin especialidad' },
            { value: 'entrenador_general', label: 'Entrenador general' },
            { value: 'entrenador_porteros', label: 'Entrenador de porteros' },
            { value: 'preparador_fisico', label: 'Preparador físico' },
            { value: 'analista', label: 'Analista' },
            { value: 'otro', label: 'Otro' },
          ]}
        />

        {/* Asignación de equipos */}
        <AsignarEquipoEntrenador equipos={equipos ?? []} />

        <FormSubmitButton>Crear entrenador</FormSubmitButton>
      </form>
    </div>
  );
}
