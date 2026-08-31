import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual } from '@/lib/auth-helpers';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { generarICS, generarLinkGoogleCalendar } from '@/lib/ics';
import { resend, EMAIL_FROM } from '@/lib/resend';
import { ArrowLeft } from 'lucide-react';
import { validateFormData, getFirstError } from '@/lib/validate';
import { actualizarEventoSchema } from '@/lib/validations';
import { ConfirmActionButton } from '@/components/confirm-action-button';
import { rateLimiters } from '@/lib/rate-limit';

async function actualizarEvento(eventoId: string, formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario?.esMaster && !usuario?.permisos.includes('convocatorias.editar')) {
    return redirect(`/convocatorias/${eventoId}?error=Sin permisos`);
  }

  const validation = validateFormData(actualizarEventoSchema, formData);
  if (!validation.success) {
    return redirect(
      `/convocatorias/${eventoId}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }
  const { tipo, fecha_hora, lugar, rival, observaciones } = validation.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from('eventos')
    .update({
      tipo: tipo ?? '',
      fecha_hora,
      lugar: lugar ?? '',
      rival: rival ?? '',
      observaciones: observaciones ?? '',
    })
    .eq('id', eventoId);

  if (error)
    redirect(
      `/convocatorias/${eventoId}?error=${encodeURIComponent('Error al guardar los cambios')}`
    );
  redirect(`/convocatorias/${eventoId}`);
}

async function eliminarEvento(eventoId: string) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario?.esMaster && !usuario?.permisos.includes('convocatorias.editar')) {
    return redirect(`/convocatorias/${eventoId}?error=Sin permisos`);
  }
  const supabase = await createClient();
  await supabase.from('convocatorias').delete().eq('evento_id', eventoId);
  const { error } = await supabase.from('eventos').delete().eq('id', eventoId);
  if (error)
    redirect(
      `/convocatorias/${eventoId}?error=${encodeURIComponent('Error al eliminar el evento')}`
    );
  redirect('/convocatorias');
}

async function toggleCampo(
  eventoId: string,
  jugadoraId: string,
  campo: 'convocada' | 'confirmada' | 'asistio',
  valorActual: boolean | null
) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario?.esMaster && !usuario?.permisos.includes('convocatorias.editar')) {
    return redirect(`/convocatorias/${eventoId}?error=Sin permisos`);
  }
  const supabase = await createClient();

  const { data: existente } = await supabase
    .from('convocatorias')
    .select('id')
    .eq('evento_id', eventoId)
    .eq('jugadora_id', jugadoraId)
    .maybeSingle();

  const nuevoValor = !valorActual;

  if (existente) {
    const { error } = await supabase
      .from('convocatorias')
      .update({ [campo]: nuevoValor })
      .eq('id', existente.id);
    if (error)
      redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent('Error al actualizar')}`);
  } else {
    const { error } = await supabase.from('convocatorias').insert({
      evento_id: eventoId,
      jugadora_id: jugadoraId,
      [campo]: nuevoValor,
    });
    if (error)
      redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent('Error al actualizar')}`);
  }

  redirect(`/convocatorias/${eventoId}`);
}

async function marcarTodas(eventoId: string, jugadoraIds: string[], valor: boolean) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario?.esMaster && !usuario?.permisos.includes('convocatorias.editar')) {
    return redirect(`/convocatorias/${eventoId}?error=Sin permisos`);
  }
  const supabase = await createClient();

  for (const jid of jugadoraIds) {
    const { data: existente } = await supabase
      .from('convocatorias')
      .select('id')
      .eq('evento_id', eventoId)
      .eq('jugadora_id', jid)
      .maybeSingle();

    if (existente) {
      await supabase.from('convocatorias').update({ convocada: valor }).eq('id', existente.id);
    } else {
      await supabase.from('convocatorias').insert({
        evento_id: eventoId,
        jugadora_id: jid,
        convocada: valor,
      });
    }
  }

  redirect(`/convocatorias/${eventoId}`);
}

async function enviarConvocatoria(eventoId: string) {
  'use server';
  const supabase = await createClient();

  const hdrs = await headers();
  const userId = hdrs.get('x-user-id');
  if (userId) {
    const rateLimit = await rateLimiters.enviarConvocatoria(userId);
    if (!rateLimit.allowed) {
      redirect(`/convocatorias/${eventoId}?error=rate_limit`);
    }
  }

  const { data: evento } = await supabase
    .from('eventos')
    .select('id, tipo, fecha_hora, lugar, rival, observaciones, equipos ( nombre, categoria )')
    .eq('id', eventoId)
    .single();

  if (!evento)
    redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent('Evento no encontrado')}`);

  const { data: convocatorias } = await supabase
    .from('convocatorias')
    .select('jugadora_id, jugadoras ( nombre, apellidos, email )')
    .eq('evento_id', eventoId)
    .eq('convocada', true);

  if (!convocatorias || convocatorias.length === 0) {
    redirect(`/convocatorias/${eventoId}?envio=vacio`);
  }

  const equipoInfo = evento.equipos as unknown as Record<string, unknown>;
  const inicio = new Date(evento.fecha_hora);
  const titulo = `${evento.tipo.toUpperCase()} ${(equipoInfo?.nombre as string) ?? ''}${
    evento.rival ? ' vs ' + evento.rival : ''
  }`;
  const descripcion = `${evento.tipo} de ${(equipoInfo?.nombre as string) ?? ''} (${
    (equipoInfo?.categoria as string) ?? ''
  }).${evento.observaciones ? '\nObservaciones: ' + evento.observaciones : ''}`;

  const icsContent = generarICS({
    uid: evento.id,
    titulo,
    descripcion,
    lugar: evento.lugar ?? '',
    inicio,
  });

  const linkCalendario = generarLinkGoogleCalendar({
    titulo,
    descripcion,
    lugar: evento.lugar ?? '',
    inicio,
  });

  const fechaFormateada = inicio.toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let enviados = 0;

  for (const c of convocatorias) {
    const jug = c.jugadoras as unknown as Record<string, unknown>;
    if (!(jug?.email as string)) continue;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color:#0f5132;">Convocatoria: ${titulo}</h2>
        <p>Hola ${jug.nombre as string},</p>
        <p>Quedas convocada al siguiente evento:</p>
        <ul>
          <li><strong>Fecha:</strong> ${fechaFormateada}</li>
          <li><strong>Lugar:</strong> ${evento.lugar ?? 'Por confirmar'}</li>
          ${evento.rival ? `<li><strong>Rival:</strong> ${evento.rival}</li>` : ''}
        </ul>
        ${
          evento.observaciones
            ? `<p><strong>Observaciones del cuerpo técnico:</strong><br>${evento.observaciones}</p>`
            : ''
        }
        <p><a href="${linkCalendario}" target="_blank">Añadir a Google Calendar</a></p>
        <p>Adjuntamos también el archivo .ics para añadirlo a cualquier calendario.</p>
        <p style="color:#666; font-size:12px;">Triana Balonmano Vivero</p>
      </div>
    `;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: jug.email as string,
      subject: `Convocatoria: ${titulo} - ${fechaFormateada}`,
      html: htmlBody,
      attachments: [
        {
          filename: 'evento.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    await supabase
      .from('convocatorias')
      .update({ notificacion_enviada: true })
      .eq('evento_id', eventoId)
      .eq('jugadora_id', c.jugadora_id);

    enviados++;
  }

  redirect(`/convocatorias/${eventoId}?envio=ok&n=${enviados}`);
}

async function guardarSesionEntrenamiento(eventoId: string, formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario?.esMaster && !usuario?.permisos.includes('convocatorias.editar')) {
    return redirect(`/convocatorias/${eventoId}?error=Sin permisos`);
  }

  const ejercicioIds = formData.getAll('ejercicio_ids') as string[];
  const objetivoPrincipal = (formData.get('objetivo_principal') as string) || '';
  const objetivoSecundarioA = (formData.get('objetivo_secundario_a') as string) || '';
  const objetivoSecundarioB = (formData.get('objetivo_secundario_b') as string) || '';
  const observaciones = (formData.get('observaciones_entrenador') as string) || '';
  const valoracion = (formData.get('valoracion_entrenamiento') as string) || '';

  if (ejercicioIds.length > 10) {
    redirect(
      `/convocatorias/${eventoId}?error=${encodeURIComponent('Máximo 10 ejercicios por sesión')}`
    );
  }

  const supabase = await createClient();

  const { data: sesionExistente } = await supabase
    .from('sesion_entrenamiento')
    .select('id')
    .eq('evento_id', eventoId)
    .maybeSingle();

  let sesionId: string;

  if (sesionExistente) {
    const { error } = await supabase
      .from('sesion_entrenamiento')
      .update({
        objetivo_principal: objetivoPrincipal || null,
        objetivo_secundario_a: objetivoSecundarioA || null,
        objetivo_secundario_b: objetivoSecundarioB || null,
        observaciones_entrenador: observaciones || null,
        valoracion_entrenamiento: valoracion || null,
      })
      .eq('id', sesionExistente.id);
    if (error)
      redirect(
        `/convocatorias/${eventoId}?error=${encodeURIComponent('Error al guardar la planificación')}`
      );
    sesionId = sesionExistente.id;
  } else {
    const { data: nuevaSesion, error } = await supabase
      .from('sesion_entrenamiento')
      .insert({
        evento_id: eventoId,
        objetivo_principal: objetivoPrincipal || null,
        objetivo_secundario_a: objetivoSecundarioA || null,
        objetivo_secundario_b: objetivoSecundarioB || null,
        observaciones_entrenador: observaciones || null,
        valoracion_entrenamiento: valoracion || null,
      })
      .select('id')
      .single();
    if (error)
      redirect(
        `/convocatorias/${eventoId}?error=${encodeURIComponent('Error al guardar la planificación')}`
      );
    sesionId = nuevaSesion!.id;
  }

  await supabase.from('sesion_entrenamiento_ejercicio').delete().eq('sesion_id', sesionId);

  if (ejercicioIds.length > 0) {
    const { error } = await supabase.from('sesion_entrenamiento_ejercicio').insert(
      ejercicioIds.map((ejId, idx) => ({
        sesion_id: sesionId,
        ejercicio_id: ejId,
        orden: idx,
      }))
    );
    if (error)
      redirect(
        `/convocatorias/${eventoId}?error=${encodeURIComponent('Error al guardar la planificación')}`
      );
  }

  redirect(`/convocatorias/${eventoId}`);
}

export default async function ConvocatoriaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ envio?: string; n?: string; error?: string }>;
}) {
  const { id } = await params;
  const { envio, n, error } = await searchParams;
  const supabase = await createClient();

  const { data: evento } = await supabase
    .from('eventos')
    .select(
      'id, tipo, fecha_hora, lugar, rival, observaciones, equipo_id, equipos ( nombre, categoria, temporada )'
    )
    .eq('id', id)
    .single();

  if (!evento) notFound();

  const { data: jugadorasEquipo } = await supabase
    .from('jugadora_equipo_temporada')
    .select('jugadora_id, dorsal, jugadoras ( id, nombre, apellidos, email )')
    .eq('equipo_id', evento.equipo_id);

  const { data: convocatorias } = await supabase
    .from('convocatorias')
    .select('*')
    .eq('evento_id', id);

  const mapaConvocatorias = new Map((convocatorias ?? []).map((c) => [c.jugadora_id, c]));

  // Datos de sesión de entrenamiento (si existe)
  const { data: sesionExistente } = await supabase
    .from('sesion_entrenamiento')
    .select('*')
    .eq('evento_id', id)
    .maybeSingle();

  let ejercicioIdsSeleccionados: string[] = [];
  if (sesionExistente) {
    const { data: ejSesion } = await supabase
      .from('sesion_entrenamiento_ejercicio')
      .select('ejercicio_id')
      .eq('sesion_id', sesionExistente.id)
      .order('orden');
    ejercicioIdsSeleccionados = (ejSesion ?? []).map((e) => e.ejercicio_id);
  }

  // Todos los ejercicios disponibles (biblioteca compartida)
  const { data: todosEjercicios } = await supabase
    .from('ejercicios')
    .select('id, seccion_principal, titulo, imagen_url, objetivo_principal')
    .order('seccion_principal')
    .order('titulo');

  const equipoInfo = evento.equipos as unknown as Record<string, unknown>;
  const actualizarAction = actualizarEvento.bind(null, id);
  const enviarAction = enviarConvocatoria.bind(null, id);
  const sesionAction = guardarSesionEntrenamiento.bind(null, id);

  const jugadoraIds = (jugadorasEquipo ?? []).map(
    (je: Record<string, unknown>) =>
      (je.jugadoras as unknown as Record<string, unknown>).id as string
  );
  const marcarTodasSiAction = marcarTodas.bind(null, id, jugadoraIds, true);
  const marcarTodasNoAction = marcarTodas.bind(null, id, jugadoraIds, false);

  const fechaInputValue = new Date(
    new Date(evento.fecha_hora).getTime() - new Date(evento.fecha_hora).getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  return (
    <div className="p-6">
      <Link
        href="/convocatorias"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a convocatorias
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold capitalize">
            {evento.tipo} {evento.rival ? `vs ${evento.rival}` : ''}
          </h1>
          <p className="text-muted-foreground text-sm">
            {equipoInfo ? `${equipoInfo.nombre as string} (${equipoInfo.categoria as string})` : ''}{' '}
            —{' '}
            {new Date(evento.fecha_hora).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {evento.lugar ? ` — ${evento.lugar}` : ''}
          </p>
        </div>

        <ConfirmActionButton
          onConfirm={() => eliminarEvento(id)}
          label="Eliminar evento"
          confirmTitle="¿Eliminar este evento?"
          confirmDescription="Se eliminará el evento y todas sus convocatorias. Esta acción no se puede deshacer."
          className="border-destructive text-destructive hover:bg-destructive/10 rounded-md border px-3 py-1.5 text-xs"
        />
      </div>

      {envio === 'ok' && (
        <div className="border-primary bg-primary/10 text-primary mb-4 rounded-md border p-3 text-sm">
          Convocatoria enviada correctamente a {n} jugadora(s).
        </div>
      )}
      {envio === 'vacio' && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          No hay jugadoras marcadas para enviar la convocatoria.
        </div>
      )}
      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <details className="border-border bg-card mb-6 rounded-lg border">
        <summary className="text-primary cursor-pointer p-4 text-sm font-medium">
          Editar datos del evento
        </summary>
        <form action={actualizarAction} className="space-y-4 p-4 pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select
                name="tipo"
                defaultValue={evento.tipo}
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              >
                <option value="entrenamiento">Entrenamiento</option>
                <option value="partido">Partido</option>
                <option value="concentracion">Concentración</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fecha y hora</label>
              <input
                type="datetime-local"
                name="fecha_hora"
                defaultValue={fechaInputValue}
                required
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Lugar</label>
              <input
                name="lugar"
                defaultValue={evento.lugar ?? ''}
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Rival</label>
              <input
                name="rival"
                defaultValue={evento.rival ?? ''}
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Observaciones (se incluyen en el email)
            </label>
            <textarea
              name="observaciones"
              rows={3}
              defaultValue={evento.observaciones ?? ''}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <FormSubmitButton>Guardar cambios del evento</FormSubmitButton>
        </form>
      </details>

      {!jugadorasEquipo || jugadorasEquipo.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          Este equipo no tiene jugadoras asignadas todavía.
        </div>
      ) : (
        (() => {
          const totalJug = jugadorasEquipo.length;
          const convocadas = jugadorasEquipo.filter((je: Record<string, unknown>) => {
            const jug = je.jugadoras as unknown as Record<string, unknown>;
            const conv = mapaConvocatorias.get(jug.id as string);
            return conv?.convocada;
          }).length;
          const confirmadas = jugadorasEquipo.filter((je: Record<string, unknown>) => {
            const jug = je.jugadoras as unknown as Record<string, unknown>;
            const conv = mapaConvocatorias.get(jug.id as string);
            return conv?.convocada && conv?.confirmada;
          }).length;
          const asistieron = jugadorasEquipo.filter((je: Record<string, unknown>) => {
            const jug = je.jugadoras as unknown as Record<string, unknown>;
            const conv = mapaConvocatorias.get(jug.id as string);
            return conv?.asistio;
          }).length;

          return (
            <>
              <div className="mb-4 grid grid-cols-4 gap-3">
                <div className="border-border bg-muted/50 rounded-lg border p-3 text-center">
                  <p className="text-lg font-bold">
                    {convocadas}
                    <span className="text-muted-foreground text-xs font-normal">/{totalJug}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">Convocadas</p>
                </div>
                <div className="border-border bg-muted/50 rounded-lg border p-3 text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {confirmadas}
                    <span className="text-muted-foreground text-xs font-normal">/{convocadas}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">Confirmadas</p>
                </div>
                <div className="border-border bg-muted/50 rounded-lg border p-3 text-center">
                  <p className="text-lg font-bold text-green-600">{asistieron}</p>
                  <p className="text-muted-foreground text-xs">Asistieron</p>
                </div>
                <div className="border-border bg-muted/50 rounded-lg border p-3 text-center">
                  <p className="text-lg font-bold">{totalJug - convocadas}</p>
                  <p className="text-muted-foreground text-xs">No convocadas</p>
                </div>
              </div>

              <div className="mb-3 flex gap-2">
                <form action={marcarTodasSiAction}>
                  <button
                    type="submit"
                    className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs"
                  >
                    Marcar todas
                  </button>
                </form>
                <form action={marcarTodasNoAction}>
                  <button
                    type="submit"
                    className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs"
                  >
                    Desmarcar todas
                  </button>
                </form>
              </div>

              <div className="border-border mb-6 rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th scope="col" className="p-3 text-left font-medium">
                          Dorsal
                        </th>
                        <th scope="col" className="p-3 text-left font-medium">
                          Jugadora
                        </th>
                        <th scope="col" className="p-3 text-center font-medium">
                          Enviar convocatoria
                        </th>
                        <th scope="col" className="p-3 text-center font-medium">
                          Confirmada
                        </th>
                        <th scope="col" className="p-3 text-center font-medium">
                          Asistió
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jugadorasEquipo.map((je: Record<string, unknown>) => {
                        const jug = je.jugadoras as unknown as Record<string, unknown>;
                        const conv = mapaConvocatorias.get(jug.id as string);

                        const actionConvocada = toggleCampo.bind(
                          null,
                          id,
                          jug.id as string,
                          'convocada',
                          conv?.convocada ?? false
                        );
                        const actionConfirmada = toggleCampo.bind(
                          null,
                          id,
                          jug.id as string,
                          'confirmada',
                          conv?.confirmada ?? false
                        );
                        const actionAsistio = toggleCampo.bind(
                          null,
                          id,
                          jug.id as string,
                          'asistio',
                          conv?.asistio ?? false
                        );

                        return (
                          <tr key={jug.id as string} className="border-border border-t">
                            <td className="p-3">{(je.dorsal as string) ?? '-'}</td>
                            <td className="p-3 font-medium">
                              {jug.nombre as string} {jug.apellidos as string}
                              {!jug.email && (
                                <span className="text-destructive ml-2 text-xs">(sin email)</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <form action={actionConvocada}>
                                <button
                                  type="submit"
                                  className={
                                    conv?.convocada
                                      ? 'bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs'
                                      : 'border-border text-muted-foreground rounded-md border px-3 py-1 text-xs'
                                  }
                                >
                                  {conv?.convocada ? 'Sí' : 'No'}
                                </button>
                              </form>
                            </td>
                            <td className="p-3 text-center">
                              <form action={actionConfirmada}>
                                <button
                                  type="submit"
                                  className={
                                    conv?.confirmada
                                      ? 'bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs'
                                      : 'border-border text-muted-foreground rounded-md border px-3 py-1 text-xs'
                                  }
                                >
                                  {conv?.confirmada ? 'Sí' : 'No'}
                                </button>
                              </form>
                            </td>
                            <td className="p-3 text-center">
                              <form action={actionAsistio}>
                                <button
                                  type="submit"
                                  className={
                                    conv?.asistio
                                      ? 'bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs'
                                      : 'border-border text-muted-foreground rounded-md border px-3 py-1 text-xs'
                                  }
                                >
                                  {conv?.asistio ? 'Sí' : 'No'}
                                </button>
                              </form>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()
      )}

      {/* Planificación de entrenamiento (solo si tipo = entrenamiento) */}
      {evento.tipo === 'entrenamiento' && (
        <details className="border-border bg-card mb-6 rounded-lg border" open>
          <summary className="text-primary cursor-pointer p-4 text-sm font-medium">
            Planificación de entrenamiento
          </summary>
          <form action={sesionAction} className="space-y-4 p-4 pt-0">
            {/* Objetivos de la sesión */}
            <div className="border-border bg-muted/50 rounded-lg border p-4">
              <h3 className="text-primary mb-3 text-sm font-medium">Objetivos de la sesión</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Objetivo Principal</label>
                  <input
                    name="objetivo_principal"
                    defaultValue={sesionExistente?.objetivo_principal ?? ''}
                    placeholder="Objetivo principal de esta sesión de entrenamiento"
                    className="border-border bg-background w-full rounded-md border p-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Objetivo Secundario A</label>
                    <input
                      name="objetivo_secundario_a"
                      defaultValue={sesionExistente?.objetivo_secundario_a ?? ''}
                      placeholder="Objetivo secundario A"
                      className="border-border bg-background w-full rounded-md border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Objetivo Secundario B</label>
                    <input
                      name="objetivo_secundario_b"
                      defaultValue={sesionExistente?.objetivo_secundario_b ?? ''}
                      placeholder="Objetivo secundario B"
                      className="border-border bg-background w-full rounded-md border p-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selección de ejercicios */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Ejercicios de la sesión ({ejercicioIdsSeleccionados.length} de 10 max.)
              </label>
              <p className="text-muted-foreground mb-3 text-xs">
                Selecciona los ejercicios de la biblioteca compartida que se realizarán en esta
                sesión. Máximo 10 ejercicios por sesión.
              </p>

              {!todosEjercicios || todosEjercicios.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No hay ejercicios en la biblioteca.{' '}
                  <Link href="/ejercicios/nuevo" className="text-primary hover:underline">
                    Crear ejercicio
                  </Link>
                </p>
              ) : (
                <div className="space-y-4">
                  {(
                    [
                      'dinamica_grupo',
                      'preparacion_fisica',
                      'calentamiento',
                      'ataque',
                      'defensa',
                      'porteria',
                      'contraataque_1a',
                      'transicion_at_def',
                      'transicion_def_at',
                      'juego_combinado',
                      'otros',
                    ] as const
                  ).map((seccion) => {
                    const ejerciciosSeccion = todosEjercicios.filter(
                      (e) => e.seccion_principal === seccion
                    );
                    if (ejerciciosSeccion.length === 0) return null;
                    const labels: Record<string, string> = {
                      dinamica_grupo: 'Dinámica de grupo',
                      preparacion_fisica: 'Preparación física',
                      calentamiento: 'Calentamiento',
                      activacion: 'Activación',
                      ataque: 'Ataque',
                      defensa: 'Defensa',
                      porteria: 'Portería',
                      contraataque_1a: 'Contraataque 1ª oleada',
                      contraataque_2a: 'Contraataque 2ª oleada',
                      contraataque_3a: 'Contraataque 3ª oleada',
                      transicion_at_def: 'Transición ataque→defensa',
                      transicion_def_at: 'Transición defensa→ataque',
                      juego_combinado: 'Juego combinado',
                      otros: 'Otros',
                    };
                    return (
                      <div key={seccion}>
                        <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                          {labels[seccion] ?? seccion}
                        </h4>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {ejerciciosSeccion.map((ej) => (
                            <label
                              key={ej.id}
                              className={`flex items-center gap-3 rounded-md border p-3 text-sm transition-colors ${
                                ejercicioIdsSeleccionados.includes(ej.id)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:bg-muted/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                name="ejercicio_ids"
                                value={ej.id}
                                defaultChecked={ejercicioIdsSeleccionados.includes(ej.id)}
                                className="size-4"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{ej.titulo}</p>
                                {ej.objetivo_principal && (
                                  <p className="text-muted-foreground truncate text-xs">
                                    {ej.objetivo_principal}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Observaciones del entrenador */}
            <div>
              <label className="mb-1 block text-sm font-medium">Observaciones del entrenador</label>
              <textarea
                name="observaciones_entrenador"
                rows={5}
                defaultValue={sesionExistente?.observaciones_entrenador ?? ''}
                placeholder="Desarrollo por escrito de la sesión: cómo se va a desarrollar el entrenamiento, aspectos a destacar, ritmo, intensidad, etc."
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>

            {/* Valoración del entrenamiento */}
            <div>
              <label className="mb-1 block text-sm font-medium">Valoración del entrenamiento</label>
              <textarea
                name="valoracion_entrenamiento"
                rows={4}
                defaultValue={sesionExistente?.valoracion_entrenamiento ?? ''}
                placeholder="¿Cómo ha ido el entrenamiento? Ritmo, implicación de las jugadoras, incidencias, ejercicios que han conectado o no, aspectos a mejorar..."
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>

            <FormSubmitButton>Guardar planificación</FormSubmitButton>
          </form>
        </details>
      )}

      <form action={enviarAction}>
        <FormSubmitButton>Enviar comunicación a marcadas</FormSubmitButton>
      </form>
    </div>
  );
}
