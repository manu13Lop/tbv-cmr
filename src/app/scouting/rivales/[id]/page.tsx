import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Play } from "lucide-react"
import { YoutubeEmbed } from "@/components/youtube-embed"

export default async function RivalDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rival } = await supabase
    .from("scouting_rivales")
    .select("*")
    .eq("id", id)
    .single()

  if (!rival) notFound()

  const { data: videos } = await supabase
    .from("scouting_rivales_videos")
    .select("url, descripcion, orden")
    .eq("rival_id", id)
    .order("orden", { ascending: true })

  return (
    <div className="p-6">
      <Link
        href="/scouting?tab=rivales"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a equipos rivales
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{rival.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          Temporada: {rival.temporada}
        </p>
      </div>

      <div className="space-y-6">
        {rival.sistema_defensivo && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-primary">Sistema defensivo</h2>
            <p className="text-sm text-muted-foreground">{rival.sistema_defensivo}</p>
          </div>
        )}

        {rival.sistema_ofensivo && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-primary">Sistema ofensivo</h2>
            <p className="text-sm text-muted-foreground">{rival.sistema_ofensivo}</p>
          </div>
        )}

        {(rival.puntos_fuertes || rival.puntos_debiles) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rival.puntos_fuertes && (
              <div>
                <h2 className="mb-2 text-sm font-medium text-primary">Puntos fuertes</h2>
                <p className="text-sm text-muted-foreground">{rival.puntos_fuertes}</p>
              </div>
            )}
            {rival.puntos_debiles && (
              <div>
                <h2 className="mb-2 text-sm font-medium text-destructive">Puntos débiles</h2>
                <p className="text-sm text-muted-foreground">{rival.puntos_debiles}</p>
              </div>
            )}
          </div>
        )}

        {rival.jugadas_pizarra && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-primary">Jugadas de pizarra</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{rival.jugadas_pizarra}</p>
          </div>
        )}

        {videos && videos.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
              <Play className="size-4" />
              Vídeos
            </h2>
            <div className="space-y-6">
              {videos.map((v: any) => (
                <div key={v.url}>
                  <YoutubeEmbed url={v.url} />
                  {v.descripcion && (
                    <p className="mt-2 text-sm text-muted-foreground">{v.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {rival.notas && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-primary">Notas adicionales</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{rival.notas}</p>
          </div>
        )}
      </div>
    </div>
  )
}
