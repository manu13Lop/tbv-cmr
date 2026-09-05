import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InputField, TextareaField } from '@/components/ui';
import { FormSubmitButton } from '@/components/form-submit-button';
import { crearSocio } from '@/lib/socios-actions';

export default async function NuevoSocioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.editar'))
    redirect('/socios?error=no_autorizado');

  return (
    <div className="p-6">
      <Link
        href="/socios"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a socios
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">Nuevo socio</h1>

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={crearSocio} className="max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Nombre" name="nombre" required />
          <InputField label="Apellidos" name="apellidos" required />
        </div>

        <InputField label="DNI" name="dni" placeholder="12345678A" />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Email" type="email" name="email" />
          <InputField label="Teléfono" name="telefono" />
        </div>

        <InputField label="Fecha de nacimiento" type="date" name="fecha_nacimiento" />

        <InputField label="Dirección" name="direccion" placeholder="Calle, número, piso..." />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Ciudad" name="ciudad" />
          <InputField label="Código postal" name="codigo_postal" />
        </div>

        <TextareaField
          label="Notas internas"
          name="notas"
          placeholder="Notas visibles solo para la directiva..."
        />

        <div className="border-border bg-muted/50 rounded-lg border p-4">
          <p className="text-muted-foreground text-xs">
            Se enviará automáticamente un email de consentimiento RGPD a la dirección de correo
            indicada. El socio deberá aceptar o rechazar el consentimiento de comunicaciones para
            completar su inscripción.
          </p>
        </div>

        <FormSubmitButton>Crear socio</FormSubmitButton>
      </form>
    </div>
  );
}
