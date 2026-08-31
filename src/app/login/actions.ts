'use server';

import { rateLimiters } from '@/lib/rate-limit';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const clientIp = 'unknown';
  const rateLimit = await rateLimiters.login(clientIp);

  if (!rateLimit.allowed) {
    const minutos = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
    return { error: `Demasiados intentos. Intenta de nuevo en ${minutos} minuto(s).` };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[LOGIN ERROR]', error.message, error.status);
    return { error: 'Email o contrasena incorrectos.' };
  }

  redirect('/');
}
