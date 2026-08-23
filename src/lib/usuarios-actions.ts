'use server';

import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getUsuarioActual } from '@/lib/auth-helpers';
import { logCambio } from '@/lib/audit';
import { redirect } from 'next/navigation';
import { validateFormData, getFirstError } from '@/lib/validate';
import { crearUsuarioSchema, actualizarUsuarioSchema } from '@/lib/validations';

async function requireMaster() {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual || !usuarioActual.esMaster) return null;
  return usuarioActual;
}

export async function crearUsuario(formData: FormData) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const validation = validateFormData(crearUsuarioSchema, formData);
  if (!validation.success) {
    return redirect('/usuarios?error=1');
  }

  const { email, password, nombre, apellidos, rol_id } = validation.data;

  const admin = createAdminClient();

  const { data: nuevoAuthUser, error: errorAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (errorAuth || !nuevoAuthUser?.user) {
    if (errorAuth?.message?.includes('already')) {
      return redirect('/usuarios?error=email_duplicado');
    }
    return redirect('/usuarios?error=1');
  }

  const { error: errorTabla } = await admin.from('usuarios').insert({
    id: nuevoAuthUser.user.id,
    nombre,
    apellidos,
    rol_id,
    es_master: false,
  });

  if (errorTabla) {
    await admin.auth.admin.deleteUser(nuevoAuthUser.user.id);
    return redirect('/usuarios?error=1');
  }

  await logCambio('usuarios', nuevoAuthUser.user.id, 'crear', null, {
    email,
    nombre,
    apellidos,
    rol_id,
  });

  redirect('/usuarios?creado=1');
}

export async function cambiarRol(usuarioId: string, formData: FormData) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const rolId = formData.get('rol_id') as string;
  const supabase = createAdminClient();

  const { data: previo } = await supabase
    .from('usuarios')
    .select('rol_id')
    .eq('id', usuarioId)
    .single();

  await supabase.from('usuarios').update({ rol_id: rolId }).eq('id', usuarioId);

  await logCambio(
    'usuarios',
    usuarioId,
    'actualizar',
    { rol_id: previo?.rol_id ?? null },
    { rol_id: rolId }
  );
  redirect('/usuarios');
}

