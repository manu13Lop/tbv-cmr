import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { csrfProtected } from '@/lib/csrf';

const PERMISOS_FORMACION = ['formacion.leer', 'formacion.editar', 'formacion.administrar'];

const PERMISOS_AUDITORIA = ['auditoria.leer', 'auditoria.administrar'];

const ALL_PERMISOS = [...PERMISOS_FORMACION, ...PERMISOS_AUDITORIA];

export async function POST(request: NextRequest) {
  const csrfError = csrfProtected(request);
  if (csrfError) return csrfError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('es_master')
    .eq('id', user.id)
    .single();

  if (!usuario?.es_master) {
    return NextResponse.json({ error: 'Solo usuarios master' }, { status: 403 });
  }

  const results: string[] = [];

  for (const permiso of ALL_PERMISOS) {
    const { error } = await supabase
      .from('permisos')
      .insert({ nombre: permiso, descripcion: `Permiso para ${permiso}` })
      .select();

    if (error && !error.message.includes('duplicate')) {
      results.push(`Error creando permiso ${permiso}: ${error.message}`);
    } else {
      results.push(`Permiso ${permiso} OK`);
    }
  }

  const { data: masterRole } = await supabase
    .from('roles')
    .select('id')
    .eq('nombre', 'master')
    .single();

  if (!masterRole) {
    results.push('Error: rol master no encontrado en la base de datos');
    return NextResponse.json({ status: 'error', message: 'Rol master no encontrado', results });
  }

  const { data: permisosDB } = await supabase
    .from('permisos')
    .select('id, nombre')
    .in('nombre', ALL_PERMISOS);

  for (const permiso of permisosDB ?? []) {
    const { error } = await supabase
      .from('rol_permiso')
      .insert({ rol_id: masterRole.id, permiso_id: permiso.id })
      .select();

    if (error && !error.message.includes('duplicate')) {
      results.push(`Error asignando ${permiso.nombre}: ${error.message}`);
    } else {
      results.push(`Asignado ${permiso.nombre} al rol master`);
    }
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Permisos configurados',
    results,
  });
}
