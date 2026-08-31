'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { getUsuarioActual } from '@/lib/auth-helpers';
import { logCambio } from '@/lib/audit';
import { redirect } from 'next/navigation';
import { validateFormData, getFirstError } from '@/lib/validate';
import { z } from 'zod';
import { rateLimiters } from '@/lib/rate-limit';

const crearEjercicioSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  seccion_principal: z.string().min(1, 'Selecciona una sección principal'),
  seccion_secundaria: z.string().optional(),
  aspectos_individuales: z.string().optional(),
  objetivo_primario: z.string().optional(),
  objetivo_secundario: z.string().optional(),
  objetivo_terciario: z.string().optional(),
  descripcion: z.string().optional(),
  observaciones: z.string().optional(),
  puntos_clave: z.string().optional(),
  video_url: z.string().url('URL no válida').optional().or(z.literal('')),
});

const crearVarianteSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  nivel_dificultad: z.enum(['basico', 'intermedio', 'avanzado']).default('intermedio'),
  descripcion: z.string().optional(),
  notas_entrenador: z.string().optional(),
});

const editarEjercicioSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  seccion_principal: z.string().min(1, 'Selecciona una sección principal'),
  seccion_secundaria: z.string().optional(),
  aspectos_individuales: z.string().optional(),
  objetivo_primario: z.string().optional(),
  objetivo_secundario: z.string().optional(),
  objetivo_terciario: z.string().optional(),
  descripcion: z.string().optional(),
  observaciones: z.string().optional(),
  puntos_clave: z.string().optional(),
  video_url: z.string().url('URL no válida').optional().or(z.literal('')),
});

export type EjercicioRow = {
  id: string;
  titulo: string;
  descripcion: string | null;
  seccion_principal: string | null;
  seccion_secundaria: string | null;
  aspectos_individuales: string[] | null;
  objetivo_primario: string | null;
  objetivo_secundario: string | null;
  objetivo_terciario: string | null;
  observaciones: string | null;
  puntos_clave: string | null;
  video_url: string | null;
  created_by: string | null;
  created_at: string;
  entrenador_creador_id: string | null;
  entrenadores?: { nombre: string; apellidos: string } | null;
};

