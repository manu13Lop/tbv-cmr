"use client"

import { useState } from "react"
import Link from "next/link"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarView } from "@/components/calendar-view"

interface Evento {
  id: string
  tipo: string
  fecha_hora: string
  lugar: string | null
  rival: string | null
  temporada: string | null
  equipos: { nombre: string; categoria: string }[] | { nombre: string; categoria: string } | null
}

interface ConvocatoriasViewProps {
  eventos: Evento[]
}

function getEquipo(equipo: Evento["equipos"]): { nombre: string; categoria: string } | null {
  if (!equipo) return null
  return Array.isArray(equipo) ? (equipo[0] ?? null) : equipo
}

export function ConvocatoriasView({ eventos }: ConvocatoriasViewProps) {
  const [view, setView] = useState<"table" | "calendar">("table")

  const calendarEvents = eventos.map((e) => ({
    id: e.id,
    fecha_hora: e.fecha_hora,
    tipo: e.tipo,
    lugar: e.lugar,
    rival: e.rival,
    equipo_nombre: getEquipo(e.equipos)?.nombre ?? null,
  }))

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setView("table")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === "table"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <List className="size-4" />
          Lista
        </button>
        <button
          onClick={() => setView("calendar")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === "calendar"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <LayoutGrid className="size-4" />
          Calendario
        </button>
      </div>

      {view === "calendar" ? (
        <CalendarView events={calendarEvents} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Fecha</th>
                  <th className="p-3 text-left font-medium">Tipo</th>
                  <th className="p-3 text-left font-medium">Equipo</th>
                  <th className="p-3 text-left font-medium">Rival</th>
                  <th className="p-3 text-left font-medium">Lugar</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/50">
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
                      {(() => { const eq = getEquipo(e.equipos); return eq ? `${eq.nombre} (${eq.categoria})` : "-" })()}
                    </td>
                    <td className="p-3">{e.rival ?? "-"}</td>
                    <td className="p-3">{e.lugar ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
