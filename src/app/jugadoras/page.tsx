import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/button"
import { Plus, ArrowLeft } from "lucide-react"
import { ExportCSVButton } from "@/components/export-csv-button"
import { ExportPDFButton } from "@/components/export-pdf-button"
import { formatDateForCSV } from "@/lib/export-csv"
import { PaginationWrapper as Pagination } from "@/components/pagination-wrapper"

const ITEMS_PER_PAGE = 15

export default async function JugadorasPage({
  searchParams,
}: {
  searchParams: Promise<{
    nombre?: string
    equipo?: string
    categoria?: string
    temporada?: string
    posicion?: string
    estado?: string
    rec_medico?: string
    page?: string
  }>
}) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "jugadoras.leer")) {
    redirect("/")
  }
  const puedeEditar = tienePermiso(usuario.permisos, "jugadoras.editar")
  const filtros = await searchParams

  const supabase = await createClient()
  const currentPage = Math.max(1, Number(filtros.page) || 1)
  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  let query = supabase
    .from("jugadoras")
    .select(
      `
        id, nombre, apellidos, fecha_nacimiento, email, codigo_interno, activa, reconocimiento_medico_estado,
        jugadora_equipo_temporada (
          dorsal, posicion, temporada, equipo_id,
          equipos ( nombre, categoria )
        )
      `,
      { count: "exact" }
    )
    .order("apellidos", { ascending: true })
    .range(from, to)

  if (filtros.nombre) {
    query = query.ilike("nombre", `%${filtros.nombre}%`)
    query = query.or(`nombre.ilike.%${filtros.nombre}%,apellidos.ilike.%${filtros.nombre}%`)
  }

  if (filtros.equipo) {
    query = query.eq("jugadora_equipo_temporada.equipo_id", filtros.equipo)
  }

  if (filtros.categoria) {
    query = query.eq("jugadora_equipo_temporada.equipos.categoria", filtros.categoria)
  }

  if (filtros.temporada) {
    query = query.eq("jugadora_equipo_temporada.temporada", filtros.temporada)
  }

  if (filtros.posicion) {
    query = query.eq("jugadora_equipo_temporada.posicion", filtros.posicion)
  }

  if (filtros.estado === "activa") {
    query = query.eq("activa", true)
  } else if (filtros.estado === "inactiva") {
    query = query.eq("activa", false)
  }

  if (filtros.rec_medico) {
    query = query.eq("reconocimiento_medico_estado", filtros.rec_medico)
  }

  const { data: jugadoras, count, error } = await query

  if (error) {
    console.error("Error fetching jugadoras:", error)
  }

  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE)
  const jugadorasData = jugadoras ?? []

  const { data: equipos } = await supabase.from("equipos").select("id, nombre, categoria").order("nombre")
  const categorias = [...new Set((equipos ?? []).map((e) => e.categoria).filter(Boolean))]

  return (
    <div className="p-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Jugadoras</h1>
          <p className="text-sm text-muted-foreground">{(count ?? 0)} jugadora(s)</p>
        </div>
        <div className="flex gap-2">
          <ExportCSVButton
            filename="jugadoras"
            headers={["Nombre", "Apellidos", "Fecha Nacimiento", "Email", "Codigo Interno", "Equipo(s)", "Posicion", "Estado Medico", "Activa"]}
            rows={jugadorasData.map((j: any) => {
              const vinculo = j.jugadora_equipo_temporada?.[0]
              const equipo = vinculo?.equipos ? `${vinculo.equipos.nombre} (${vinculo.equipos.categoria})` : ""
              return [
                j.nombre,
                j.apellidos,
                formatDateForCSV(j.fecha_nacimiento),
                j.email ?? "",
                j.codigo_interno ?? "",
                equipo,
                vinculo?.posicion ?? "",
                j.reconocimiento_medico_estado ?? "pendiente",
                j.activa ? "Si" : "No",
              ]
            })}
          />
          <ExportPDFButton
            filename="jugadoras"
            title="Listado de Jugadoras"
            columns={[
              { header: "Nombre", key: "nombre" },
              { header: "Apellidos", key: "apellidos" },
              { header: "F. Nacimiento", key: "fecha_nacimiento" },
              { header: "Email", key: "email" },
              { header: "Equipo", key: "equipo" },
              { header: "Posición", key: "posicion" },
              { header: "Rec. Médico", key: "rec_medico" },
              { header: "Estado", key: "estado" },
            ]}
            rows={jugadorasData.map((j: any) => {
              const vinculo = j.jugadora_equipo_temporada?.[0]
              const equipo = vinculo?.equipos ? `${vinculo.equipos.nombre} (${vinculo.equipos.categoria})` : "-"
              return {
                nombre: j.nombre,
                apellidos: j.apellidos,
                fecha_nacimiento: formatDateForCSV(j.fecha_nacimiento),
                email: j.email ?? "-",
                equipo,
                posicion: vinculo?.posicion ?? "-",
                rec_medico: j.reconocimiento_medico_estado ?? "pendiente",
                estado: j.activa ? "Activa" : "Inactiva",
              }
            })}
          />
          {puedeEditar && (
            <Link href="/jugadoras/nueva">
              <Button><Plus className="size-4" />Nueva jugadora</Button>
            </Link>
          )}
        </div>
      </div>

      <form className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium">Nombre</label>
          <input name="nombre" defaultValue={filtros.nombre ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Equipo</label>
          <select name="equipo" defaultValue={filtros.equipo ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm">
            <option value="">Todos</option>
            {equipos?.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Categoría</label>
          <select name="categoria" defaultValue={filtros.categoria ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm">
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Temporada</label>
          <input name="temporada" defaultValue={filtros.temporada ?? ""} placeholder="2025-2026" className="w-full rounded-md border border-border bg-background p-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Posición</label>
          <select name="posicion" defaultValue={filtros.posicion ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm">
            <option value="">Todas</option>
            <option value="Portera">Portera</option>
            <option value="Lateral izquierdo">Lateral izquierdo</option>
            <option value="Lateral derecho">Lateral derecho</option>
            <option value="Central">Central</option>
            <option value="Extremo izquierdo">Extremo izquierdo</option>
            <option value="Extremo derecho">Extremo derecho</option>
            <option value="Pivote">Pivote</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Estado</label>
          <select name="estado" defaultValue={filtros.estado ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm">
            <option value="">Todas</option>
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Rec. médico</label>
          <select name="rec_medico" defaultValue={filtros.rec_medico ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm">
            <option value="">Todos</option>
            <option value="apto">Apto</option>
            <option value="no_apto">No apto</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" className="w-full">Filtrar</Button>
        </div>
      </form>

      {jugadorasData.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No hay jugadoras con esos filtros.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Nombre</th>
                <th className="p-3 text-left font-medium">Equipo</th>
                <th className="p-3 text-left font-medium">Dorsal</th>
                <th className="p-3 text-left font-medium">Posición</th>
                <th className="p-3 text-left font-medium">Rec. médico</th>
                <th className="p-3 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {jugadorasData.map((j: any) => {
                const vinculo = j.jugadora_equipo_temporada?.[0]
                return (
                  <tr key={j.id} className="border-t border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">
                      <Link href={`/jugadoras/${j.id}`} className="hover:underline">{j.nombre} {j.apellidos}</Link>
                    </td>
                    <td className="p-3">{vinculo?.equipos ? `${vinculo.equipos.nombre} (${vinculo.equipos.categoria})` : "-"}</td>
                    <td className="p-3">{vinculo?.dorsal ?? "-"}</td>
                    <td className="p-3">{vinculo?.posicion ?? "-"}</td>
                    <td className="p-3">
                      <span className={j.reconocimiento_medico_estado === "apto" ? "text-primary" : "text-destructive"}>
                        {j.reconocimiento_medico_estado ?? "pendiente"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={j.activa ? "text-primary" : "text-muted-foreground"}>{j.activa ? "Activa" : "Inactiva"}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}