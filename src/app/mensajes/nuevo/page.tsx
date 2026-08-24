import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { FormSubmitButton } from '@/components/form-submit-button';
import { InputField, SelectField, TextareaField } from '@/components/ui';
import { enviarMensajeAction } from '../actions';

export default async function NuevoMensajePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'mensajes.enviar')) {
    redirect('/');
  }

  const { error } = await searchParams;

  const supabase = await createClient();

  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre, categoria')
    .order('nombre');

  return (
    <div className="p-6">
      <Link
        href="/mensajes"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a mensajes
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">Nuevo mensaje</h1>

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={enviarMensajeAction} className="max-w-lg space-y-4">
        <SelectField
          label="Equipo / categoría destino"
          name="equipo_id"
          required
          defaultValue=""
          placeholder="Selecciona un equipo"
          options={(equipos ?? []).map((eq) => ({
            value: eq.id,
            label: `${eq.nombre} (${eq.categoria})`,
          }))}
        />

        <InputField label="Asunto" name="asunto" required />

        <TextareaField label="Mensaje" name="cuerpo" rows={6} required />

        <div className="flex items-center gap-2">
          <input type="checkbox" name="requiere_confirmacion" id="requiere_confirmacion" />
          <label htmlFor="requiere_confirmacion" className="text-sm font-medium">
            Solicitar confirmación de lectura
          </label>
        </div>

        <FormSubmitButton>Enviar mensaje</FormSubmitButton>
      </form>
    </div>
  );
}
