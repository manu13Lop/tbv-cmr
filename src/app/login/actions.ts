'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimiters } from '@/lib/rate-limit';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const clientIp = 'unknown';
  const rateLimit = await rateLimiters.login(clientIp);

  if (!rateLimit.allowed) {
    const minutos = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
    return { error: `Demasiados intentos. Intenta de nuevo en ${minutos} minuto(s).` };
  }

  let res: Response;
  let data: Record<string, unknown>;

  try {
    res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ email, password }),
    });
    data = await res.json();
  } catch (fetchError) {
    console.error('[LOGIN] Fetch failed:', fetchError);
    return { error: 'No se pudo conectar con el servidor de autenticación.' };
  }

  if (!res.ok || data.error) {
    console.error('[LOGIN] Auth error:', res.status, data);
    return { error: 'Email o contraseña incorrectos.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('sb-access-token', data.access_token as string, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: data.expires_in as number,
  });
  cookieStore.set('sb-refresh-token', data.refresh_token as string, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: (data.expires_in as number) * 4,
  });

  redirect('/');
}
