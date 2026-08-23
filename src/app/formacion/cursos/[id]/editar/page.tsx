import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { FormSubmitButton } from '@/components/form-submit-button';
import { validateFormData, getFirstError } from '@/lib/validate';
import { actualizarCursoFormacionSchema } from '@/lib/validations';
import { logCambio } from '@/lib/audit';
import { CATEGORIAS_FORMACION, NIVELES_FORMACION } from '@/lib/formacion';

async function actualizarCurso(cursoId: string, formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || (!tienePermiso(usuario.permisos, 'formacion.editar') && !usuario.esMaster))
    return;

  const validation = validateFormData(actualizarCursoFormacionSchema, formData);
  if (!validation.success) {
    return redirect(
      `/formacion/cursos/${cursoId}/editar?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const {
    titulo,
    categoria,
    nivel,
    descripcion,
    contenido_url,
    pdf_url,
    titulo_pdf,
    duracion_minutos,
    activo,
    destacado,
  } = validation.data;

  const supabase = await createClient();

  const slug = titulo
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const { error } = await supabase
    .from('formacion_cursos')
    .update({
      titulo,
      slug,
      categoria,
      nivel: nivel ?? 'intermedio',
      descripcion: descripcion || null,
      contenido_url: contenido_url || null,
      pdf_url: pdf_url || null,
      titulo_pdf: titulo_pdf || null,
      duracion_minutos: duracion_minutos ?? 0,
      activo: activo ?? true,
      destacado: destacado ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cursoId);

  if (error) {
    return redirect(`/formacion/cursos/${cursoId}/editar?error=Error+al+actualizar+el+curso`);
  }

  await logCambio('formacion_cursos', cursoId, 'actualizar', null, { titulo, categoria, nivel });
  redirect(`/formacion/cursos/${cursoId}?actualizado=1`);
}

export default async function EditarCursoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const usuario = await getUsuarioActual();
  if (!usuario || (!tienePermiso(usuario.permisos, 'formacion.editar') && !usuario.esMaster)) {
    redirect('/formacion');
  }

  const supabase = await createClient();

  const { data: curso } = await supabase.from('formacion_cursos').select('*').eq('id', id).single();

  if (!curso) notFound();

  return (
    <div className="p-6">
      <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-xs">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span>/</span>
        <Link href="/formacion" className="hover:text-foreground">
          Formación
        </Link>
        <span>/</span>
        <Link href={`/formacion/cursos/${curso.id}`} className="hover:text-foreground">
          {curso.titulo}
        </Link>
        <span>/</span>
        <span className="text-foreground">Editar</span>
      </nav>

      <div className="mb-6">
        <Link
          href={`/formacion/cursos/${curso.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          Volver al curso
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-primary text-2xl font-bold">Editar curso</h1>
      </div>

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={actualizarCurso.bind(null, curso.id)} className="max-w-4xl space-y-4">
        <input type="hidden" name="pdf_url" value={curso.pdf_url ?? ''} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Título *</label>
            <input
              name="titulo"
              required
              defaultValue={curso.titulo}
              className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Categoría *</label>
            <select
              name="categoria"
              required
              defaultValue={curso.categoria}
              className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {CATEGORIAS_FORMACION.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nivel</label>
            <select
              name="nivel"
              defaultValue={curso.nivel ?? 'intermedio'}
              className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
            >
              {NIVELES_FORMACION.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Duración estimada (minutos)</label>
            <input
              name="duracion_minutos"
              type="number"
              min={0}
              defaultValue={curso.duracion_minutos ?? 0}
              className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            rows={3}
            placeholder="Describe el contenido del curso..."
            defaultValue={curso.descripcion ?? ''}
            className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            URL del contenido (vídeo o enlace)
          </label>
          <input
            name="contenido_url"
            type="url"
            placeholder="https://..."
            defaultValue={curso.contenido_url ?? ''}
            className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Título del PDF</label>
          <input
            name="titulo_pdf"
            placeholder="Ej: Guía de tácticas 6-0"
            defaultValue={curso.titulo_pdf ?? ''}
            className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="activo"
              value="on"
              defaultChecked={curso.activo}
              className="size-4 rounded"
            />
            Activo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="destacado"
              value="on"
              defaultChecked={curso.destacado}
              className="size-4 rounded"
            />
            Destacado
          </label>
        </div>

        <FormSubmitButton>
          <Save className="size-4" />
          Guardar cambios
        </FormSubmitButton>
      </form>
    </div>
  );
}
