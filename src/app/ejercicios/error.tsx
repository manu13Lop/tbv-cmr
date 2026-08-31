'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('ejercicios');

export default function EjerciciosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error({ err: error }, 'Error en módulo de ejercicios');
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <AlertTriangle className="text-destructive mx-auto mb-4 size-12" />
        <h2 className="text-foreground mb-2 text-xl font-bold">Error en ejercicios</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Ha ocurrido un error al cargar los ejercicios.
        </p>
        {error.digest && (
          <p className="text-muted-foreground/60 mb-4 font-mono text-xs">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="border-border bg-card hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
        >
          <RefreshCw className="size-4" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