export async function actualizarUsuario(usuarioId: string, formData: FormData) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const validation = validateFormData(actualizarUsuarioSchema, formData);
  if (!validation.success) {
    return redirect(
      `/usuarios/editar?id=${encodeURIComponent(usuarioId)}&error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const { nombre, apellidos, email } = validation.data;

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: previo } = await supabase
    .from('usuarios')
    .select('nombre, apellidos, email')
    .eq('id', usuarioId)
    .single();

  await supabase.from('usuarios').update({ nombre, apellidos }).eq('id', usuarioId);

  if (email && email !== '') {
    const { error: errorAuth } = await admin.auth.admin.updateUserById(usuarioId, { email });
    if (errorAuth) {
      return redirect(`/usuarios/editar?id=${encodeURIComponent(usuarioId)}&error=1`);
    }
  }

  await logCambio('usuarios', usuarioId, 'actualizar', previo ?? null, {
    nombre,
    apellidos,
    email,
  });
  redirect(`/usuarios/editar?id=${encodeURIComponent(usuarioId)}&ok=1`);
}

export async function resetearPassword(usuarioId: string) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const admin = createAdminClient();
  const password = crypto.randomUUID().slice(0, 10);
  const { error: errorAuth } = await admin.auth.admin.updateUserById(usuarioId, { password });
  if (errorAuth) {
    return redirect(`/usuarios/editar?id=${encodeURIComponent(usuarioId)}&error=1`);
  }

  await logCambio('usuarios', usuarioId, 'actualizar', null, { reset_password: true });
  redirect(
    `/usuarios/editar?id=${encodeURIComponent(usuarioId)}&msg=password_reseteado&nueva_password=${encodeURIComponent(password)}`
  );
}

export async function eliminarUsuario(usuarioId: string) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: previo } = await supabase
    .from('usuarios')
    .select('nombre, apellidos, email, rol_id, es_master')
    .eq('id', usuarioId)
    .single();

  await admin.auth.admin.deleteUser(usuarioId);
  const { error } = await admin.from('usuarios').delete().eq('id', usuarioId);

  if (!error) {
    await logCambio('usuarios', usuarioId, 'eliminar', previo ?? null, null);
  }

  redirect('/usuarios');
}

export async function togglePermisoUsuario(usuarioId: string, formData: FormData) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const permisoNombre = formData.get('permiso') as string;
  const accion = formData.get('accion') as 'agregar' | 'quitar';
  const admin = createAdminClient();

  const { data: permiso } = await admin
    .from('permisos')
    .select('id')
    .eq('nombre', permisoNombre)
    .single();

  if (!permiso) return;

  if (accion === 'agregar') {
    await admin.from('usuario_permisos').insert({
      usuario_id: usuarioId,
      permiso_id: permiso.id,
    });
  } else {
    await admin
      .from('usuario_permisos')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('permiso_id', permiso.id);
  }

  await logCambio('usuario_permisos', null, accion, null, {
    usuario_id: usuarioId,
    permiso_id: permiso.id,
  });
  redirect(`/usuarios/editar?id=${encodeURIComponent(usuarioId)}`);
}

export async function crearPermiso(formData: FormData) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const nombre = formData.get('nombre') as string;
  const descripcion = formData.get('descripcion') as string;
  const admin = createAdminClient();

  await admin.from('permisos').insert({ nombre, descripcion });
  await logCambio('permisos', null, 'crear', null, { nombre, descripcion });
  redirect('/usuarios?seccion=permisos');
}

export async function crearRol(formData: FormData) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const nombre = formData.get('nombre') as string;
  const admin = createAdminClient();

  const { data: rol } = await admin.from('roles').insert({ nombre }).select('id').single();
  await logCambio('roles', rol?.id ?? null, 'crear', null, { nombre });
  redirect('/usuarios?seccion=permisos');
}

export async function actualizarPermisosRol(rolId: string, formData: FormData) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const admin = createAdminClient();
  const permisosSeleccionados = formData.getAll('permisos') as string[];

  const { data: permisosDB } = await admin.from('permisos').select('id, nombre');
  const { data: permisosRol } = await admin
    .from('rol_permiso')
    .select('permiso_id')
    .eq('rol_id', rolId);

  const permisosActualesIds = (permisosRol ?? []).map(
    (p: Record<string, unknown>) => p.permiso_id as string
  ) as string[];
  const permisosNuevosIds = (permisosDB ?? [])
    .filter((p: Record<string, unknown>) => permisosSeleccionados.includes(p.nombre as string))
    .map((p: Record<string, unknown>) => p.id as string) as string[];

  for (const pid of permisosNuevosIds) {
    if (!permisosActualesIds.includes(pid)) {
      await admin.from('rol_permiso').insert({ rol_id: rolId, permiso_id: pid });
    }
  }
  for (const pid of permisosActualesIds) {
    if (!permisosNuevosIds.includes(pid)) {
      await admin.from('rol_permiso').delete().eq('rol_id', rolId).eq('permiso_id', pid);
    }
  }

  redirect(`/usuarios?seccion=permisos&editar_rol=${rolId}`);
}

export async function eliminarPermiso(permisoId: string) {
  const usuarioActual = await requireMaster();
  if (!usuarioActual) return;

  const admin = createAdminClient();
  const { data: permiso } = await admin
    .from('permisos')
    .select('nombre')
    .eq('id', permisoId)
    .single();
  await admin.from('permisos').delete().eq('id', permisoId);
  await logCambio('permisos', permisoId, 'eliminar', { nombre: permiso?.nombre }, null);
  redirect('/usuarios?seccion=permisos');
}
