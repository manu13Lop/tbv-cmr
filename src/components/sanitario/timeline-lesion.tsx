"use client"

type Seguimiento = {
  id: string
  fecha_hora: string
  tipo_entrada: string
  tratamiento_aplicado: string | null
  evolucion: string | null
  tipo_baja: string | null
  es_alta: boolean
  autor_nombre_snapshot: string | null
}

const tipoColor: Record<string, { bg: string; text: string; label: string }> = {
  revision: { bg: "bg-blue-100", text: "text-blue-700", label: "Revisión" },
  tratamiento: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Tratamiento" },
  prueba_diagnostica: { bg: "bg-purple-100", text: "text-purple-700", label: "Prueba" },
  alta: { bg: "bg-green-100", text: "text-green-700", label: "Alta" },
}

export function TimelineLesion({ seguimientos }: { seguimientos: Seguimiento[] }) {
  if (!seguimientos || seguimientos.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay seguimientos registrados.</p>
  }

  const sorted = [...seguimientos].sort(
    (a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
  )

  return (
    <div className="relative ml-4 border-l-2 border-border pl-6">
      {sorted.map((s, i) => {
        const style = tipoColor[s.tipo_entrada] ?? tipoColor.revision
        const isLast = i === sorted.length - 1

        return (
          <div key={s.id} className="relative mb-6 last:mb-0">
            {/* Dot */}
            <div
              className={`absolute -left-[31px] top-1 size-4 rounded-full border-2 border-white ${
                s.es_alta ? "bg-green-500" : style.bg.replace("100", "500")
              }`}
            />

            {/* Content */}
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.fecha_hora).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {s.tratamiento_aplicado && (
                <p className="mb-1 text-sm">
                  <span className="font-medium">Tratamiento:</span> {s.tratamiento_aplicado}
                </p>
              )}
              {s.evolucion && (
                <p className="mb-1 text-sm">
                  <span className="font-medium">Evolución:</span> {s.evolucion}
                </p>
              )}
              {s.tipo_baja && (
                <p className="text-xs text-muted-foreground">
                  Tipo de baja: {s.tipo_baja.replace("_", " ")}
                </p>
              )}
              {s.autor_nombre_snapshot && (
                <p className="mt-1 text-xs text-muted-foreground">
                  — {s.autor_nombre_snapshot} ({s.autor_puesto_snapshot})
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
