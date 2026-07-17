import Image from "next/image"
import { getPermisosUsuario } from "@/lib/supabase-server"
import { getUsuarioActual } from "@/lib/auth-helpers"
import { SidebarNav } from "@/components/sidebar-nav"
import { SidebarWrapper } from "@/components/sidebar-wrapper"
import { LogoutButton } from "@/components/logout-button"
import { NotificationBell } from "@/components/notification-bell"
import { SearchGlobal } from "@/components/search-global"
import {
  getNotificacionesUsuario,
  getNotificacionesNoLeidas,
} from "@/lib/notifications"

export async function Sidebar() {
  const permisos = await getPermisosUsuario()
  const usuario = await getUsuarioActual()

  let notificaciones: Awaited<ReturnType<typeof getNotificacionesUsuario>> = []
  let noLeidas = 0

  if (usuario) {
    try {
      notificaciones = await getNotificacionesUsuario(usuario.id)
      noLeidas = await getNotificacionesNoLeidas(usuario.id)
    } catch {
      // notifications table may not exist yet
    }
  }

  const etiquetaUsuario = usuario
    ? `${usuario.nombreCompleto} — ${usuario.puesto}`
    : "Usuario"

  return (
    <SidebarWrapper notificaciones={notificaciones} noLeidas={noLeidas}>
      <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="TBV"
              width={36}
              height={36}
              unoptimized
              className="rounded-full"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary">TBV</span>
              <span className="text-xs text-muted-foreground">
                Triana Balonmano Vivero
              </span>
            </div>
          </div>
          {usuario && (
            <NotificationBell
              notificaciones={notificaciones}
              noLeidas={noLeidas}
            />
          )}
        </div>

        <SidebarNav permisos={permisos} />

        <div className="px-3 pb-2">
          <SearchGlobal />
        </div>

        <div className="mt-auto border-t border-border p-3">
          <div className="mb-3 rounded-lg border border-border bg-background p-3">
            <p className="text-sm font-medium text-foreground">
              {etiquetaUsuario}
            </p>
          </div>

          <LogoutButton />
        </div>
      </aside>
    </SidebarWrapper>
  )
}