import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-ufhlipsfkzwsswmllfek-auth-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  let session;
  try {
    const decoded = JSON.parse(decodeURIComponent(token));
    session = decoded;
  } catch {
    return NextResponse.json({ error: 'Sesión inválida.' }, { status: 401 });
  }

  const { password_actual, password_nueva } = await request.json();

  if (!password_actual || !password_nueva) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
  }

  if (password_nueva.length < 8) {
    return NextResponse.json(
      { error: 'La nueva contraseña debe tener al menos 8 caracteres.' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: session.email || '',
    password: password_actual,
  });

  if (signInError) {
    return NextResponse.json({ error: 'La contraseña actual es incorrecta.' }, { status: 400 });
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: password_nueva,
  });

  if (updateError) {
    return NextResponse.json({ error: 'Error al actualizar la contraseña.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
