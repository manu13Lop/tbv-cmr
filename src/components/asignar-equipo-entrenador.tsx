'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type Equipo = {
  id: string;
  nombre: string;
  categoria: string;
  temporada: string;
};

export function AsignarEquipoEntrenador({ equipos }: { equipos: Equipo[] }) {
  const [asignaciones, setAsignaciones] = useState<{ equipoId: string; rol: string }[]>([]);

  function addAsignacion() {
    setAsignaciones([...asignaciones, { equipoId: '', rol: 'entrenador' }]);
  }

  function removeAsignacion(index: number) {
    setAsignaciones(asignaciones.filter((_, i) => i !== index));
  }

  function updateAsignacion(index: number, field: 'equipoId' | 'rol', value: string) {
    const updated = [...asignaciones];
    updated[index] = { ...updated[index]!, [field]: value };
    setAsignaciones(updated);
  }

  return (
    <div className="border-border bg-muted/50 rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-primary text-sm font-medium">Equipos asignados</h3>
        <button
          type="button"
          onClick={addAsignacion}
          className="border-border bg-background text-muted-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
        >
          <Plus className="size-3" />
          Añadir equipo
        </button>
      </div>

      {asignaciones.length === 0 ? (
        <p className="text-muted-foreground text-xs">
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
                  onChange={(e) => updateAsignacion(i, 'equipoId', e.target.value)}
                  className="border-border bg-background w-full rounded-md border p-2 text-sm"
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
                  onChange={(e) => updateAsignacion(i, 'rol', e.target.value)}
                  className="border-border bg-background w-full rounded-md border p-2 text-sm"
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
                className="text-destructive hover:bg-destructive/10 rounded-md p-2"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
