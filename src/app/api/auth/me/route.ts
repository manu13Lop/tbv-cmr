import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-ufhlipsfkzwsswmllfek-auth-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let session;
  try {
    session = JSON.parse(decodeURIComponent(token));
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellidos, es_master, roles(nombre)')
    .eq('id', session.user_id)
    .single();

  const rolData = Array.isArray(usuario?.roles) ? usuario.roles[0] : usuario?.roles;
  const nombre = usuario
    ? `${usuario.nombre} ${usuario.apellidos}`
    : session.user_metadata?.nombre || '';

  const rol = rolData?.nombre || session.user_metadata?.rol || '—';

  return NextResponse.json({
    email: session.email,
    nombre,
    rol,
    es_master: usuario?.es_master || false,
  });
}
