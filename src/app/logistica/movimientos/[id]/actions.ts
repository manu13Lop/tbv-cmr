"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { z } from "zod"
import { validateFormData, getFirstError } from "@/lib/validate"

export type MovimientoActionState = {
  error: string | null
  pendingConfirm: boolean
}

const actualizarMovimientoSchema = z.object({
  id: z.string().uuid(),
  articulo_id: z.string().uuid("Selecciona un artículo válido"),
  tipo: z.enum(["entrada", "salida", "ajuste"]),
  cantidad: z.coerce.number().int().min(1, "La cantidad debe ser mayor a 0"),
  equipo_id: z.string().uuid().nullable().optional(),
  motivo: z.string().nullable().optional().or(z.literal("")),
  forzar: z.boolean().optional(),
})

export async function actualizarMovimientoAction(
  _prevState: MovimientoActionState,
  formData: FormData
): Promise<MovimientoActionState> {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.movimientos")) {
    redirect("/")
  }

  const validation = validateFormData(actualizarMovimientoSchema, formData)
  if (!validation.success) {
    return { error: getFirstError(validation.errors), pendingConfirm: false }
  }

  const { id, articulo_id, tipo, cantidad, motivo, equipo_id, forzar } = validation.data

  const supabase = await createClient()

  const { data: movimientosDelArticulo } = await supabase
    .from("logistica_movimientos")
    .select("id, tipo, cantidad")
    .eq("articulo_id", articulo_id)

  let stockSimulado = 0

  for (const mov of movimientosDelArticulo ?? []) {
    if (mov.id === id) continue
    if (mov.tipo === "entrada" || mov.tipo === "ajuste") stockSimulado += mov.cantidad
    if (mov.tipo === "salida") stockSimulado -= mov.cantidad
  }

  if (tipo === "entrada" || tipo === "ajuste") stockSimulado += cantidad
  if (tipo === "salida") stockSimulado -= cantidad

  if (stockSimulado < 0 && !forzar) {
    return { error: "stock_negativo", pendingConfirm: true }
  }

  const { error } = await supabase
    .from("logistica_movimientos")
    .update({
      articulo_id,
      tipo,
      cantidad,
      motivo: motivo || null,
      equipo_id: equipo_id || null,
    })
    .eq("id", id)

  if (error) {
    console.error(error)
    return { error: "error_guardado", pendingConfirm: false }
  }

  redirect(`/logistica/movimientos/${id}`)
}

export async function borrarMovimientoAction(
  _prevState: MovimientoActionState,
  formData: FormData
): Promise<MovimientoActionState> {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "logistica.movimientos")) {
    redirect("/")
  }

  const supabase = await createClient()

  const id = formData.get("id") as string
  const forzar = formData.get("forzar") === "true"

  const { data: movimiento } = await supabase
    .from("logistica_movimientos")
    .select("id, articulo_id")
    .eq("id", id)
    .single()

  if (!movimiento) {
    redirect("/logistica/movimientos")
  }

  const { data: movimientosDelArticulo } = await supabase
    .from("logistica_movimientos")
    .select("id, tipo, cantidad")
    .eq("articulo_id", movimiento.articulo_id)

  let stockSimulado = 0

  for (const mov of movimientosDelArticulo ?? []) {
    if (mov.id === id) continue
    if (mov.tipo === "entrada" || mov.tipo === "ajuste") stockSimulado += mov.cantidad
    if (mov.tipo === "salida") stockSimulado -= mov.cantidad
  }

  if (stockSimulado < 0 && !forzar) {
    return { error: "stock_negativo", pendingConfirm: true }
  }

  const { error } = await supabase
    .from("logistica_movimientos")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(error)
    return { error: "error_borrado", pendingConfirm: false }
  }

  redirect("/logistica/movimientos")
}