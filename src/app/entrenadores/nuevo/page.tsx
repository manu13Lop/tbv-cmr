import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { FormSubmitButton } from "@/components/form-submit-button"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearEntrenadorSchema } from "@/lib/validations"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

async function crearEntrenador(formData: FormData) {
  "use server"

  const validation = validateFormData(crearEntrenadorSchema, formData)
  if (!validation.success) {
    return redirect(`/entrenadores/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const supabase = await createClient()

  const { error } = await supabase.from("entrenadores").insert({
    nombre: validation.data.nombre,
    apellidos: validation.data.apellidos,
    email: validation.data.email || null,
    telefono: validation.data.telefono || null,
    titulacion: validation.data.titulacion || null,
    especialidad: validation.data.especialidad || null,
  })

  if (error) {
    console.error(error)
    return redirect(`/entrenadores/nuevo?error=${encodeURIComponent("Error al crear el entrenador")}`)
  }

  redirect("/entrenadores")
}

export default async function NuevoEntrenadorPage() {
  return (
    <div className="p-6">
      <Link
        href="/entrenadores"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a entrenadores
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Nuevo entrenador</h1>

      <form action={crearEntrenador} className="max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre *</label>
            <input
              name="nombre"
              required
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Apellidos *</label>
            <input
              name="apellidos"
              required
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Teléfono</label>
            <input
              name="telefono"
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Titulación</label>
          <input
            name="titulacion"
            placeholder="Ej: Nivel II, Nivel III, etc."
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Especialidad</label>
          <select
            name="especialidad"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="">Sin especialidad</option>
            <option value="entrenador_general">Entrenador general</option>
            <option value="entrenador_porteros">Entrenador de porteros</option>
            <option value="preparador_fisico">Preparador físico</option>
            <option value="analista">Analista</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <FormSubmitButton>Crear entrenador</FormSubmitButton>
      </form>
    </div>
  )
}
