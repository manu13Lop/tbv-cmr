import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/button"

export default async function PsicologiaPage() {
  const usuario = await getUsuarioActual()

  if (!usuario || !tienePermiso(usuario.permisos, "sanitario.leer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: sesiones } = await supabase
    .from("psicologia_sesiones")
    .select(`
      id,
      tipo_sesion,
      fecha_hora,
      tema,
      estado,
      jugadoras ( id, nombre, apellidos ),
      equipos ( id, nombre )
    `)
    .order("fecha_hora", { ascending: false })

  return (
    <div className="p-6">
      <Link
        href="/sanitario"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a sanitario
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Psicología deportiva</h1>
          <p className="text-sm text-muted-foreground">
            {sesiones?.length ?? 0} sesión(es) registradas
          </p>
        </div>

        {tienePermiso(usuario.permisos, "sanitario.editar") && (
          <Link href="/sanitario/psicologia/nueva">
            <Button>
              <Plus className="size-4" />
              Nueva sesión
            </Button>
          </Link>
        )}
      </div>

      {!sesiones || sesiones.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Todavía no hay sesiones de psicología registradas.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Tipo</th>
                <th className="p-3 text-left font-medium">Destino</th>
                <th className="p-3 text-left font-medium">Tema</th>
                <th className="p-3 text-left font-medium">Fecha</th>
                <th className="p-3 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s: any) => {
                const destino =
                  s.tipo_sesion === "individual"
                    ? `${s.jugadoras?.nombre ?? ""} ${s.jugadoras?.apellidos ?? ""}`.trim()
                    : s.equipos?.nombre ?? "Equipo"

                return (
                  <tr key={s.id} className="border-t border-border hover:bg-muted/50">
                    <td className="p-3 capitalize">{s.tipo_sesion}</td>
                    <td className="p-3 font-medium">
                      <Link
                        href={`/sanitario/psicologia/${s.id}`}
                        className="hover:underline"
                      >
                        {destino}
                      </Link>
                    </td>
                    <td className="p-3">{s.tema}</td>
                    <td className="p-3">
                      {new Date(s.fecha_hora).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 capitalize text-muted-foreground">
                      {s.estado}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}