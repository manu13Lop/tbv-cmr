"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Shield,
  ClipboardList,
  Search,
  Truck,
  HeartPulse,
  MessageSquare,
  UserCog,
  ClipboardCheck,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard, permiso: null },
  { href: "/jugadoras", label: "Jugadoras", icon: Users, permiso: "jugadoras.leer" },
  { href: "/equipos", label: "Equipos", icon: Shield, permiso: "equipos.leer" },
  { href: "/convocatorias", label: "Convocatorias", icon: ClipboardList, permiso: "jugadoras.leer" },
  { href: "/entrenadores", label: "Entrenadores", icon: ClipboardCheck, permiso: "equipos.leer" },
  { href: "/sanitario", label: "Sanitario", icon: HeartPulse, permiso: "sanitario.leer" },
  { href: "/scouting", label: "Scouting", icon: Search, permiso: "scouting.leer" },
  { href: "/logistica", label: "Logística", icon: Truck, permiso: "logistica.leer" },
  { href: "/usuarios", label: "Usuarios", icon: UserCog, permiso: "usuarios.gestionar" },
  { href: "/mensajes", label: "Mensajes", icon: MessageSquare, permiso: "mensajes.enviar" },
]

export function SidebarNav({ permisos }: { permisos: string[] }) {
  const pathname = usePathname()

  const items = navItems.filter(
    (item) => item.permiso === null || permisos.includes(item.permiso)
  )

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}