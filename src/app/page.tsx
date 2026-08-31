import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';
import { getUsuarioActual } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import {
  Users,
  Dumbbell,
  HeartPulse,
  ClipboardList,
  GraduationCap,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default async function Home() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect('/login');

  const admin = createAdminClient();

  const now = new Date().toISOString();

  const [
    { data: proximosEventos },
    { count: totalJugadoras },
    { count: totalEntrenadores },
    { count: totalEjercicios },
    { data: lesionesActivas },
    { count: totalConvocatorias },
    { count: totalCursos },
  ] = await Promise.all([
    admin
      .from('eventos')
      .select('id, tipo, fecha_hora, lugar, rival, equipos(nombre)')
      .gte('fecha_hora', now)
      .order('fecha_hora', { ascending: true })
      .limit(5),
    admin.from('jugadoras').select('*', { count: 'exact', head: true }),
    admin.from('entrenadores').select('*', { count: 'exact', head: true }),
    admin.from('ejercicios').select('*', { count: 'exact', head: true }),
    admin
      .from('lesiones')
      .select('id, jugadora_id, tipo, gravedad, fecha_lesion, jugadoras(nombre, apellidos)')
      .is('fecha_fin', null)
      .order('fecha_lesion', { ascending: false })
      .limit(5),
    admin.from('convocatorias').select('*', { count: 'exact', head: true }),
    admin.from('formacion_cursos').select('*', { count: 'exact', head: true }),
  ]);

  const kpis = [
    {
      label: 'Jugadoras',
      value: totalJugadoras ?? 0,
      icon: Users,
      href: '/jugadoras',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Entrenadores',
      value: totalEntrenadores ?? 0,
      icon: GraduationCap,
      href: '/entrenadores',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      label: 'Ejercicios',
      value: totalEjercicios ?? 0,
      icon: Dumbbell,
      href: '/ejercicios',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      label: 'Convocatorias',
      value: totalConvocatorias ?? 0,
      icon: ClipboardList,
      href: '/convocatorias',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      label: 'Cursos formación',
      value: totalCursos ?? 0,
      icon: GraduationCap,
      href: '/formacion',
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950',
    },
  ];

  const tipoLabels: Record<string, string> = {
    entrenamiento: 'Entrenamiento',
    partido: 'Partido',
    concentracion: 'Concentración',
    otro: 'Otro',
  };

  const tipoColors: Record<string, string> = {
    entrenamiento: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    partido: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    concentracion: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    otro: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Hola, {usuario.nombreCompleto.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm">Panel de control del club</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="border-border bg-card hover:bg-muted/50 rounded-lg border p-4 transition-colors"
            >
              <div className={`mb-2 inline-flex rounded-lg p-2 ${kpi.bg}`}>
                <Icon className={`size-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-muted-foreground text-xs">{kpi.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border-border bg-card rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Próximos eventos</h2>
            <Link
              href="/convocatorias"
              className="text-primary flex items-center gap-1 text-xs hover:underline"
            >
              Ver todos <ArrowRight className="size-3" />
            </Link>
          </div>
          {proximosEventos && proximosEventos.length > 0 ? (
            <ul className="space-y-3">
              {proximosEventos.map((ev) => {
                const fecha = new Date(ev.fecha_hora);
                const equipo = ev.equipos as unknown as { nombre: string } | null;
                return (
                  <li key={ev.id}>
                    <Link
                      href={`/convocatorias/${ev.id}`}
                      className="border-border hover:bg-muted/50 flex items-center gap-3 rounded-md border p-3 transition-colors"
                    >
                      <div className="bg-muted flex size-10 shrink-0 flex-col items-center justify-center rounded-lg text-center">
                        <span className="text-[10px] leading-tight font-bold uppercase">
                          {fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${tipoColors[ev.tipo] ?? tipoColors.otro}`}
                          >
                            {tipoLabels[ev.tipo] ?? ev.tipo}
                          </span>
                          {equipo && (
                            <span className="text-muted-foreground text-xs">{equipo.nombre}</span>
                          )}
                        </div>
                        <p className="truncate text-sm font-medium">
                          {ev.rival ? `vs ${ev.rival}` : ev.lugar || 'Sin detalle'}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {fecha.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {ev.lugar && ev.rival ? ` — ${ev.lugar}` : ''}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No hay próximos eventos programados
            </p>
          )}
        </div>

        <div className="border-border bg-card rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Lesiones activas</h2>
            <Link
              href="/sanitario"
              className="text-primary flex items-center gap-1 text-xs hover:underline"
            >
              Ver todas <ArrowRight className="size-3" />
            </Link>
          </div>
          {lesionesActivas && lesionesActivas.length > 0 ? (
            <ul className="space-y-3">
              {lesionesActivas.map((lesion) => {
                const jug = lesion.jugadoras as unknown as {
                  nombre: string;
                  apellidos: string;
                } | null;
                const gravedadColor: Record<string, string> = {
                  leve: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                  moderada: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
                  grave: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                };
                return (
                  <li
                    key={lesion.id}
                    className="border-border flex items-center gap-3 rounded-md border p-3"
                  >
                    <AlertTriangle className="size-4 shrink-0 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {jug ? `${jug.nombre} ${jug.apellidos}` : 'Jugadora'}
                      </p>
                      <p className="text-muted-foreground text-xs">{lesion.tipo}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${gravedadColor[lesion.gravedad] ?? gravedadColor.leve}`}
                    >
                      {lesion.gravedad}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <HeartPulse className="text-muted-foreground mx-auto mb-2 size-8" />
              <p className="text-muted-foreground text-sm">No hay lesiones activas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
