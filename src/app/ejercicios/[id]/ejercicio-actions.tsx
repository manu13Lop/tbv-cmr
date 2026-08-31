'use client';

import Link from 'next/link';
import { eliminarEjercicio } from '@/lib/ejercicios-actions';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

type Props = {
  ejercicioId: string;
  createdBy: string | null;
  userId: string;
};

export function EjercicioActions({ ejercicioId, createdBy, userId }: Props) {
  const handleEliminar = async () => {
    if (!confirm('¿Eliminar este ejercicio permanentemente?')) return;
    await eliminarEjercicio(ejercicioId);
  };

  if (createdBy !== userId) return null;

  return (
    <div className="flex gap-2">
      <Link href={`/ejercicios/${ejercicioId}/editar`}>
        <Button variant="secondary" size="sm">
          <Pencil className="size-4" />
        </Button>
      </Link>
      <Button variant="destructive" size="sm" onClick={handleEliminar}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
