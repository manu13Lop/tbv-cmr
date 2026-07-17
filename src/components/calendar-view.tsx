"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  id: string
  fecha_hora: string
  tipo: string
  lugar: string | null
  rival: string | null
  equipo_nombre: string | null
}

const tipoColors: Record<string, { bg: string; text: string; dot: string }> = {
  entrenamiento: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  partido: {
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  concentracion: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  otro: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

function getTipoColors(tipo: string) {
  return tipoColors[tipo] || tipoColors.otro
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function groupEventsByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const d = new Date(ev.fecha_hora)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  }
  return map
}

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const eventsByDay = groupEventsByDay(events)

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const cells: Array<{ day: number | null; key: string }> = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, key: `empty-${i}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `day-${d}` })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={prevMonth}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h2>
        <button
          onClick={nextMonth}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map(({ day, key }) => {
          if (day === null) {
            return <div key={key} className="min-h-[72px] border-b border-r border-border p-1 md:min-h-[96px]" />
          }

          const dateObj = new Date(currentYear, currentMonth, day)
          const isToday = isSameDay(dateObj, today)
          const dayKey = `${currentYear}-${currentMonth}-${day}`
          const dayEvents = eventsByDay.get(dayKey) || []

          return (
            <div
              key={key}
              className={cn(
                "min-h-[72px] border-b border-r border-border p-1 md:min-h-[96px]",
                day === daysInMonth && "border-r-0",
                Math.floor((firstDay + day - 1) / 7) === Math.floor((firstDay + daysInMonth - 1) / 7) && "border-b-0"
              )}
            >
              <div
                className={cn(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-primary text-primary-foreground",
                  !isToday && "text-muted-foreground"
                )}
              >
                {day}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => {
                  const colors = getTipoColors(ev.tipo)
                  return (
                    <Link
                      key={ev.id}
                      href={`/convocatorias/${ev.id}`}
                      className={cn(
                        "block rounded px-1 py-0.5 text-[10px] leading-tight font-medium truncate transition-opacity hover:opacity-80",
                        colors.bg,
                        colors.text
                      )}
                      title={`${ev.tipo} - ${ev.equipo_nombre ?? ""} ${ev.rival ? `vs ${ev.rival}` : ""}`}
                    >
                      <span className="hidden sm:inline">{ev.tipo}</span>
                      <span className={cn("sm:hidden inline-block size-1.5 rounded-full", colors.dot)} />
                    </Link>
                  )
                })}
                {dayEvents.length > 3 && (
                  <span className="block px-1 text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3} más
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
