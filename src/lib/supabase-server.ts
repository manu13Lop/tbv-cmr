import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
}

export async function getPermisosUsuario() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol_id, es_master')
    .eq('id', authData.user.id)
    .single();

  if (usuario?.es_master) {
    const { data: todosLosPermisos } = await supabase.from('permisos').select('nombre');

    return (todosLosPermisos ?? []).map((p) => p.nombre).filter(Boolean);
  }

  if (!usuario?.rol_id) return [];

  const { data: permisos } = await supabase
    .from('rol_permiso')
    .select('permisos(nombre)')
    .eq('rol_id', usuario.rol_id);

  return (permisos ?? [])
    .map((p: Record<string, unknown>) => (p.permisos as Record<string, unknown>)?.nombre)
    .filter(Boolean);
}
