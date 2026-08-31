import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

async function crearCriterio(formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'scouting.editar')) return;

  const supabase = await createClient();
  const etiqueta = (formData.get('etiqueta') as string).trim();
  const clave = etiqueta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  await supabase.from('scouting_criterios').insert({ clave, etiqueta, orden: 999 });
  redirect('/scouting/criterios');
}

async function alternarActivo(id: string, activo: boolean) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'scouting.editar')) return;

  const supabase = await createClient();
  await supabase.from('scouting_criterios').update({ activo: !activo }).eq('id', id);
  redirect('/scouting/criterios');
}

export default async function CriteriosScoutingPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'scouting.editar')) {
    redirect('/scouting');
  }

  const supabase = await createClient();
  const { data: criterios } = await supabase
    .from('scouting_criterios')
    .select('*')
    .order('orden', { ascending: true });

  return (
    <div className="p-6">
      <Link
        href="/scouting"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a scouting
      </Link>

      <h1 className="text-primary mb-2 text-2xl font-bold">Criterios de valoración</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Añade aquí cuantos criterios necesites. Se mostrarán automáticamente en los informes.
      </p>

      <form
        action={crearCriterio}
        className="border-border bg-card mb-6 flex gap-2 rounded-lg border p-4"
      >
        <input
          name="etiqueta"
          required
          placeholder="Ej: Velocidad en transición"
          className="border-border bg-background flex-1 rounded-md border p-2 text-sm"
        />
        <Button type="submit">Añadir criterio</Button>
      </form>

      <div className="border-border rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th scope="col" className="p-3 text-left font-medium">
                  Criterio
                </th>
                <th scope="col" className="p-3 text-left font-medium">
                  Clave interna
                </th>
                <th scope="col" className="p-3 text-left font-medium">
                  Estado
                </th>
                <th scope="col" className="p-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {criterios?.map((c) => {
                const toggleAction = alternarActivo.bind(null, c.id, c.activo);
                return (
                  <tr key={c.id} className="border-border border-t">
                    <td className="p-3 font-medium">{c.etiqueta}</td>
                    <td className="text-muted-foreground p-3">{c.clave}</td>
                    <td className="p-3">
                      <span className={c.activo ? 'text-primary' : 'text-muted-foreground'}>
                        {c.activo ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className="text-muted-foreground text-xs hover:underline"
                        >
                          {c.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
