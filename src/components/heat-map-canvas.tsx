'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PuntoLanzamiento {
  x: number;
  y: number;
  anotado: boolean;
}

interface HeatMapCanvasProps {
  puntos: PuntoLanzamiento[];
  editable?: boolean;
  onAddPunto?: (x: number, y: number, anotado: boolean) => void;
  className?: string;
}

export function HeatMapCanvas({
  puntos,
  editable = false,
  onAddPunto,
  className,
}: HeatMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modoAnotado, setModoAnotado] = useState(true);

  const dibujar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#9b1b30';
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.15, h * 0.05, w * 0.7, h * 0.9);

    ctx.beginPath();
    ctx.arc(w / 2, h * 0.95, w * 0.35, Math.PI, 0);
    ctx.stroke();

    for (const p of puntos) {
      const px = (p.x / 100) * w;
      const py = (p.y / 100) * h;
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, 25);
      if (p.anotado) {
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.7)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(px - 25, py - 25, 50, 50);

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = p.anotado ? '#22c55e' : '#ef4444';
      ctx.fill();
    }
  };

  useEffect(() => {
    dibujar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntos]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable || !onAddPunto) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddPunto(Math.round(x * 10) / 10, Math.round(y * 10) / 10, modoAnotado);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {editable && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModoAnotado(true)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              modoAnotado
                ? 'bg-green-600 text-white'
                : 'border-border bg-card text-muted-foreground border'
            )}
          >
            Gol
          </button>
          <button
            type="button"
            onClick={() => setModoAnotado(false)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              !modoAnotado
                ? 'bg-red-600 text-white'
                : 'border-border bg-card text-muted-foreground border'
            )}
          >
            Fallo
          </button>
          <span className="text-muted-foreground self-center text-xs">
            Clic en el campo para registrar lanzamiento
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        onClick={handleClick}
        className={cn(
          'border-border w-full max-w-md rounded-lg border',
          editable && 'cursor-crosshair'
        )}
      />
      <div className="text-muted-foreground flex gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-green-500" />
          Anotados ({puntos.filter((p) => p.anotado).length})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-red-500" />
          Fallados ({puntos.filter((p) => !p.anotado).length})
        </span>
      </div>
    </div>
  );
}
