import Image from 'next/image';
import { getPermisosUsuario } from '@/lib/supabase-server';
import { getUsuarioActual } from '@/lib/auth-helpers';
import { SidebarNav } from '@/components/sidebar-nav';
import { SidebarWrapper } from '@/components/sidebar-wrapper';
import { LogoutButton } from '@/components/logout-button';
import { NotificationBell } from '@/components/notification-bell';
import { SearchGlobal } from '@/components/search-global';
import { getNotificacionesUsuario, getNotificacionesNoLeidas } from '@/lib/notifications';

export async function Sidebar() {
  const permisos = await getPermisosUsuario();
  const usuario = await getUsuarioActual();

  let notificaciones: Awaited<ReturnType<typeof getNotificacionesUsuario>> = [];
  let noLeidas = 0;

  if (usuario) {
    try {
      notificaciones = await getNotificacionesUsuario(usuario.id);
      noLeidas = await getNotificacionesNoLeidas(usuario.id);
    } catch {
      // notifications table may not exist yet
    }
  }

  const etiquetaUsuario = usuario ? `${usuario.nombreCompleto} — ${usuario.puesto}` : 'Usuario';

  return (
    <SidebarWrapper notificaciones={notificaciones} noLeidas={noLeidas}>
      <nav
        className="border-border bg-card flex h-screen w-64 flex-col border-r"
        aria-label="Navegación principal"
      >
        <div className="border-border flex items-center justify-between border-b p-4">
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
              <span className="text-primary text-sm font-bold">TBV</span>
              <span className="text-muted-foreground text-xs">Triana Balonmano Vivero</span>
            </div>
          </div>
          {usuario && <NotificationBell notificaciones={notificaciones} noLeidas={noLeidas} />}
        </div>

        <SidebarNav permisos={permisos} />

        <div className="px-3 pb-2">
          <SearchGlobal />
        </div>

        <div className="border-border mt-auto border-t p-3">
          <div className="border-border bg-background mb-3 rounded-lg border p-3">
            <p className="text-foreground text-sm font-medium">{etiquetaUsuario}</p>
          </div>

          <LogoutButton />
        </div>
      </nav>
    </SidebarWrapper>
  );
}
