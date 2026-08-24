import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { FormSubmitButton } from '@/components/form-submit-button';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearEjercicioSchema } from '@/lib/validations';
import { InputField, SelectField, TextareaField } from '@/components/ui';
import { ImageUpload } from '@/components/image-upload';
import { optimizeImage, getImageExtension } from '@/lib/image-utils';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('entrenadores');

async function crearEjercicio(formData: FormData) {
  'use server';

  const validation = validateFormData(crearEjercicioSchema, formData);
  if (!validation.success) {
    return redirect(
      `/entrenadores/ejercicios/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const supabase = await createClient();

  let imagenUrl: string | null = null;

  // Subir imagen si se adjunta
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
      imagenUrl = urlData.publicUrl;
    }
  }

  const { error } = await supabase.from('ejercicios').insert({
    categoria: validation.data.categoria,
    titulo: validation.data.titulo,
    descripcion: validation.data.descripcion || null,
    imagen_url: imagenUrl,
    objetivo_principal: validation.data.objetivo_principal || null,
    objetivo_secundario_1: validation.data.objetivo_secundario_1 || null,
    objetivo_secundario_2: validation.data.objetivo_secundario_2 || null,
    entrenador_creador_id: validation.data.entrenador_creador_id || null,
  });

  if (error) {
    log.error({ err: error }, 'Error creating ejercicio');
    return redirect(
      `/entrenadores/ejercicios/nuevo?error=${encodeURIComponent('Error al crear el ejercicio')}`
    );
  }

  redirect('/entrenadores/ejercicios');
}

export default async function NuevoEjercicioPage() {
  const supabase = await createClient();

  const { data: entrenadores } = await supabase
    .from('entrenadores')
    .select('id, nombre, apellidos')
    .eq('activo', true)
    .order('apellidos', { ascending: true });

  return (
    <div className="p-6">
      <Link
        href="/entrenadores/ejercicios"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a ejercicios
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">Nuevo ejercicio</h1>

      <form action={crearEjercicio} className="max-w-lg space-y-4">
        <SelectField
          label="Categoría"
          name="categoria"
          required
          defaultValue=""
          placeholder="Selecciona una categoría"
          options={[
            { value: 'táctico', label: 'Táctico' },
            { value: 'técnica_individual', label: 'Técnica Individual' },
            { value: 'portero', label: 'Portero' },
            { value: 'físico', label: 'Físico' },
          ]}
        />

        <InputField label="Título" name="titulo" required placeholder="Nombre del ejercicio" />

        <ImageUpload name="imagen" />

        <TextareaField
          label="Descripción"
          name="descripcion"
          rows={4}
          placeholder="Describe el desarrollo del ejercicio..."
        />

        <div className="border-border bg-muted/50 rounded-lg border p-4">
          <h3 className="text-primary mb-3 text-sm font-medium">Objetivos del ejercicio</h3>

          <div className="space-y-3">
            <InputField
              label="Objetivo Principal"
              name="objetivo_principal"
              placeholder="Objetivo principal del ejercicio"
            />
            <InputField
              label="Objetivo Secundario 1"
              name="objetivo_secundario_1"
              placeholder="Objetivo secundario"
            />
            <InputField
              label="Objetivo Secundario 2"
              name="objetivo_secundario_2"
              placeholder="Objetivo secundario"
            />
          </div>
        </div>

        <SelectField
          label="Creado por"
          name="entrenador_creador_id"
          options={[
            { value: '', label: 'Sin asignar' },
            ...(entrenadores?.map((e) => ({ value: e.id, label: `${e.nombre} ${e.apellidos}` })) ??
              []),
          ]}
        />

        <FormSubmitButton>Crear ejercicio</FormSubmitButton>
      </form>
    </div>
  );
}
