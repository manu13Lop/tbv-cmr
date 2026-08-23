import type { Metadata } from "next"
import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { HelpCircle, BarChart } from "lucide-react"
import { getCategoriaLabel, getCategoriaColor } from "@/lib/formacion"

export const metadata: Metadata = {
  title: "Quizzes - TBV Formación",
}

export default async function QuizzesPage({}) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.leer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: quizzes } = await supabase
    .from("formacion_quizzes")
    .select(`
      id, titulo, categoria, activo,
      formacion_quiz_preguntas!inner(id)
    `)
    .eq("activo", true)
    .order("created_at", { ascending: false })

  const { data: resultados } = await supabase
    .from("formacion_quiz_resultados")
    .select("quiz_id, puntuacion, completado_at")
    .eq("usuario_id", usuario.id)
    .order("completado_at", { ascending: false })

  const resultadosMap = new Map((resultados ?? []).map((r) => [r.quiz_id, r]))

  return (
    <div className="p-6">
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">🏠 Inicio</Link>
        <span>/</span>
        <Link href="/formacion" className="hover:text-foreground">Formación</Link>
        <span>/</span>
        <span className="text-foreground">Quizzes</span>
      </nav>

      <div className="mb-6">
        <Link
          href="/formacion"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a Formación
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-primary flex items-center gap-2">
        <HelpCircle className="size-6" />
        Quizzes de conocimientos
      </h1>

      {!quizzes || quizzes.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No hay quizzes disponibles.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const resultado = resultadosMap.get(quiz.id)
            return (
              <Link
                key={quiz.id}
                href={`/formacion/quizzes/${quiz.id}`}
                className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{quiz.titulo}</h3>
                    <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${getCategoriaColor(quiz.categoria)}`}>
                      {getCategoriaLabel(quiz.categoria)}
                    </span>
                  </div>
                  {resultado && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{resultado.puntuacion}%</div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(resultado.completado_at).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
