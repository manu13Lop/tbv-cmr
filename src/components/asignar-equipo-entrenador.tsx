"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

type Equipo = {
  id: string
  nombre: string
  categoria: string
  temporada: string
}

export function AsignarEquipoEntrenador({ equipos }: { equipos: Equipo[] }) {
  const [asignaciones, setAsignaciones] = useState<{ equipoId: string; rol: string }[]>([])

  function addAsignacion() {
    setAsignaciones([...asignaciones, { equipoId: "", rol: "entrenador" }])
  }

  function removeAsignacion(index: number) {
    setAsignaciones(asignaciones.filter((_, i) => i !== index))
  }

  function updateAsignacion(index: number, field: "equipoId" | "rol", value: string) {
    const updated = [...asignaciones]
    updated[index] = { ...updated[index], [field]: value }
    setAsignaciones(updated)
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Equipos asignados</h3>
        <button
          type="button"
          onClick={addAsignacion}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          <Plus className="size-3" />
          Añadir equipo
        </button>
      </div>

      {asignaciones.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Sin equipos asignados. Puedes asignar equipos después desde la ficha del entrenador.
        </p>
      ) : (
        <div className="space-y-2">
          {asignaciones.map((a, i) => (
            <div key={i} className="flex items-end gap-2">
              <input type="hidden" name="equipo_id" value={a.equipoId} />
              <input type="hidden" name="equipo_rol" value={a.rol} />
              <div className="flex-1">
                <select
                  value={a.equipoId}
                  onChange={(e) => updateAsignacion(i, "equipoId", e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                >
                  <option value="">Selecciona un equipo</option>
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.nombre} ({eq.categoria}) - {eq.temporada}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <select
                  value={a.rol}
                  onChange={(e) => updateAsignacion(i, "rol", e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                >
                  <option value="entrenador">Entrenador</option>
                  <option value="segundo_entrenador">2do Entrenador</option>
                  <option value="auxiliar">Auxiliar</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeAsignacion(i)}
                className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
