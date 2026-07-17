"use client"

import { useActionState } from "react"
import { Button } from "@/components/button"
import {
  actualizarMovimientoAction,
  type MovimientoActionState,
} from "./actions"

type Props = {
  movimiento: {
    id: string
    articulo_id: string
    tipo: string
    cantidad: number
    motivo: string | null
    equipo_id: string | null
  }
  articulos: { id: string; nombre: string; unidad: string }[]
  equipos: { id: string; nombre: string }[]
}

const initialState: MovimientoActionState = { error: null, pendingConfirm: false }

export function EditarMovimientoForm({ movimiento, articulos, equipos }: Props) {
  const [state, formAction, isPending] = useActionState(
    actualizarMovimientoAction,
    initialState
  )

  return (
    <form action={formAction} className="mb-8 rounded-xl border border-border bg-card p-4">
      <h2 className="mb-4 text-lg font-bold text-primary">Editar movimiento</h2>

      <input type="hidden" name="id" value={movimiento.id} />

      {state.error === "stock_negativo" && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <p className="font-medium">
            Este movimiento dejaría el stock del artículo en negativo.
          </p>
          <p className="mt-1 text-destructive/90">
            Revisa la cantidad o el tipo. Si aun así quieres continuar, pulsa
            &quot;Confirmar y guardar de todas formas&quot;.
          </p>
        </div>
      )}

      {state.error === "datos_invalidos" && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Revisa los campos, hay datos obligatorios sin completar.
        </div>
      )}

      {state.error === "error_guardado" && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          No se ha podido guardar el movimiento. Inténtalo de nuevo.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Artículo</label>
          <select
            name="articulo_id"
            defaultValue={movimiento.articulo_id}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            {articulos.map((articulo) => (
              <option key={articulo.id} value={articulo.id}>
                {articulo.nombre} · {articulo.unidad}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tipo</label>
          <select
            name="tipo"
            defaultValue={movimiento.tipo}
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
            defaultValue={movimiento.cantidad}
            required
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Equipo</label>
          <select
            name="equipo_id"
            defaultValue={movimiento.equipo_id ?? ""}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="">Sin equipo específico</option>
            {equipos.map((equipo) => (
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
            defaultValue={movimiento.motivo ?? ""}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="submit" name="forzar" value="false" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>

        {state.pendingConfirm && (
          <Button
            type="submit"
            name="forzar"
            value="true"
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:opacity-90"
          >
            Confirmar y guardar de todas formas
          </Button>
        )}
      </div>
    </form>
  )
}