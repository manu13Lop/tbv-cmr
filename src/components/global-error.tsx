'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('app');

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error({ err: error }, 'Unhandled error');
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <AlertTriangle className="text-destructive mx-auto mb-4 size-12" />
        <h2 className="text-foreground mb-2 text-xl font-bold">Algo salió mal</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Ha ocurrido un error inesperado. Por favor, intenta de nuevo o vuelve al inicio.
        </p>
        {error.digest && (
          <p className="text-muted-foreground/60 mb-4 font-mono text-xs">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="border-border bg-card hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
          >
            <RefreshCw className="size-4" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
          >
            <Home className="size-4" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
