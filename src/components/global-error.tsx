"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto mb-4 size-12 text-destructive" />
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Algo salió mal
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Ha ocurrido un error inesperado. Por favor, intenta de nuevo o vuelve
          al inicio.
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="size-4" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Home className="size-4" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
