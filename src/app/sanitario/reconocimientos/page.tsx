import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Plus, ArrowLeft } from 'lucide-react';

export default async function ReconocimientosPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.leer')) {
    redirect('/');
  }
  const puedeEditar = tienePermiso(usuario.permisos, 'sanitario.editar');

  const supabase = await createClient();

  const { data: convocatorias } = await supabase
    .from('reconocimientos_medicos_convocatoria')
    .select('id, temporada, fecha_hora, lugar, convocatoria_enviada')
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
          <h1 className="text-primary text-2xl font-bold">Reconocimientos médicos</h1>
          <p className="text-muted-foreground text-sm">
            {convocatorias?.length ?? 0} convocatoria(s) de temporada
          </p>
        </div>
        {puedeEditar && (
          <Link href="/sanitario/reconocimientos/nueva">
            <Button>
              <Plus className="size-4" />
              Nueva convocatoria
            </Button>
          </Link>
        )}
      </div>

      {!convocatorias || convocatorias.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          Todavía no hay convocatorias de reconocimiento médico.
        </div>
      ) : (
        <div className="border-border rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Temporada</th>
                  <th className="p-3 text-left font-medium">Fecha</th>
                  <th className="p-3 text-left font-medium">Lugar</th>
                  <th className="p-3 text-left font-medium">Convocatoria enviada</th>
                </tr>
              </thead>
              <tbody>
                {convocatorias.map((c) => (
                  <tr key={c.id} className="border-border hover:bg-muted/50 border-t">
                    <td className="p-3 font-medium">
                      <Link href={`/sanitario/reconocimientos/${c.id}`} className="hover:underline">
                        {c.temporada}
                      </Link>
                    </td>
                    <td className="p-3">
                      {new Date(c.fecha_hora).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3">{c.lugar ?? '-'}</td>
                    <td className="p-3">
                      <span
                        className={
                          c.convocatoria_enviada ? 'text-primary' : 'text-muted-foreground'
                        }
                      >
                        {c.convocatoria_enviada ? 'Sí' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
