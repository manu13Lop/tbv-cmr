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
import { InputField, SelectField } from '@/components/ui';

const ITEMS_PER_PAGE = 15;

export default async function JugadorasPage({
  searchParams,
}: {
  searchParams: Promise<{
    nombre?: string;
    equipo?: string;
    categoria?: string;
    temporada?: string;
    posicion?: string;
    estado?: string;
    rec_medico?: string;
    page?: string;
  }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'jugadoras.leer')) {
    redirect('/');
  }
  const puedeEditar = tienePermiso(usuario.permisos, 'jugadoras.editar');
  const filtros = await searchParams;

  const supabase = await createClient();
  const currentPage = Math.max(1, Number(filtros.page) || 1);
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from('jugadoras')
    .select(
      `
        id, nombre, apellidos, fecha_nacimiento, email, codigo_interno, activa, reconocimiento_medico_estado,
        jugadora_equipo_temporada (
          dorsal, posicion, temporada, equipo_id,
          equipos ( nombre, categoria )
        )
      `,
      { count: 'exact' }
    )
    .order('apellidos', { ascending: true })
    .range(from, to);

  if (filtros.nombre) {
    query = query.ilike('nombre', `%${filtros.nombre}%`);
    query = query.or(`nombre.ilike.%${filtros.nombre}%,apellidos.ilike.%${filtros.nombre}%`);
  }

  if (filtros.equipo) {
    query = query.eq('jugadora_equipo_temporada.equipo_id', filtros.equipo);
  }

  if (filtros.categoria) {
    query = query.eq('jugadora_equipo_temporada.equipos.categoria', filtros.categoria);
  }

  if (filtros.temporada) {
    query = query.eq('jugadora_equipo_temporada.temporada', filtros.temporada);
  }

  if (filtros.posicion) {
    query = query.eq('jugadora_equipo_temporada.posicion', filtros.posicion);
  }

  if (filtros.estado === 'activa') {
    query = query.eq('activa', true);
  } else if (filtros.estado === 'inactiva') {
    query = query.eq('activa', false);
  }

  if (filtros.rec_medico) {
    query = query.eq('reconocimiento_medico_estado', filtros.rec_medico);
  }

  const { data: jugadoras, count, error } = await query;

  if (error) {
    console.error('Error fetching jugadoras:', error);
  }

  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE);
  const jugadorasData = jugadoras ?? [];

  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre, categoria')
    .order('nombre');
  const categorias = [...new Set((equipos ?? []).map((e) => e.categoria).filter(Boolean))];

  return (
    <div className="p-6">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">Jugadoras</h1>
          <p className="text-muted-foreground text-sm">{count ?? 0} jugadora(s)</p>
        </div>
        <div className="flex gap-2">
          <ExportCSVButton
            filename="jugadoras"
            headers={[
              'Nombre',
              'Apellidos',
              'Fecha Nacimiento',
              'Email',
              'Codigo Interno',
              'Equipo(s)',
              'Posicion',
              'Estado Medico',
              'Activa',
            ]}
            rows={jugadorasData.map((j: Record<string, unknown>) => {
              const vinculo = (
                j.jugadora_equipo_temporada as unknown as Record<string, unknown>[]
              )?.[0];
              const equipo = vinculo?.equipos
                ? `${(vinculo.equipos as unknown as Record<string, unknown>).nombre} (${(vinculo.equipos as unknown as Record<string, unknown>).categoria})`
                : '';
              return [
                j.nombre as string,
                j.apellidos as string,
                formatDateForCSV(j.fecha_nacimiento as string),
                (j.email as string) ?? '',
                (j.codigo_interno as string) ?? '',
                equipo,
                (vinculo?.posicion as string) ?? '',
                (j.reconocimiento_medico_estado as string) ?? 'pendiente',
                j.activa ? 'Si' : 'No',
              ];
            })}
          />
          <ExportPDFButton
            filename="jugadoras"
            title="Listado de Jugadoras"
            columns={[
              { header: 'Nombre', key: 'nombre' },
              { header: 'Apellidos', key: 'apellidos' },
              { header: 'F. Nacimiento', key: 'fecha_nacimiento' },
              { header: 'Email', key: 'email' },
              { header: 'Equipo', key: 'equipo' },
              { header: 'Posición', key: 'posicion' },
              { header: 'Rec. Médico', key: 'rec_medico' },
              { header: 'Estado', key: 'estado' },
            ]}
            rows={jugadorasData.map((j: Record<string, unknown>) => {
              const vinculo = (
                j.jugadora_equipo_temporada as unknown as Record<string, unknown>[]
              )?.[0];
              const equipo = vinculo?.equipos
                ? `${(vinculo.equipos as unknown as Record<string, unknown>).nombre} (${(vinculo.equipos as unknown as Record<string, unknown>).categoria})`
                : '-';
              return {
                nombre: j.nombre as string | number | null,
                apellidos: j.apellidos as string | number | null,
                fecha_nacimiento: formatDateForCSV(j.fecha_nacimiento as string),
                email: (j.email as string) ?? '-',
                equipo,
                posicion: (vinculo?.posicion as string) ?? '-',
                rec_medico: (j.reconocimiento_medico_estado as string) ?? 'pendiente',
                estado: j.activa ? 'Activa' : 'Inactiva',
              };
            })}
          />
          {puedeEditar && (
            <Link href="/jugadoras/nueva">
              <Button>
                <Plus className="size-4" />
                Nueva jugadora
              </Button>
            </Link>
          )}
        </div>
      </div>

      <form className="border-border bg-card mb-6 grid grid-cols-2 gap-3 rounded-lg border p-4 md:grid-cols-4">
        <InputField label="Nombre" name="nombre" defaultValue={filtros.nombre ?? ''} />
        <SelectField
          label="Equipo"
          name="equipo"
          defaultValue={filtros.equipo ?? ''}
          options={[
            { value: '', label: 'Todos' },
            ...(equipos ?? []).map((e) => ({ value: e.id, label: e.nombre })),
          ]}
        />
        <SelectField
          label="Categoría"
          name="categoria"
          defaultValue={filtros.categoria ?? ''}
          options={[
            { value: '', label: 'Todas' },
            ...categorias.map((c) => ({ value: c, label: c })),
          ]}
        />
        <InputField
          label="Temporada"
          name="temporada"
          defaultValue={filtros.temporada ?? ''}
          placeholder="2025-2026"
        />
        <SelectField
          label="Posición"
          name="posicion"
          defaultValue={filtros.posicion ?? ''}
          options={[
            { value: '', label: 'Todas' },
            { value: 'Portera', label: 'Portera' },
            { value: 'Lateral izquierdo', label: 'Lateral izquierdo' },
            { value: 'Lateral derecho', label: 'Lateral derecho' },
            { value: 'Central', label: 'Central' },
            { value: 'Extremo izquierdo', label: 'Extremo izquierdo' },
            { value: 'Extremo derecho', label: 'Extremo derecho' },
            { value: 'Pivote', label: 'Pivote' },
          ]}
        />
        <SelectField
          label="Estado"
          name="estado"
          defaultValue={filtros.estado ?? ''}
          options={[
            { value: '', label: 'Todas' },
            { value: 'activa', label: 'Activa' },
            { value: 'inactiva', label: 'Inactiva' },
          ]}
        />
        <SelectField
          label="Rec. médico"
          name="rec_medico"
          defaultValue={filtros.rec_medico ?? ''}
          options={[
            { value: '', label: 'Todos' },
            { value: 'apto', label: 'Apto' },
            { value: 'no_apto', label: 'No apto' },
            { value: 'pendiente', label: 'Pendiente' },
          ]}
        />
        <div className="flex items-end">
          <Button type="submit" variant="secondary" className="w-full">
            Filtrar
          </Button>
        </div>
      </form>

      {jugadorasData.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          No hay jugadoras con esos filtros.
        </div>
      ) : (
        <div className="border-border rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Nombre</th>
                  <th className="p-3 text-left font-medium">Equipo</th>
                  <th className="p-3 text-left font-medium">Dorsal</th>
                  <th className="p-3 text-left font-medium">Posición</th>
                  <th className="p-3 text-left font-medium">Rec. médico</th>
                  <th className="p-3 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {jugadorasData.map((j: Record<string, unknown>) => {
                  const vinculo = (
                    j.jugadora_equipo_temporada as unknown as Record<string, unknown>[]
                  )?.[0];
                  return (
                    <tr key={j.id as string} className="border-border hover:bg-muted/50 border-t">
                      <td className="p-3 font-medium">
                        <Link href={`/jugadoras/${j.id as string}`} className="hover:underline">
                          {j.nombre as string} {j.apellidos as string}
                        </Link>
                      </td>
                      <td className="p-3">
                        {vinculo?.equipos
                          ? `${(vinculo.equipos as unknown as Record<string, unknown>).nombre} (${(vinculo.equipos as unknown as Record<string, unknown>).categoria})`
                          : '-'}
                      </td>
                      <td className="p-3">{(vinculo?.dorsal as string) ?? '-'}</td>
                      <td className="p-3">{(vinculo?.posicion as string) ?? '-'}</td>
                      <td className="p-3">
                        <span
                          className={
                            (j.reconocimiento_medico_estado as string) === 'apto'
                              ? 'text-primary'
                              : 'text-destructive'
                          }
                        >
                          {(j.reconocimiento_medico_estado as string) ?? 'pendiente'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={j.activa ? 'text-primary' : 'text-muted-foreground'}>
                          {j.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
