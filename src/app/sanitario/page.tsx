import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { HeartPulse, Brain, ArrowLeft } from "lucide-react"

export default async function SanitarioPage() {
  const usuario = await getUsuarioActual()

  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.leer")) {
    redirect("/")
  }

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
    </div>
  )
}