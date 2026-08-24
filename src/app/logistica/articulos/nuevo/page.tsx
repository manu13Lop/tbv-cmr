import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { FormSubmitButton } from '@/components/form-submit-button';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearArticuloSchema } from '@/lib/validations';
import { InputField, SelectField, TextareaField } from '@/components/ui';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('logistica');

async function crearArticulo(formData: FormData) {
  'use server';

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'logistica.editar')) {
    redirect('/');
  }

  const validation = validateFormData(crearArticuloSchema, formData);
  if (!validation.success) {
    return redirect(
      `/logistica/articulos/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const {
    nombre,
    categoria,
    unidad,
    descripcion,
    es_sanitario,
    stock_minimo,
    equipo_id,
    observaciones_stock,
  } = validation.data;

  const supabase = await createClient();

  const { data: articulo, error: articuloError } = await supabase
    .from('logistica_articulos')
    .insert({
      nombre,
      categoria,
      descripcion: descripcion || null,
      unidad,
      es_sanitario: es_sanitario || false,
      activo: true,
    })
    .select('id')
    .single();

  if (articuloError || !articulo) {
    log.error({ err: articuloError }, 'Error creating articulo logistica');
    redirect('/logistica/articulos/nuevo');
  }

  const { error: minimoError } = await supabase.from('logistica_stock_minimos').insert({
    articulo_id: articulo.id,
    stock_minimo: stock_minimo || 0,
    equipo_id: equipo_id || null,
    observaciones: observaciones_stock || null,
  });

  if (minimoError) {
    log.error({ err: minimoError }, 'Error creating stock minimo');
  }

  redirect(`/logistica/articulos/${articulo.id}`);
}

export default async function NuevoArticuloLogisticaPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'logistica.editar')) {
    redirect('/');
  }

  const supabase = await createClient();
  const { data: equipos } = await supabase.from('equipos').select('id, nombre').order('nombre');

  return (
    <div className="p-6">
      <Link
        href="/logistica/articulos"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a artículos
      </Link>

      <h1 className="text-primary mb-2 text-2xl font-bold">Nuevo artículo</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Da de alta el artículo y define su stock mínimo.
      </p>

      <form action={crearArticulo} className="border-border bg-card rounded-xl border p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Nombre" name="nombre" required />

          <InputField
            label="Categoría"
            name="categoria"
            required
            placeholder="Botiquín, higiene, material deportivo..."
          />

          <InputField label="Unidad" name="unidad" required placeholder="uds, botellas, cajas..." />

          <SelectField
            label="Equipo asociado"
            name="equipo_id"
            defaultValue=""
            options={[
              { value: '', label: 'Sin equipo específico' },
              ...(equipos?.map((equipo: Record<string, unknown>) => ({
                value: equipo.id as string,
                label: equipo.nombre as string,
              })) ?? []),
            ]}
          />

          <InputField
            label="Stock mínimo"
            type="number"
            name="stock_minimo"
            min="0"
            defaultValue="0"
            required
          />

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="es_sanitario" />
              Material sanitario
            </label>
          </div>

          <div className="md:col-span-2">
            <TextareaField label="Descripción" name="descripcion" rows={3} />
          </div>

          <div className="md:col-span-2">
            <TextareaField
              label="Observaciones de stock mínimo"
              name="observaciones_stock"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-4">
          <FormSubmitButton>Guardar artículo</FormSubmitButton>
        </div>
      </form>
    </div>
  );
}
