'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { editarEjercicio, eliminarArchivoEjercicio } from '@/lib/ejercicios-actions';
import {
  SECCIONES_PRINCIPALES,
  SECCIONES_SECUNDARIAS,
  ASPECTOS_INDIVIDUALES,
} from '@/lib/ejercicios-constants';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/file-upload';
import { Save, FileText, Video, Image, Trash2 } from 'lucide-react';

type Archivo = { id: string; tipo: string; url: string; nombre: string | null };
type Ejercicio = {
  id: string;
  titulo: string;
  seccion_principal: string | null;
  seccion_secundaria: string | null;
  aspectos_individuales: string[] | null;
  objetivo_primario: string | null;
  objetivo_secundario: string | null;
  objetivo_terciario: string | null;
  descripcion: string | null;
  observaciones: string | null;
  puntos_clave: string | null;
  video_url: string | null;
};

function getIcon(tipo: string) {
  if (tipo === 'imagen') return Image;
  if (tipo === 'video' || tipo === 'enlace') return Video;
  return FileText;
}

export function EditarEjercicioForm({
  ejercicio,
  archivos,
}: {
  ejercicio: Ejercicio;
  archivos: Archivo[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aspectosSeleccionados, setAspectosSeleccionados] = useState<string[]>(
    ejercicio.aspectos_individuales ?? []
  );

  const toggleAspecto = (aspecto: string) => {
    setAspectosSeleccionados((prev) =>
      prev.includes(aspecto) ? prev.filter((a) => a !== aspecto) : [...prev, aspecto]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await editarEjercicio(ejercicio.id, fd);
    setLoading(false);
  };

  return (
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
            defaultValue={ejercicio.titulo}
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
              defaultValue={ejercicio.seccion_principal ?? ''}
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
              defaultValue={ejercicio.seccion_secundaria ?? ''}
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
            defaultValue={ejercicio.objetivo_primario ?? ''}
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
            defaultValue={ejercicio.objetivo_secundario ?? ''}
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
            defaultValue={ejercicio.objetivo_terciario ?? ''}
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
            defaultValue={ejercicio.descripcion ?? ''}
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
            defaultValue={ejercicio.puntos_clave ?? ''}
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
            defaultValue={ejercicio.observaciones ?? ''}
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
            defaultValue={ejercicio.video_url ?? ''}
            placeholder="https://www.youtube.com/watch?v=..."
            className="border-border bg-background w-full rounded-md border p-2 text-sm"
          />
        </div>
      </div>

      {archivos.length > 0 && (
        <div className="border-border bg-card space-y-3 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Archivos adjuntos</h2>
          <ul className="space-y-2">
            {archivos.map((a) => {
              const Icon = getIcon(a.tipo);
              return (
                <li
                  key={a.id}
                  className="border-border bg-background flex items-center gap-3 rounded-md border p-2"
                >
                  <Icon className="text-muted-foreground size-4 shrink-0" />
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm hover:underline"
                  >
                    {a.nombre ?? a.url}
                  </a>
                  <form action={eliminarArchivoEjercicio.bind(null, a.id, ejercicio.id)}>
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="border-border bg-card rounded-lg border p-6">
        <FileUpload disabled={loading} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="size-4" />
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
