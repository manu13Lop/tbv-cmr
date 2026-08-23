import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { FormSubmitButton } from "@/components/form-submit-button"
import { ArrowLeft } from "lucide-react"
import { enviarEmailConvocatoria } from "@/lib/email-convocatoria"
import { validateFormData, getFirstError } from "@/lib/validate"
import { actualizarReconocimientoSchema } from "@/lib/validations"
import { ConfirmActionButton } from "@/components/confirm-action-button"


async function comprobarEdicion() {
  const usuario = await getUsuarioActual()
  return !!usuario && tienePermiso(usuario.permisos, "sanitario.editar")
}

async function actualizarConvocatoria(convId: string, formData: FormData) {
  "use server"
  if (!(await comprobarEdicion())) return

  const validation = validateFormData(actualizarReconocimientoSchema, formData)
  if (!validation.success) {
    return redirect(`/sanitario/reconocimientos/${convId}?error=${encodeURIComponent(getFirstError(validation.errors))}`)
  }

  const { temporada, fecha_hora, lugar, mensaje_instrucciones, notas } = validation.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("reconocimientos_medicos_convocatoria")
    .update({
      temporada,
      fecha_hora,
      lugar,
      mensaje_instrucciones,
      notas,
    })
    .eq("id", convId)

  if (error) redirect(`/sanitario/reconocimientos/${convId}?error=${encodeURIComponent("Error al guardar los cambios")}`)
  redirect(`/sanitario/reconocimientos/${convId}`)
}

async function eliminarConvocatoria(convId: string) {
  "use server"
  if (!(await comprobarEdicion())) return

  const supabase = await createClient()
  await supabase
    .from("reconocimientos_medicos_jugadora")
    .delete()
    .eq("convocatoria_id", convId)

  const { error } = await supabase
    .from("reconocimientos_medicos_convocatoria")
    .delete()
    .eq("id", convId)

  if (error) redirect(`/sanitario/reconocimientos?error=${encodeURIComponent("Error al eliminar la convocatoria")}`)
  redirect("/sanitario/reconocimientos")
}

async function actualizarResultado(
  convId: string,
  jugadoraId: string,
  formData: FormData
) {
  "use server"
  if (!(await comprobarEdicion())) return

  const supabase = await createClient()
  const { error } = await supabase
    .from("reconocimientos_medicos_jugadora")
    .update({
      resultado: formData.get("resultado") as string,
      observaciones: formData.get("observaciones") as string,
      fecha_realizado: formData.get("fecha_realizado")
        ? (formData.get("fecha_realizado") as string)
        : null,
    })
    .eq("convocatoria_id", convId)
    .eq("jugadora_id", jugadoraId)

  if (error) redirect(`/sanitario/reconocimientos/${convId}?error=${encodeURIComponent("Error al guardar el resultado")}`)
  redirect(`/sanitario/reconocimientos/${convId}`)
}

async function toggleCitar(
  convId: string,
  jugadoraId: string,
  yaEstaCitada: boolean
) {
  "use server"
  if (!(await comprobarEdicion())) return

  const supabase = await createClient()

  if (yaEstaCitada) {
    const { error } = await supabase
      .from("reconocimientos_medicos_jugadora")
      .delete()
      .eq("convocatoria_id", convId)
      .eq("jugadora_id", jugadoraId)
    if (error) redirect(`/sanitario/reconocimientos/${convId}?error=${encodeURIComponent("Error al actualizar citación")}`)
  } else {
    const { error } = await supabase.from("reconocimientos_medicos_jugadora").insert({
      convocatoria_id: convId,
      jugadora_id: jugadoraId,
      resultado: "pendiente",
    })
    if (error) redirect(`/sanitario/reconocimientos/${convId}?error=${encodeURIComponent("Error al actualizar citación")}`)
  }

  redirect(`/sanitario/reconocimientos/${convId}`)
}

