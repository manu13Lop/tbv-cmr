import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InputField, TextareaField } from '@/components/ui';
import { FormSubmitButton } from '@/components/form-submit-button';
import { actualizarSocio } from '@/lib/socios-actions';

export default async function EditarSocioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.editar'))
    redirect('/socios?error=no_autorizado');

  const supabase = await createClient();
  const { data: socio } = await supabase.from('socios').select('*').eq('id', id).single();

  if (!socio) notFound();

  const updateAction = actualizarSocio.bind(null, id);

  return (
    <div className="p-6">
      <Link
        href={`/socios/${id}`}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver al socio
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">
        Editar: {socio.nombre} {socio.apellidos}
      </h1>

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={updateAction} className="max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Nombre" name="nombre" defaultValue={socio.nombre} required />
          <InputField label="Apellidos" name="apellidos" defaultValue={socio.apellidos} required />
        </div>

        <InputField label="DNI" name="dni" defaultValue={socio.dni ?? ''} />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Email" type="email" name="email" defaultValue={socio.email ?? ''} />
          <InputField label="Teléfono" name="telefono" defaultValue={socio.telefono ?? ''} />
        </div>

        <InputField
          label="Fecha de nacimiento"
          type="date"
          name="fecha_nacimiento"
          defaultValue={socio.fecha_nacimiento ?? ''}
        />

        <InputField label="Dirección" name="direccion" defaultValue={socio.direccion ?? ''} />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Ciudad" name="ciudad" defaultValue={socio.ciudad ?? ''} />
          <InputField
            label="Código postal"
            name="codigo_postal"
            defaultValue={socio.codigo_postal ?? ''}
          />
        </div>

        <TextareaField label="Notas internas" name="notas" defaultValue={socio.notas ?? ''} />

        <FormSubmitButton>Guardar cambios</FormSubmitButton>
      </form>
    </div>
  );
}
