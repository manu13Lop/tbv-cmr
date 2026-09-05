'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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
  GraduationCap,
  History,
  Dumbbell,
  UserCircle,
  Contact,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permiso: string | null;
};

const sections: { label?: string; items: NavItem[] }[] = [
  { items: [{ href: '/', label: 'Inicio', icon: LayoutDashboard, permiso: null }] },
  {
    label: 'Gestión',
    items: [
      { href: '/jugadoras', label: 'Jugadoras', icon: Users, permiso: 'jugadoras.leer' },
      { href: '/equipos', label: 'Equipos', icon: Shield, permiso: 'equipos.leer' },
      {
        href: '/convocatorias',
        label: 'Convocatorias',
        icon: ClipboardList,
        permiso: 'jugadoras.leer',
      },
      {
        href: '/entrenadores',
        label: 'Entrenadores',
        icon: ClipboardCheck,
        permiso: 'equipos.leer',
      },
      { href: '/ejercicios', label: 'Ejercicios', icon: Dumbbell, permiso: null },
    ],
  },
  {
    label: 'Deportivo',
    items: [
      { href: '/sanitario', label: 'Sanitario', icon: HeartPulse, permiso: 'sanitario.leer' },
      { href: '/scouting', label: 'Scouting', icon: Search, permiso: 'scouting.leer' },
      { href: '/logistica', label: 'Logística', icon: Truck, permiso: 'logistica.leer' },
      { href: '/formacion', label: 'Formación', icon: GraduationCap, permiso: null },
    ],
  },
  {
    label: 'Administración',
    items: [{ href: '/socios', label: 'Socios', icon: Contact, permiso: 'socios.leer' }],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/usuarios', label: 'Usuarios', icon: UserCog, permiso: 'usuarios.gestionar' },
      { href: '/mensajes', label: 'Mensajes', icon: MessageSquare, permiso: 'mensajes.leer' },
      { href: '/auditoria', label: 'Auditoría', icon: History, permiso: null },
    ],
  },
  {
    items: [{ href: '/perfil', label: 'Mi perfil', icon: UserCircle, permiso: null }],
  },
];

export function SidebarNav({ permisos }: { permisos: string[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-4 p-3">
      {sections.map((section, si) => {
        const visible = section.items.filter(
          (item) => item.permiso === null || permisos.includes(item.permiso)
        );
        if (visible.length === 0) return null;
        return (
          <div key={si}>
            {section.label && (
              <p className="text-muted-foreground/60 mb-1 px-3 text-xs font-semibold tracking-wider uppercase">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {visible.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
