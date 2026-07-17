"use client"

import { useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"

export function ImageUpload({
  name,
  currentImageUrl,
  disabled,
}: {
  name: string
  currentImageUrl?: string | null
  disabled?: boolean
}) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null)
  const [fileName, setFileName] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleClear() {
    setPreview(null)
    setFileName("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Imagen del ejercicio</label>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Vista previa"
            className="max-h-64 rounded-lg border border-border object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-destructive hover:bg-background"
            >
              <X className="size-4" />
            </button>
          )}
          {fileName && (
            <p className="mt-1 text-xs text-muted-foreground">{fileName}</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-60"
        >
          <ImagePlus className="size-5" />
          Seleccionar imagen
        </button>
      )}
    </div>
  )
}
