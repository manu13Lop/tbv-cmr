import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Plus, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { Button } from '@/components/ui/button';
import { PaginationWrapper as Pagination } from '@/components/pagination-wrapper';

interface Mensaje {
  id: string;
  asunto: string;
  created_at: string;
  requiere_confirmacion: boolean;
  enviado_por_nombre: string;
  equipos: { nombre: string; categoria: string } | null;
  mensajes_destinatarios: { id: string; leido_en: string | null }[] | null;
}

export default async function MensajesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'mensajes.leer')) {
    redirect('/');
  }

  const puedeEnviar = tienePermiso(usuario.permisos, 'mensajes.enviar');

  const supabase = await createClient();

  const { data: rawMensajes } = await supabase
    .from('mensajes')
    .select(
      `
      id,
      asunto,
      created_at,
      requiere_confirmacion,
      enviado_por_nombre,
      equipos ( nombre, categoria ),
      mensajes_destinatarios ( id, leido_en )
    `
    )
    .order('created_at', { ascending: false });
  const mensajes = (rawMensajes ?? null) as unknown as Mensaje[] | null;

  const params = (await searchParams) ?? {};
  const allMensajes = mensajes ?? [];
  const itemsPerPage = 10;
  const totalPages = Math.ceil(allMensajes.length / itemsPerPage);
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages || 1));
  const paginatedMensajes = allMensajes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <h1 className="text-primary text-2xl font-bold">Mensajes</h1>
          <p className="text-muted-foreground text-sm">
            {mensajes?.length ?? 0} mensaje(s) enviado(s)
          </p>
        </div>
        {puedeEnviar && (
          <Link href="/mensajes/nuevo">
            <Button>
              <Plus className="size-4" />
              Nuevo mensaje
            </Button>
          </Link>
        )}
      </div>

      {!mensajes || mensajes.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
          No se han enviado mensajes todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedMensajes.map((m) => {
            const total = m.mensajes_destinatarios?.length ?? 0;
            const leidos = m.mensajes_destinatarios?.filter((d) => d.leido_en).length ?? 0;

            return (
              <Link
                key={m.id}
                href={`/mensajes/${m.id}`}
                className="border-border bg-card hover:border-primary/40 hover:bg-muted/40 flex items-center justify-between rounded-lg border p-4 transition"
              >
                <div className="flex items-center gap-3">
                  <Mail className="text-primary size-4" />
                  <div>
                    <p className="text-foreground text-sm font-medium">{m.asunto}</p>
                    <p className="text-muted-foreground text-xs">
                      {m.equipos?.nombre} ({m.equipos?.categoria}) ·{' '}
                      {new Date(m.created_at).toLocaleString('es-ES')} · {m.enviado_por_nombre}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Destinatarios</p>
                  <p className="text-sm font-semibold">
                    {total}
                    {m.requiere_confirmacion && (
                      <span className="text-muted-foreground ml-1 text-xs">({leidos} leídos)</span>
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
