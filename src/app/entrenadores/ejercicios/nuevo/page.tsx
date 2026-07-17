import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { FormSubmitButton } from "@/components/form-submit-button"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearEjercicioSchema } from "@/lib/validations"
import { ImageUpload } from "@/components/image-upload"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

async function crearEjercicio(formData: FormData) {
  "use server"

  const validation = validateFormData(crearEjercicioSchema, formData)
  if (!validation.success) {
    return redirect(`/entrenadores/ejercicios/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const supabase = await createClient()

  let imagenUrl: string | null = null

  // Subir imagen si se adjunta
  const imagenFile = formData.get("imagen") as File | null
  if (imagenFile && imagenFile.size > 0) {
    const ext = imagenFile.name.split(".").pop() || "jpg"
    const filePath = `ejercicios/${crypto.randomUUID()}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("fotos-ejercicios")
      .upload(filePath, imagenFile)

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from("fotos-ejercicios")
        .getPublicUrl(uploadData.path)
      imagenUrl = urlData.publicUrl
    }
  }

  const { error } = await supabase.from("ejercicios").insert({
    categoria: validation.data.categoria,
    titulo: validation.data.titulo,
    descripcion: validation.data.descripcion || null,
    imagen_url: imagenUrl,
    objetivo_principal: validation.data.objetivo_principal || null,
    objetivo_secundario_1: validation.data.objetivo_secundario_1 || null,
    objetivo_secundario_2: validation.data.objetivo_secundario_2 || null,
    entrenador_creador_id: validation.data.entrenador_creador_id || null,
  })

  if (error) {
    console.error(error)
    return redirect(`/entrenadores/ejercicios/nuevo?error=${encodeURIComponent("Error al crear el ejercicio")}`)
  }

  redirect("/entrenadores/ejercicios")
}

export default async function NuevoEjercicioPage() {
  const supabase = await createClient()

  const { data: entrenadores } = await supabase
    .from("entrenadores")
    .select("id, nombre, apellidos")
    .eq("activo", true)
    .order("apellidos", { ascending: true })

  return (
    <div className="p-6">
      <Link
        href="/entrenadores/ejercicios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a ejercicios
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Nuevo ejercicio</h1>

      <form action={crearEjercicio} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Categoría *</label>
          <select
            name="categoria"
            required
            defaultValue=""
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="" disabled>
              Selecciona una categoría
            </option>
            <option value="táctico">Táctico</option>
            <option value="técnica_individual">Técnica Individual</option>
            <option value="portero">Portero</option>
            <option value="físico">Físico</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Título *</label>
          <input
            name="titulo"
            required
            placeholder="Nombre del ejercicio"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <ImageUpload name="imagen" />

        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            rows={4}
            placeholder="Describe el desarrollo del ejercicio..."
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-primary">Objetivos del ejercicio</h3>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Objetivo Principal</label>
              <input
                name="objetivo_principal"
                placeholder="Objetivo principal del ejercicio"
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Objetivo Secundario 1</label>
              <input
                name="objetivo_secundario_1"
                placeholder="Objetivo secundario"
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Objetivo Secundario 2</label>
              <input
                name="objetivo_secundario_2"
                placeholder="Objetivo secundario"
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Creado por</label>
          <select
            name="entrenador_creador_id"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="">Sin asignar</option>
            {entrenadores?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} {e.apellidos}
              </option>
            ))}
          </select>
        </div>

        <FormSubmitButton>Crear ejercicio</FormSubmitButton>
      </form>
    </div>
  )
}
