'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type Entrenador = {
  id: string;
  nombre: string;
  apellidos: string;
};

export function AsignarEntrenadorEquipo({ entrenadores }: { entrenadores: Entrenador[] }) {
  const [asignaciones, setAsignaciones] = useState<{ entrenadorId: string; rol: string }[]>([
    { entrenadorId: '', rol: 'entrenador' },
  ]);

  function addAsignacion() {
    setAsignaciones([...asignaciones, { entrenadorId: '', rol: 'segundo_entrenador' }]);
  }

  function removeAsignacion(index: number) {
    setAsignaciones(asignaciones.filter((_, i) => i !== index));
  }

  function updateAsignacion(index: number, field: 'entrenadorId' | 'rol', value: string) {
    const updated = [...asignaciones];
    updated[index] = { ...updated[index]!, [field]: value };
    setAsignaciones(updated);
  }

  const rolLabels: Record<string, string> = {
    entrenador: 'Entrenador principal',
    segundo_entrenador: '2do Entrenador',
    auxiliar: 'Auxiliar',
    otro: 'Otro',
  };

  return (
    <div className="border-border bg-muted/50 rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-primary text-sm font-medium">Cuerpo técnico</h3>
        <button
          type="button"
          onClick={addAsignacion}
          className="border-border bg-background text-muted-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
        >
          <Plus className="size-3" />
          Añadir entrenador
        </button>
      </div>

      <div className="space-y-2">
        {asignaciones.map((a, i) => (
          <div key={i} className="flex items-end gap-2">
            <input type="hidden" name="entrenador_id" value={a.entrenadorId} />
            <input type="hidden" name="entrenador_rol" value={a.rol} />
            <div className="flex-1">
              <label className="text-muted-foreground mb-1 block text-xs">
                {rolLabels[a.rol] || a.rol}
              </label>
              <select
                value={a.entrenadorId}
                onChange={(e) => updateAsignacion(i, 'entrenadorId', e.target.value)}
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              >
                <option value="">Selecciona un entrenador</option>
                {entrenadores.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="text-muted-foreground mb-1 block text-xs">Rol</label>
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
            {asignaciones.length > 1 && (
              <button
                type="button"
                onClick={() => removeAsignacion(i)}
                className="text-destructive hover:bg-destructive/10 rounded-md p-2"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
