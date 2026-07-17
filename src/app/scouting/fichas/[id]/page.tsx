import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/button"
import { ArrowLeft, Plus } from "lucide-react"

async function actualizarFicha(id: string, formData: FormData) {
  "use server"
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.editar")) return

  const supabase = await createClient()
  await supabase
    .from("scouting_fichas")
    .update({
      estado: formData.get("estado") as string,
      club_actual: formData.get("club_actual") as string,
      notas_generales: formData.get("notas_generales") as string,
    })
    .eq("id", id)

  redirect(`/scouting/fichas/${id}`)
}

export default async function FichaScoutingDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "scouting.leer")) {
    redirect("/")
  }
  const puedeEditar = tienePermiso(usuario.permisos, "scouting.editar")

  const supabase = await createClient()

  const { data: ficha } = await supabase
    .from("scouting_fichas")
    .select("*, jugadoras ( nombre, apellidos )")
    .eq("id", id)
    .single()

  if (!ficha) notFound()

  const { data: informes } = await supabase
    .from("scouting_informes")
    .select("id, fecha, rival, temporada, nota_global")
    .eq("ficha_id", id)
    .order("fecha", { ascending: false })

  const nombre = ficha.jugadoras ? `${ficha.jugadoras.nombre} ${ficha.jugadoras.apellidos}` : ficha.nombre_externo
  const updateAction = actualizarFicha.bind(null, id)

  return (
    <div className="p-6">
      <Link href="/scouting" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver a scouting
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {ficha.posicion ?? "Sin posición"} — {ficha.club_actual ?? "Club desconocido"}
          </p>
        </div>
        {puedeEditar && (
          <Link href={`/scouting/fichas/${id}/informes/nuevo`}>
            <Button>
              <Plus className="size-4" />
              Nuevo informe
            </Button>
          </Link>
        )}
      </div>

      <h2 className="mb-3 text-lg font-bold text-primary">Evolución cronológica</h2>

      {!informes || informes.length === 0 ? (
        <div className="mb-8 rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          Todavía no hay informes registrados para esta jugadora.
        </div>
      ) : (
        <div className="mb-8 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Fecha</th>
                <th className="p-3 text-left font-medium">Rival</th>
                <th className="p-3 text-left font-medium">Temporada</th>
                <th className="p-3 text-left font-medium">Nota global</th>
              </tr>
            </thead>
            <tbody>
              {informes.map((i) => (
                <tr key={i.id} className="border-t border-border hover:bg-muted/50">
                  <td className="p-3 font-medium">
                    <Link href={`/scouting/informes/${i.id}`} className="hover:underline">
                      {new Date(i.fecha).toLocaleDateString("es-ES")}
                    </Link>
                  </td>
                  <td className="p-3">{i.rival ?? "-"}</td>
                  <td className="p-3">{i.temporada}</td>
                  <td className="p-3">{i.nota_global ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {puedeEditar && (
        <form action={updateAction} className="max-w-lg space-y-4 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Editar ficha</p>
          <div>
            <label className="mb-1 block text-sm font-medium">Estado</label>
            <select name="estado" defaultValue={ficha.estado} className="w-full rounded-md border border-border bg-background p-2 text-sm">
              <option value="seguimiento">En seguimiento</option>
              <option value="fichada">Fichada</option>
              <option value="descartada">Descartada</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Club actual</label>
            <input name="club_actual" defaultValue={ficha.club_actual ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Notas generales</label>
            <textarea name="notas_generales" rows={3} defaultValue={ficha.notas_generales ?? ""} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </div>
          <Button type="submit">Guardar cambios</Button>
        </form>
      )}
    </div>
  )
}