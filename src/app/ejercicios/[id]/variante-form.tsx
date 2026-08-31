'use client';

import { useState } from 'react';
import { crearVariante } from '@/lib/ejercicios-actions';
import { NIVELES_DIFICULTAD } from '@/lib/ejercicios-constants';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

export function VarianteForm({ ejercicioId }: { ejercicioId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await crearVariante(ejercicioId, fd);
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-border bg-muted/50 hover:bg-muted text-muted-foreground flex w-full items-center justify-center gap-2 rounded-md border border-dashed p-3 text-sm transition-colors"
      >
        <Plus className="size-4" />
        Añadir variante
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-border space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Nueva variante</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="variante_titulo" className="text-sm font-medium">
          Título <span className="text-destructive">*</span>
        </label>
        <input
          id="variante_titulo"
          name="titulo"
          type="text"
          required
          placeholder="Ej: Versión con mayor dificultad"
          className="border-border bg-background w-full rounded-md border p-2 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="variante_nivel" className="text-sm font-medium">
          Nivel de dificultad
        </label>
        <select
          id="variante_nivel"
          name="nivel_dificultad"
          defaultValue="intermedio"
          className="border-border bg-background w-full rounded-md border p-2 text-sm"
        >
          {NIVELES_DIFICULTAD.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="variante_descripcion" className="text-sm font-medium">
          Descripción de la variante
        </label>
        <textarea
          id="variante_descripcion"
          name="descripcion"
          rows={3}
          placeholder="¿En qué se diferencia del ejercicio original?"
          className="border-border bg-background w-full rounded-md border p-2 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="variante_notas" className="text-sm font-medium">
          Notas del entrenador
        </label>
        <textarea
          id="variante_notas"
          name="notas_entrenador"
          rows={2}
          placeholder="Indicaciones adicionales..."
          className="border-border bg-background w-full rounded-md border p-2 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar variante'}
        </Button>
      </div>
    </form>
  );
}
