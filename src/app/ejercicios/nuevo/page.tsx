'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearEjercicio } from '@/lib/ejercicios-actions';
import {
  SECCIONES_PRINCIPALES,
  SECCIONES_SECUNDARIAS,
  ASPECTOS_INDIVIDUALES,
} from '@/lib/ejercicios-constants';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/file-upload';
import { ArrowLeft, Save } from 'lucide-react';

export default function NuevoEjercicioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aspectosSeleccionados, setAspectosSeleccionados] = useState<string[]>([]);

  const toggleAspecto = (aspecto: string) => {
    setAspectosSeleccionados((prev) =>
      prev.includes(aspecto) ? prev.filter((a) => a !== aspecto) : [...prev, aspecto]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await crearEjercicio(fd);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo ejercicio</h1>
          <p className="text-muted-foreground text-sm">
            Añade un ejercicio a la biblioteca del club
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-border bg-card space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Información básica</h2>

          <div className="space-y-1.5">
            <label htmlFor="titulo" className="text-sm font-medium">
              Título del ejercicio <span className="text-destructive">*</span>
            </label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              required
              placeholder="Ej: Circuito de pase y movimiento"
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="seccion_principal" className="text-sm font-medium">
                Sección principal <span className="text-destructive">*</span>
              </label>
              <select
                id="seccion_principal"
                name="seccion_principal"
                required
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {SECCIONES_PRINCIPALES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="seccion_secundaria" className="text-sm font-medium">
                Sección secundaria
              </label>
              <select
                id="seccion_secundaria"
                name="seccion_secundaria"
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {SECCIONES_SECUNDARIAS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-border bg-card space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Aspectos individuales a mejorar</h2>
          <p className="text-muted-foreground text-xs">
            Selecciona los aspectos que trabaja este ejercicio
          </p>
          <div className="flex flex-wrap gap-2">
            {ASPECTOS_INDIVIDUALES.map((aspecto) => (
              <button
                key={aspecto}
                type="button"
                onClick={() => toggleAspecto(aspecto)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  aspectosSeleccionados.includes(aspecto)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                {aspecto}
              </button>
            ))}
          </div>
          {aspectosSeleccionados.map((a) => (
            <input key={a} type="hidden" name="aspectos_individuales" value={a} />
          ))}
        </div>

        <div className="border-border bg-card space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Objetivos</h2>

          <div className="space-y-1.5">
            <label htmlFor="objetivo_primario" className="text-sm font-medium">
              Objetivo primario
            </label>
            <textarea
              id="objetivo_primario"
              name="objetivo_primario"
              rows={2}
              placeholder="¿Qué se busca conseguir con este ejercicio?"
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="objetivo_secundario" className="text-sm font-medium">
              Objetivo secundario
            </label>
            <textarea
              id="objetivo_secundario"
              name="objetivo_secundario"
              rows={2}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="objetivo_terciario" className="text-sm font-medium">
              Objetivo terciario
            </label>
            <textarea
              id="objetivo_terciario"
              name="objetivo_terciario"
              rows={2}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>
        </div>

        <div className="border-border bg-card space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Descripción y material</h2>

          <div className="space-y-1.5">
            <label htmlFor="descripcion" className="text-sm font-medium">
              Descripción del ejercicio
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={4}
              placeholder="Describe el ejercicio en detalle..."
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="puntos_clave" className="text-sm font-medium">
              Puntos clave
            </label>
            <textarea
              id="puntos_clave"
              name="puntos_clave"
              rows={3}
              placeholder="Aspectos importantes a tener en cuenta..."
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="observaciones" className="text-sm font-medium">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              rows={2}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="video_url" className="text-sm font-medium">
              URL de video (opcional)
            </label>
            <input
              id="video_url"
              name="video_url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <FileUpload disabled={loading} />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="size-4" />
            {loading ? 'Guardando...' : 'Guardar ejercicio'}
          </Button>
        </div>
      </form>
    </div>
  );
}
