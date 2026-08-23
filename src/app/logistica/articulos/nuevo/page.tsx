import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { FormSubmitButton } from '@/components/form-submit-button';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearArticuloSchema } from '@/lib/validations';

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
    console.error(articuloError);
    redirect('/logistica/articulos/nuevo');
  }

  const { error: minimoError } = await supabase.from('logistica_stock_minimos').insert({
    articulo_id: articulo.id,
    stock_minimo: stock_minimo || 0,
    equipo_id: equipo_id || null,
    observaciones: observaciones_stock || null,
  });

  if (minimoError) {
    console.error(minimoError);
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
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              name="nombre"
              required
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Categoría</label>
            <input
              name="categoria"
              required
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
              placeholder="Botiquín, higiene, material deportivo..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Unidad</label>
            <input
              name="unidad"
              required
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
              placeholder="uds, botellas, cajas..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Equipo asociado</label>
            <select
              name="equipo_id"
              defaultValue=""
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            >
              <option value="">Sin equipo específico</option>
              {equipos?.map((equipo: Record<string, unknown>) => (
                <option key={equipo.id as string} value={equipo.id as string}>
                  {equipo.nombre as string}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Stock mínimo</label>
            <input
              type="number"
              name="stock_minimo"
              min={0}
              defaultValue={0}
              required
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="es_sanitario" />
              Material sanitario
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <textarea
              name="descripcion"
              rows={3}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Observaciones de stock mínimo</label>
            <textarea
              name="observaciones_stock"
              rows={2}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
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
