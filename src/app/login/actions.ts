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

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ email, password }),
    }
  );

  const data = await res.json();

  if (!res.ok || data.error) {
    return { error: 'Email o contraseña incorrectos.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('sb-access-token', data.access_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: data.expires_in,
  });
  cookieStore.set('sb-refresh-token', data.refresh_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: data.expires_in * 4,
  });

  const admin = createAdminClient();
  const { data: userData } = await admin.auth.getUser(data.access_token);

  if (userData?.user) {
    cookieStore.set('x-user-id', userData.user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: data.expires_in,
    });
  }

  redirect('/');
}
