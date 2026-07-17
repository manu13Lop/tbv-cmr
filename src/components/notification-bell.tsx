"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  marcarComoLeida,
  marcarTodasComoLeidas,
} from "@/lib/notifications-actions"
import Link from "next/link"

type Notificacion = {
  id: string
  tipo: string
  titulo: string
  descripcion: string | null
  enlace: string | null
  leida: boolean
  created_at: string
}

const tipoIcon: Record<string, string> = {
  convocatoria: "\u{1F4C5}",
  lesion: "\u{1F3E5}",
  mensaje: "\u{2709}\u{FE0F}",
  reconocimiento: "\u{1FA7A}",
  general: "\u{2139}\u{FE0F}",
}

export function NotificationBell({
  notificaciones,
  noLeidas,
}: {
  notificaciones: Notificacion[]
  noLeidas: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifs, setNotifs] = useState(notificaciones)
  const [count, setCount] = useState(noLeidas)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
    setCount((prev) => Math.max(0, prev - 1))
    await marcarComoLeida(id)
  }

  const handleMarkAllAsRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })))
    setCount(0)
    await marcarTodasComoLeidas()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border p-3">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {count > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="size-3" />
                Marcar todo leído
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Sin notificaciones
              </p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 border-b border-border p-3 transition-colors hover:bg-muted/50",
                    !n.leida && "bg-primary/5"
                  )}
                >
                  <span className="mt-0.5 text-lg">
                    {tipoIcon[n.tipo] || "\u{2139}\u{FE0F}"}
                  </span>
                  <div className="flex-1 min-w-0">
                    {n.enlace ? (
                      <Link
                        href={n.enlace}
                        onClick={() => {
                          handleMarkAsRead(n.id)
                          setIsOpen(false)
                        }}
                        className="block"
                      >
                        <p className="text-sm font-medium text-foreground hover:underline">
                          {n.titulo}
                        </p>
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {n.titulo}
                      </p>
                    )}
                    {n.descripcion && (
                      <p className="text-xs text-muted-foreground truncate">
                        {n.descripcion}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString("es-ES")}
                    </p>
                  </div>
                  {!n.leida && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="mt-1 rounded p-1 text-muted-foreground hover:bg-muted"
                      title="Marcar como leída"
                    >
                      <Check className="size-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
