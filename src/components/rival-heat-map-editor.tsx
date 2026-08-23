'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeatMapCanvas } from '@/components/heat-map-canvas';

interface Punto {
  x: number;
  y: number;
  anotado: boolean;
}

interface RivalHeatMapEditorProps {
  rivalId: string;
  puntosIniciales: Punto[];
  onAddLanzamiento: (x: number, y: number, anotado: boolean) => Promise<void>;
}

export function RivalHeatMapEditor({ puntosIniciales, onAddLanzamiento }: RivalHeatMapEditorProps) {
  const router = useRouter();
  const [puntos, setPuntos] = useState<Punto[]>(puntosIniciales);

  async function handleAddPunto(x: number, y: number, anotado: boolean) {
    await onAddLanzamiento(x, y, anotado);
    setPuntos((prev) => [...prev, { x, y, anotado }]);
    router.refresh();
  }

  return <HeatMapCanvas puntos={puntos} editable onAddPunto={handleAddPunto} />;
}
