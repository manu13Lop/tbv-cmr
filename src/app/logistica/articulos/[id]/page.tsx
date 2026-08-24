import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { FormSubmitButton } from '@/components/form-submit-button';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('logistica');

async function actualizarArticuloDetalle(id: string, formData: FormData) {
  'use server';

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'logistica.editar')) {
    redirect('/');
  }

  const supabase = await createClient();

  const nombre = (formData.get('nombre') as string)?.trim();
  const categoria = (formData.get('categoria') as string)?.trim();
  const descripcion = (formData.get('descripcion') as string)?.trim();
  const unidad = (formData.get('unidad') as string)?.trim();
  const esSanitario = formData.get('es_sanitario') === 'on';
  const activo = formData.get('activo') === 'on';
  const stockMinimoId = (formData.get('stock_minimo_id') as string) || '';
  const stockMinimo = Number(formData.get('stock_minimo') || 0);
  const equipoIdRaw = (formData.get('equipo_id') as string) || '';
  const observaciones = (formData.get('observaciones_stock') as string)?.trim();

  if (!nombre || !categoria || !unidad) {
    redirect(`/logistica/articulos/${id}`);
  }

  const { error: articuloError } = await supabase
    .from('logistica_articulos')
    .update({
      nombre,
      categoria,
      descripcion: descripcion || null,
      unidad,
      es_sanitario: esSanitario,
      activo,
    })
    .eq('id', id);

  if (articuloError) {
    log.error({ err: articuloError }, 'Error updating articulo detalle');
    redirect(`/logistica/articulos/${id}`);
  }

  if (stockMinimoId) {
    const { error: minimoError } = await supabase
      .from('logistica_stock_minimos')
      .update({
        stock_minimo: stockMinimo,
        equipo_id: equipoIdRaw || null,
        observaciones: observaciones || null,
      })
      .eq('id', stockMinimoId);

    if (minimoError) log.error({ err: minimoError }, 'Error updating stock minimo');
  } else {
    const { error: insertError } = await supabase.from('logistica_stock_minimos').insert({
      articulo_id: id,
      stock_minimo: stockMinimo,
      equipo_id: equipoIdRaw || null,
      observaciones: observaciones || null,
    });

    if (insertError) log.error({ err: insertError }, 'Error creating stock minimo');
  }

  redirect(`/logistica/articulos/${id}`);
}

async function crearMovimientoDesdeDetalle(id: string, formData: FormData) {
  'use server';

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'logistica.movimientos')) {
    redirect('/');
  }

  const supabase = await createClient();

  const tipo = formData.get('tipo') as string;
  const cantidad = Number(formData.get('cantidad') || 0);
  const motivo = (formData.get('motivo') as string)?.trim();
  const equipoIdRaw = (formData.get('equipo_id') as string) || '';

  if (!['entrada', 'salida', 'ajuste'].includes(tipo) || cantidad <= 0) {
    redirect(`/logistica/articulos/${id}`);
  }

  const { data: articulo } = await supabase
    .from('logistica_articulos')
    .select('id, stock_actual, activo')
    .eq('id', id)
    .single();

  if (!articulo || !articulo.activo) {
    redirect(`/logistica/articulos/${id}`);
  }

  if (tipo === 'salida' && articulo.stock_actual < cantidad) {
    redirect(`/logistica/articulos/${id}`);
  }

  const { error } = await supabase.from('logistica_movimientos').insert({
    articulo_id: id,
    tipo,
    cantidad,
    motivo: motivo || null,
    equipo_id: equipoIdRaw || null,
    usuario_id: usuario.id,
    usuario_nombre_snapshot: usuario.nombreCompleto,
  });

  if (error) log.error({ err: error }, 'Error creating movimiento desde detalle');

  redirect(`/logistica/articulos/${id}`);
}

