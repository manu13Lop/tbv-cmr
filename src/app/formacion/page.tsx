import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, HelpCircle, GraduationCap } from 'lucide-react';
import { ProgressBar } from '@/components/progress-bar';
import {
  CATEGORIAS_FORMACION,
  getCategoriaLabel,
  getCategoriaColor,
  getNivelLabel,
} from '@/lib/formacion';

export const metadata: Metadata = {
  title: 'Formación - TBV Balonmano',
  description: 'Cursos, talleres y quizzes de formación deportiva',
};

export default async function FormacionPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'scouting.leer')) {
    redirect('/');
  }

  const puedeEditar = tienePermiso(usuario.permisos, 'formacion.editar') || usuario.esMaster;
  const { categoria } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from('formacion_cursos')
    .select(
      'id, titulo, slug, categoria, descripcion, duracion_minutos, nivel, activo, destacado, created_at'
    )
    .eq('activo', true)
    .order('created_at', { ascending: false });

  if (categoria) {
    query = query.eq('categoria', categoria);
  }

  const { data: cursos } = await query;

  const { data: progreso } = await supabase
    .from('formacion_progreso')
    .select('curso_id, porcentaje, completado')
    .eq('usuario_id', usuario.id);

  const progresoMap = new Map((progreso ?? []).map((p) => [p.curso_id, p]));

  const { data: quizzes } = await supabase
    .from('formacion_quizzes')
    .select(
      `
      id, titulo, categoria, activo,
      formacion_quiz_preguntas!inner(id)
    `
    )
    .eq('activo', true)
    .order('created_at', { ascending: false })
    .limit(6);

  const { data: resultadosRecientes } = await supabase
    .from('formacion_quiz_resultados')
    .select('quiz_id, puntuacion, completado_at')
    .eq('usuario_id', usuario.id)
    .order('completado_at', { ascending: false })
    .limit(3);

  const categoriaActiva = !categoria ? 'todas' : categoria;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-xs">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <span>🏠</span>
          <span>Inicio</span>
        </Link>
        <span>/</span>
        <span className="text-foreground">Formación</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-primary flex items-center gap-2 text-3xl font-bold">
            <GraduationCap className="size-7" />
            Formación Deportiva
          </h1>
          <p className="text-muted-foreground text-sm">
            Cursos y quizzes de balonmano para mejorar tu conocimiento técnico-táctico
          </p>
        </div>
        {puedeEditar && (
          <Link href="/formacion/cursos/nuevo">
            <Button>
              <Plus className="size-4" />
              Nuevo curso
            </Button>
          </Link>
        )}
      </div>

      {/* Stats rápidos */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-lg border p-4 text-center">
          <div className="text-primary text-2xl font-bold">
            {cursos?.filter((c) => c.activo).length ?? 0}
          </div>
          <p className="text-muted-foreground text-xs">Cursos disponibles</p>
        </div>
        <div className="border-border bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{progresoMap.size}</div>
          <p className="text-muted-foreground text-xs">Cursos iniciados</p>
        </div>
        <div className="border-border bg-card rounded-lg border p-4 text-center">
          <div className="text-primary text-2xl font-bold">
            {progreso?.filter((p) => p.completado).length ?? 0}
          </div>
          <p className="text-muted-foreground text-xs">Cursos completados</p>
        </div>
      </div>

      {/* Categorías */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/formacion"
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            categoriaActiva === 'todas'
              ? 'bg-primary text-primary-foreground'
              : 'border-border bg-card text-muted-foreground hover:bg-muted border'
          }`}
        >
          Todas
        </Link>
        {CATEGORIAS_FORMACION.map((cat) => (
          <Link
            key={cat.value}
            href={`/formacion?categoria=${cat.value}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              categoria === cat.value
                ? 'bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted border'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Cursos destacados */}
      {cursos?.some((c) => c.destacado) && (
        <>
          <h2 className="text-primary mb-3 flex items-center gap-2 text-lg font-bold">
            <BookOpen className="size-5" />
            Cursos destacados
          </h2>
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cursos
              .filter((c) => c.destacado)
              .map((curso) => (
                <CursoCard key={curso.id} curso={curso} progreso={progresoMap.get(curso.id)} />
              ))}
          </div>
        </>
      )}

      {/* Todos los cursos */}
      <h2 className="text-primary mb-3 flex items-center gap-2 text-lg font-bold">
        <BookOpen className="size-5" />
        {categoria ? `Cursos de ${getCategoriaLabel(categoria)}` : 'Todos los cursos'}
      </h2>

      {!cursos || cursos.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          No hay cursos disponibles en esta categoría.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cursos
            .filter((c) => !c.destacado || !cursos?.some((d) => d.destacado))
            .map((curso) => (
              <CursoCard key={curso.id} curso={curso} progreso={progresoMap.get(curso.id)} />
            ))}
        </div>
      )}

      {/* Quizzes */}
      <div className="mt-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-primary flex items-center gap-2 text-lg font-bold">
            <HelpCircle className="size-5" />
            Quizzes recientes
          </h2>
          <Link href="/formacion/quizzes" className="text-primary text-xs hover:underline">
            Ver todos →
          </Link>
        </div>

        {!quizzes || quizzes.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground rounded-lg border p-6 text-center">
            No hay quizzes disponibles.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                ultimoResultado={resultadosRecientes?.find((r) => r.quiz_id === quiz.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CursoCard({
  curso,
  progreso,
}: {
  curso: Record<string, unknown>;
  progreso?: { porcentaje: number; completado: boolean } | undefined;
}) {
  const pct = (progreso?.porcentaje as number) ?? 0;
  const completado = progreso?.completado ?? false;

  return (
    <Link
      href={`/formacion/cursos/${curso.id as string}`}
      className="group border-border bg-card hover:border-primary/50 rounded-lg border p-4 transition-all hover:shadow-sm"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="group-hover:text-primary font-medium">{curso.titulo as string}</h3>
        {completado && <span className="shrink-0 text-xs">✅</span>}
      </div>

      {(curso.descripcion as unknown as string) && (
        <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
          {curso.descripcion as unknown as string}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-1">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${getCategoriaColor(curso.categoria as string)}`}
        >
          {getCategoriaLabel(curso.categoria as string)}
        </span>
        <span className="bg-muted rounded px-2 py-0.5 text-xs">
          {getNivelLabel((curso.nivel as string) ?? 'intermedio')}
        </span>
        {(curso.duracion_minutos as number) > 0 && (
          <span className="bg-muted rounded px-2 py-0.5 text-xs">
            {curso.duracion_minutos as number} min
          </span>
        )}
      </div>

      {pct > 0 && (
        <ProgressBar porcentaje={pct} label={completado ? 'Completado' : 'Tu progreso'} />
      )}
    </Link>
  );
}

function QuizCard({
  quiz,
  ultimoResultado,
}: {
  quiz: Record<string, unknown>;
  ultimoResultado?: { puntuacion: number; completado_at: string } | undefined;
}) {
  return (
    <Link
      href={`/formacion/quizzes/${quiz.id as string}`}
      className="border-border bg-card hover:border-primary/50 rounded-lg border p-4 transition-all hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{quiz.titulo as string}</h3>
          <span
            className={`mt-1 text-xs ${getCategoriaColor(quiz.categoria as string)} rounded px-2 py-0.5 font-medium`}
          >
            {getCategoriaLabel(quiz.categoria as string)}
          </span>
        </div>
        {ultimoResultado && (
          <div className="text-right">
            <div className="text-primary text-lg font-bold">{ultimoResultado.puntuacion}%</div>
            <span className="text-muted-foreground text-xs">
              {new Date(ultimoResultado.completado_at).toLocaleDateString('es-ES')}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
