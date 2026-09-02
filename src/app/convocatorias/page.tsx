import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Copy } from 'lucide-react';
import { ConvocatoriasView } from '@/components/convocatorias-view';
import { FilterBar, FilterOption } from '@/components/filter-bar';
import { SelectField } from '@/components/ui';
import { Suspense } from 'react';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('convocatorias');

async function duplicarEventos(formData: FormData) {
  'use server';
  const supabase = await createClient();

  const idsSeleccionados = formData.getAll('evento_id') as string[];
  const semanas = parseInt((formData.get('semanas') as string) || '1', 10);

  if (idsSeleccionados.length === 0) {
    redirect('/convocatorias?duplicado=vacio');
  }

  const { data: eventosOriginales } = await supabase
    .from('eventos')
    .select('*')
    .in('id', idsSeleccionados);

  if (!eventosOriginales || eventosOriginales.length === 0) {
    redirect('/convocatorias?duplicado=vacio');
  }

  const nuevosEventos: Record<string, unknown>[] = [];

  for (const ev of eventosOriginales) {
    const fechaBase = new Date(ev.fecha_hora);
    for (let s = 1; s <= semanas; s++) {
      const nuevaFecha = new Date(fechaBase);
      nuevaFecha.setDate(fechaBase.getDate() + s * 7);
      nuevosEventos.push({
        equipo_id: ev.equipo_id,
        tipo: ev.tipo,
        fecha_hora: nuevaFecha.toISOString(),
        lugar: ev.lugar,
        rival: ev.rival,
        observaciones: ev.observaciones,
      });
    }
  }

  const { data: eventosCreados, error } = await supabase
    .from('eventos')
    .insert(nuevosEventos)
    .select('id, equipo_id');

  if (error || !eventosCreados) {
    log.error({ err: error }, 'Error duplicating eventos');
    redirect('/convocatorias?duplicado=error');
  }

  for (const ev of eventosCreados) {
    const { data: jugadorasEquipo } = await supabase
      .from('jugadora_equipo_temporada')
      .select('jugadora_id')
      .eq('equipo_id', ev.equipo_id);

    if (jugadorasEquipo && jugadorasEquipo.length > 0) {
      await supabase.from('convocatorias').insert(
        jugadorasEquipo.map((je) => ({
          evento_id: ev.id,
          jugadora_id: je.jugadora_id,
          convocada: true,
        }))
      );
    }
  }

  redirect(`/convocatorias?duplicado=ok&n=${eventosCreados.length}`);
}

export default async function ConvocatoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicado?: string; n?: string; tipo?: string; equipo?: string }>;
}) {
  const { duplicado, n, tipo, equipo } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('eventos')
    .select(
      'id, tipo, fecha_hora, lugar, rival, equipo_id, equipos ( nombre, categoria, temporada )'
    )
    .order('fecha_hora', { ascending: false });

  if (tipo) {
    query = query.eq('tipo', tipo);
  }
  if (equipo) {
    query = query.eq('equipo_id', equipo);
  }

  const { data: eventos } = await query;

  // Equipos para filtro
  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre, categoria')
    .order('nombre');

  const filters: FilterOption[] = [
    {
      key: 'tipo',
      label: 'Tipo',
      options: [
        { value: 'entrenamiento', label: 'Entrenamiento' },
        { value: 'partido', label: 'Partido' },
        { value: 'concentracion', label: 'Concentración' },
        { value: 'otro', label: 'Otro' },
      ],
    },
    {
      key: 'equipo',
      label: 'Equipo',
      options: (equipos ?? []).map((e) => ({ value: e.id, label: `${e.nombre} (${e.categoria})` })),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">Convocatorias</h1>
          <p className="text-muted-foreground text-sm">
            {eventos?.length ?? 0} eventos registrados
          </p>
        </div>
        <Link href="/convocatorias/nueva">
          <Button>
            <Plus className="size-4" />
            Nuevo evento
          </Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {duplicado === 'ok' && (
        <div className="border-primary bg-primary/10 text-primary mb-4 rounded-md border p-3 text-sm">
          Se han creado {n} evento(s) duplicado(s) correctamente.
        </div>
      )}
      {duplicado === 'vacio' && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          Selecciona al menos un evento para duplicar.
        </div>
      )}
      {duplicado === 'error' && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          Ha ocurrido un error al duplicar los eventos.
        </div>
      )}

      {!eventos || eventos.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          Todavía no hay eventos registrados.
        </div>
      ) : (
        <>
          <form action={duplicarEventos} className="mb-6">
            <div className="border-border bg-card mb-3 flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <span className="text-sm font-medium">
                Duplicar eventos seleccionados, repitiendo cada
              </span>
              <SelectField
                label=""
                name="semanas"
                defaultValue="1"
                options={[
                  { value: '1', label: '1 semana' },
                  { value: '2', label: '2 semanas' },
                  { value: '3', label: '3 semanas' },
                  { value: '4', label: '4 semanas' },
                  { value: '8', label: '8 semanas' },
                  { value: '12', label: '12 semanas' },
                ]}
                className="w-auto"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs hover:opacity-90"
              >
                <Copy className="size-3.5" />
                Duplicar seleccionados
              </button>
            </div>

            <div className="border-border rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th scope="col" className="w-10 p-3"></th>
                      <th scope="col" className="p-3 text-left font-medium">
                        Fecha
                      </th>
                      <th scope="col" className="p-3 text-left font-medium">
                        Tipo
                      </th>
                      <th scope="col" className="p-3 text-left font-medium">
                        Equipo
                      </th>
                      <th scope="col" className="p-3 text-left font-medium">
                        Rival
                      </th>
                      <th scope="col" className="p-3 text-left font-medium">
                        Lugar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.map((e: Record<string, unknown>) => (
                      <tr key={e.id as string} className="border-border hover:bg-muted/50 border-t">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            name="evento_id"
                            value={e.id as string}
                            className="size-4"
                          />
                        </td>
                        <td className="p-3 font-medium">
                          <Link
                            href={`/convocatorias/${e.id as string}`}
                            className="hover:underline"
                          >
                            {new Date(e.fecha_hora as string).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Link>
                        </td>
                        <td className="p-3 capitalize">{e.tipo as string}</td>
                        <td className="p-3">
                          {e.equipos
                            ? `${(e.equipos as Record<string, unknown>).nombre} (${(e.equipos as Record<string, unknown>).categoria})`
                            : '-'}
                        </td>
                        <td className="p-3">{(e.rival as string) ?? '-'}</td>
                        <td className="p-3">{(e.lugar as string) ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </form>

          <div>
            <h2 className="text-foreground mb-3 text-lg font-semibold">Vista de calendario</h2>
            <ConvocatoriasView eventos={eventos} />
          </div>
        </>
      )}
    </div>
  );
}
