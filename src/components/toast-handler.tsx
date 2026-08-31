'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function ToastHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const envio = searchParams.get('envio');
    const n = searchParams.get('n');

    if (success) {
      toast.success(decodeURIComponent(success));
    }
    if (error) {
      toast.error(decodeURIComponent(error));
    }
    if (envio === 'ok') {
      toast.success(`Convocatoria enviada a ${n ?? ''} jugadora(s)`);
    }
    if (envio === 'vacio') {
      toast.error('No hay jugadoras marcadas para enviar la convocatoria');
    }
  }, [searchParams]);

  return null;
}
