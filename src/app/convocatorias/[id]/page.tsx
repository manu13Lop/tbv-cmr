import { createClient } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FormSubmitButton } from "@/components/form-submit-button"
import { generarICS, generarLinkGoogleCalendar } from "@/lib/ics"
import { Resend } from "resend"
import { ArrowLeft } from "lucide-react"
import { validateFormData, getFirstError } from "@/lib/validate"
import { actualizarEventoSchema, crearSesionEntrenamientoSchema } from "@/lib/validations"
import { ConfirmActionButton } from "@/components/confirm-action-button"


async function actualizarEvento(eventoId: string, formData: FormData) {
  "use server"

  const validation = validateFormData(actualizarEventoSchema, formData)
  if (!validation.success) {
    return redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }
  const { tipo, fecha_hora, lugar, rival, observaciones } = validation.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("eventos")
    .update({
      tipo: tipo ?? "",
      fecha_hora,
      lugar: lugar ?? "",
      rival: rival ?? "",
      observaciones: observaciones ?? "",
    })
    .eq("id", eventoId)

  if (error) redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent("Error al guardar los cambios")}`)
  redirect(`/convocatorias/${eventoId}`)
}

async function eliminarEvento(eventoId: string) {
  "use server"
  const supabase = await createClient()
  await supabase.from("convocatorias").delete().eq("evento_id", eventoId)
  const { error } = await supabase.from("eventos").delete().eq("id", eventoId)
  if (error) redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent("Error al eliminar el evento")}`)
  redirect("/convocatorias")
}

async function toggleCampo(
  eventoId: string,
  jugadoraId: string,
  campo: "convocada" | "confirmada" | "asistio",
  valorActual: boolean | null
) {
  "use server"
  const supabase = await createClient()

  const { data: existente } = await supabase
    .from("convocatorias")
    .select("id")
    .eq("evento_id", eventoId)
    .eq("jugadora_id", jugadoraId)
    .maybeSingle()

  const nuevoValor = !valorActual

  if (existente) {
    const { error } = await supabase
      .from("convocatorias")
      .update({ [campo]: nuevoValor })
      .eq("id", existente.id)
    if (error) redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent("Error al actualizar")}`)
  } else {
    const { error } = await supabase.from("convocatorias").insert({
      evento_id: eventoId,
      jugadora_id: jugadoraId,
      [campo]: nuevoValor,
    })
    if (error) redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent("Error al actualizar")}`)
  }

  redirect(`/convocatorias/${eventoId}`)
}

async function marcarTodas(eventoId: string, jugadoraIds: string[], valor: boolean) {
  "use server"
  const supabase = await createClient()

  for (const jid of jugadoraIds) {
    const { data: existente } = await supabase
      .from("convocatorias")
      .select("id")
      .eq("evento_id", eventoId)
      .eq("jugadora_id", jid)
      .maybeSingle()

    if (existente) {
      await supabase
        .from("convocatorias")
        .update({ convocada: valor })
        .eq("id", existente.id)
    } else {
      await supabase.from("convocatorias").insert({
        evento_id: eventoId,
        jugadora_id: jid,
        convocada: valor,
      })
    }
  }

  redirect(`/convocatorias/${eventoId}`)
}