export default async function LogisticaArticuloDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'logistica.leer')) {
    redirect('/');
  }

  const supabase = await createClient();

  const [{ data: articuloData }, { data: equipos }, { data: movimientos }] = await Promise.all([
    supabase
      .from('logistica_articulos')
      .select(
        `
          *,
          logistica_stock_minimos (
            id,
            stock_minimo,
            observaciones,
            equipo_id
          )
        `
      )
      .eq('id', id)
      .single(),
    supabase.from('equipos').select('id, nombre').order('nombre'),
    supabase
      .from('logistica_movimientos')
      .select(
        `
          *,
          equipos (
            nombre
          )
        `
      )
      .eq('articulo_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!articuloData) notFound();

  const articulo = articuloData as unknown as Record<string, unknown>;
  const minimo =
    (articulo.logistica_stock_minimos as unknown as Record<string, unknown>[] | null)?.[0] ?? null;
  const equipo = equipos?.find(
    (e: Record<string, unknown>) => e.id === (minimo?.equipo_id as string)
  );
  const stockBajo = (articulo.stock_actual as number) <= ((minimo?.stock_minimo as number) ?? 0);
  const actualizarAction = actualizarArticuloDetalle.bind(null, id);
  const crearMovimientoAction = crearMovimientoDesdeDetalle.bind(null, id);

  return (
    <div className="p-6">
      <Link
        href="/logistica/articulos"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a artículos
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-primary text-2xl font-bold">{articulo.nombre as string}</h1>
          <p className="text-muted-foreground text-sm">
            {articulo.categoria as string}
            {articulo.es_sanitario ? ' · Material sanitario' : ''}
            {equipo ? ` · ${equipo.nombre}` : ''}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="border-border bg-card rounded-lg border px-4 py-3 text-center">
            <p className="text-muted-foreground text-xs">Stock actual</p>
            <p className="text-lg font-bold">
              {articulo.stock_actual as string} {articulo.unidad as string}
            </p>
          </div>

          <div className="border-border bg-card rounded-lg border px-4 py-3 text-center">
            <p className="text-muted-foreground text-xs">Stock mínimo</p>
            <p className="text-lg font-bold">
              {(minimo?.stock_minimo as string) ?? 0} {articulo.unidad as string}
            </p>
          </div>
        </div>
      </div>

      <div className="border-border bg-card mb-6 rounded-xl border p-4">
        <p className="text-sm">
          Estado actual:{' '}
          <span
            className={stockBajo ? 'text-destructive font-semibold' : 'text-primary font-semibold'}
          >
            {stockBajo ? 'Stock bajo' : 'Correcto'}
          </span>
        </p>
      </div>

      {tienePermiso(usuario.permisos, 'logistica.editar') && (
        <form
          action={actualizarAction}
          className="border-border bg-card mb-8 rounded-xl border p-4"
        >
          <h2 className="text-primary mb-4 text-lg font-bold">Editar artículo</h2>

          <input type="hidden" name="stock_minimo_id" value={(minimo?.id as string) ?? ''} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                name="nombre"
                defaultValue={articulo.nombre as string}
                required
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Categoría</label>
              <input
                name="categoria"
                defaultValue={articulo.categoria as string}
                required
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Unidad</label>
              <input
                name="unidad"
                defaultValue={articulo.unidad as string}
                required
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Equipo asociado</label>
              <select
                name="equipo_id"
                defaultValue={(minimo?.equipo_id as string) ?? ''}
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
                defaultValue={(minimo?.stock_minimo as number) ?? 0}
                required
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="es_sanitario"
                  defaultChecked={articulo.es_sanitario as boolean}
                />
                Material sanitario
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="activo" defaultChecked={articulo.activo as boolean} />
                Activo
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Descripción</label>
              <textarea
                name="descripcion"
                rows={3}
                defaultValue={(articulo.descripcion as string) ?? ''}
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Observaciones de stock mínimo
              </label>
              <textarea
                name="observaciones_stock"
                rows={2}
                defaultValue={(minimo?.observaciones as string) ?? ''}
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <FormSubmitButton>Guardar cambios</FormSubmitButton>
          </div>
        </form>
      )}

      {tienePermiso(usuario.permisos, 'logistica.movimientos') && (
        <form
          action={crearMovimientoAction}
          className="border-border bg-card mb-8 rounded-xl border p-4"
        >
          <h2 className="text-primary mb-4 text-lg font-bold">Registrar movimiento</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select
                name="tipo"
                defaultValue="entrada"
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
                <option value="ajuste">Ajuste</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Cantidad</label>
              <input
                type="number"
                name="cantidad"
                min={1}
                required
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Equipo</label>
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

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Motivo</label>
              <textarea
                name="motivo"
                rows={3}
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <FormSubmitButton>Guardar movimiento</FormSubmitButton>
          </div>
        </form>
      )}

      <div className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-primary mb-4 text-lg font-bold">Historial</h2>

        {movimientos && movimientos.length > 0 ? (
          <div className="space-y-3">
            {movimientos.map((movimiento: Record<string, unknown>) => (
              <div
                key={movimiento.id as string}
                className="border-border bg-background rounded-lg border p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{movimiento.tipo as string}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(movimiento.created_at as string).toLocaleString('es-ES')}
                    </p>
                  </div>

                  <p
                    className={`text-sm font-semibold ${
                      movimiento.tipo === 'salida' ? 'text-destructive' : 'text-primary'
                    }`}
                  >
                    {movimiento.tipo === 'salida' ? '-' : '+'}
                    {movimiento.cantidad as string} {articulo.unidad as string}
                  </p>
                </div>

                {(movimiento.equipos as unknown as Record<string, unknown>)?.nombre ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Equipo:{' '}
                    {(movimiento.equipos as unknown as Record<string, unknown>).nombre as string}
                  </p>
                ) : null}

                {movimiento.usuario_nombre_snapshot ? (
                  <p className="text-muted-foreground text-xs">
                    Registrado por: {movimiento.usuario_nombre_snapshot as string}
                  </p>
                ) : null}

                {movimiento.motivo ? (
                  <p className="text-muted-foreground mt-2 text-sm">
                    {movimiento.motivo as string}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No hay movimientos registrados para este artículo.
          </p>
        )}
      </div>
    </div>
  );
}
