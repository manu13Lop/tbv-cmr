import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { FormSubmitButton } from "@/components/form-submit-button"
import { validateFormData, getFirstError } from "@/lib/validate"
import { crearMovimientoSchema } from "@/lib/validations"

async function crearMovimiento(formData: FormData) {
  "use server"

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.movimientos")) {
    redirect("/")
  }

  const validation = validateFormData(crearMovimientoSchema, formData)
  if (!validation.success) {
    return redirect(`/logistica/movimientos/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const { articulo_id, tipo, cantidad, motivo, equipo_id } = validation.data

  const supabase = await createClient()

  const { data: articulo } = await supabase
    .from("logistica_articulos")
    .select("id, stock_actual, activo")
    .eq("id", articulo_id)
    .single()

  if (!articulo || !articulo.activo) {
    redirect("/logistica/movimientos/nuevo")
  }

  if (tipo === "salida" && articulo.stock_actual < cantidad) {
    redirect("/logistica/movimientos/nuevo")
  }

  const { error } = await supabase
    .from("logistica_movimientos")
    .insert({
      articulo_id,
      tipo: tipo || "entrada",
      cantidad,
      motivo: motivo || null,
      equipo_id: equipo_id || null,
      usuario_id: usuario.id,
      usuario_nombre_snapshot: usuario.nombreCompleto,
    })

  if (error) {
    console.error(error)
  }

  redirect("/logistica/movimientos")
}

export default async function NuevoMovimientoLogisticaPage() {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.movimientos")) {
    redirect("/")
  }

  const supabase = await createClient()

  const [{ data: articulos }, { data: equipos }] = await Promise.all([
    supabase
      .from("logistica_articulos")
      .select("id, nombre, stock_actual, unidad, activo")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("equipos")
      .select("id, nombre")
      .order("nombre"),
  ])

  return (
    <div className="p-6">
      <Link
        href="/logistica/movimientos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a movimientos
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-primary">Nuevo movimiento</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Registra una entrada, salida o ajuste sobre un artículo existente.
      </p>

      <form action={crearMovimiento} className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Artículo</label>
            <select
              name="articulo_id"
              required
              defaultValue=""
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            >
              <option value="" disabled>
                Selecciona un artículo
              </option>
              {articulos?.map((articulo: any) => (
                <option key={articulo.id} value={articulo.id}>
                  {articulo.nombre} · stock {articulo.stock_actual} {articulo.unidad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo</label>
            <select
              name="tipo"
              defaultValue="entrada"
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            >
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Cantidad</label>
            <input
              type="number"
              name="cantidad"
              min={1}
              required
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Equipo</label>
            <select
              name="equipo_id"
              defaultValue=""
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            >
              <option value="">Sin equipo específico</option>
              {equipos?.map((equipo: any) => (
                <option key={equipo.id} value={equipo.id}>
                  {equipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Motivo</label>
            <textarea
              name="motivo"
              rows={3}
              placeholder="Reposición, entrega a equipo, ajuste por recuento..."
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <FormSubmitButton>Guardar movimiento</FormSubmitButton>
        </div>
      </form>
    </div>
  )
}