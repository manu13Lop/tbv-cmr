'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const MESSAGES: Record<string, string> = {
  guardado: 'Cambios guardados correctamente.',
  creado: 'Elemento creado correctamente.',
  eliminado: 'Elemento eliminado correctamente.',
  ok: 'Operación completada.',
};

export function ToastHandler() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const envio = searchParams.get('envio');
    const n = searchParams.get('n');
    const msg = searchParams.get('msg');
    const nuevaPassword = searchParams.get('nuevaPassword');

    if (success) toast.success(decodeURIComponent(success));
    if (error) toast.error(decodeURIComponent(error));

    for (const [key, msgText] of Object.entries(MESSAGES)) {
      if (searchParams.get(key) === '1') toast.success(msgText);
    }

    if (msg === 'password_reseteado') {
      if (nuevaPassword) {
        toast.success(
          `Contraseña reseteada. Nueva contraseña: ${decodeURIComponent(nuevaPassword)}`,
          { duration: 15000 }
        );
      } else {
        toast.success('Contraseña reseteada correctamente.');
      }
    }

    if (envio === 'ok') toast.success(`Convocatoria enviada a ${n ?? ''} jugadora(s)`);
    if (envio === 'vacio') toast.error('No hay jugadoras marcadas para enviar la convocatoria');
  }, [searchParams]);
  return null;
}
