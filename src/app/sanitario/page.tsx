import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { HeartPulse, Brain, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { GraficaEvolucion } from "@/components/sanitario/grafica-evolucion"

export default async function SanitarioPage() {
  const usuario = await getUsuarioActual()

  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.leer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: lesiones } = await supabase
    .from("lesiones")
    .select("id, fecha_lesion, fecha_alta, gravedad, tipo, estado")
    .order("fecha_lesion", { ascending: false })

  return (
    <div className="p-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Sanitario</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona el área de trabajo
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/sanitario/fisioterapia"
          className="rounded-xl border border-border bg-card p-5 hover:bg-muted/40 transition-colors"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <HeartPulse className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-primary">
              Fisioterapia y medicina deportiva
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Lesiones, seguimientos, altas médicas y reconocimientos.
          </p>
        </Link>

        <Link
          href="/sanitario/psicologia"
          className="rounded-xl border border-border bg-card p-5 hover:bg-muted/40 transition-colors"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Brain className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-primary">
              Psicología deportiva
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Sesiones individuales y grupales, objetivos, desarrollo y acuerdos.
          </p>
        </Link>
      </div>

      {/* Gráfica de evolución de lesiones */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold text-primary">Evolución de lesiones</h2>
        <GraficaEvolucion lesiones={lesiones ?? []} />
      </div>
    </div>
  )
}