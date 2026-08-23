import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/button';

export default async function PsicologiaPage() {
  const usuario = await getUsuarioActual();

  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.leer')) {
    redirect('/');
  }

  const supabase = await createClient();

  const { data: sesiones } = await supabase
    .from('psicologia_sesiones')
    .select(
      `
      id,
      tipo_sesion,
      fecha_hora,
      tema,
      estado,
      jugadoras ( id, nombre, apellidos ),
      equipos ( id, nombre )
    `
    )
    .order('fecha_hora', { ascending: false });

  return (
    <div className="p-6">
      <Link
        href="/sanitario"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a sanitario
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">Psicología deportiva</h1>
          <p className="text-muted-foreground text-sm">
            {sesiones?.length ?? 0} sesión(es) registradas
          </p>
        </div>

        {tienePermiso(usuario.permisos, 'sanitario.editar') && (
          <Link href="/sanitario/psicologia/nueva">
            <Button>
              <Plus className="size-4" />
              Nueva sesión
            </Button>
          </Link>
        )}
      </div>

      {!sesiones || sesiones.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          Todavía no hay sesiones de psicología registradas.
        </div>
      ) : (
        <div className="border-border rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Tipo</th>
                  <th className="p-3 text-left font-medium">Destino</th>
                  <th className="p-3 text-left font-medium">Tema</th>
                  <th className="p-3 text-left font-medium">Fecha</th>
                  <th className="p-3 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((s: Record<string, unknown>) => {
                  const destino =
                    s.tipo_sesion === 'individual'
                      ? `${(s.jugadoras as Record<string, unknown>)?.nombre ?? ''} ${(s.jugadoras as Record<string, unknown>)?.apellidos ?? ''}`.trim()
                      : ((s.equipos as Record<string, unknown>)?.nombre ?? 'Equipo');

                  return (
                    <tr key={s.id as string} className="border-border hover:bg-muted/50 border-t">
                      <td className="p-3 capitalize">{s.tipo_sesion as string}</td>
                      <td className="p-3 font-medium">
                        <Link
                          href={`/sanitario/psicologia/${s.id as string}`}
                          className="hover:underline"
                        >
                          {destino as string}
                        </Link>
                      </td>
                      <td className="p-3">{s.tema as string}</td>
                      <td className="p-3">
                        {new Date(s.fecha_hora as string).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="text-muted-foreground p-3 capitalize">{s.estado as string}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
