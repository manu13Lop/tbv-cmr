import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Dumbbell, FileText, Video } from 'lucide-react';
import { SECCIONES_PRINCIPALES } from '@/lib/ejercicios-constants';

const seccionLabel = (val: string | null) =>
  SECCIONES_PRINCIPALES.find((s) => s.value === val)?.label ?? val ?? '—';

export default async function EjerciciosPage() {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) redirect('/login');

  const supabase = await createClient();

  const { data: ejercicios } = await supabase
    .from('ejercicios')
    .select(
      `
      id, titulo, seccion_principal, seccion_secundaria,
      created_at, created_by,
      ejercicio_archivos(id, tipo),
      ejercicio_valoraciones(puntuacion)
    `
    )
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ejercicios</h1>
          <p className="text-muted-foreground text-sm">
            Biblioteca compartida de ejercicios del club
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ejercicios/nuevo"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
          >
            <Plus className="size-4" />
            Nuevo ejercicio
          </Link>
        </div>
      </div>

      {!ejercicios || ejercicios.length === 0 ? (
        <div className="border-border bg-muted/50 rounded-lg border border-dashed p-12 text-center">
          <Dumbbell className="text-muted-foreground mx-auto mb-4 size-12" />
          <h3 className="text-foreground mb-1 font-medium">No hay ejercicios</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Empieza a crear ejercicios para compartir con el club.
          </p>
          <Link
            href="/ejercicios/nuevo"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
          >
            <Plus className="size-4" />
            Crear primer ejercicio
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ejercicios.map((ej) => {
            const archivos = (ej.ejercicio_archivos as unknown as { tipo: string }[]) ?? [];
            const valoraciones =
              (ej.ejercicio_valoraciones as unknown as { puntuacion: number }[]) ?? [];
            const avgPuntuacion =
              valoraciones.length > 0
                ? valoraciones.reduce((sum, v) => sum + v.puntuacion, 0) / valoraciones.length
                : 0;

            return (
              <Link
                key={ej.id}
                href={`/ejercicios/${ej.id}`}
                className="border-border bg-card hover:bg-muted/50 group rounded-lg border p-4 transition-colors"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-foreground group-hover:text-primary text-sm font-semibold transition-colors">
                    {ej.titulo}
                  </h3>
                  <div className="flex gap-1">
                    {archivos.some((a) => a.tipo === 'pdf') && (
                      <FileText className="size-3.5 text-red-500" />
                    )}
                    {archivos.some((a) => a.tipo === 'video' || a.tipo === 'enlace') && (
                      <Video className="size-3.5 text-blue-500" />
                    )}
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium">
                    {seccionLabel(ej.seccion_principal)}
                  </span>
                  {ej.seccion_secundaria && (
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                      {ej.seccion_secundaria}
                    </span>
                  )}
                </div>

                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {avgPuntuacion > 0 ? (
                      <>
                        <span className="text-yellow-400">★</span>
                        <span>{avgPuntuacion.toFixed(1)}</span>
                        <span>({valoraciones.length})</span>
                      </>
                    ) : (
                      <span>Sin valoraciones</span>
                    )}
                  </div>
                  <span>{new Date(ej.created_at).toLocaleDateString('es-ES')}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
