import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'formacion.editar')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const cursoId = formData.get('cursoId') as string;

    if (!file || !cursoId) {
      return NextResponse.json({ error: 'Missing file or cursoId' }, { status: 400 });
    }

    const supabase = await createClient();

    const fileName = `cursos/${cursoId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('formacion').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from('formacion').getPublicUrl(data.path);

    await supabase
      .from('formacion_cursos')
      .update({
        pdf_url: publicUrl?.publicUrl || null,
        titulo_pdf: file.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cursoId);

    return NextResponse.json({ url: publicUrl?.publicUrl, path: data.path });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
