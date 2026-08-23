import { createClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { validateFormData, getFirstError } from '@/lib/validate';
import { actualizarEjercicioSchema } from '@/lib/validations';
import { ImageUpload } from '@/components/image-upload';
import { optimizeImage, getImageExtension } from '@/lib/image-utils';
import { ArrowLeft } from 'lucide-react';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { DeleteButton } from '@/components/delete-button';

async function eliminarEjercicio(id: string) {
  'use server';
  const supabase = await createClient();
  const { error } = await supabase.from('ejercicios').delete().eq('id', id);
  if (error) redirect(`/entrenadores/ejercicios/${id}?error=Error+al+eliminar`);
  redirect('/entrenadores/ejercicios');
}

async function actualizarEjercicio(id: string, formData: FormData) {
  'use server';

  const validation = validateFormData(actualizarEjercicioSchema, formData);
  if (!validation.success) {
    return redirect(
      `/entrenadores/ejercicios/${id}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    categoria: validation.data.categoria,
    titulo: validation.data.titulo,
    descripcion: validation.data.descripcion || null,
    objetivo_principal: validation.data.objetivo_principal || null,
    objetivo_secundario_1: validation.data.objetivo_secundario_1 || null,
    objetivo_secundario_2: validation.data.objetivo_secundario_2 || null,
  };

  const imagenFile = formData.get('imagen') as File | null;
  if (imagenFile && imagenFile.size > 0) {
    const optimized = await optimizeImage(imagenFile);
    const ext = getImageExtension(imagenFile);
    const filePath = `ejercicios/${crypto.randomUUID()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fotos-ejercicios')
      .upload(filePath, optimized, { contentType: `image/${ext}` });

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from('fotos-ejercicios')
        .getPublicUrl(uploadData.path);
      updateData.imagen_url = urlData.publicUrl;
    }
  }

  await supabase.from('ejercicios').update(updateData).eq('id', id);

  redirect(`/entrenadores/ejercicios/${id}`);
}

export default async function EjercicioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await getUsuarioActual();
  const puedeEditar = tienePermiso(usuario?.permisos, 'equipos.editar');

  const supabase = await createClient();

  const { data: ejercicio } = await supabase
    .from('ejercicios')
    .select('*, entrenadores ( nombre, apellidos )')
    .eq('id', id)
    .single();

  if (!ejercicio) notFound();

  const autor = ejercicio.entrenadores as Record<string, unknown>;
  const updateAction = actualizarEjercicio.bind(null, id);
  const deleteAction = eliminarEjercicio.bind(null, id);

  return (
    <div className="p-6">
      <Link
        href="/entrenadores/ejercicios"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a ejercicios
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">{ejercicio.titulo}</h1>
          <p className="text-muted-foreground text-sm">
            <span className="capitalize">{ejercicio.categoria.replace('_', ' ')}</span>
            {autor && ` — Creado por ${autor.nombre as string} ${autor.apellidos as string}`}
          </p>
        </div>
        {puedeEditar && (
          <DeleteButton
            action={deleteAction}
            confirmTitle="¿Eliminar este ejercicio?"
            confirmDescription="Se eliminará el ejercicio permanentemente. Esta acción no se puede deshacer."
          />
        )}
      </div>

      <form action={updateAction} className="max-w-2xl space-y-4">
        <ImageUpload name="imagen" currentImageUrl={ejercicio.imagen_url} disabled={!puedeEditar} />

        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <select
            name="categoria"
            defaultValue={ejercicio.categoria}
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          >
            <option value="táctico">Táctico</option>
            <option value="técnica_individual">Técnica Individual</option>
            <option value="portero">Portero</option>
            <option value="físico">Físico</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Título</label>
          <input
            name="titulo"
            defaultValue={ejercicio.titulo}
            required
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            rows={5}
            defaultValue={ejercicio.descripcion ?? ''}
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div className="border-border bg-muted/50 rounded-lg border p-4">
          <h3 className="text-primary mb-3 text-sm font-medium">Objetivos del ejercicio</h3>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Objetivo Principal</label>
              <input
                name="objetivo_principal"
                defaultValue={ejercicio.objetivo_principal ?? ''}
                disabled={!puedeEditar}
                className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Objetivo Secundario 1</label>
              <input
                name="objetivo_secundario_1"
                defaultValue={ejercicio.objetivo_secundario_1 ?? ''}
                disabled={!puedeEditar}
                className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Objetivo Secundario 2</label>
              <input
                name="objetivo_secundario_2"
                defaultValue={ejercicio.objetivo_secundario_2 ?? ''}
                disabled={!puedeEditar}
                className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {puedeEditar && <FormSubmitButton>Guardar cambios</FormSubmitButton>}
      </form>
    </div>
  );
}