async function enviarConvocatoria(eventoId: string) {
  "use server"
  const supabase = await createClient()

  const { data: evento } = await supabase
    .from("eventos")
    .select(
      "id, tipo, fecha_hora, lugar, rival, observaciones, equipos ( nombre, categoria )"
    )
    .eq("id", eventoId)
    .single()

  if (!evento) redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent("Evento no encontrado")}`)

  const { data: convocatorias } = await supabase
    .from("convocatorias")
    .select("jugadora_id, jugadoras ( nombre, apellidos, email )")
    .eq("evento_id", eventoId)
    .eq("convocada", true)

  if (!convocatorias || convocatorias.length === 0) {
    redirect(`/convocatorias/${eventoId}?envio=vacio`)
  }

  const equipoInfo = evento.equipos as any
  const inicio = new Date(evento.fecha_hora)
  const titulo = `${evento.tipo.toUpperCase()} ${equipoInfo?.nombre ?? ""}${
    evento.rival ? " vs " + evento.rival : ""
  }`
  const descripcion = `${evento.tipo} de ${equipoInfo?.nombre ?? ""} (${
    equipoInfo?.categoria ?? ""
  }).${evento.observaciones ? "\nObservaciones: " + evento.observaciones : ""}`

  const icsContent = generarICS({
    uid: evento.id,
    titulo,
    descripcion,
    lugar: evento.lugar ?? "",
    inicio,
  })

  const linkCalendario = generarLinkGoogleCalendar({
    titulo,
    descripcion,
    lugar: evento.lugar ?? "",
    inicio,
  })

  const fechaFormateada = inicio.toLocaleString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const resend = new Resend(process.env.RESEND_API_KEY as string)
  let enviados = 0

  for (const c of convocatorias) {
    const jug = c.jugadoras as any
    if (!jug?.email) continue

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color:#0f5132;">Convocatoria: ${titulo}</h2>
        <p>Hola ${jug.nombre},</p>
        <p>Quedas convocada al siguiente evento:</p>
        <ul>
          <li><strong>Fecha:</strong> ${fechaFormateada}</li>
          <li><strong>Lugar:</strong> ${evento.lugar ?? "Por confirmar"}</li>
          ${evento.rival ? `<li><strong>Rival:</strong> ${evento.rival}</li>` : ""}
        </ul>
        ${
          evento.observaciones
            ? `<p><strong>Observaciones del cuerpo técnico:</strong><br>${evento.observaciones}</p>`
            : ""
        }
        <p><a href="${linkCalendario}" target="_blank">Añadir a Google Calendar</a></p>
        <p>Adjuntamos también el archivo .ics para añadirlo a cualquier calendario.</p>
        <p style="color:#666; font-size:12px;">Triana Balonmano Vivero</p>
      </div>
    `

    await resend.emails.send({
      from: "Triana Balonmano Vivero <onboarding@resend.dev>",
      to: jug.email,
      subject: `Convocatoria: ${titulo} - ${fechaFormateada}`,
      html: htmlBody,
      attachments: [
        {
          filename: "evento.ics",
          content: Buffer.from(icsContent).toString("base64"),
        },
      ],
    })

    await supabase
      .from("convocatorias")
      .update({ notificacion_enviada: true })
      .eq("evento_id", eventoId)
      .eq("jugadora_id", c.jugadora_id)

    enviados++
  }

  redirect(`/convocatorias/${eventoId}?envio=ok&n=${enviados}`)
}

async function guardarSesionEntrenamiento(eventoId: string, formData: FormData) {
  "use server"

  const ejercicioIds = formData.getAll("ejercicio_ids") as string[]
  const objetivoPrincipal = (formData.get("objetivo_principal") as string) || ""
  const objetivoSecundarioA = (formData.get("objetivo_secundario_a") as string) || ""
  const objetivoSecundarioB = (formData.get("objetivo_secundario_b") as string) || ""
  const observaciones = (formData.get("observaciones_entrenador") as string) || ""
  const valoracion = (formData.get("valoracion_entrenamiento") as string) || ""

  const supabase = await createClient()

  const { data: sesionExistente } = await supabase
    .from("sesion_entrenamiento")
    .select("id")
    .eq("evento_id", eventoId)
    .maybeSingle()

  let sesionId: string

  if (sesionExistente) {
    const { error } = await supabase
      .from("sesion_entrenamiento")
      .update({
        objetivo_principal: objetivoPrincipal || null,
        objetivo_secundario_a: objetivoSecundarioA || null,
        objetivo_secundario_b: objetivoSecundarioB || null,
        observaciones_entrenador: observaciones || null,
        valoracion_entrenamiento: valoracion || null,
      })
      .eq("id", sesionExistente.id)
    if (error) redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent("Error al guardar la planificación")}`)
    sesionId = sesionExistente.id
  } else {
    const { data: nuevaSesion, error } = await supabase
      .from("sesion_entrenamiento")
      .insert({
        evento_id: eventoId,
        objetivo_principal: objetivoPrincipal || null,
        objetivo_secundario_a: objetivoSecundarioA || null,
        objetivo_secundario_b: objetivoSecundarioB || null,
        observaciones_entrenador: observaciones || null,
        valoracion_entrenamiento: valoracion || null,
      })
      .select("id")
      .single()
    if (error) redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent("Error al guardar la planificación")}`)
    sesionId = nuevaSesion!.id
  }

  await supabase
    .from("sesion_entrenamiento_ejercicio")
    .delete()
    .eq("sesion_id", sesionId)

  if (ejercicioIds.length > 0) {
    const { error } = await supabase.from("sesion_entrenamiento_ejercicio").insert(
      ejercicioIds.map((ejId, idx) => ({
        sesion_id: sesionId,
        ejercicio_id: ejId,
        orden: idx,
      }))
    )
    if (error) redirect(`/convocatorias/${eventoId}?error=${encodeURIComponent("Error al guardar la planificación")}`)
  }

  redirect(`/convocatorias/${eventoId}`)
}

