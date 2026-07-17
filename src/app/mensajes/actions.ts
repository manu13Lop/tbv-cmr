"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { resend, EMAIL_FROM } from "@/lib/resend"
import { validateFormData, getFirstError } from "@/lib/validate"
import { enviarMensajeSchema } from "@/lib/validations"
import { notificarUsuariosConPermiso } from "@/lib/notifications"

export async function enviarMensajeAction(formData: FormData) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "mensajes.enviar")) {
    redirect("/")
  }

  const validation = validateFormData(enviarMensajeSchema, formData)
  if (!validation.success) {
    return redirect(`/mensajes/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const { equipo_id: equipoId, asunto, cuerpo, requiere_confirmacion: requiereConfirmacion } = validation.data

  const supabase = await createClient()

  const { data: vinculos } = await supabase
    .from("jugadora_equipo_temporada")
    .select("jugadora_id, jugadoras ( id, nombre, apellidos, email )")
    .eq("equipo_id", equipoId)

  const jugadoraIds = (vinculos ?? []).map((v: any) => v.jugadora_id)

  const { data: tutores } = await supabase
    .from("tutores")
    .select("id, jugadora_id, nombre, email")
    .in(
      "jugadora_id",
      jugadoraIds.length > 0 ? jugadoraIds : ["00000000-0000-0000-0000-000000000000"]
    )

  const { data: mensaje, error: errorMensaje } = await supabase
    .from("mensajes")
    .insert({
      asunto,
      cuerpo,
      equipo_id: equipoId,
      requiere_confirmacion: requiereConfirmacion,
      enviado_por_nombre: usuario.nombreCompleto ?? "Desconocido",
    })
    .select("id")
    .single()

  if (errorMensaje || !mensaje) {
    console.error(errorMensaje)
    redirect("/mensajes/nuevo?error=error_creacion")
  }

  const destinatarios: {
    mensaje_id: string
    jugadora_id: string | null
    tipo: "jugadora" | "tutor"
    nombre: string
    email: string
  }[] = []

  for (const v of vinculos ?? []) {
    const jugadora = (v as any).jugadoras
    if (!jugadora) continue

    const tutoresDeJugadora = (tutores ?? []).filter(
      (t: any) => t.jugadora_id === jugadora.id && t.email
    )

    if (jugadora.email) {
      destinatarios.push({
        mensaje_id: mensaje.id,
        jugadora_id: jugadora.id,
        tipo: "jugadora",
        nombre: `${jugadora.nombre} ${jugadora.apellidos}`,
        email: jugadora.email,
      })
    }

    for (const t of tutoresDeJugadora) {
      destinatarios.push({
        mensaje_id: mensaje.id,
        jugadora_id: jugadora.id,
        tipo: "tutor",
        nombre: t.nombre,
        email: t.email,
      })
    }
  }

  if (destinatarios.length === 0) {
    redirect(`/mensajes/${mensaje.id}?aviso=sin_destinatarios`)
  }

  const { data: destinatariosInsertados, error: errorDestinatarios } =
    await supabase
      .from("mensajes_destinatarios")
      .insert(destinatarios)
      .select("id, email, nombre, token_confirmacion")

  if (errorDestinatarios || !destinatariosInsertados) {
    console.error(errorDestinatarios)
    redirect(`/mensajes/${mensaje.id}?aviso=error_destinatarios`)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const emailsParaEnviar = destinatariosInsertados.map((d) => {
    const linkConfirmacion = `${appUrl}/mensajes/confirmar/${d.token_confirmacion}`

    const html = requiereConfirmacion
      ? `<p>${cuerpo.replace(/\n/g, "<br/>")}</p>
         <p style="margin-top:24px;">
           <a href="${linkConfirmacion}" style="background:#7a1f2b;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
             He leído este mensaje
           </a>
         </p>`
      : `<p>${cuerpo.replace(/\n/g, "<br/>")}</p>`

    return {
      from: EMAIL_FROM,
      to: [d.email],
      subject: asunto,
      html,
    }
  })

  const lotes: (typeof emailsParaEnviar)[] = []
  for (let i = 0; i < emailsParaEnviar.length; i += 100) {
    lotes.push(emailsParaEnviar.slice(i, i + 100))
  }

  for (const lote of lotes) {
    try {
      const { error: errorEnvio } = await resend.batch.send(lote)
      if (errorEnvio) {
        console.error("Error enviando lote de emails:", errorEnvio)
      }
    } catch (err) {
      console.error("Excepción enviando lote de emails:", err)
    }
  }

  await supabase
    .from("mensajes_destinatarios")
    .update({ enviado: true })
    .in(
      "id",
      destinatariosInsertados.map((d) => d.id)
    )

  try {
    await notificarUsuariosConPermiso(
      "mensajes.leer",
      "mensaje",
      `Nuevo mensaje: ${asunto}`,
      `Enviado por ${usuario.nombreCompleto}`,
      `/mensajes/${mensaje.id}`
    )
  } catch (err) {
    console.error("Error creando notificaciones:", err)
  }

  redirect(`/mensajes/${mensaje.id}`)
}

export async function confirmarLecturaAction(token: string) {
  const supabase = await createClient()

  await supabase
    .from("mensajes_destinatarios")
    .update({ leido_en: new Date().toISOString() })
    .eq("token_confirmacion", token)
    .is("leido_en", null)
}