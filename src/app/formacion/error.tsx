'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('error-boundary');

export default function FormacionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error({ err: error }, 'Error en formación');
  }, [error]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <AlertTriangle className="text-destructive mx-auto mb-4 size-10" />
        <h2 className="mb-2 text-lg font-bold">Error en Formación</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          No se pudo cargar la formación. Verifica tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
        >
          <RefreshCw className="size-4" />
          Reintentar
        </button>
      </div>
    </div>
  );
}
