import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual } from '@/lib/auth-helpers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Video, ExternalLink, Tag } from 'lucide-react';
import {
  SECCIONES_PRINCIPALES,
  SECCIONES_SECUNDARIAS,
  NIVELES_DIFICULTAD,
} from '@/lib/ejercicios-constants';
import { StarRatingWrapper } from './star-rating-wrapper';
import { EjercicioActions } from './ejercicio-actions';
import { VarianteForm } from './variante-form';

const seccionLabel = (val: string | null, list: readonly { value: string; label: string }[]) =>
  list.find((s) => s.value === val)?.label ?? val ?? '—';

export default async function EjercicioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) redirect('/login');

  const supabase = await createClient();

  const { data: ejercicio } = await supabase
    .from('ejercicios')
    .select(
      `
      *,
      ejercicio_archivos(id, tipo, url, nombre),
      ejercicio_valoraciones(puntuacion, usuario_id, comentario, created_at, usuarios(nombre, apellidos)),
      ejercicio_variantes(id, titulo, nivel_dificultad, descripcion, notas_entrenador, created_at, created_by, usuarios(nombre, apellidos))
    `
    )
    .eq('id', id)
    .single();

  if (!ejercicio) notFound();

  const archivos =
    (ejercicio.ejercicio_archivos as unknown as {
      id: string;
      tipo: string;
      url: string;
      nombre: string | null;
    }[]) ?? [];

  const valoraciones =
    (ejercicio.ejercicio_valoraciones as unknown as {
      puntuacion: number;
      usuario_id: string;
      comentario: string | null;
      created_at: string;
      usuarios: { nombre: string; apellidos: string } | null;
    }[]) ?? [];

  const avgPuntuacion =
    valoraciones.length > 0
      ? valoraciones.reduce((sum, v) => sum + v.puntuacion, 0) / valoraciones.length
      : 0;

  const miValoracion = valoraciones.find((v) => v.usuario_id === usuarioActual?.id);

  const variantes =
    (ejercicio.ejercicio_variantes as unknown as {
      id: string;
      titulo: string;
      nivel_dificultad: string;
      descripcion: string | null;
      notas_entrenador: string | null;
      created_at: string;
      created_by: string | null;
      usuarios: { nombre: string; apellidos: string } | null;
    }[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ejercicios" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ejercicio.titulo}</h1>
          <p className="text-muted-foreground text-sm">
            Creado el{' '}
            {new Date(ejercicio.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <EjercicioActions
          ejercicioId={ejercicio.id}
          createdBy={ejercicio.created_by}
          userId={usuarioActual.id}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
          <Tag className="size-3" />
          {seccionLabel(ejercicio.seccion_principal, SECCIONES_PRINCIPALES)}
        </span>
        {ejercicio.seccion_secundaria && (
          <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
            {seccionLabel(ejercicio.seccion_secundaria, SECCIONES_SECUNDARIAS)}
          </span>
        )}
      </div>

      <div className="border-border bg-card rounded-lg border p-6">
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Valoración
        </h2>
        <StarRatingWrapper
          ejercicioId={ejercicio.id}
          miPuntuacion={miValoracion?.puntuacion ?? 0}
          totalValoraciones={valoraciones.length}
          promedio={avgPuntuacion}
        />
      </div>

      {ejercicio.aspectos_individuales && ejercicio.aspectos_individuales.length > 0 && (
        <div className="border-border bg-card rounded-lg border p-6">
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Aspectos individuales
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(ejercicio.aspectos_individuales as string[]).map((a) => (
              <span key={a} className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {(ejercicio.objetivo_primario ||
        ejercicio.objetivo_secundario ||
        ejercicio.objetivo_terciario) && (
        <div className="border-border bg-card space-y-3 rounded-lg border p-6">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Objetivos
          </h2>
          {ejercicio.objetivo_primario && (
            <div>
              <p className="text-primary text-xs font-medium">Primario</p>
              <p className="text-sm">{ejercicio.objetivo_primario}</p>
            </div>
          )}
          {ejercicio.objetivo_secundario && (
            <div>
              <p className="text-muted-foreground text-xs font-medium">Secundario</p>
              <p className="text-sm">{ejercicio.objetivo_secundario}</p>
            </div>
          )}
          {ejercicio.objetivo_terciario && (
            <div>
              <p className="text-muted-foreground text-xs font-medium">Terciario</p>
              <p className="text-sm">{ejercicio.objetivo_terciario}</p>
            </div>
          )}
        </div>
      )}

      {ejercicio.descripcion && (
        <div className="border-border bg-card rounded-lg border p-6">
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Descripción
          </h2>
          <p className="text-sm whitespace-pre-wrap">{ejercicio.descripcion}</p>
        </div>
      )}

      {ejercicio.puntos_clave && (
        <div className="border-border bg-card rounded-lg border p-6">
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Puntos clave
          </h2>
          <p className="text-sm whitespace-pre-wrap">{ejercicio.puntos_clave}</p>
        </div>
      )}

      {ejercicio.observaciones && (
        <div className="border-border bg-card rounded-lg border p-6">
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Observaciones
          </h2>
          <p className="text-sm whitespace-pre-wrap">{ejercicio.observaciones}</p>
        </div>
      )}

      {archivos.length > 0 && (
        <div className="border-border bg-card rounded-lg border p-6">
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Archivos adjuntos
          </h2>
          <div className="space-y-2">
            {archivos.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-muted/50 hover:bg-muted flex items-center gap-3 rounded-md border p-3 text-sm transition-colors"
              >
                {a.tipo === 'pdf' && <FileText className="size-4 text-red-500" />}
                {(a.tipo === 'video' || a.tipo === 'enlace') && (
                  <Video className="size-4 text-blue-500" />
                )}
                {a.tipo === 'imagen' && <FileText className="size-4 text-green-500" />}
                <span className="flex-1">{a.nombre ?? a.url}</span>
                <ExternalLink className="text-muted-foreground size-3.5" />
              </a>
            ))}
          </div>
        </div>
      )}

      {ejercicio.video_url && (
        <div className="border-border bg-card rounded-lg border p-6">
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Video
          </h2>
          <a
            href={ejercicio.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex items-center gap-2 text-sm hover:underline"
          >
            <Video className="size-4" />
            Ver video enlace externo
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}

      <div className="border-border bg-card space-y-4 rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Variantes ({variantes.length})
          </h2>
        </div>

        {variantes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay variantes creadas. Crea variantes para ofrecer opciones con diferentes niveles de
            dificultad.
          </p>
        ) : (
          <div className="space-y-3">
            {variantes.map((v) => (
              <div key={v.id} className="border-border space-y-2 rounded-md border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{v.titulo}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          v.nivel_dificultad === 'basico'
                            ? 'bg-green-100 text-green-800'
                            : v.nivel_dificultad === 'avanzado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {NIVELES_DIFICULTAD.find((n) => n.value === v.nivel_dificultad)?.label ??
                          v.nivel_dificultad}
                      </span>
                      {v.usuarios && (
                        <span className="text-muted-foreground text-[10px]">
                          {v.usuarios.nombre} {v.usuarios.apellidos}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {v.descripcion && <p className="text-muted-foreground text-sm">{v.descripcion}</p>}
                {v.notas_entrenador && (
                  <p className="text-muted-foreground text-xs italic">Nota: {v.notas_entrenador}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <VarianteForm ejercicioId={ejercicio.id} />
      </div>

      {valoraciones.length > 0 && (
        <div className="border-border bg-card space-y-4 rounded-lg border p-6">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Valoraciones ({valoraciones.length})
          </h2>
          <div className="space-y-3">
            {valoraciones.map((v, i) => (
              <div key={i} className="border-border rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {v.usuarios?.nombre} {v.usuarios?.apellidos}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={s <= v.puntuacion ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {v.comentario && <p className="text-muted-foreground text-xs">{v.comentario}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
