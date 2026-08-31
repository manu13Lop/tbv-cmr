'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  ejercicioId: string;
  puntuacionInicial?: number;
  miPuntuacion?: number;
  totalValoraciones?: number;
  valorarAction?: (ejercicioId: string, puntuacion: number) => Promise<void>;
};

export function StarRating({
  ejercicioId,
  miPuntuacion = 0,
  totalValoraciones = 0,
  valorarAction,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [current, setCurrent] = useState(miPuntuacion);
  const [isPending, startTransition] = useTransition();

  const handleClick = (rating: number) => {
    if (!valorarAction) return;
    setCurrent(rating);
    startTransition(() => {
      valorarAction(ejercicioId, rating);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isPending || !valorarAction}
            onClick={() => handleClick(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={cn(
              'transition-colors disabled:cursor-not-allowed',
              star <= (hovered || current) ? 'text-yellow-400' : 'text-gray-300'
            )}
            aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
          >
            <Star
              className="size-5"
              fill={star <= (hovered || current) ? 'currentColor' : 'none'}
            />
          </button>
        ))}
      </div>
      {totalValoraciones > 0 && (
        <span className="text-muted-foreground text-xs">({totalValoraciones})</span>
      )}
    </div>
  );
}
