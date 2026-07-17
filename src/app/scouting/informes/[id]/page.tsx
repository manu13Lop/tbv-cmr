import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function InformeScoutingDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.leer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: informe } = await supabase
    .from("scouting_informes")
    .select(`
      *,
      scouting_fichas (
        id,
        nombre_externo,
        posicion,
        club_actual,
        jugadoras ( nombre, apellidos )
      ),
      equipos ( nombre )
    `)
    .eq("id", id)
    .single()

  if (!informe) notFound()

  const { data: criterios } = await supabase
    .from("scouting_criterios")
    .select("*")
    .order("orden", { ascending: true })

  const ficha = informe.scouting_fichas
  const nombre = ficha?.jugadoras
    ? `${ficha.jugadoras.nombre} ${ficha.jugadoras.apellidos}`
    : ficha?.nombre_externo ?? "Jugadora"

  const valoraciones = (informe.valoraciones ?? {}) as Record<string, string>

  return (
    <div className="p-6">
      <Link
        href={ficha ? `/scouting/fichas/${ficha.id}` : "/scouting"}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a la ficha
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{nombre}</h1>
        <p className="text-sm text-muted-foreground">
          {ficha?.posicion ?? "Sin posición"}
          {ficha?.club_actual ? ` — ${ficha.club_actual}` : ""}
          {" — "}
          {new Date(informe.fecha).toLocaleDateString("es-ES")}
          {informe.rival ? ` — vs ${informe.rival}` : ""}
          {" — "}
          {informe.temporada}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {informe.nota_global && (
          <div className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Nota global: {informe.nota_global} / 5
          </div>
        )}
        {informe.equipos?.nombre && (
          <div className="rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground">
            Equipo propio: {informe.equipos.nombre}
          </div>
        )}
        {informe.minutos_jugados && (
          <div className="rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground">
            {informe.minutos_jugados} minutos jugados
          </div>
        )}
      </div>

      <h2 className="mb-3 text-lg font-bold text-primary">Valoración detallada</h2>

      {criterios && criterios.length > 0 ? (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {criterios.map((criterio) => {
            const valor = valoraciones[criterio.clave]
            if (!valor) return null

            return (
              <div
                key={criterio.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                <p className="text-xs text-muted-foreground">{criterio.etiqueta}</p>
                <p className="text-sm font-medium text-foreground">{valor}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          No hay valoraciones registradas en este informe.
        </p>
      )}

      {informe.observaciones && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="mb-1 text-sm font-medium">Observaciones</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {informe.observaciones}
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Registrado por {informe.autor_nombre_snapshot} ({informe.autor_puesto_snapshot}) el{" "}
        {new Date(informe.created_at).toLocaleDateString("es-ES")}
      </p>
    </div>
  )
}