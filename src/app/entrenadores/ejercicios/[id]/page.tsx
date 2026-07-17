import { createClient } from "@/lib/supabase-server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { validateFormData, getFirstError } from "@/lib/validate"
import { actualizarEjercicioSchema } from "@/lib/validations"
import { ArrowLeft } from "lucide-react"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"

async function actualizarEjercicio(id: string, formData: FormData) {
  "use server"

  const validation = validateFormData(actualizarEjercicioSchema, formData)
  if (!validation.success) {
    return redirect(`/entrenadores/ejercicios/${id}?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const supabase = await createClient()

  await supabase
    .from("ejercicios")
    .update({
      categoria: validation.data.categoria,
      titulo: validation.data.titulo,
      descripcion: validation.data.descripcion || null,
      objetivo_principal: validation.data.objetivo_principal || null,
      objetivo_secundario_1: validation.data.objetivo_secundario_1 || null,
      objetivo_secundario_2: validation.data.objetivo_secundario_2 || null,
    })
    .eq("id", id)

  redirect(`/entrenadores/ejercicios/${id}`)
}

export default async function EjercicioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const usuario = await getUsuarioActual()
  const puedeEditar = tienePermiso(usuario?.permisos, "equipos.editar")

  const supabase = await createClient()

  const { data: ejercicio } = await supabase
    .from("ejercicios")
    .select("*, entrenadores ( nombre, apellidos )")
    .eq("id", id)
    .single()

  if (!ejercicio) notFound()

  const autor = ejercicio.entrenadores as any
  const updateAction = actualizarEjercicio.bind(null, id)

  return (
    <div className="p-6">
      <Link
        href="/entrenadores/ejercicios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a ejercicios
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{ejercicio.titulo}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="capitalize">{ejercicio.categoria.replace("_", " ")}</span>
            {autor && ` — Creado por ${autor.nombre} ${autor.apellidos}`}
          </p>
        </div>
      </div>

      {/* Imagen del ejercicio */}
      {ejercicio.imagen_url && (
        <div className="mb-6">
          <img
            src={ejercicio.imagen_url}
            alt={ejercicio.titulo}
            className="max-h-96 rounded-lg border border-border object-cover"
          />
        </div>
      )}

      {/* Formulario de edición */}
      <form action={updateAction} className="max-w-2xl space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <select
            name="categoria"
            defaultValue={ejercicio.categoria}
            disabled={!puedeEditar}
            className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
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
            className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            rows={5}
            defaultValue={ejercicio.descripcion ?? ""}
            disabled={!puedeEditar}
            className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-primary">Objetivos del ejercicio</h3>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Objetivo Principal</label>
              <input
                name="objetivo_principal"
                defaultValue={ejercicio.objetivo_principal ?? ""}
                disabled={!puedeEditar}
                className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Objetivo Secundario 1</label>
              <input
                name="objetivo_secundario_1"
                defaultValue={ejercicio.objetivo_secundario_1 ?? ""}
                disabled={!puedeEditar}
                className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Objetivo Secundario 2</label>
              <input
                name="objetivo_secundario_2"
                defaultValue={ejercicio.objetivo_secundario_2 ?? ""}
                disabled={!puedeEditar}
                className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {puedeEditar && <FormSubmitButton>Guardar cambios</FormSubmitButton>}
      </form>
    </div>
  )
}
