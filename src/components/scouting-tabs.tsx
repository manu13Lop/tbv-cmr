"use client"

import Link from "next/link"
import { Users, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScoutingTabsProps {
  tabActiva: "jugadoras" | "rivales"
}

export function ScoutingTabs({ tabActiva }: ScoutingTabsProps) {
  const tabs = [
    { id: "jugadoras" as const, label: "Jugadoras", icon: Users, href: "/scouting?tab=jugadoras" },
    { id: "rivales" as const, label: "Equipos Rivales", icon: Shield, href: "/scouting?tab=rivales" },
  ]

  return (
    <div className="mb-6 flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tabActiva === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
