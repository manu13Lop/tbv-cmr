import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { ExportCSVButton } from '@/components/export-csv-button';
import { ExportPDFButton } from '@/components/export-pdf-button';
import { formatDateForCSV } from '@/lib/export-csv';
import { PaginationWrapper as Pagination } from '@/components/pagination-wrapper';

interface Lesion {
  id: string;
  tipo: string;
  fecha_lesion: string;
  gravedad: string;
  estado: string;
  jugadoras: { nombre: string; apellidos: string } | null;
}

const gravedadColor: Record<string, string> = {
  leve: 'text-primary',
  moderada: 'text-yellow-600',
  grave: 'text-destructive',
};

export default async function FisioterapiaPage({
  searchParams,
}: {
  searchParams?: Promise<{ page_activas?: string; page_cerradas?: string }>;
}) {
  const usuario = await getUsuarioActual();

  if (!usuario || !tienePermiso(usuario.permisos, 'sanitario.leer')) {
    redirect('/');
  }

  const puedeEditar = tienePermiso(usuario.permisos, 'sanitario.editar');

  const supabase = await createClient();

  const { data: rawLesiones } = await supabase
    .from('lesiones')
    .select('id, tipo, fecha_lesion, gravedad, estado, jugadoras ( nombre, apellidos )')
    .order('fecha_lesion', { ascending: false });
  const lesiones = (rawLesiones ?? []) as unknown as Lesion[];

  const activas = lesiones.filter((l) => l.estado === 'activa');
  const cerradas = lesiones.filter((l) => l.estado !== 'activa');

  const params = (await searchParams) ?? {};
  const itemsPerPage = 15;

  const totalPaginasActivas = Math.ceil(activas.length / itemsPerPage);
  const paginaActivas = Math.max(
    1,
    Math.min(Number(params.page_activas) || 1, totalPaginasActivas || 1)
  );
  const paginatedActivas = activas.slice(
    (paginaActivas - 1) * itemsPerPage,
    paginaActivas * itemsPerPage
  );

  const totalPaginasCerradas = Math.ceil(cerradas.length / itemsPerPage);
  const paginaCerradas = Math.max(
    1,
    Math.min(Number(params.page_cerradas) || 1, totalPaginasCerradas || 1)
  );
  const paginatedCerradas = cerradas.slice(
    (paginaCerradas - 1) * itemsPerPage,
    paginaCerradas * itemsPerPage
  );

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
          <h1 className="text-primary text-2xl font-bold">Fisioterapia y medicina deportiva</h1>
          <p className="text-muted-foreground text-sm">
            {activas.length} lesión(es) activa(s) — {cerradas.length} cerrada(s)
          </p>
        </div>
        <div className="flex gap-2">
          <ExportCSVButton
            filename="lesiones"
            headers={['Jugadora', 'Tipo', 'Fecha', 'Gravedad', 'Estado']}
            rows={lesiones.map((l) => [
              `${l.jugadoras?.nombre ?? ''} ${l.jugadoras?.apellidos ?? ''}`.trim(),
              l.tipo,
              formatDateForCSV(l.fecha_lesion),
              l.gravedad ?? '',
              l.estado,
            ])}
          />
          <ExportPDFButton
            filename="lesiones"
            title="Informe de Lesiones"
            columns={[
              { header: 'Jugadora', key: 'jugadora' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Fecha', key: 'fecha' },
              { header: 'Gravedad', key: 'gravedad' },
              { header: 'Estado', key: 'estado' },
            ]}
            rows={lesiones.map((l) => ({
              jugadora: `${l.jugadoras?.nombre ?? ''} ${l.jugadoras?.apellidos ?? ''}`.trim(),
              tipo: l.tipo,
              fecha: formatDateForCSV(l.fecha_lesion),
              gravedad: l.gravedad ?? '-',
              estado: l.estado,
            }))}
          />
          <Link href="/sanitario/reconocimientos">
            <Button variant="secondary">Reconocimientos médicos</Button>
          </Link>
          {puedeEditar && (
            <Link href="/sanitario/lesiones/nueva">
              <Button>
                <Plus className="size-4" />
                Nueva lesión
              </Button>
            </Link>
          )}
        </div>
      </div>

      <h2 className="text-primary mb-3 text-lg font-bold">Lesiones activas</h2>
      {activas.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground mb-8 rounded-lg border p-6 text-center">
          No hay lesiones activas registradas.
        </div>
      ) : (
        <div className="border-border mb-8 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Jugadora</th>
                <th className="p-3 text-left font-medium">Tipo</th>
                <th className="p-3 text-left font-medium">Fecha</th>
                <th className="p-3 text-left font-medium">Gravedad</th>
              </tr>
            </thead>
            <tbody>
              {paginatedActivas.map((l) => (
                <tr key={l.id} className="border-border hover:bg-muted/50 border-t">
                  <td className="p-3 font-medium">
                    <Link href={`/sanitario/lesiones/${l.id}`} className="hover:underline">
                      {l.jugadoras?.nombre} {l.jugadoras?.apellidos}
                    </Link>
                  </td>
                  <td className="p-3">{l.tipo}</td>
                  <td className="p-3">{new Date(l.fecha_lesion).toLocaleDateString('es-ES')}</td>
                  <td className="p-3">
                    <span className={gravedadColor[l.gravedad] ?? ''}>{l.gravedad ?? '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={paginaActivas} totalPages={totalPaginasActivas} />

      <h2 className="text-primary mb-3 text-lg font-bold">Historial de lesiones</h2>
      {cerradas.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-6 text-center">
          No hay lesiones cerradas todavía.
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Jugadora</th>
                <th className="p-3 text-left font-medium">Tipo</th>
                <th className="p-3 text-left font-medium">Fecha</th>
                <th className="p-3 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCerradas.map((l) => (
                <tr key={l.id} className="border-border hover:bg-muted/50 border-t">
                  <td className="p-3 font-medium">
                    <Link href={`/sanitario/lesiones/${l.id}`} className="hover:underline">
                      {l.jugadoras?.nombre} {l.jugadoras?.apellidos}
                    </Link>
                  </td>
                  <td className="p-3">{l.tipo}</td>
                  <td className="p-3">{new Date(l.fecha_lesion).toLocaleDateString('es-ES')}</td>
                  <td className="text-muted-foreground p-3">{l.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={paginaCerradas} totalPages={totalPaginasCerradas} />
    </div>
  );
}
