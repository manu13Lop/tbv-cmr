import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearJugadoraSchema } from "@/lib/validations"

async function crearJugadora(formData: FormData) {
  "use server"
  const supabase = await createClient()

  const validation = validateFormData(crearJugadoraSchema, formData)
  if (!validation.success) {
    return redirect(`/jugadoras/nueva?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const { nombre, apellidos, fecha_nacimiento, codigo_interno, email, talla_camiseta_entreno, talla_camiseta_partido, talla_calzona, talla_chandal, talla_chaqueton } = validation.data

  const { error } = await supabase.from("jugadoras").insert({
    nombre,
    apellidos,
    fecha_nacimiento,
    codigo_interno,
    email,
    talla_camiseta_entreno,
    talla_camiseta_partido,
    talla_calzona,
    talla_chandal,
    talla_chaqueton,
  })

  if (error) {
    console.error(error)
    return
  }

  redirect("/jugadoras")
}

const tallaOptions = ["", "XS", "S", "M", "L", "XL", "XXL"]

function TallaSelect({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        name={name}
        className="w-full rounded-md border border-border bg-background p-2 text-sm"
      >
        {tallaOptions.map((t) => (
          <option key={t} value={t}>
            {t === "" ? "-" : t}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function NuevaJugadoraPage() {
  return (
    <div className="p-6">
      <Link
        href="/jugadoras"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a jugadoras
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-primary">Nueva jugadora</h1>

      <form action={crearJugadora} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            name="nombre"
            required
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Apellidos</label>
          <input
            name="apellidos"
            required
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            name="fecha_nacimiento"
            required
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Código interno
          </label>
          <input
            name="codigo_interno"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TallaSelect name="talla_camiseta_entreno" label="Camiseta entreno" />
          <TallaSelect name="talla_camiseta_partido" label="Camiseta partido" />
          <TallaSelect name="talla_calzona" label="Calzona" />
          <TallaSelect name="talla_chandal" label="Chándal" />
          <TallaSelect name="talla_chaqueton" label="Chaquetón" />
        </div>

        <FormSubmitButton>Guardar jugadora</FormSubmitButton>
      </form>
    </div>
  )
}