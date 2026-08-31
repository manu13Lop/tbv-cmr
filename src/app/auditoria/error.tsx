'use client';

import { useEffect } from 'react';

export default function AuditoriaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <h2 className="text-xl font-bold">Error en Auditoría</h2>
      <p className="text-muted-foreground text-sm">
        Ha ocurrido un error al cargar el registro de auditoría.
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
