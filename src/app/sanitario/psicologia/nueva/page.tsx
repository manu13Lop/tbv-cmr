import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ArrowLeft } from 'lucide-react';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearSesionPsicologiaSchema } from '@/lib/validations';
import { InputField, SelectField, TextareaField } from '@/components/ui';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('sanitario');

async function crearSesion(formData: FormData) {
  'use server';

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.editar')) {
    return redirect('/sanitario');
  }

  const validation = validateFormData(crearSesionPsicologiaSchema, formData);
  if (!validation.success) {
    return redirect(
      `/sanitario/psicologia/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const supabase = await createClient();

  const { tipo_sesion, jugadora_id, equipo_id, fecha_hora, tema, objetivos, desarrollo, acuerdos } =
    validation.data;

  const { data: sesion, error } = await supabase
    .from('psicologia_sesiones')
    .insert({
      tipo_sesion,
      jugadora_id: tipo_sesion === 'individual' ? (jugadora_id ?? null) : null,
      equipo_id: tipo_sesion === 'grupal' ? (equipo_id ?? null) : null,
      fecha_hora,
      tema,
      objetivos,
      desarrollo,
      acuerdos,
      estado: 'abierta',
      autor_usuario_id: usuario.id,
      autor_nombre_snapshot: usuario.nombreCompleto,
      autor_puesto_snapshot: usuario.puesto,
    })
    .select('id')
    .single();

  if (error || !sesion) {
    log.error({ err: error }, 'Error creating sesion psicologia');
    return redirect('/sanitario/psicologia');
  }

  redirect(`/sanitario/psicologia/${sesion.id}`);
}

export default async function NuevaSesionPsicologiaPage() {
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

  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  return (
    <div className="p-6">
      <Link
        href="/sanitario/psicologia"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a psicología
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">Nueva sesión de psicología</h1>

      <form
        action={crearSesion}
        className="border-border bg-card max-w-2xl space-y-4 rounded-lg border p-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Tipo de sesión"
            name="tipo_sesion"
            required
            defaultValue="individual"
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'grupal', label: 'Grupal / de equipo' },
            ]}
          />
          <InputField label="Fecha y hora" type="datetime-local" name="fecha_hora" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Jugadora (si es individual)"
            name="jugadora_id"
            defaultValue=""
            options={[
              { value: '', label: '-' },
              ...(jugadoras ?? []).map((j) => ({
                value: j.id,
                label: `${j.nombre} ${j.apellidos}`,
              })),
            ]}
          />
          <SelectField
            label="Equipo (si es grupal)"
            name="equipo_id"
            defaultValue=""
            options={[
              { value: '', label: '-' },
              ...(equipos ?? []).map((e) => ({
                value: e.id,
                label: e.nombre,
              })),
            ]}
          />
        </div>

        <InputField
          label="Tema"
          name="tema"
          required
          placeholder="Ej: Ansiedad competitiva, cohesión de equipo, adaptación a lesión..."
        />

        <TextareaField label="Objetivos trabajados" name="objetivos" rows={3} />

        <TextareaField label="Desarrollo de la sesión" name="desarrollo" rows={4} />

        <TextareaField label="Acuerdos / tareas" name="acuerdos" rows={3} />

        <FormSubmitButton>Guardar sesión</FormSubmitButton>
      </form>
    </div>
  );
}
