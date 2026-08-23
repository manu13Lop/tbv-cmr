import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/button"
import { Plus, ArrowLeft, Settings } from "lucide-react"
import { PaginationWrapper as Pagination } from "@/components/pagination-wrapper"
import { ExportCSVButton } from "@/components/export-csv-button"
import { ExportPDFButton } from "@/components/export-pdf-button"
import { formatDateForCSV } from "@/lib/export-csv"
import { ScoutingTabs } from "@/components/scouting-tabs"

const estadoColor: Record<string, string> = {
  seguimiento: "text-primary",
  fichada: "text-primary",
  descartada: "text-muted-foreground",
}

export default async function ScoutingPage({
  searchParams,
}: {
  searchParams: Promise<{
    nombre?: string
    posicion?: string
    estado?: string
    rival?: string
    temporada?: string
    edad_min?: string
    edad_max?: string
    page?: string
    tab?: string
  }>
}) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.leer")) {
    redirect("/")
  }
  const puedeEditar = tienePermiso(usuario.permisos, "scouting.editar")
  const filtros = await searchParams
  const tab = filtros.tab === "rivales" ? "rivales" : "jugadoras"

  const supabase = await createClient()

  const { data: fichas } = await supabase
    .from("scouting_fichas")
    .select(`
      id, nombre_externo, club_actual, posicion, fecha_nacimiento, estado,
      jugadoras ( id, nombre, apellidos ),
      scouting_informes ( id, fecha, rival, temporada, nota_global )
    `)
    .order("created_at", { ascending: false })

  const { data: rivales } = await supabase
    .from("scouting_rivales")
    .select("id, nombre, temporada, sistema_defensivo, sistema_ofensivo, puntos_fuertes, puntos_debiles")
    .order("created_at", { ascending: false })

  const hoy = new Date()
  const calcularEdad = (fechaNacimiento: string | null) => {
    if (!fechaNacimiento) return null
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    if (
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())
    ) {
      edad--
    }
    return edad
  }

  const fichasFiltradas = (fichas ?? []).filter((f: any) => {
    const nombre = f.jugadoras ? `${f.jugadoras.nombre} ${f.jugadoras.apellidos}` : f.nombre_externo
    const edad = calcularEdad(f.fecha_nacimiento)
    const informes = f.scouting_informes ?? []

    if (filtros.nombre && !nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) return false
    if (filtros.posicion && f.posicion !== filtros.posicion) return false
    if (filtros.estado && f.estado !== filtros.estado) return false
    if (filtros.edad_min && (edad === null || edad < Number(filtros.edad_min))) return false
    if (filtros.edad_max && (edad === null || edad > Number(filtros.edad_max))) return false
    if (filtros.rival && !informes.some((i: any) => i.rival?.toLowerCase().includes(filtros.rival!.toLowerCase()))) return false
    if (filtros.temporada && !informes.some((i: any) => i.temporada === filtros.temporada)) return false

    return true
  })

  const itemsPerPage = 15
  const totalPages = Math.ceil(fichasFiltradas.length / itemsPerPage)
  const currentPage = Math.max(1, Math.min(Number(filtros.page) || 1, totalPages || 1))
  const paginatedFichas = fichasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Scouting</h1>
          <p className="text-sm text-muted-foreground">{fichasFiltradas.length} jugadora(s) en seguimiento</p>
        </div>
        <div className="flex gap-2">
          <ExportCSVButton
            filename="scouting"
            headers={["Nombre", "Club Actual", "Posicion", "Fecha Nacimiento", "Estado", "Ultima Nota"]}
            rows={fichasFiltradas.map((f: any) => {
              const nombre = f.jugadoras ? `${f.jugadoras.nombre} ${f.jugadoras.apellidos}` : f.nombre_externo
              const informes = (f.scouting_informes ?? []).sort(
                (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              )
              return [
                nombre,
                f.club_actual ?? "",
                f.posicion ?? "",
                formatDateForCSV(f.fecha_nacimiento),
                f.estado,
                informes[0]?.nota_global ?? "",
              ]
            })}
          />
          <ExportPDFButton
            filename="scouting"
            title="Fichas de Scouting"
            columns={[
              { header: "Jugadora", key: "nombre" },
              { header: "Club Actual", key: "club" },
              { header: "Posición", key: "posicion" },
              { header: "Edad", key: "edad" },
              { header: "Informes", key: "informes" },
              { header: "Última Nota", key: "nota" },
              { header: "Estado", key: "estado" },
            ]}
            rows={fichasFiltradas.map((f: any) => {
              const nombre = f.jugadoras ? `${f.jugadoras.nombre} ${f.jugadoras.apellidos}` : f.nombre_externo
              const informes = (f.scouting_informes ?? []).sort(
                (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              )
              return {
                nombre,
                club: f.club_actual ?? "-",
                posicion: f.posicion ?? "-",
                edad: calcularEdad(f.fecha_nacimiento) ?? "-",
                informes: informes.length,
                nota: informes[0]?.nota_global ?? "-",
                estado: f.estado,
              }
            })}
          />
          {puedeEditar && (
            <Link href="/scouting/criterios">
              <Button variant="secondary">
                <Settings className="size-4" />
                Criterios
              </Button>
            </Link>
          )}
          {puedeEditar && (
            <Link href="/scouting/fichas/nueva">
              <Button>
                <Plus className="size-4" />
                Nueva ficha
              </Button>
            </Link>
          )}
        </div>
      </div>

      <ScoutingTabs tabActiva={tab} />

      {tab === "rivales" ? (
        <div>
          <div className="mb-4 flex justify-end">
            {puedeEditar && (
              <Link href="/scouting/rivales/nuevo">
                <Button>
                  <Plus className="size-4" />
                  Nuevo rival
                </Button>
              </Link>
            )}
          </div>

          {!rivales || rivales.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              No hay equipos rivales analizados todavía.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {rivales.map((r: any) => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-medium">{r.nombre}</h3>
                    <span className="text-xs text-muted-foreground">{r.temporada}</span>
                  </div>
                  {r.sistema_defensivo && (
                    <p className="text-xs"><span className="font-medium">Defensa:</span> {r.sistema_defensivo}</p>
                  )}
                  {r.sistema_ofensivo && (
                    <p className="text-xs"><span className="font-medium">Ataque:</span> {r.sistema_ofensivo}</p>
                  )}
                  {r.puntos_fuertes && (
                    <p className="mt-1 text-xs text-primary line-clamp-2"><span className="font-medium">Fuertes:</span> {r.puntos_fuertes}</p>
                  )}
                  {r.puntos_debiles && (
                    <p className="text-xs text-destructive line-clamp-2"><span className="font-medium">Débiles:</span> {r.puntos_debiles}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <form className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium">Nombre</label>
              <input name="nombre" defaultValue={filtros.nombre ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Posición</label>
              <input name="posicion" defaultValue={filtros.posicion ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Estado</label>
              <select name="estado" defaultValue={filtros.estado ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm">
                <option value="">Todos</option>
                <option value="seguimiento">En seguimiento</option>
                <option value="fichada">Fichada</option>
                <option value="descartada">Descartada</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Rival visto</label>
              <input name="rival" defaultValue={filtros.rival ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Temporada</label>
              <input name="temporada" defaultValue={filtros.temporada ?? ""} placeholder="2025-2026" className="w-full rounded-md border border-border bg-background p-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Edad mínima</label>
              <input type="number" name="edad_min" defaultValue={filtros.edad_min ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Edad máxima</label>
              <input type="number" name="edad_max" defaultValue={filtros.edad_max ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="secondary" className="w-full">Filtrar</Button>
            </div>
          </form>

          {fichasFiltradas.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              No hay fichas con esos filtros.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left font-medium">Jugadora</th>
                    <th className="p-3 text-left font-medium">Club actual</th>
                    <th className="p-3 text-left font-medium">Posición</th>
                    <th className="p-3 text-left font-medium">Edad</th>
                    <th className="p-3 text-left font-medium">Informes</th>
                    <th className="p-3 text-left font-medium">Última nota</th>
                    <th className="p-3 text-left font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFichas.map((f: any) => {
                    const nombre = f.jugadoras ? `${f.jugadoras.nombre} ${f.jugadoras.apellidos}` : f.nombre_externo
                    const informes = (f.scouting_informes ?? []).sort(
                      (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                    )
                    const edad = calcularEdad(f.fecha_nacimiento)

                    return (
                      <tr key={f.id} className="border-t border-border hover:bg-muted/50">
                        <td className="p-3 font-medium">
                          <Link href={`/scouting/fichas/${f.id}`} className="hover:underline">{nombre}</Link>
                        </td>
                        <td className="p-3">{f.club_actual ?? "-"}</td>
                        <td className="p-3">{f.posicion ?? "-"}</td>
                        <td className="p-3">{edad ?? "-"}</td>
                        <td className="p-3">{informes.length}</td>
                        <td className="p-3">{informes[0]?.nota_global ?? "-"}</td>
                        <td className="p-3">
                          <span className={estadoColor[f.estado] ?? ""}>{f.estado}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </>
      )}
    </div>
  )
}