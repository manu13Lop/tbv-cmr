'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { borrarMovimientoAction, type MovimientoActionState } from './actions';

type Props = {
  movimientoId: string;
};

const initialState: MovimientoActionState = { error: null, pendingConfirm: false };

export function BorrarMovimientoForm({ movimientoId }: Props) {
  const [state, formAction, isPending] = useActionState(borrarMovimientoAction, initialState);

  return (
    <form action={formAction} className="border-destructive/30 bg-card rounded-xl border p-4">
      <h2 className="text-destructive mb-2 text-lg font-bold">Eliminar movimiento</h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Esta acción borrará el movimiento y recalculará el stock del artículo automáticamente.
      </p>

      <input type="hidden" name="id" value={movimientoId} />

      {state.error === 'stock_negativo' && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive mb-4 rounded-lg border px-3 py-3 text-sm">
          <p className="font-medium">
            Borrar este movimiento dejaría el stock del artículo en negativo.
          </p>
          <p className="text-destructive/90 mt-1">
            Si aun así quieres continuar, pulsa &quot;Confirmar borrado de todas formas&quot;.
          </p>
        </div>
      )}

      {state.error === 'error_borrado' && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive mb-4 rounded-lg border px-3 py-2 text-sm">
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
          {isPending ? 'Borrando...' : 'Borrar movimiento'}
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
  );
}
