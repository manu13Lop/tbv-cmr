'use client';

import { StarRating } from '@/components/star-rating';

type Props = {
  ejercicioId: string;
  miPuntuacion: number;
  totalValoraciones: number;
  promedio: number;
};

export function StarRatingWrapper({
  ejercicioId,
  miPuntuacion,
  totalValoraciones,
  promedio,
}: Props) {
  const handleValorar = async (ejId: string, puntuacion: number) => {
    const { valorarEjercicio } = await import('@/lib/ejercicios-actions');
    await valorarEjercicio(ejId, puntuacion);
  };

  return (
    <div className="flex items-center gap-4">
      <StarRating
        ejercicioId={ejercicioId}
        miPuntuacion={miPuntuacion}
        totalValoraciones={totalValoraciones}
        valorarAction={handleValorar}
      />
      {promedio > 0 && (
        <span className="text-muted-foreground text-sm">
          Promedio: <span className="text-foreground font-semibold">{promedio.toFixed(1)}</span> / 5
        </span>
      )}
    </div>
  );
}
