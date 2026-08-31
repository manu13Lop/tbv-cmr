import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';

export async function getUsuarioActual() {
  const hdrs = await headers();
  const userId = hdrs.get('x-user-id');
  const userEmail = hdrs.get('x-user-email');

  if (!userId) return null;

  const admin = createAdminClient();

  const { data: usuario } = await admin
    .from('usuarios')
    .select('id, nombre, apellidos, rol_id, es_master')
    .eq('id', userId)
    .single();

  if (!usuario) {
    return {
      id: userId,
      nombreCompleto: userEmail || 'Usuario',
      puesto: 'Sin rol',
      rolId: null,
      esMaster: false,
      permisos: [],
    };
  }

  let permisos: string[] = [];

  if (usuario.es_master) {
    const { data: todosLosPermisos } = await admin.from('permisos').select('nombre');

    permisos = (todosLosPermisos ?? []).map((p) => p.nombre).filter(Boolean);
  } else {
    const permisoIds: string[] = [];

    if (usuario.rol_id) {
      const { data: rolPermisos } = await admin
        .from('rol_permiso')
        .select('permiso_id')
        .eq('rol_id', usuario.rol_id);

      permisoIds.push(...(rolPermisos ?? []).map((p) => p.permiso_id));
    }

    const { data: permisosPropios } = await admin
      .from('usuario_permisos')
      .select('permiso_id')
      .eq('usuario_id', usuario.id);

    permisoIds.push(...(permisosPropios ?? []).map((p) => p.permiso_id));

    if (permisoIds.length > 0) {
      const { data: permisosData } = await admin
        .from('permisos')
        .select('id, nombre')
        .in('id', permisoIds);

      const seen = new Set<string>();
      for (const p of permisosData ?? []) {
        if (!seen.has(p.nombre)) {
          seen.add(p.nombre);
          permisos.push(p.nombre);
        }
      }
    }
  }

  let puesto = 'Sin rol';
  if (usuario.es_master) {
    puesto = 'Master';
  } else if (usuario.rol_id) {
    const { data: rol } = await admin
      .from('roles')
      .select('nombre')
      .eq('id', usuario.rol_id)
      .single();
    puesto = rol?.nombre ?? 'Sin rol';
  }

  return {
    id: usuario.id,
    nombreCompleto: `${usuario.nombre} ${usuario.apellidos}`,
    puesto,
    rolId: usuario.rol_id,
    esMaster: !!usuario.es_master,
    permisos,
  };
}

export function tienePermiso(permisos: string[] | undefined, permiso: string) {
  return !!permisos?.includes(permiso);
}
