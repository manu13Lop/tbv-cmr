'use client';

import { useEffect } from 'react';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('equipos-error');

export default function EquiposError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error({ err: error }, 'Equipos page error');
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <h2 className="text-xl font-bold">Error en Equipos</h2>
      <p className="text-muted-foreground text-sm">
        Ha ocurrido un error al cargar los datos de equipos.
      </p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
      >
        Reintentar
      </button>
    </div>
  );
}
