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
    .select('es_master, permisos:rol_permiso(permiso:permisos(nombre))')
    .eq('id', session.user_id)
    .single();

  const permisos = (usuario?.permisos ?? [])
    .map((rp: Record<string, unknown>) => {
      const p = rp.permiso as Record<string, unknown> | null;
      return p?.nombre as string;
    })
    .filter(Boolean);

  if (!usuario?.es_master && !permisos.includes('socios.leer')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { data: socios } = await supabase
    .from('socios')
    .select(
      'numero_socio, nombre, apellidos, dni, email, telefono, fecha_nacimiento, direccion, ciudad, codigo_postal, activo, consentimiento_estado, created_at'
    );

  const header = [
    'N.º Socio',
    'Nombre',
    'Apellidos',
    'DNI',
    'Email',
    'Teléfono',
    'Fecha nacimiento',
    'Dirección',
    'Ciudad',
    'Código postal',
    'Activo',
    'Consentimiento',
    'Fecha alta',
  ];

  const rows = (socios ?? []).map((s) => [
    s.numero_socio,
    s.nombre,
    s.apellidos,
    s.dni ?? '',
    s.email ?? '',
    s.telefono ?? '',
    s.fecha_nacimiento ?? '',
    s.direccion ?? '',
    s.ciudad ?? '',
    s.codigo_postal ?? '',
    s.activo ? 'Sí' : 'No',
    s.consentimiento_estado,
    s.created_at ? new Date(s.created_at).toLocaleDateString('es-ES') : '',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="socios_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
