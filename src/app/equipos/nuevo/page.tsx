import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearEquipoSchema } from "@/lib/validations"
import { AsignarEntrenadorEquipo } from "@/components/asignar-entrenador-equipo"

async function crearEquipo(formData: FormData) {
  "use server"

  const validation = validateFormData(crearEquipoSchema, formData)
  if (!validation.success) {
    return redirect(`/equipos/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }
  const { nombre, categoria, temporada, federada } = validation.data

  const supabase = await createClient()

  const { data: equipo, error } = await supabase.from("equipos").insert({
    nombre,
    categoria,
    temporada,
    federada: federada ?? false,
  }).select("id").single()

  if (error || !equipo) {
    console.error(error)
    return redirect(`/equipos/nuevo?error=${encodeURIComponent("Error al crear el equipo")}`)
  }

  // Asignar entrenadores si se seleccionaron
  const entrenadorIds = formData.getAll("entrenador_id") as string[]
  const roles = formData.getAll("entrenador_rol") as string[]

  for (let i = 0; i < entrenadorIds.length; i++) {
    if (entrenadorIds[i]) {
      await supabase.from("entrenador_equipo").insert({
        entrenador_id: entrenadorIds[i],
        equipo_id: equipo.id,
        temporada,
        rol: roles[i] || "entrenador",
      })
    }
  }

  redirect("/equipos")
}

export default async function NuevoEquipoPage() {
  const supabase = await createClient()

  const { data: entrenadores } = await supabase
    .from("entrenadores")
    .select("id, nombre, apellidos")
    .eq("activo", true)
    .order("apellidos", { ascending: true })

  return (
    <div className="p-6">
      <Link
        href="/equipos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a equipos
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Nuevo equipo</h1>

      <form action={crearEquipo} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            name="nombre"
            required
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <input
            name="categoria"
            list="categorias"
            required
            placeholder="Elige o escribe una nueva"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
          <datalist id="categorias">
            <option value="Benjamín" />
            <option value="Alevín" />
            <option value="Infantil" />
            <option value="Cadete" />
            <option value="Juvenil" />
            <option value="Junior" />
            <option value="Senior" />
            <option value="Senior A" />
            <option value="Senior B" />
          </datalist>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Temporada</label>
          <input
            name="temporada"
            required
            placeholder="Ej: 2025-2026"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="federada"
            id="federada"
            defaultChecked
          />
          <label htmlFor="federada" className="text-sm font-medium">
            Equipo federado
          </label>
        </div>

        {/* Asignación de entrenadores */}
        <AsignarEntrenadorEquipo entrenadores={entrenadores ?? []} />

        <FormSubmitButton>Guardar equipo</FormSubmitButton>
      </form>
    </div>
  )
}