export default async function ConvocatoriaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ envio?: string; n?: string }>
}) {
  const { id } = await params
  const { envio, n } = await searchParams
  const supabase = await createClient()

  const { data: evento } = await supabase
    .from("eventos")
    .select(
      "id, tipo, fecha_hora, lugar, rival, observaciones, equipo_id, equipos ( nombre, categoria, temporada )"
    )
    .eq("id", id)
    .single()

  if (!evento) notFound()

  const { data: jugadorasEquipo } = await supabase
    .from("jugadora_equipo_temporada")
    .select("jugadora_id, dorsal, jugadoras ( id, nombre, apellidos, email )")
    .eq("equipo_id", evento.equipo_id)

  const { data: convocatorias } = await supabase
    .from("convocatorias")
    .select("*")
    .eq("evento_id", id)

  const mapaConvocatorias = new Map(
    (convocatorias ?? []).map((c) => [c.jugadora_id, c])
  )

  // Datos de sesión de entrenamiento (si existe)
  const { data: sesionExistente } = await supabase
    .from("sesion_entrenamiento")
    .select("*")
    .eq("evento_id", id)
    .maybeSingle()

  let ejercicioIdsSeleccionados: string[] = []
  if (sesionExistente) {
    const { data: ejSesion } = await supabase
      .from("sesion_entrenamiento_ejercicio")
      .select("ejercicio_id")
      .eq("sesion_id", sesionExistente.id)
      .order("orden")
    ejercicioIdsSeleccionados = (ejSesion ?? []).map((e) => e.ejercicio_id)
  }

  // Todos los ejercicios disponibles (biblioteca compartida)
  const { data: todosEjercicios } = await supabase
    .from("ejercicios")
    .select("id, categoria, titulo, imagen_url, objetivo_principal")
    .order("categoria")
    .order("titulo")

  const equipoInfo = evento.equipos as any
  const actualizarAction = actualizarEvento.bind(null, id)
  const eliminarAction = eliminarEvento.bind(null, id)
  const enviarAction = enviarConvocatoria.bind(null, id)
  const sesionAction = guardarSesionEntrenamiento.bind(null, id)

  const jugadoraIds = (jugadorasEquipo ?? []).map((je: any) => je.jugadoras.id)
  const marcarTodasSiAction = marcarTodas.bind(null, id, jugadoraIds, true)
  const marcarTodasNoAction = marcarTodas.bind(null, id, jugadoraIds, false)

  const fechaInputValue = new Date(
    new Date(evento.fecha_hora).getTime() -
      new Date(evento.fecha_hora).getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16)

  return (
    <div className="p-6">
      <Link
        href="/convocatorias"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a convocatorias
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary capitalize">
            {evento.tipo} {evento.rival ? `vs ${evento.rival}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {equipoInfo ? `${equipoInfo.nombre} (${equipoInfo.categoria})` : ""} —{" "}
            {new Date(evento.fecha_hora).toLocaleString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {evento.lugar ? ` — ${evento.lugar}` : ""}
          </p>
        </div>

        <ConfirmActionButton
          onConfirm={() => eliminarEvento(id)}
          label="Eliminar evento"
          confirmTitle="¿Eliminar este evento?"
          confirmDescription="Se eliminará el evento y todas sus convocatorias. Esta acción no se puede deshacer."
          className="rounded-md border border-destructive px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
        />
      </div>

      {envio === "ok" && (
        <div className="mb-4 rounded-md border border-primary bg-primary/10 p-3 text-sm text-primary">
          Convocatoria enviada correctamente a {n} jugadora(s).
        </div>
      )}
      {envio === "vacio" && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          No hay jugadoras marcadas para enviar la convocatoria.
        </div>
      )}

      <details className="mb-6 rounded-lg border border-border bg-card">
        <summary className="cursor-pointer p-4 text-sm font-medium text-primary">
          Editar datos del evento
        </summary>
        <form action={actualizarAction} className="space-y-4 p-4 pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select
                name="tipo"
                defaultValue={evento.tipo}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              >
                <option value="entrenamiento">Entrenamiento</option>
                <option value="partido">Partido</option>
                <option value="concentracion">Concentración</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Fecha y hora
              </label>
              <input
                type="datetime-local"
                name="fecha_hora"
                defaultValue={fechaInputValue}
                required
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Lugar</label>
              <input
                name="lugar"
                defaultValue={evento.lugar ?? ""}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Rival</label>
              <input
                name="rival"
                defaultValue={evento.rival ?? ""}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
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
              defaultValue={evento.observaciones ?? ""}
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          </div>

          <FormSubmitButton>Guardar cambios del evento</FormSubmitButton>
        </form>
      </details>

      {!jugadorasEquipo || jugadorasEquipo.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Este equipo no tiene jugadoras asignadas todavía.
        </div>
      ) : (
        <>
          <div className="mb-3 flex gap-2">
            <form action={marcarTodasSiAction}>
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Marcar todas
              </button>
            </form>
            <form action={marcarTodasNoAction}>
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Desmarcar todas
              </button>
            </form>
          </div>

          <div className="mb-6 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Dorsal</th>
                  <th className="p-3 text-left font-medium">Jugadora</th>
                  <th className="p-3 text-center font-medium">Enviar convocatoria</th>
                  <th className="p-3 text-center font-medium">Confirmada</th>
                  <th className="p-3 text-center font-medium">Asistió</th>
                </tr>
              </thead>
              <tbody>
                {jugadorasEquipo.map((je: any) => {
                  const jug = je.jugadoras
                  const conv = mapaConvocatorias.get(jug.id)

                  const actionConvocada = toggleCampo.bind(
                    null,
                    id,
                    jug.id,
                    "convocada",
                    conv?.convocada ?? false
                  )
                  const actionConfirmada = toggleCampo.bind(
                    null,
                    id,
                    jug.id,
                    "confirmada",
                    conv?.confirmada ?? false
                  )
                  const actionAsistio = toggleCampo.bind(
                    null,
                    id,
                    jug.id,
                    "asistio",
                    conv?.asistio ?? false
                  )

                  return (
                    <tr key={jug.id} className="border-t border-border">
                      <td className="p-3">{je.dorsal ?? "-"}</td>
                      <td className="p-3 font-medium">
                        {jug.nombre} {jug.apellidos}
                        {!jug.email && (
                          <span className="ml-2 text-xs text-destructive">
                            (sin email)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <form action={actionConvocada}>
                          <button
                            type="submit"
                            className={
                              conv?.convocada
                                ? "rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
                                : "rounded-md border border-border px-3 py-1 text-xs text-muted-foreground"
                            }
                          >
                            {conv?.convocada ? "Sí" : "No"}
                          </button>
                        </form>
                      </td>
                      <td className="p-3 text-center">
                        <form action={actionConfirmada}>
                          <button
                            type="submit"
                            className={
                              conv?.confirmada
                                ? "rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
                                : "rounded-md border border-border px-3 py-1 text-xs text-muted-foreground"
                            }
                          >
                            {conv?.confirmada ? "Sí" : "No"}
                          </button>
                        </form>
                      </td>
                      <td className="p-3 text-center">
                        <form action={actionAsistio}>
                          <button
                            type="submit"
                            className={
                              conv?.asistio
                                ? "rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
                                : "rounded-md border border-border px-3 py-1 text-xs text-muted-foreground"
                            }
                          >
                            {conv?.asistio ? "Sí" : "No"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Planificación de entrenamiento (solo si tipo = entrenamiento) */}
      {evento.tipo === "entrenamiento" && (
        <details className="mb-6 rounded-lg border border-border bg-card" open>
          <summary className="cursor-pointer p-4 text-sm font-medium text-primary">
            Planificación de entrenamiento
          </summary>
          <form action={sesionAction} className="space-y-4 p-4 pt-0">
            {/* Objetivos de la sesión */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="mb-3 text-sm font-medium text-primary">Objetivos de la sesión</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Objetivo Principal</label>
                  <input
                    name="objetivo_principal"
                    defaultValue={sesionExistente?.objetivo_principal ?? ""}
                    placeholder="Objetivo principal de esta sesión de entrenamiento"
                    className="w-full rounded-md border border-border bg-background p-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Objetivo Secundario A</label>
                    <input
                      name="objetivo_secundario_a"
                      defaultValue={sesionExistente?.objetivo_secundario_a ?? ""}
                      placeholder="Objetivo secundario A"
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Objetivo Secundario B</label>
                    <input
                      name="objetivo_secundario_b"
                      defaultValue={sesionExistente?.objetivo_secundario_b ?? ""}
                      placeholder="Objetivo secundario B"
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selección de ejercicios */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Ejercicios de la sesión ({ejercicioIdsSeleccionados.length} seleccionados)
              </label>
              <p className="mb-3 text-xs text-muted-foreground">
                Selecciona los ejercicios de la biblioteca compartida que se realizarán en esta sesión.
              </p>

              {!todosEjercicios || todosEjercicios.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay ejercicios en la biblioteca.{' '}
                  <Link href="/entrenadores/ejercicios/nuevo" className="text-primary hover:underline">
                    Crear ejercicio
                  </Link>
                </p>
              ) : (
                <div className="space-y-4">
                  {(["táctico", "técnica_individual", "portero", "físico"] as const).map((cat) => {
                    const ejerciciosCat = todosEjercicios.filter((e) => e.categoria === cat)
                    if (ejerciciosCat.length === 0) return null
                    const labels: Record<string, string> = {
                      táctico: "Tácticos",
                      técnica_individual: "Técnica Individual",
                      portero: "Porteros",
                      físico: "Físicos",
                    }
                    return (
                      <div key={cat}>
                        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          {labels[cat]}
                        </h4>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {ejerciciosCat.map((ej) => (
                            <label
                              key={ej.id}
                              className={`flex items-center gap-3 rounded-md border p-3 text-sm transition-colors ${
                                ejercicioIdsSeleccionados.includes(ej.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-muted/50"
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
                                  <p className="truncate text-xs text-muted-foreground">
                                    {ej.objetivo_principal}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Observaciones del entrenador */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Observaciones del entrenador
              </label>
              <textarea
                name="observaciones_entrenador"
                rows={5}
                defaultValue={sesionExistente?.observaciones_entrenador ?? ""}
                placeholder="Desarrollo por escrito de la sesión: cómo se va a desarrollar el entrenamiento, aspectos a destacar, ritmo, intensidad, etc."
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>

            {/* Valoración del entrenamiento */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Valoración del entrenamiento
              </label>
              <textarea
                name="valoracion_entrenamiento"
                rows={4}
                defaultValue={sesionExistente?.valoracion_entrenamiento ?? ""}
                placeholder="¿Cómo ha ido el entrenamiento? Ritmo, implicación de las jugadoras, incidencias, ejercicios que han conectado o no, aspectos a mejorar..."
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
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
  )
}