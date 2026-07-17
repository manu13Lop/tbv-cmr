import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { FormSubmitButton } from "@/components/form-submit-button"

async function actualizarArticuloDetalle(id: string, formData: FormData) {
  "use server"

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.editar")) {
    redirect("/")
  }

  const supabase = await createClient()

  const nombre = (formData.get("nombre") as string)?.trim()
  const categoria = (formData.get("categoria") as string)?.trim()
  const descripcion = (formData.get("descripcion") as string)?.trim()
  const unidad = (formData.get("unidad") as string)?.trim()
  const esSanitario = formData.get("es_sanitario") === "on"
  const activo = formData.get("activo") === "on"
  const stockMinimoId = (formData.get("stock_minimo_id") as string) || ""
  const stockMinimo = Number(formData.get("stock_minimo") || 0)
  const equipoIdRaw = (formData.get("equipo_id") as string) || ""
  const observaciones = (formData.get("observaciones_stock") as string)?.trim()

  if (!nombre || !categoria || !unidad) {
    redirect(`/logistica/articulos/${id}`)
  }

  const { error: articuloError } = await supabase
    .from("logistica_articulos")
    .update({
      nombre,
      categoria,
      descripcion: descripcion || null,
      unidad,
      es_sanitario: esSanitario,
      activo,
    })
    .eq("id", id)

  if (articuloError) {
    console.error(articuloError)
    redirect(`/logistica/articulos/${id}`)
  }

  if (stockMinimoId) {
    const { error: minimoError } = await supabase
      .from("logistica_stock_minimos")
      .update({
        stock_minimo: stockMinimo,
        equipo_id: equipoIdRaw || null,
        observaciones: observaciones || null,
      })
      .eq("id", stockMinimoId)

    if (minimoError) console.error(minimoError)
  } else {
    const { error: insertError } = await supabase
      .from("logistica_stock_minimos")
      .insert({
        articulo_id: id,
        stock_minimo: stockMinimo,
        equipo_id: equipoIdRaw || null,
        observaciones: observaciones || null,
      })

    if (insertError) console.error(insertError)
  }

  redirect(`/logistica/articulos/${id}`)
}

async function crearMovimientoDesdeDetalle(id: string, formData: FormData) {
  "use server"

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.movimientos")) {
    redirect("/")
  }

  const supabase = await createClient()

  const tipo = formData.get("tipo") as string
  const cantidad = Number(formData.get("cantidad") || 0)
  const motivo = (formData.get("motivo") as string)?.trim()
  const equipoIdRaw = (formData.get("equipo_id") as string) || ""

  if (!["entrada", "salida", "ajuste"].includes(tipo) || cantidad <= 0) {
    redirect(`/logistica/articulos/${id}`)
  }

  const { data: articulo } = await supabase
    .from("logistica_articulos")
    .select("id, stock_actual, activo")
    .eq("id", id)
    .single()

  if (!articulo || !articulo.activo) {
    redirect(`/logistica/articulos/${id}`)
  }

  if (tipo === "salida" && articulo.stock_actual < cantidad) {
    redirect(`/logistica/articulos/${id}`)
  }

  const { error } = await supabase
    .from("logistica_movimientos")
    .insert({
      articulo_id: id,
      tipo,
      cantidad,
      motivo: motivo || null,
      equipo_id: equipoIdRaw || null,
      usuario_id: usuario.id,
      usuario_nombre_snapshot: usuario.nombreCompleto,
    })

  if (error) console.error(error)

  redirect(`/logistica/articulos/${id}`)
}

