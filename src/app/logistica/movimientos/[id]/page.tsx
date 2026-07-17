import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { EditarMovimientoForm } from "./editar-movimiento-form"
import { BorrarMovimientoForm } from "./borrar-movimiento-form"

export default async function LogisticaMovimientoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.leer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const [{ data: movimientoData }, { data: articulos }, { data: equipos }] =
    await Promise.all([
      supabase
        .from("logistica_movimientos")
        .select(`
          *,
          logistica_articulos (
            id,
            nombre,
            unidad
          ),
          equipos (
            nombre
          )
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("logistica_articulos")
        .select("id, nombre, unidad, activo")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("equipos")
        .select("id, nombre")
        .order("nombre"),
    ])

  if (!movimientoData) notFound()

  const movimiento = movimientoData as any
  const puedeEditar = tienePermiso(usuario.permisos, "logistica.movimientos")

  return (
    <div className="p-6">
      <Link
        href="/logistica/movimientos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a movimientos
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-primary">Detalle de movimiento</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Edita o elimina un movimiento registrado.
      </p>

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Creado</p>
            <p className="text-sm font-medium text-foreground">
              {new Date(movimiento.created_at).toLocaleString("es-ES")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Registrado por</p>
            <p className="text-sm font-medium text-foreground">
              {movimiento.usuario_nombre_snapshot ?? "Sin usuario"}
            </p>
          </div>
        </div>
      </div>

      {puedeEditar && (
        <EditarMovimientoForm
          movimiento={{
            id: movimiento.id,
            articulo_id: movimiento.articulo_id,
            tipo: movimiento.tipo,
            cantidad: movimiento.cantidad,
            motivo: movimiento.motivo,
            equipo_id: movimiento.equipo_id,
          }}
          articulos={articulos ?? []}
          equipos={equipos ?? []}
        />
      )}

      {puedeEditar && <BorrarMovimientoForm movimientoId={movimiento.id} />}
    </div>
  )
}