'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const labelMap: Record<string, string> = {
  '': 'Inicio',
  jugadoras: 'Jugadoras',
  equipos: 'Equipos',
  convocatorias: 'Convocatorias',
  entrenadores: 'Entrenadores',
  sanitario: 'Sanitario',
  scouting: 'Scouting',
  logistica: 'Logística',
  formacion: 'Formación',
  auditoria: 'Auditoría',
  permisos: 'Permisos',
  usuarios: 'Usuarios',
  mensajes: 'Mensajes',
  nuevo: 'Nuevo',
  nueva: 'Nueva',
  ejercicios: 'Ejercicios',
  lesiones: 'Lesiones',
  psicologia: 'Psicología',
  reconocimientos: 'Reconocimientos',
  fisioterapia: 'Fisioterapia',
  fichas: 'Fichas',
  informes: 'Informes',
  criterios: 'Criterios',
  articulos: 'Artículos',
  movimientos: 'Movimientos',
  'stock-bajo': 'Stock bajo',
  confirmar: 'Confirmar',
  setup: 'Setup',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;
  if (pathname.startsWith('/socios/inscribirme')) return null;
  if (pathname.startsWith('/socios/verificar-email')) return null;
  if (pathname.startsWith('/socios/consentir')) return null;

  const items: { label: string; href: string }[] = [];
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Skip UUID-like segments (show as "Detalle")
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

    items.push({
      label: isUuid ? 'Detalle' : (labelMap[segment] ?? segment),
      href: currentPath,
    });
  }

  return (
    <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-xs">
      <Link href="/" className="hover:text-foreground flex items-center gap-1">
        <Home className="size-3" />
      </Link>
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-1">
          <ChevronRight className="size-3" />
          {i === items.length - 1 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