export async function crearEjercicio(formData: FormData) {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) return;

  const rateLimit = await rateLimiters.crearUsuario(usuarioActual.id);
  if (!rateLimit.allowed) {
    return redirect('/ejercicios?error=rate_limit');
  }

  const validation = validateFormData(crearEjercicioSchema, formData);
  if (!validation.success) {
    return redirect(
      `/ejercicios/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const data = validation.data;
  const aspectosRaw = formData.getAll('aspectos_individuales') as string[];

  const supabase = createAdminClient();

  const { data: ejercicio, error } = await supabase
    .from('ejercicios')
    .insert({
      titulo: data.titulo,
      seccion_principal: data.seccion_principal,
      seccion_secundaria: data.seccion_secundaria || null,
      aspectos_individuales: aspectosRaw.length > 0 ? aspectosRaw : [],
      objetivo_primario: data.objetivo_primario || null,
      objetivo_secundario: data.objetivo_secundario || null,
      objetivo_terciario: data.objetivo_terciario || null,
      descripcion: data.descripcion || null,
      observaciones: data.observaciones || null,
      puntos_clave: data.puntos_clave || null,
      video_url: data.video_url || null,
      created_by: usuarioActual.id,
    })
    .select('id')
    .single();

  if (error) {
    return redirect('/ejercicios/nuevo?error=1');
  }

  const archivos = formData
    .getAll('archivos')
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const archivo of archivos) {
    const ext = archivo.name.split('.').pop() ?? 'bin';
    const filePath = `ejercicios/${ejercicio.id}/${crypto.randomUUID()}.${ext}`;

    const { data: uploadData } = await supabase.storage
      .from('ejercicio-archivos')
      .upload(filePath, archivo, { contentType: archivo.type });

    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from('ejercicio-archivos')
        .getPublicUrl(uploadData.path);

      let tipo: string;
      if (archivo.type.startsWith('image/')) tipo = 'imagen';
      else if (archivo.type === 'application/pdf') tipo = 'pdf';
      else if (archivo.type.startsWith('video/')) tipo = 'video';
      else tipo = 'enlace';

      await supabase.from('ejercicio_archivos').insert({
        ejercicio_id: ejercicio.id,
        tipo,
        url: urlData.publicUrl,
        nombre: archivo.name,
      });
    }
  }

  await logCambio('ejercicios', ejercicio.id, 'crear', null, {
    titulo: data.titulo,
    seccion_principal: data.seccion_principal,
  });

  redirect(`/ejercicios/${ejercicio.id}`);
}

export async function vincularEjercicioSesion(sesionId: string, formData: FormData) {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) return;

  const ejercicioId = formData.get('ejercicio_id') as string;
  const orden = parseInt((formData.get('orden') as string) || '0', 10);
  const duracion = formData.get('duracion_minutos') as string;
  const notas = formData.get('notas') as string;

  if (!ejercicioId || !sesionId) return;

  const admin = createAdminClient();

  const { error } = await admin.from('sesion_entrenamiento_ejercicio').insert({
    sesion_id: sesionId,
    ejercicio_id: ejercicioId,
    orden,
    duracion_minutos: duracion ? parseInt(duracion, 10) : null,
    notas: notas || null,
  });

  if (error) {
    return redirect(`/convocatorias/${sesionId}?error=no_se_pudo_vincular`);
  }

  redirect(`/convocatorias/${sesionId}`);
}

export async function valorarEjercicio(
  ejercicioId: string,
  puntuacion: number,
  comentario?: string
) {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) return;

  const admin = createAdminClient();

  const { error } = await admin.from('ejercicio_valoraciones').upsert(
    {
      ejercicio_id: ejercicioId,
      usuario_id: usuarioActual.id,
      puntuacion,
      comentario: comentario || null,
    },
    { onConflict: 'ejercicio_id,usuario_id' }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function eliminarEjercicio(ejercicioId: string) {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) return;

  const admin = createAdminClient();

  if (!usuarioActual.esMaster) {
    const { data: ejercicio } = await admin
      .from('ejercicios')
      .select('created_by')
      .eq('id', ejercicioId)
      .single();
    if (ejercicio?.created_by !== usuarioActual.id) {
      return redirect('/ejercicios?error=Sin permisos');
    }
  }

  const { error } = await admin.from('ejercicios').delete().eq('id', ejercicioId);

  if (!error) {
    await logCambio('ejercicios', ejercicioId, 'eliminar', null, null);
  }

  redirect('/ejercicios');
}

export async function editarEjercicio(ejercicioId: string, formData: FormData) {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) return;

  const admin = createAdminClient();

  if (!usuarioActual.esMaster) {
    const { data: ejercicio } = await admin
      .from('ejercicios')
      .select('created_by')
      .eq('id', ejercicioId)
      .single();
    if (ejercicio?.created_by !== usuarioActual.id) {
      return redirect(`/ejercicios/${ejercicioId}?error=Sin permisos`);
    }
  }

  const validation = validateFormData(editarEjercicioSchema, formData);
  if (!validation.success) {
    return redirect(
      `/ejercicios/${ejercicioId}/editar?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const data = validation.data;
  const aspectosRaw = formData.getAll('aspectos_individuales') as string[];

  const { error } = await admin
    .from('ejercicios')
    .update({
      titulo: data.titulo,
      seccion_principal: data.seccion_principal,
      seccion_secundaria: data.seccion_secundaria || null,
      aspectos_individuales: aspectosRaw.length > 0 ? aspectosRaw : [],
      objetivo_primario: data.objetivo_primario || null,
      objetivo_secundario: data.objetivo_secundario || null,
      objetivo_terciario: data.objetivo_terciario || null,
      descripcion: data.descripcion || null,
      observaciones: data.observaciones || null,
      puntos_clave: data.puntos_clave || null,
      video_url: data.video_url || null,
    })
    .eq('id', ejercicioId);

  if (error) {
    return redirect(`/ejercicios/${ejercicioId}/editar?error=1`);
  }

  const archivos = formData
    .getAll('archivos')
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const archivo of archivos) {
    const ext = archivo.name.split('.').pop() ?? 'bin';
    const filePath = `ejercicios/${ejercicioId}/${crypto.randomUUID()}.${ext}`;

    const { data: uploadData } = await admin.storage
      .from('ejercicio-archivos')
      .upload(filePath, archivo, { contentType: archivo.type });

    if (uploadData) {
      const { data: urlData } = admin.storage
        .from('ejercicio-archivos')
        .getPublicUrl(uploadData.path);

      let tipo: string;
      if (archivo.type.startsWith('image/')) tipo = 'imagen';
      else if (archivo.type === 'application/pdf') tipo = 'pdf';
      else if (archivo.type.startsWith('video/')) tipo = 'video';
      else tipo = 'enlace';

      await admin.from('ejercicio_archivos').insert({
        ejercicio_id: ejercicioId,
        tipo,
        url: urlData.publicUrl,
        nombre: archivo.name,
      });
    }
  }

  await logCambio('ejercicios', ejercicioId, 'actualizar', null, {
    titulo: data.titulo,
  });

  redirect(`/ejercicios/${ejercicioId}`);
}

