'use client';

type Lesion = {
  id: string;
  fecha_lesion: string;
  fecha_alta: string | null;
  gravedad: string | null;
  tipo: string;
  estado: string;
};

const gravedadColors: Record<string, string> = {
  leve: '#22c55e',
  moderada: '#eab308',
  grave: '#ef4444',
};

export function GraficaEvolucion({ lesiones }: { lesiones: Lesion[] }) {
  if (!lesiones || lesiones.length === 0) {
    return <p className="text-muted-foreground text-sm">No hay datos para mostrar.</p>;
  }

  // Group by month
  const monthlyData: Record<
    string,
    { total: number; leve: number; moderada: number; grave: number }
  > = {};

  for (const l of lesiones) {
    const date = new Date(l.fecha_lesion);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { total: 0, leve: 0, moderada: 0, grave: 0 };
    }
    monthlyData[key].total++;
    if (l.gravedad === 'leve') monthlyData[key].leve++;
    else if (l.gravedad === 'moderada') monthlyData[key].moderada++;
    else if (l.gravedad === 'grave') monthlyData[key].grave++;
  }

  const months = Object.keys(monthlyData).sort();
  const maxTotal = Math.max(...months.map((m) => monthlyData[m]?.total ?? 0), 1);

  // Stats
  const activas = lesiones.filter((l) => l.estado === 'activa').length;
  const alta = lesiones.filter((l) => l.estado === 'alta').length;
  const totalDiasBaja = lesiones
    .filter((l) => l.fecha_alta)
    .reduce((acc, l) => {
      const diff = Math.ceil(
        (new Date(l.fecha_alta!).getTime() - new Date(l.fecha_lesion).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return acc + diff;
    }, 0);
  const mediaDiasBaja =
    lesiones.filter((l) => l.fecha_alta).length > 0
      ? Math.round(totalDiasBaja / lesiones.filter((l) => l.fecha_alta).length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-lg border p-3 text-center">
          <p className="text-primary text-2xl font-bold">{activas}</p>
          <p className="text-muted-foreground text-xs">Lesiones activas</p>
        </div>
        <div className="border-border bg-card rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{alta}</p>
          <p className="text-muted-foreground text-xs">Dados de alta</p>
        </div>
        <div className="border-border bg-card rounded-lg border p-3 text-center">
          <p className="text-muted-foreground text-2xl font-bold">{mediaDiasBaja}</p>
          <p className="text-muted-foreground text-xs">Media días baja</p>
        </div>
      </div>

      {/* Bar chart */}
      <div>
        <h4 className="text-primary mb-3 text-sm font-medium">Lesiones por mes</h4>
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {months.map((month) => {
            const data = monthlyData[month]!;
            const height = (data.total / maxTotal) * 100;
            const [year, m] = month.split('-');
            const monthName = new Date(Number(year), Number(m) - 1).toLocaleString('es-ES', {
              month: 'short',
            });

            return (
              <div key={month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-muted-foreground text-xs">{data.total}</span>
                <div className="w-full" style={{ height: `${height}%` }}>
                  {/* Stacked bar */}
                  <div className="flex h-full w-full flex-col justify-end overflow-hidden rounded-t-sm">
                    {data.grave > 0 && (
                      <div
                        className="w-full"
                        style={{
                          height: `${(data.grave / data.total) * 100}%`,
                          backgroundColor: gravedadColors.grave,
                        }}
                      />
                    )}
                    {data.moderada > 0 && (
                      <div
                        className="w-full"
                        style={{
                          height: `${(data.moderada / data.total) * 100}%`,
                          backgroundColor: gravedadColors.moderada,
                        }}
                      />
                    )}
                    {data.leve > 0 && (
                      <div
                        className="w-full"
                        style={{
                          height: `${(data.leve / data.total) * 100}%`,
                          backgroundColor: gravedadColors.leve,
                        }}
                      />
                    )}
                  </div>
                </div>
                <span className="text-muted-foreground text-[10px] capitalize">{monthName}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex justify-center gap-4">
          {Object.entries(gravedadColors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="size-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground text-xs capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
