import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, FileText } from 'lucide-react';
import { ProgressBar } from '@/components/progress-bar';

export default async function LeccionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; leccion_id: string }>;
  searchParams: Promise<{ curso?: string }>;
}) {
  const { leccion_id } = await params;
  const { curso: cursoParam } = await searchParams;

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'scouting.leer')) {
    redirect('/');
  }

  const supabase = await createClient();

  const { data: leccion } = await supabase
    .from('formacion_lecciones')
    .select('*')
    .eq('id', leccion_id)
    .eq('activo', true)
    .single();

  if (!leccion) notFound();

  const cursoId = cursoParam ?? leccion.curso_id;

  const { data: cursoData } = await supabase
    .from('formacion_cursos')
    .select('titulo')
    .eq('id', cursoId)
    .single();

  const { data: todasLecciones } = await supabase
    .from('formacion_lecciones')
    .select('id, titulo, orden')
    .eq('curso_id', cursoId)
    .eq('activo', true)
    .order('orden');

  const { data: progreso } = await supabase
    .from('formacion_progreso')
    .select('porcentaje, completado, leccion_actual_id')
    .eq('curso_id', cursoId)
    .eq('usuario_id', usuario.id)
    .maybeSingle();

  const leccionIndex = todasLecciones?.findIndex((l) => l.id === leccion_id) ?? 0;
  const totalLecciones = todasLecciones?.length ?? 0;
  const pctLeccion =
    totalLecciones > 0 ? Math.round(((leccionIndex + 1) / totalLecciones) * 100) : 0;

  await updateLeccionProgreso(
    await supabase,
    usuario.id,
    cursoId,
    leccion_id,
    pctLeccion,
    progreso
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-xs">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span>/</span>
        <Link href="/formacion" className="hover:text-foreground">
          Formación
        </Link>
        <span>/</span>
        <Link href={`/formacion/cursos/${cursoId}`} className="hover:text-foreground">
          {cursoData?.titulo ?? 'Curso'}
        </Link>
        <span>/</span>
        <span className="text-foreground">{leccion.titulo}</span>
      </nav>

      <div className="mb-6">
        <Link
          href={`/formacion/cursos/${cursoId}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          Volver al curso
        </Link>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-primary text-2xl font-bold">{leccion.titulo}</h1>
          {leccion.tipo === 'video' && <Play className="text-muted-foreground size-5" />}
          {leccion.tipo === 'texto' && <FileText className="text-muted-foreground size-5" />}
        </div>

        {totalLecciones > 0 && (
          <p className="text-muted-foreground text-xs">
            Lección {leccionIndex + 1} de {totalLecciones}
          </p>
        )}
      </div>

      {pctLeccion > 0 && (
        <div className="mb-6">
          <ProgressBar porcentaje={pctLeccion} label={`Progreso del curso (${pctLeccion}%)`} />
        </div>
      )}

      <div className="border-border bg-card mb-8 rounded-lg border p-6">
        {leccion.tipo === 'video' && leccion.contenido_url && (
          <div className="mb-4 aspect-video w-full">
            <iframe
              src={leccion.contenido_url.replace('watch?v=', 'embed/')}
              className="h-full w-full rounded-md"
              allowFullScreen
              title={leccion.titulo}
            />
          </div>
        )}

        {leccion.tipo === 'texto' && leccion.contenido_texto && (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: leccion.contenido_texto }}
          />
        )}

        {leccion.tipo === 'pdf' && leccion.contenido_url && (
          <div className="border-border bg-muted rounded-md border p-4 text-center">
            <a
              href={leccion.contenido_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary flex items-center justify-center gap-2 text-sm hover:underline"
            >
              <FileText className="size-5" />
              Abrir documento PDF
            </a>
          </div>
        )}

        {leccion.tipo === 'imagen' && leccion.contenido_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={leccion.contenido_url} alt={leccion.titulo} className="max-w-full rounded-md" />
        )}

        {!leccion.contenido_url && !leccion.contenido_texto && (
          <p className="text-muted-foreground text-sm">
            No hay contenido disponible para esta lección.
          </p>
        )}

        {leccion.duracion_minutos > 0 && (
          <p className="text-muted-foreground mt-4 text-xs">
            Duración estimada: {leccion.duracion_minutos} minutos
          </p>
        )}
      </div>

      {todasLecciones && todasLecciones.length > 0 && (
        <div className="border-border border-t pt-6">
          <h2 className="text-primary mb-3 text-lg font-bold">Lecciones del curso</h2>
          <div className="space-y-2">
            {todasLecciones.map((l, idx) => (
              <Link
                key={l.id}
                href={`/formacion/cursos/${cursoId}/lecciones/${l.id}?curso=${cursoId}`}
                className={`flex items-center gap-3 rounded-md border p-3 text-sm transition-colors ${
                  l.id === leccion_id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span className="w-5 text-center text-xs">{idx + 1}</span>
                <span className="flex-1">{l.titulo}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

async function updateLeccionProgreso(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuarioId: string,
  cursoId: string,
  leccionId: string,
  porcentaje: number,
  progreso: { porcentaje: number; completado: boolean } | null
) {
  if (progreso?.completado) return;

  const porcentajeCurso = progreso?.porcentaje ?? 0;
  const nuevoPorcentaje = Math.max(porcentajeCurso, porcentaje);

  await supabase.from('formacion_progreso').upsert({
    curso_id: cursoId,
    usuario_id: usuarioId,
    leccion_actual_id: leccionId,
    porcentaje: nuevoPorcentaje,
    completado: nuevoPorcentaje >= 100,
    completado_at: nuevoPorcentaje >= 100 ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
