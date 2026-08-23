import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';
import { YoutubeEmbed } from '@/components/youtube-embed';

interface RivalDetalle {
  id: string;
  nombre: string;
  temporada: string;
  sistema_defensivo: string | null;
  sistema_ofensivo: string | null;
  puntos_fuertes: string | null;
  puntos_debiles: string | null;
  jugadas_pizarra: string | null;
  notas: string | null;
}

interface VideoRival {
  url: string;
  descripcion: string | null;
  orden: number;
}

export default async function RivalDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawRival } = await supabase
    .from('scouting_rivales')
    .select('*')
    .eq('id', id)
    .single();
  const rival = (rawRival ?? null) as unknown as RivalDetalle | null;

  if (!rival) notFound();

  const { data: rawVideos } = await supabase
    .from('scouting_rivales_videos')
    .select('url, descripcion, orden')
    .eq('rival_id', id)
    .order('orden', { ascending: true });
  const videos = (rawVideos ?? []) as unknown as VideoRival[];

  return (
    <div className="p-6">
      <Link
        href="/scouting?tab=rivales"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a equipos rivales
      </Link>

      <div className="mb-6">
        <h1 className="text-primary text-2xl font-bold">{rival.nombre}</h1>
        <p className="text-muted-foreground text-sm">Temporada: {rival.temporada}</p>
      </div>

      <div className="space-y-6">
        {rival.sistema_defensivo && (
          <div>
            <h2 className="text-primary mb-2 text-sm font-medium">Sistema defensivo</h2>
            <p className="text-muted-foreground text-sm">{rival.sistema_defensivo}</p>
          </div>
        )}

        {rival.sistema_ofensivo && (
          <div>
            <h2 className="text-primary mb-2 text-sm font-medium">Sistema ofensivo</h2>
            <p className="text-muted-foreground text-sm">{rival.sistema_ofensivo}</p>
          </div>
        )}

        {(rival.puntos_fuertes || rival.puntos_debiles) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rival.puntos_fuertes && (
              <div>
                <h2 className="text-primary mb-2 text-sm font-medium">Puntos fuertes</h2>
                <p className="text-muted-foreground text-sm">{rival.puntos_fuertes}</p>
              </div>
            )}
            {rival.puntos_debiles && (
              <div>
                <h2 className="text-destructive mb-2 text-sm font-medium">Puntos débiles</h2>
                <p className="text-muted-foreground text-sm">{rival.puntos_debiles}</p>
              </div>
            )}
          </div>
        )}

        {rival.jugadas_pizarra && (
          <div>
            <h2 className="text-primary mb-2 text-sm font-medium">Jugadas de pizarra</h2>
            <p className="text-muted-foreground text-sm whitespace-pre-line">
              {rival.jugadas_pizarra}
            </p>
          </div>
        )}

        {videos.length > 0 && (
          <div>
            <h2 className="text-primary mb-3 flex items-center gap-2 text-sm font-medium">
              <Play className="size-4" />
              Vídeos
            </h2>
            <div className="space-y-6">
              {videos.map((v) => (
                <div key={v.url}>
                  <YoutubeEmbed url={v.url} />
                  {v.descripcion && (
                    <p className="text-muted-foreground mt-2 text-sm">{v.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {rival.notas && (
          <div>
            <h2 className="text-primary mb-2 text-sm font-medium">Notas adicionales</h2>
            <p className="text-muted-foreground text-sm whitespace-pre-line">{rival.notas}</p>
          </div>
        )}
      </div>
    </div>
  );
}
