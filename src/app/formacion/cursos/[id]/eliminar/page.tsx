import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react"
import { logCambio } from "@/lib/audit"

async function eliminarCurso(cursoId: string, formData: FormData) {
  "use server"
  const usuario = await getUsuarioActual()
  if (!usuario || (!tienePermiso(usuario.permisos, "formacion.editar") && !usuario.esMaster)) return

  const confirmado = formData.get("confirmar") === "on"
  if (!confirmado) return

  const supabase = await createClient()

  const { data: curso, error: fetchError } = await supabase
    .from("formacion_cursos")
    .select("titulo")
    .eq("id", cursoId)
    .single()

  if (fetchError || !curso) notFound()

  await logCambio("formacion_cursos", cursoId, "eliminar", { titulo: curso.titulo }, null)

  await supabase
    .from("formacion_cursos")
    .delete()
    .eq("id", cursoId)

  redirect("/formacion")
}

export default async function EliminarCursoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const usuario = await getUsuarioActual()
  if (!usuario || (!tienePermiso(usuario.permisos, "formacion.editar") && !usuario.esMaster)) {
    redirect("/formacion")
  }

  const supabase = await createClient()

  const { data: curso } = await supabase
    .from("formacion_cursos")
    .select("titulo, categoria, descripcion")
    .eq("id", id)
    .single()

  if (!curso) notFound()

  return (
    <div className="p-6">
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Inicio</Link>
        <span>/</span>
        <Link href="/formacion" className="hover:text-foreground">Formación</Link>
        <span>/</span>
        <span className="text-foreground">Eliminar curso</span>
      </nav>

      <div className="mb-6">
        <Link
          href={`/formacion/cursos/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver al curso
        </Link>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-destructive bg-destructive/5 p-6">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="size-6 text-destructive" />
          <h1 className="text-xl font-bold text-destructive">¿Eliminar curso?</h1>
        </div>

        <div className="mb-6 rounded-md border border-border bg-card p-4">
          <h2 className="font-medium text-foreground">{curso.titulo}</h2>
          <p className="text-sm text-muted-foreground">{curso.descripcion}</p>
        </div>

        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <p>⚠️ Esta acción es irreversible. Se eliminarán:</p>
          <ul className="mt-1 list-disc list-inside">
            <li>El curso y todas sus lecciones</li>
            <li>Los quizzes asociados</li>
            <li>El progreso de todos los usuarios</li>
            <li>Los certificados asociados</li>
          </ul>
        </div>

        <form action={eliminarCurso.bind(null, id)} className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-md border border-transparent bg-clip-padding px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Trash2 className="mr-2 size-4" />
            Confirmar eliminación
          </button>
          <input type="checkbox" name="confirmar" value="on" required className="sr-only" />
        </form>
      </div>
    </div>
  )
}