export async function eliminarArchivoEjercicio(archivoId: string, ejercicioId: string) {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) return;

  const admin = createAdminClient();

  if (!usuarioActual.esMaster) {
    const { data: ejercicio } = await admin
      .from('ejercicios')
      .select('created_by')
      .eq('id', ejercicioId)
      .single();
    if (ejercicio?.created_by !== usuarioActual.id) {
      return redirect(`/ejercicios/${ejercicioId}?error=Sin permisos`);
    }
  }

  const { data: archivo } = await admin
    .from('ejercicio_archivos')
    .select('url')
    .eq('id', archivoId)
    .single();

  if (archivo?.url) {
    const path = archivo.url.split('/storage/v1/object/public/ejercicio-archivos/')[1];
    if (path) {
      await admin.storage.from('ejercicio-archivos').remove([path]);
    }
  }

  await admin.from('ejercicio_archivos').delete().eq('id', archivoId);

  redirect(`/ejercicios/${ejercicioId}/editar`);
}

export async function crearVariante(ejercicioId: string, formData: FormData) {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) return;

  const rateLimit = await rateLimiters.crearUsuario(usuarioActual.id);
  if (!rateLimit.allowed) {
    return redirect(`/ejercicios/${ejercicioId}?error=rate_limit`);
  }

  const validation = validateFormData(crearVarianteSchema, formData);
  if (!validation.success) {
    return redirect(
      `/ejercicios/${ejercicioId}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const data = validation.data;
  const admin = createAdminClient();

  const { error } = await admin.from('ejercicio_variantes').insert({
    ejercicio_id: ejercicioId,
    titulo: data.titulo,
    nivel_dificultad: data.nivel_dificultad,
    descripcion: data.descripcion || null,
    notas_entrenador: data.notas_entrenador || null,
    created_by: usuarioActual.id,
  });

  if (error) {
    return redirect(`/ejercicios/${ejercicioId}?error=no_se_pudo_crear`);
  }

  await logCambio('ejercicio_variantes', ejercicioId, 'crear', null, {
    titulo: data.titulo,
    nivel_dificultad: data.nivel_dificultad,
  });

  redirect(`/ejercicios/${ejercicioId}`);
}

export async function eliminarVariante(varianteId: string, ejercicioId: string) {
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) return;

  const admin = createAdminClient();

  if (!usuarioActual.esMaster) {
    const { data: variante } = await admin
      .from('ejercicio_variantes')
      .select('created_by')
      .eq('id', varianteId)
      .single();
    if (variante?.created_by !== usuarioActual.id) {
      return redirect(`/ejercicios/${ejercicioId}?error=Sin permisos`);
    }
  }

  const { error } = await admin.from('ejercicio_variantes').delete().eq('id', varianteId);

  if (!error) {
    await logCambio('ejercicio_variantes', varianteId, 'eliminar', null, null);
  }

  redirect(`/ejercicios/${ejercicioId}`);
}
