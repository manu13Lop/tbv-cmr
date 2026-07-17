"use client"

import { useActionState } from "react"
import { Button } from "@/components/button"
import {
  borrarMovimientoAction,
  type MovimientoActionState,
} from "./actions"

type Props = {
  movimientoId: string
}

const initialState: MovimientoActionState = { error: null, pendingConfirm: false }

export function BorrarMovimientoForm({ movimientoId }: Props) {
  const [state, formAction, isPending] = useActionState(
    borrarMovimientoAction,
    initialState
  )

  return (
    <form action={formAction} className="rounded-xl border border-destructive/30 bg-card p-4">
      <h2 className="mb-2 text-lg font-bold text-destructive">Eliminar movimiento</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Esta acción borrará el movimiento y recalculará el stock del artículo automáticamente.
      </p>

      <input type="hidden" name="id" value={movimientoId} />

      {state.error === "stock_negativo" && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <p className="font-medium">
            Borrar este movimiento dejaría el stock del artículo en negativo.
          </p>
          <p className="mt-1 text-destructive/90">
            Si aun así quieres continuar, pulsa &quot;Confirmar borrado de todas formas&quot;.
          </p>
        </div>
      )}

      {state.error === "error_borrado" && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          No se ha podido borrar el movimiento. Inténtalo de nuevo.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          name="forzar"
          value="false"
          disabled={isPending}
          className="bg-destructive text-destructive-foreground hover:opacity-90"
        >
          {isPending ? "Borrando..." : "Borrar movimiento"}
        </Button>

        {state.pendingConfirm && (
          <Button
            type="submit"
            name="forzar"
            value="true"
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:opacity-90"
          >
            Confirmar borrado de todas formas
          </Button>
        )}
      </div>
    </form>
  )
}