import { CheckCircle } from "lucide-react"
import { confirmarLecturaAction } from "@/app/mensajes/actions"

export default async function ConfirmarLecturaPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  await confirmarLecturaAction(token)

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle className="mx-auto mb-4 size-12 text-primary" />
        <h1 className="mb-2 text-xl font-bold text-primary">
          Lectura confirmada
        </h1>
        <p className="text-sm text-muted-foreground">
          Gracias, hemos registrado que has leído este mensaje del club.
        </p>
      </div>
    </div>
  )
}