'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase-server';

export async function marcarComoLeida(notificacionId: string) {
  const hdrs = await headers();
  const userId = hdrs.get('x-user-id');
  if (!userId) return;

  const supabase = await createClient();
  await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', notificacionId)
    .eq('usuario_id', userId);
}

export async function marcarTodasComoLeidas() {
  const hdrs = await headers();
  const userId = hdrs.get('x-user-id');
  if (!userId) return;

  const supabase = await createClient();
  await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_id', userId)
    .eq('leida', false);
}
