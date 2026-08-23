import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { EditarMovimientoForm } from './editar-movimiento-form';
import { BorrarMovimientoForm } from './borrar-movimiento-form';

export default async function LogisticaMovimientoDetallePage({
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

  const [{ data: movimientoData }, { data: articulos }, { data: equipos }] = await Promise.all([
    supabase
      .from('logistica_movimientos')
      .select(
        `
          *,
          logistica_articulos (
            id,
            nombre,
            unidad
          ),
          equipos (
            nombre
          )
        `
      )
      .eq('id', id)
      .single(),
    supabase
      .from('logistica_articulos')
      .select('id, nombre, unidad, activo')
      .eq('activo', true)
      .order('nombre'),
    supabase.from('equipos').select('id, nombre').order('nombre'),
  ]);

  if (!movimientoData) notFound();

  const movimiento = movimientoData as unknown as Record<string, unknown>;
  const puedeEditar = tienePermiso(usuario.permisos, 'logistica.movimientos');

  return (
    <div className="p-6">
      <Link
        href="/logistica/movimientos"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a movimientos
      </Link>

      <h1 className="text-primary mb-2 text-2xl font-bold">Detalle de movimiento</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Edita o elimina un movimiento registrado.
      </p>

      <div className="border-border bg-card mb-6 rounded-xl border p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">Creado</p>
            <p className="text-foreground text-sm font-medium">
              {new Date(movimiento.created_at as string).toLocaleString('es-ES')}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">Registrado por</p>
            <p className="text-foreground text-sm font-medium">
              {(movimiento.usuario_nombre_snapshot as string) ?? 'Sin usuario'}
            </p>
          </div>
        </div>
      </div>

      {puedeEditar && (
        <EditarMovimientoForm
          movimiento={{
            id: movimiento.id as string,
            articulo_id: movimiento.articulo_id as string,
            tipo: movimiento.tipo as string,
            cantidad: movimiento.cantidad as number,
            motivo: (movimiento.motivo as string) ?? null,
            equipo_id: (movimiento.equipo_id as string) ?? null,
          }}
          articulos={articulos ?? []}
          equipos={equipos ?? []}
        />
      )}

      {puedeEditar && <BorrarMovimientoForm movimientoId={movimiento.id as string} />}
    </div>
  );
}
