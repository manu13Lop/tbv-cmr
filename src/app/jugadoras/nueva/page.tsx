import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ArrowLeft } from 'lucide-react';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearJugadoraSchema } from '@/lib/validations';
import { InputField, SelectField } from '@/components/ui';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('jugadoras');

async function crearJugadora(formData: FormData) {
  'use server';
  const supabase = await createClient();

  const validation = validateFormData(crearJugadoraSchema, formData);
  if (!validation.success) {
    return redirect(
      `/jugadoras/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const {
    nombre,
    apellidos,
    fecha_nacimiento,
    dni,
    email,
    talla_camiseta_entreno,
    talla_camiseta_partido,
    talla_calzona,
    talla_chandal,
    talla_chaqueton,
  } = validation.data;

  const { count } = await supabase.from('jugadoras').select('id', { count: 'exact', head: true });

  const codigo_interno = `JUG-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { error } = await supabase.from('jugadoras').insert({
    nombre,
    apellidos,
    fecha_nacimiento,
    dni: dni || null,
    codigo_interno,
    email: email || null,
    talla_camiseta_entreno,
    talla_camiseta_partido,
    talla_calzona,
    talla_chandal,
    talla_chaqueton,
  });

  if (error) {
    log.error({ err: error }, 'Error creating jugadora');
    return redirect(
      `/jugadoras/nueva?error=${encodeURIComponent('Error al crear la jugadora: ' + error.message)}`
    );
  }

  redirect('/jugadoras');
}

const tallaOptions = ['', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const tallaSelectOptions = tallaOptions.map((t) => ({ value: t, label: t === '' ? '-' : t }));

function TallaSelect({ name, label }: { name: string; label: string }) {
  return <SelectField label={label} name={name} options={tallaSelectOptions} />;
}

export default async function NuevaJugadoraPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="p-6">
      <Link
        href="/jugadoras"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a jugadoras
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">Nueva jugadora</h1>

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={crearJugadora} className="max-w-lg space-y-4">
        <InputField label="Nombre" name="nombre" required />

        <InputField label="Apellidos" name="apellidos" required />

        <InputField label="Fecha de nacimiento" type="date" name="fecha_nacimiento" required />

        <InputField label="DNI" name="dni" placeholder="12345678A" />

        <InputField label="Email" type="email" name="email" />

        <div className="grid grid-cols-2 gap-4">
          <TallaSelect name="talla_camiseta_entreno" label="Camiseta entreno" />
          <TallaSelect name="talla_camiseta_partido" label="Camiseta partido" />
          <TallaSelect name="talla_calzona" label="Calzona" />
          <TallaSelect name="talla_chandal" label="Chándal" />
          <TallaSelect name="talla_chaqueton" label="Chaquetón" />
        </div>

        <FormSubmitButton>Guardar jugadora</FormSubmitButton>
      </form>
    </div>
  );
}
