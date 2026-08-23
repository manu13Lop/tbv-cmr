import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';

export default async function MensajeDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'mensajes.leer')) {
    redirect('/');
  }

  const { id } = await params;
  const { aviso } = await searchParams;

  const supabase = await createClient();

  const { data: mensaje } = await supabase
    .from('mensajes')
    .select(
      `
      *,
      equipos ( nombre, categoria ),
      mensajes_destinatarios ( id, nombre, tipo, email, leido_en, enviado )
    `
    )
    .eq('id', id)
    .single();

  if (!mensaje) notFound();

  return (
    <div className="p-6">
      <Link
        href="/mensajes"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a mensajes
      </Link>

      {aviso === 'sin_destinatarios' && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive mb-4 rounded-lg border px-3 py-2 text-sm">
          El mensaje se creó pero no se encontraron destinatarios con email para ese equipo.
        </div>
      )}

      <h1 className="text-primary mb-1 text-2xl font-bold">{mensaje.asunto}</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {mensaje.equipos?.nombre} ({mensaje.equipos?.categoria}) ·{' '}
        {new Date(mensaje.created_at).toLocaleString('es-ES')} · {mensaje.enviado_por_nombre}
      </p>

      <div className="border-border bg-card mb-6 rounded-xl border p-4">
        <p className="text-foreground text-sm whitespace-pre-wrap">{mensaje.cuerpo}</p>
      </div>

      <h2 className="text-primary mb-4 text-lg font-bold">Destinatarios</h2>

      <div className="border-border rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Nombre</th>
                <th className="p-3 text-left font-medium">Tipo</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(mensaje.mensajes_destinatarios ?? []).map((d: Record<string, unknown>) => (
                <tr key={d.id as string} className="border-border border-t">
                  <td className="p-3">{d.nombre as string}</td>
                  <td className="p-3 capitalize">{d.tipo as string}</td>
                  <td className="p-3">{d.email as string}</td>
                  <td className="p-3">
                    {mensaje.requiere_confirmacion ? (
                      d.leido_en ? (
                        <span className="text-primary">
                          Leído el {new Date(d.leido_en as string).toLocaleString('es-ES')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin confirmar</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">
                        {d.enviado ? 'Enviado' : 'Pendiente'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