async function enviarConvocatoriaMedica(convId: string) {
  "use server"
  if (!(await comprobarEdicion())) return

  const supabase = await createClient()

  const { data: conv } = await supabase
    .from("reconocimientos_medicos_convocatoria")
    .select("*")
    .eq("id", convId)
    .single()

  if (!conv) redirect(`/sanitario/reconocimientos/${convId}?error=${encodeURIComponent("Convocatoria no encontrada")}`)

  const { data: citadas } = await supabase
    .from("reconocimientos_medicos_jugadora")
    .select("jugadora_id, jugadoras ( nombre, apellidos, email )")
    .eq("convocatoria_id", convId)

  if (!citadas || citadas.length === 0) {
    redirect(`/sanitario/reconocimientos/${convId}?envio=vacio`)
  }

  const titulo = `Reconocimiento médico ${conv.temporada}`
  const inicio = new Date(conv.fecha_hora)
  let enviados = 0

  for (const c of citadas) {
    const jug = c.jugadoras as any
    if (!jug?.email) continue

    await enviarEmailConvocatoria({
      destinatarioEmail: jug.email,
      destinatarioNombre: jug.nombre,
      titulo,
      lugar: conv.lugar ?? "",
      inicio,
      observaciones: conv.mensaje_instrucciones,
      uid: conv.id,
    })

    enviados++
  }

  await supabase
    .from("reconocimientos_medicos_convocatoria")
    .update({
      convocatoria_enviada: true,
      fecha_envio_convocatoria: new Date().toISOString(),
    })
    .eq("id", convId)

  redirect(`/sanitario/reconocimientos/${convId}?envio=ok&n=${enviados}`)
}

const resultadoColor: Record<string, string> = {
  apto: "bg-primary text-primary-foreground",
  no_apto: "bg-destructive text-white",
  pendiente: "border border-border text-muted-foreground",
}

