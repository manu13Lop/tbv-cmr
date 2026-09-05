'use server';

import { createClient } from '@/lib/supabase-server';

export async function verificarEmail(token: string) {
  const supabase = await createClient();

  const { data: socio } = await supabase
    .from('socios')
    .select('id, email_verificado')
    .eq('email_verificacion_token', token)
    .single();

  if (!socio) return { error: 'Enlace no válido' };
  if (socio.email_verificado) return { ok: true, already: true };

  const { error } = await supabase
    .from('socios')
    .update({ email_verificado: true })
    .eq('email_verificacion_token', token)
    .eq('email_verificado', false);

  if (error) return { error: 'Error al verificar el email' };

  return { ok: true };
}
