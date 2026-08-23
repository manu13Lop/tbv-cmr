"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function JugadorasError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error en jugadoras:", error)
  }, [error])

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto mb-4 size-10 text-destructive" />
        <h2 className="mb-2 text-lg font-bold">Error en Jugadoras</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          No se pudieron cargar las jugadoras. Verifica tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="size-4" />
          Reintentar
        </button>
      </div>
    </div>
  )
}
