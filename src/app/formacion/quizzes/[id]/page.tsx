import type { Metadata } from "next"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle } from "lucide-react"
import { getCategoriaLabel, getCategoriaColor } from "@/lib/formacion"

export const metadata: Metadata = {
  title: "Quiz - TBV Formación",
}

async function guardarResultado(quizId: string, formData: FormData) {
  "use server"
  const usuario = await getUsuarioActual()
  if (!usuario) return

  const supabase = await createClient()

  const { data: quiz } = await supabase
    .from("formacion_quizzes")
    .select("id")
    .eq("id", quizId)
    .eq("activo", true)
    .single()

  if (!quiz) redirect("/formacion")

  const preguntasRaw = formData.get("preguntas") as string
  if (!preguntasRaw) redirect(`/formacion/quizzes/${quizId}`)

  const preguntas = JSON.parse(preguntasRaw) as Array<{
    id: string
    respuesta_correcta: string
  }>

  const respuestas: Record<string, string> = {}
  let correctas = 0

  for (const p of preguntas) {
    const respuesta = formData.get(`pregunta_${p.id}`) as string
    respuestas[p.id] = respuesta ?? ""
    if (respuesta === p.respuesta_correcta) correctas++
  }

  const totalPreguntas = preguntas.length
  const puntuacion = totalPreguntas > 0 ? Math.round((correctas / totalPreguntas) * 100) : 0

  await supabase.from("formacion_quiz_resultados").insert({
    quiz_id: quizId,
    usuario_id: usuario.id,
    puntuacion,
    respuestas,
  })

  redirect(`/formacion/quizzes/${quizId}?resultado=${puntuacion}`)
}

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ resultado?: string; curso?: string }>
}) {
  const { id } = await params
  const { resultado, curso } = await searchParams

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.leer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: quiz } = await supabase
    .from("formacion_quizzes")
    .select("id, titulo, categoria, curso_id, activo")
    .eq("id", id)
    .eq("activo", true)
    .single()

  if (!quiz) notFound()

  const { data: preguntas } = await supabase
    .from("formacion_quiz_preguntas")
    .select("id, enunciado, opciones, respuesta_correcta, orden")
    .eq("quiz_id", id)
    .order("orden")

  const { data: resultadoAnterior } = await supabase
    .from("formacion_quiz_resultados")
    .select("puntuacion, completado_at")
    .eq("quiz_id", id)
    .eq("usuario_id", usuario.id)
    .order("completado_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (typeof resultado === "string") {
    const pct = Number(resultado)
    const passed = pct >= 80

    return (
      <div className="p-6">
        <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Inicio</Link>
          <span>/</span>
          <Link href="/formacion" className="hover:text-foreground">Formación</Link>
          <span>/</span>
          <span className="text-foreground">Resultado</span>
        </nav>

        <div className="mb-6">
          <Link
            href={curso ? `/formacion/cursos/${curso}` : `/formacion/quizzes/${quiz.id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver
          </Link>
        </div>

        <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
          <div className="mb-4">
            {passed ? (
              <CheckCircle className="mx-auto size-12 text-green-500" />
            ) : (
              <XCircle className="mx-auto size-12 text-red-500" />
            )}
          </div>
          <h1 className="mb-4 text-2xl font-bold text-primary">Resultado</h1>
          <p className="mb-2 text-sm text-muted-foreground">{quiz.titulo}</p>
          <div className="mb-6 text-6xl font-bold text-primary">{pct}%</div>
          <p className="mb-6 text-sm text-muted-foreground">
            {passed
              ? "¡Excelente! Has aprobado el quiz."
              : pct >= 60
              ? "Has aprobado, pero puedes mejorar."
              : "No has alcanzado la puntuación mínima. Intenta de nuevo."}
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href={`/formacion/quizzes/${quiz.id}`}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/80"
            >
              Repetir quiz
            </Link>
            <Link
              href={curso ? `/formacion/cursos/${curso}` : "/formacion"}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              {curso ? "Volver al curso" : "Volver a Formación"}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Inicio</Link>
        <span>/</span>
        <Link href="/formacion" className="hover:text-foreground">Formación</Link>
        <span>/</span>
        <span className="text-foreground">Quiz</span>
      </nav>

      <div className="mb-6">
        <Link
          href={curso ? `/formacion/cursos/${curso}` : "/formacion/quizzes"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← {curso ? "Volver al curso" : "Volver a quizzes"}
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{quiz.titulo}</h1>
          <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${getCategoriaColor(quiz.categoria)}`}>
            {getCategoriaLabel(quiz.categoria)}
          </span>
        </div>
        {resultadoAnterior && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Último intento</p>
            <p className="text-lg font-bold text-primary">{resultadoAnterior.puntuacion}%</p>
          </div>
        )}
      </div>

      {!preguntas || preguntas.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Este quiz no tiene preguntas todavía.
        </div>
      ) : (
        <form
          action={guardarResultado.bind(null, quiz.id)}
          className="space-y-6"
        >
          <input type="hidden" name="preguntas" value={JSON.stringify(preguntas)} />

          {preguntas.map((pregunta, idx) => {
            const opciones = pregunta.opciones as string[] | null
            return (
              <div key={pregunta.id} className="rounded-lg border border-border bg-card p-4">
                <p className="mb-3 text-sm font-medium">
                  <span className="text-primary">{idx + 1}.</span> {pregunta.enunciado}
                </p>
                {opciones && opciones.length > 0 ? (
                  <div className="space-y-2">
                    {opciones.map((opcion: string, optIdx: number) => (
                      <label
                        key={optIdx}
                        className="flex items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-muted/50"
                      >
                        <input
                          type="radio"
                          name={`pregunta_${pregunta.id}`}
                          value={opcion}
                          required
                          className="size-4"
                        />
                        {opcion}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    name={`pregunta_${pregunta.id}`}
                    placeholder="Tu respuesta"
                    required
                    className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                )}
              </div>
            )
          })}

          <button
            type="submit"
            className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 bg-primary text-primary-foreground hover:bg-primary/80 h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2"
          >
            Enviar respuestas
          </button>
        </form>
      )}
    </div>
  )
}
