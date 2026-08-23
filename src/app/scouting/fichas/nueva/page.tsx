import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ArrowLeft } from 'lucide-react';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearFichaScoutingSchema } from '@/lib/validations';
import { InputField, SelectField, TextareaField } from '@/components/ui';

async function crearFicha(formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'scouting.editar')) return;

  const validation = validateFormData(crearFichaScoutingSchema, formData);
  if (!validation.success) {
    return redirect(
      `/scouting/fichas/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const { jugadora_id, nombre_externo, club_actual, posicion, fecha_nacimiento, notas_generales } =
    validation.data;

  const supabase = await createClient();

  const { data: ficha, error } = await supabase
    .from('scouting_fichas')
    .insert({
      jugadora_id: jugadora_id || null,
      nombre_externo: jugadora_id ? null : nombre_externo || null,
      club_actual: club_actual || null,
      posicion: posicion || null,
      fecha_nacimiento: fecha_nacimiento || null,
      notas_generales: notas_generales || null,
      autor_usuario_id: usuario.id,
      autor_nombre_snapshot: usuario.nombreCompleto,
    })
    .select('id')
    .single();

  if (error || !ficha) {
    console.error(error);
    return redirect('/scouting');
  }

  redirect(`/scouting/fichas/${ficha.id}`);
}

export default async function NuevaFichaScoutingPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'scouting.editar')) {
    redirect('/scouting');
  }

  const supabase = await createClient();
  const { data: jugadoras } = await supabase
    .from('jugadoras')
    .select('id, nombre, apellidos')
    .order('apellidos');

  return (
    <div className="p-6">
      <Link
        href="/scouting"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a scouting
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">Nueva ficha de seguimiento</h1>

      <form
        action={crearFicha}
        className="border-border bg-card max-w-lg space-y-4 rounded-lg border p-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Jugadora del club"
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
          <InputField
            label="O jugadora externa"
            name="nombre_externo"
            placeholder="Nombre y apellidos"
          />
        </div>

        <InputField label="Club actual" name="club_actual" />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Posición" name="posicion" placeholder="Ej: Extremo, Central..." />
          <InputField label="Fecha de nacimiento" type="date" name="fecha_nacimiento" />
        </div>

        <TextareaField label="Notas generales" name="notas_generales" rows={3} />

        <FormSubmitButton>Crear ficha</FormSubmitButton>
      </form>
    </div>
  );
}
