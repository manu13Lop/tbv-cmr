"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

type VideoEntry = { url: string; descripcion: string }

export function VideoFields() {
  const [videos, setVideos] = useState<VideoEntry[]>([])

  function addVideo() {
    setVideos([...videos, { url: "", descripcion: "" }])
  }

  function removeVideo(idx: number) {
    setVideos(videos.filter((_, i) => i !== idx))
  }

  function updateVideo(idx: number, field: keyof VideoEntry, value: string) {
    setVideos(videos.map((v, i) => (i === idx ? { ...v, [field]: value } : v)))
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">Vídeos de YouTube</label>
      {videos.length === 0 ? (
        <button
          type="button"
          onClick={addVideo}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          <Plus className="mr-1 size-3" />
          Añadir vídeo
        </button>
      ) : (
        <div className="space-y-3">
          {videos.map((v, idx) => (
            <div key={idx} className="rounded-lg border border-border p-3">
              <div className="mb-2">
                <label className="block text-xs font-medium">URL de YouTube</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={v.url}
                  onChange={(e) => updateVideo(idx, "url", e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium">Descripción</label>
                <input
                  type="text"
                  placeholder="Describe el contenido del vídeo..."
                  value={v.descripcion}
                  onChange={(e) => updateVideo(idx, "descripcion", e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeVideo(idx)}
                className="rounded-md border border-destructive px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3" />
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addVideo}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
          >
            <Plus className="mr-1 size-3" />
            Añadir otro vídeo
          </button>
        </div>
      )}
      {videos.map((v, idx) => (
        <input key={idx} type="hidden" name={`videos[${idx}][url]`} value={v.url} />
      ))}
      {videos.map((v, idx) => (
        <input key={`d${idx}`} type="hidden" name={`videos[${idx}][descripcion]`} value={v.descripcion} />
      ))}
    </div>
  )
}
