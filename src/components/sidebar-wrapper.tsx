'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notification-bell';

type Notificacion = {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  enlace: string | null;
  leida: boolean;
  created_at: string;
};

export function SidebarWrapper({
  children,
  notificaciones,
  noLeidas,
}: {
  children: React.ReactNode;
  notificaciones?: Notificacion[];
  noLeidas?: number;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar sidebar al cambiar de ruta
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (pathname === '/login') return null;
  if (pathname.startsWith('/socios/inscribirme')) return null;
  if (pathname.startsWith('/socios/verificar-email')) return null;
  if (pathname.startsWith('/socios/consentir')) return null;

  return (
    <>
      {/* Botón hamburguesa + notificaciones - visible solo en móvil/tablet */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'border-border bg-card flex items-center gap-2 rounded-lg border p-2 shadow-md',
            'hover:bg-muted transition-colors'
          )}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <img src="/logo.jpg" alt="TBV" className="h-7 w-7 rounded-full object-cover" />
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <NotificationBell notificaciones={notificaciones ?? []} noLeidas={noLeidas ?? 0} />
      </div>

      {/* Overlay oscuro en móvil cuando el sidebar está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - en móvil es fixed/overlay, en desktop fluye con el documento */}
      <div
        className={cn(
          // Móvil: fixed overlay
          'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {children}
      </div>
    </>
  );
}
