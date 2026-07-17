import { createClient } from "@/lib/supabase-server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/button"
import { Plus, Copy } from "lucide-react"
import { ConvocatoriasView } from "@/components/convocatorias-view"
import { FilterBar, FilterOption } from "@/components/filter-bar"
import { Suspense } from "react"

async function duplicarEventos(formData: FormData) {
  "use server"
  const supabase = await createClient()

  const idsSeleccionados = formData.getAll("evento_id") as string[]
  const semanas = parseInt((formData.get("semanas") as string) || "1", 10)

  if (idsSeleccionados.length === 0) {
    redirect("/convocatorias?duplicado=vacio")
  }

  const { data: eventosOriginales } = await supabase
    .from("eventos")
    .select("*")
    .in("id", idsSeleccionados)

  if (!eventosOriginales || eventosOriginales.length === 0) {
    redirect("/convocatorias?duplicado=vacio")
  }

  const nuevosEventos: any[] = []

  for (const ev of eventosOriginales) {
    const fechaBase = new Date(ev.fecha_hora)
    for (let s = 1; s <= semanas; s++) {
      const nuevaFecha = new Date(fechaBase)
      nuevaFecha.setDate(fechaBase.getDate() + s * 7)
      nuevosEventos.push({
        equipo_id: ev.equipo_id,
        tipo: ev.tipo,
        fecha_hora: nuevaFecha.toISOString(),
        lugar: ev.lugar,
        rival: ev.rival,
        observaciones: ev.observaciones,
      })
    }
  }

  const { data: eventosCreados, error } = await supabase
    .from("eventos")
    .insert(nuevosEventos)
    .select("id, equipo_id")

  if (error || !eventosCreados) {
    console.error(error)
    redirect("/convocatorias?duplicado=error")
  }

  for (const ev of eventosCreados) {
    const { data: jugadorasEquipo } = await supabase
      .from("jugadora_equipo_temporada")
      .select("jugadora_id")
      .eq("equipo_id", ev.equipo_id)

    if (jugadorasEquipo && jugadorasEquipo.length > 0) {
      await supabase.from("convocatorias").insert(
        jugadorasEquipo.map((je) => ({
          evento_id: ev.id,
          jugadora_id: je.jugadora_id,
          convocada: true,
        }))
      )
    }
  }

  redirect(`/convocatorias?duplicado=ok&n=${eventosCreados.length}`)
}

export default async function ConvocatoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicado?: string; n?: string; tipo?: string; equipo?: string }>
}) {
  const { duplicado, n, tipo, equipo } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("eventos")
    .select(
      "id, tipo, fecha_hora, lugar, rival, temporada, equipo_id, equipos ( nombre, categoria )"
    )
    .order("fecha_hora", { ascending: false })

  if (tipo) {
    query = query.eq("tipo", tipo)
  }
  if (equipo) {
    query = query.eq("equipo_id", equipo)
  }

  const { data: eventos } = await query

  // Equipos para filtro
  const { data: equipos } = await supabase.from("equipos").select("id, nombre, categoria").order("nombre")

  const filters: FilterOption[] = [
    {
      key: "tipo",
      label: "Tipo",
      options: [
        { value: "entrenamiento", label: "Entrenamiento" },
        { value: "partido", label: "Partido" },
        { value: "concentracion", label: "Concentración" },
        { value: "otro", label: "Otro" },
      ],
    },
    {
      key: "equipo",
      label: "Equipo",
      options: (equipos ?? []).map((e) => ({ value: e.id, label: `${e.nombre} (${e.categoria})` })),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Convocatorias</h1>
          <p className="text-sm text-muted-foreground">
            {eventos?.length ?? 0} eventos registrados
          </p>
        </div>
        <Link href="/convocatorias/nueva">
          <Button>
            <Plus className="size-4" />
            Nuevo evento
          </Button>
        </Link>
      </div>

      <Suspense>
        <FilterBar filters={filters} />
      </Suspense>

      {duplicado === "ok" && (
        <div className="mb-4 rounded-md border border-primary bg-primary/10 p-3 text-sm text-primary">
          Se han creado {n} evento(s) duplicado(s) correctamente.
        </div>
      )}
      {duplicado === "vacio" && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          Selecciona al menos un evento para duplicar.
        </div>
      )}
      {duplicado === "error" && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          Ha ocurrido un error al duplicar los eventos.
        </div>
      )}

      {!eventos || eventos.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Todavía no hay eventos registrados.
        </div>
      ) : (
        <>
          <form action={duplicarEventos} className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
              <span className="text-sm font-medium">
                Duplicar eventos seleccionados, repitiendo cada
              </span>
              <select
                name="semanas"
                defaultValue="1"
                className="rounded-md border border-border bg-background p-1.5 text-sm"
              >
                <option value="1">1 semana</option>
                <option value="2">2 semanas</option>
                <option value="3">3 semanas</option>
                <option value="4">4 semanas</option>
                <option value="8">8 semanas</option>
                <option value="12">12 semanas</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90"
              >
                <Copy className="size-3.5" />
                Duplicar seleccionados
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="w-10 p-3"></th>
                    <th className="p-3 text-left font-medium">Fecha</th>
                    <th className="p-3 text-left font-medium">Tipo</th>
                    <th className="p-3 text-left font-medium">Equipo</th>
                    <th className="p-3 text-left font-medium">Rival</th>
                    <th className="p-3 text-left font-medium">Lugar</th>
                  </tr>
                </thead>
                <tbody>
                  {eventos.map((e: any) => (
                    <tr key={e.id} className="border-t border-border hover:bg-muted/50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          name="evento_id"
                          value={e.id}
                          className="size-4"
                        />
                      </td>
                      <td className="p-3 font-medium">
                        <Link href={`/convocatorias/${e.id}`} className="hover:underline">
                          {new Date(e.fecha_hora).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Link>
                      </td>
                      <td className="p-3 capitalize">{e.tipo}</td>
                      <td className="p-3">
                        {e.equipos ? `${e.equipos.nombre} (${e.equipos.categoria})` : "-"}
                      </td>
                      <td className="p-3">{e.rival ?? "-"}</td>
                      <td className="p-3">{e.lugar ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </form>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Vista de calendario</h2>
            <ConvocatoriasView eventos={eventos} />
          </div>
        </>
      )}
    </div>
  )
}