export default async function ReconocimientoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ envio?: string; n?: string }>
}) {
  const { id } = await params
  const { envio, n } = await searchParams

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.leer")) {
    redirect("/")
  }
  const puedeEditar = tienePermiso(usuario.permisos, "sanitario.editar")

  const supabase = await createClient()

  const { data: conv } = await supabase
    .from("reconocimientos_medicos_convocatoria")
    .select("*")
    .eq("id", id)
    .single()

  if (!conv) notFound()

  const { data: citadas } = await supabase
    .from("reconocimientos_medicos_jugadora")
    .select("jugadora_id, resultado, fecha_realizado, observaciones, jugadoras ( id, nombre, apellidos, email )")
    .eq("convocatoria_id", id)

  const { data: todasJugadoras } = await supabase
    .from("jugadoras")
    .select("id, nombre, apellidos")
    .eq("activa", true)
    .order("apellidos", { ascending: true })

  const idsYaCitadas = new Set((citadas ?? []).map((c) => c.jugadora_id))
  const noCitadas = (todasJugadoras ?? []).filter((j) => !idsYaCitadas.has(j.id))

  const actualizarConvAction = actualizarConvocatoria.bind(null, id)
  const eliminarAction = eliminarConvocatoria.bind(null, id)
  const enviarAction = enviarConvocatoriaMedica.bind(null, id)

  const fechaInputValue = new Date(
    new Date(conv.fecha_hora).getTime() -
      new Date(conv.fecha_hora).getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16)

  return (
    <div className="p-6">
      <Link
        href="/sanitario/reconocimientos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a reconocimientos
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Reconocimiento médico {conv.temporada}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(conv.fecha_hora).toLocaleString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {conv.lugar ? ` — ${conv.lugar}` : ""}
          </p>
        </div>

        {puedeEditar && (
          <ConfirmActionButton
            onConfirm={() => eliminarConvocatoria(id)}
            label="Eliminar convocatoria"
            confirmTitle="¿Eliminar esta convocatoria?"
            confirmDescription="Se eliminará la convocatoria y todas las jugadoras citadas. Esta acción no se puede deshacer."
            className="rounded-md border border-destructive px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          />
        )}
      </div>

      {envio === "ok" && (
        <div className="mb-4 rounded-md border border-primary bg-primary/10 p-3 text-sm text-primary">
          Convocatoria médica enviada a {n} jugadora(s).
        </div>
      )}
      {envio === "vacio" && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          No hay jugadoras citadas para enviar la convocatoria.
        </div>
      )}

      {puedeEditar && (
        <details className="mb-6 rounded-lg border border-border bg-card">
          <summary className="cursor-pointer p-4 text-sm font-medium text-primary">
            Editar datos de la convocatoria
          </summary>
          <form action={actualizarConvAction} className="space-y-4 p-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Temporada</label>
                <input
                  name="temporada"
                  defaultValue={conv.temporada}
                  required
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                />
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
            <div>
              <label className="mb-1 block text-sm font-medium">Lugar</label>
              <input
                name="lugar"
                defaultValue={conv.lugar ?? ""}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Mensaje de instrucciones
              </label>
              <textarea
                name="mensaje_instrucciones"
                rows={2}
                defaultValue={conv.mensaje_instrucciones ?? ""}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Notas internas
              </label>
              <textarea
                name="notas"
                rows={2}
                defaultValue={conv.notas ?? ""}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </div>
            <FormSubmitButton>Guardar cambios</FormSubmitButton>
          </form>
        </details>
      )}

      <h2 className="mb-3 text-lg font-bold text-primary">
        Jugadoras citadas ({citadas?.length ?? 0})
      </h2>

      {!citadas || citadas.length === 0 ? (
        <p className="mb-6 text-sm text-muted-foreground">
          No hay jugadoras citadas todavía.
        </p>
      ) : (
        <div className="mb-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Jugadora</th>
                <th className="p-3 text-left font-medium">Resultado</th>
                <th className="p-3 text-left font-medium">Fecha realizado</th>
                <th className="p-3 text-left font-medium">Observaciones</th>
                {puedeEditar && <th className="p-3 text-left font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {citadas.map((c: any) => {
                const jug = c.jugadoras
                const resultadoAction = actualizarResultado.bind(
                  null,
                  id,
                  jug.id
                )
                const quitarAction = toggleCitar.bind(null, id, jug.id, true)

                return (
                  <tr key={jug.id} className="border-t border-border">
                    <td className="p-3 font-medium align-top">
                      {jug.nombre} {jug.apellidos}
                      {!jug.email && (
                        <div className="text-xs text-destructive">
                          (sin email)
                        </div>
                      )}
                    </td>
                    <td className="p-3 align-top" colSpan={3}>
                      {puedeEditar ? (
                        <form
                          action={resultadoAction}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <select
                            name="resultado"
                            defaultValue={c.resultado ?? "pendiente"}
                            className={
                              "rounded-md px-2 py-1 text-xs " +
                              (resultadoColor[c.resultado ?? "pendiente"] ?? "")
                            }
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="apto">Apto</option>
                            <option value="no_apto">No apto</option>
                          </select>
                          <input
                            type="date"
                            name="fecha_realizado"
                            defaultValue={c.fecha_realizado ?? ""}
                            className="rounded-md border border-border bg-background p-1 text-xs"
                          />
                          <input
                            name="observaciones"
                            defaultValue={c.observaciones ?? ""}
                            placeholder="Observaciones"
                            className="flex-1 rounded-md border border-border bg-background p-1 text-xs"
                          />
                          <button
                            type="submit"
                            className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                          >
                            Guardar
                          </button>
                        </form>
                      ) : (
                        <span
                          className={
                            "rounded-md px-2 py-1 text-xs " +
                            (resultadoColor[c.resultado ?? "pendiente"] ?? "")
                          }
                        >
                          {c.resultado ?? "pendiente"}
                        </span>
                      )}
                    </td>
                    {puedeEditar && (
                      <td className="p-3 align-top">
                        <form action={quitarAction}>
                          <button
                            type="submit"
                            className="text-xs text-destructive hover:underline"
                          >
                            Quitar
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {puedeEditar && noCitadas.length > 0 && (
        <details className="mb-6 rounded-lg border border-border bg-card">
          <summary className="cursor-pointer p-4 text-sm font-medium text-primary">
            Añadir más jugadoras a esta convocatoria
          </summary>
          <div className="grid grid-cols-2 gap-2 p-4 pt-0 max-h-64 overflow-y-auto">
            {noCitadas.map((j) => {
              const citarAction = toggleCitar.bind(null, id, j.id, false)
              return (
                <form key={j.id} action={citarAction}>
                  <button
                    type="submit"
                    className="text-left text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    + {j.nombre} {j.apellidos}
                  </button>
                </form>
              )
            })}
          </div>
        </details>
      )}

      {puedeEditar && (
        <form action={enviarAction}>
          <FormSubmitButton>Enviar convocatoria médica por email</FormSubmitButton>
        </form>
      )}
    </div>
  )
}