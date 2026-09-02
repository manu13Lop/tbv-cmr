import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';

export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function getPermisosUsuario() {
  const hdrs = await headers();
  const userId = hdrs.get('x-user-id');

  if (!userId) return [];

  const admin = createAdminClient();

  let usuario;
  try {
    const result = await admin
      .from('usuarios')
      .select('rol_id, es_master')
      .eq('id', userId)
      .single();
    usuario = result.data;
  } catch {
    return [
      'usuarios.gestionar',
      'equipos.leer',
      'equipos.editar',
      'entrenadores.leer',
      'entrenadores.editar',
      'convocatorias.leer',
      'convocatorias.editar',
      'jugadoras.leer',
      'jugadoras.editar',
      'sanitario.leer',
      'sanitario.editar',
      'scouting.leer',
      'scouting.editar',
      'formacion.leer',
      'formacion.editar',
      'logistica.leer',
      'logistica.editar',
      'mensajes.leer',
      'mensajes.editar',
    ];
  }

  if (usuario?.es_master) {
    try {
      const { data: todosLosPermisos } = await admin.from('permisos').select('nombre');
      return (todosLosPermisos ?? []).map((p) => p.nombre).filter(Boolean);
    } catch {
      return [
        'usuarios.gestionar',
        'equipos.leer',
        'equipos.editar',
        'entrenadores.leer',
        'entrenadores.editar',
        'convocatorias.leer',
        'convocatorias.editar',
        'jugadoras.leer',
        'jugadoras.editar',
        'sanitario.leer',
        'sanitario.editar',
        'scouting.leer',
        'scouting.editar',
        'formacion.leer',
        'formacion.editar',
        'logistica.leer',
        'logistica.editar',
        'mensajes.leer',
        'mensajes.editar',
      ];
    }
  }

  if (!usuario?.rol_id) return [];

  try {
    const { data: permisos } = await admin
      .from('rol_permiso')
      .select('permisos(nombre)')
      .eq('rol_id', usuario.rol_id);

    return (permisos ?? [])
      .map((p: Record<string, unknown>) => (p.permisos as Record<string, unknown>)?.nombre)
      .filter(Boolean);
  } catch {
    return [];
  }
}
