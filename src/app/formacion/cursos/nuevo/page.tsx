import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { FormSubmitButton } from '@/components/form-submit-button';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearCursoFormacionSchema } from '@/lib/validations';
import { logCambio } from '@/lib/audit';
import { CATEGORIAS_FORMACION, NIVELES_FORMACION } from '@/lib/formacion';

async function crearCurso(formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'formacion.editar')) return;

  const validation = validateFormData(crearCursoFormacionSchema, formData);
  if (!validation.success) {
    return redirect(
      `/formacion/cursos/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const { titulo, categoria, nivel, descripcion, contenido_url, duracion_minutos } =
    validation.data;
  const supabase = await createClient();

  const slug = titulo
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const { data: curso, error } = await supabase
    .from('formacion_cursos')
    .insert({
      titulo,
      slug,
      categoria,
      nivel: nivel ?? 'intermedio',
      descripcion: descripcion || null,
      contenido_url: contenido_url || null,
      pdf_url: null,
      titulo_pdf: null,
      duracion_minutos: duracion_minutos ?? 0,
      activo: true,
      destacado: false,
      autor_usuario_id: usuario.id,
    })
    .select('id')
    .single();

  if (error || !curso) {
    return redirect('/formacion/cursos/nuevo?error=Error+al+crear+el+curso');
  }

  await logCambio('formacion_cursos', curso.id, 'crear', null, { titulo, categoria });
  redirect(`/formacion/cursos/${curso.id}`);
}

export default async function NuevoCursoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || (!tienePermiso(usuario.permisos, 'formacion.editar') && !usuario.esMaster)) {
    redirect('/formacion');
  }

  const { error } = await searchParams;

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
        <span className="text-foreground">Nuevo curso</span>
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

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-primary text-2xl font-bold">Nuevo curso / taller</h1>
      </div>

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <form
        action={crearCurso}
        className="border-border bg-card max-w-2xl space-y-4 rounded-lg border p-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Título *</label>
          <input
            name="titulo"
            required
            className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Categoría *</label>
          <select
            name="categoria"
            required
            defaultValue=""
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

        <div>
          <label className="mb-1 block text-sm font-medium">Nivel</label>
          <select
            name="nivel"
            defaultValue="intermedio"
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
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            rows={3}
            placeholder="Describe el contenido del curso..."
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
            className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
          />
        </div>

        <div className="border-border bg-muted/30 rounded-md border border-dashed p-6 text-center">
          <p className="mb-2 text-sm font-medium">Subir PDF</p>
          <p className="text-muted-foreground mb-3 text-xs">
            Después de crear el curso, podrás subir el PDF desde la página de edición.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Duración estimada (minutos)</label>
          <input
            name="duracion_minutos"
            type="number"
            min={0}
            defaultValue={30}
            className="border-border bg-background focus-visible:ring-ring/50 w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
          />
        </div>

        <FormSubmitButton>
          <Save className="size-4" />
          Crear curso
        </FormSubmitButton>
      </form>
    </div>
  );
}