export default async function LogisticaArticuloDetallePage({
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

  const [{ data: articuloData }, { data: equipos }, { data: movimientos }] =
    await Promise.all([
      supabase
        .from("logistica_articulos")
        .select(`
          *,
          logistica_stock_minimos (
            id,
            stock_minimo,
            observaciones,
            equipo_id
          )
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("equipos")
        .select("id, nombre")
        .order("nombre"),
      supabase
        .from("logistica_movimientos")
        .select(`
          *,
          equipos (
            nombre
          )
        `)
        .eq("articulo_id", id)
        .order("created_at", { ascending: false }),
    ])

  if (!articuloData) notFound()

  const articulo = articuloData as any
  const minimo = articulo.logistica_stock_minimos?.[0] ?? null
  const equipo = equipos?.find((e: any) => e.id === minimo?.equipo_id)
  const stockBajo = articulo.stock_actual <= (minimo?.stock_minimo ?? 0)
  const actualizarAction = actualizarArticuloDetalle.bind(null, id)
  const crearMovimientoAction = crearMovimientoDesdeDetalle.bind(null, id)

  return (
    <div className="p-6">
      <Link
        href="/logistica/articulos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a artículos
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{articulo.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {articulo.categoria}
            {articulo.es_sanitario ? " · Material sanitario" : ""}
            {equipo ? ` · ${equipo.nombre}` : ""}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">Stock actual</p>
            <p className="text-lg font-bold">
              {articulo.stock_actual} {articulo.unidad}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">Stock mínimo</p>
            <p className="text-lg font-bold">
              {minimo?.stock_minimo ?? 0} {articulo.unidad}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <p className="text-sm">
          Estado actual:{" "}
          <span className={stockBajo ? "font-semibold text-destructive" : "font-semibold text-primary"}>
            {stockBajo ? "Stock bajo" : "Correcto"}
          </span>
        </p>
      </div>

      {tienePermiso(usuario.permisos, "logistica.editar") && (
        <form
          action={actualizarAction}
          className="mb-8 rounded-xl border border-border bg-card p-4"
        >
          <h2 className="mb-4 text-lg font-bold text-primary">Editar artículo</h2>

          <input type="hidden" name="stock_minimo_id" value={minimo?.id ?? ""} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                name="nombre"
                defaultValue={articulo.nombre}
                required
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Categoría</label>
              <input
                name="categoria"
                defaultValue={articulo.categoria}
                required
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Unidad</label>
              <input
                name="unidad"
                defaultValue={articulo.unidad}
                required
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Equipo asociado</label>
              <select
                name="equipo_id"
                defaultValue={minimo?.equipo_id ?? ""}
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

            <div>
              <label className="mb-1 block text-sm font-medium">Stock mínimo</label>
              <input
                type="number"
                name="stock_minimo"
                min={0}
                defaultValue={minimo?.stock_minimo ?? 0}
                required
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>

            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="es_sanitario"
                  defaultChecked={articulo.es_sanitario}
                />
                Material sanitario
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="activo"
                  defaultChecked={articulo.activo}
                />
                Activo
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Descripción</label>
              <textarea
                name="descripcion"
                rows={3}
                defaultValue={articulo.descripcion ?? ""}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Observaciones de stock mínimo
              </label>
              <textarea
                name="observaciones_stock"
                rows={2}
                defaultValue={minimo?.observaciones ?? ""}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <FormSubmitButton>Guardar cambios</FormSubmitButton>
          </div>
        </form>
      )}

      {tienePermiso(usuario.permisos, "logistica.movimientos") && (
        <form
          action={crearMovimientoAction}
          className="mb-8 rounded-xl border border-border bg-card p-4"
        >
          <h2 className="mb-4 text-lg font-bold text-primary">Registrar movimiento</h2>

          <div className="grid gap-4 md:grid-cols-2">
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
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <FormSubmitButton>Guardar movimiento</FormSubmitButton>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-lg font-bold text-primary">Historial</h2>

        {movimientos && movimientos.length > 0 ? (
          <div className="space-y-3">
            {movimientos.map((movimiento: any) => (
              <div
                key={movimiento.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {movimiento.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(movimiento.created_at).toLocaleString("es-ES")}
                    </p>
                  </div>

                  <p
                    className={`text-sm font-semibold ${
                      movimiento.tipo === "salida"
                        ? "text-destructive"
                        : "text-primary"
                    }`}
                  >
                    {movimiento.tipo === "salida" ? "-" : "+"}
                    {movimiento.cantidad} {articulo.unidad}
                  </p>
                </div>

                {movimiento.equipos?.nombre && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Equipo: {movimiento.equipos.nombre}
                  </p>
                )}

                {movimiento.usuario_nombre_snapshot && (
                  <p className="text-xs text-muted-foreground">
                    Registrado por: {movimiento.usuario_nombre_snapshot}
                  </p>
                )}

                {movimiento.motivo && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {movimiento.motivo}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay movimientos registrados para este artículo.
          </p>
        )}
      </div>
    </div>
  )
}