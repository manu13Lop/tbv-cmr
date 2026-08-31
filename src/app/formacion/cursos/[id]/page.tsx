import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, FileText, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from '@/components/progress-bar';
import { getCategoriaLabel } from '@/lib/formacion';

export const metadata: Metadata = {
  title: 'Curso - TBV Formación',
};

export default async function CursoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'formacion.leer')) {
    redirect('/');
  }

  const supabase = await createClient();

  const { data: curso } = await supabase
    .from('formacion_cursos')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single();

  if (!curso) notFound();

  const { data: lecciones } = await supabase
    .from('formacion_lecciones')
    .select('id, titulo, orden, tipo, duracion_minutos, activo')
    .eq('curso_id', id)
    .eq('activo', true)
    .order('orden');

  const { data: progreso } = await supabase
    .from('formacion_progreso')
    .select('curso_id, porcentaje, completado, leccion_actual_id')
    .eq('curso_id', id)
    .eq('usuario_id', usuario.id)
    .maybeSingle();

  const { data: quizzes } = await supabase
    .from('formacion_quizzes')
    .select('id, titulo')
    .eq('curso_id', id)
    .eq('activo', true);

  const puedeEditar = tienePermiso(usuario.permisos, 'formacion.editar') || usuario.esMaster;

  const leccionActualIndex = progreso
    ? (lecciones?.findIndex((l) => l.id === progreso.leccion_actual_id) ?? 0)
    : 0;

  return (
    <div className="p-6">
      <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-xs">
        <Link href="/" className="hover:text-foreground">
          🏠 Inicio
        </Link>
        <span>/</span>
        <Link href="/formacion" className="hover:text-foreground">
          Formación
        </Link>
        <span>/</span>
        <span className="text-foreground">{curso.titulo}</span>
      </nav>

      <div className="mb-6">
        <Link
          href="/formacion"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          Volver a Formación
        </Link>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h1 className="text-primary text-2xl font-bold">{curso.titulo}</h1>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
              curso.nivel === 'avanzado'
                ? 'bg-red-500/10 text-red-600'
                : curso.nivel === 'intermedio'
                  ? 'bg-blue-500/10 text-blue-600'
                  : 'bg-green-500/10 text-green-600'
            }`}
          >
            {curso.nivel}
          </span>
        </div>

        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium`}
          style={{
            backgroundColor: 'hsl(var(--secondary) / 0.1)',
            color: 'hsl(var(--secondary))',
          }}
        >
          {getCategoriaLabel(curso.categoria)}
        </span>

        {curso.descripcion && (
          <p className="text-muted-foreground mt-3 text-sm">{curso.descripcion}</p>
        )}

        {curso.duracion_minutos > 0 && (
          <p className="text-muted-foreground mt-2 text-xs">
            Duración estimada: {curso.duracion_minutos} minutos
          </p>
        )}

        {puedeEditar && (
          <div className="mt-3 flex gap-2">
            <Link
              href={`/formacion/cursos/${curso.id}/editar`}
              className="border-border bg-card hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              Editar
            </Link>
            <Link
              href={`/formacion/cursos/${curso.id}/eliminar`}
              className="border-destructive bg-destructive/5 text-destructive hover:bg-destructive/10 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              Eliminar
            </Link>
          </div>
        )}
      </div>

      {curso.pdf_url && (
        <div className="border-border bg-card mb-6 rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="size-4" />
            {curso.titulo_pdf ?? 'Documento PDF'}
          </div>
          <iframe
            src={curso.pdf_url}
            className="border-border h-96 w-full rounded-md border"
            title={curso.titulo_pdf ?? curso.titulo}
          />
          <div className="mt-2 text-right">
            <a
              href={curso.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs hover:underline"
            >
              Abrir en ventana nueva →
            </a>
          </div>
        </div>
      )}

      {progreso && progreso.porcentaje > 0 && (
        <div className="border-border bg-card mb-6 rounded-lg border p-4">
          <ProgressBar
            porcentaje={progreso.porcentaje}
            label={progreso.completado ? 'Curso completado' : 'Tu progreso'}
          />
        </div>
      )}

      {(curso.contenido_url || (lecciones && lecciones.length > 0)) && (
        <div className="mb-8">
          <h2 className="text-primary mb-3 text-lg font-bold">Contenido del curso</h2>

          {curso.contenido_url && (
            <div className="border-border bg-card mb-4 rounded-lg border p-4">
              <a
                href={curso.contenido_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-2 text-sm hover:underline"
              >
                <Play className="size-4" />
                Ver contenido
              </a>
            </div>
          )}

          {lecciones && lecciones.length > 0 && (
            <div className="space-y-2">
              {lecciones.map((leccion, idx) => {
                const esActual = progreso?.leccion_actual_id === leccion.id;
                const esCompletada = idx < leccionActualIndex;
                const icono =
                  leccion.tipo === 'video' ? (
                    <Play className="size-3" />
                  ) : (
                    <FileText className="size-3" />
                  );
                return (
                  <Link
                    key={leccion.id}
                    href={`/formacion/cursos/${curso.id}/lecciones/${leccion.id}?curso=${curso.id}`}
                    className={`flex items-center gap-3 rounded-md border p-3 text-sm transition-colors ${
                      esActual
                        ? 'border-primary bg-primary/5 text-primary'
                        : esCompletada
                          ? 'border-secondary bg-secondary/5 text-secondary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {esCompletada ? <CheckCircle2 className="text-secondary size-4" /> : icono}
                    <span className="w-5 text-center text-xs">{idx + 1}</span>
                    <span className="flex-1">{leccion.titulo}</span>
                    {leccion.duracion_minutos > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {leccion.duracion_minutos} min
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {quizzes && quizzes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-primary mb-3 text-lg font-bold">Quizzes</h2>
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/formacion/quizzes/${quiz.id}?curso=${curso.id}`}
                className="border-border bg-card hover:border-primary/50 flex items-center justify-between rounded-md border p-3 text-sm transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="size-4" />
                  {quiz.titulo}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
