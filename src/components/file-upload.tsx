'use client';

import { useRef, useState, useCallback } from 'react';
import { Paperclip, X, FileText, Image, Film } from 'lucide-react';

type FileEntry = {
  file: File;
  preview?: string;
};

const ACCEPT = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
].join(',');

function getIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  return FileText;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function FileUpload({ disabled }: { disabled?: boolean }) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    const mapped: FileEntry[] = incoming.map((f) => {
      const isImage = f.type.startsWith('image/');
      return {
        file: f,
        preview: isImage ? URL.createObjectURL(f) : undefined,
      };
    });
    setFiles((prev) => [...prev, ...mapped]);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const remove = useCallback((idx: number) => {
    setFiles((prev) => {
      const removed = prev[idx];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Archivos adjuntos</label>
      <p className="text-muted-foreground text-xs">PDFs, imágenes o vídeos (máx. 10 MB c/u)</p>

      <input
        ref={inputRef}
        type="file"
        name="archivos"
        multiple
        accept={ACCEPT}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((entry, idx) => {
            const Icon = getIcon(entry.file.type);
            return (
              <li
                key={`${entry.file.name}-${idx}`}
                className="border-border bg-background flex items-center gap-3 rounded-md border p-2"
              >
                {entry.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.preview}
                    alt={entry.file.name}
                    className="size-10 rounded object-cover"
                  />
                ) : (
                  <div className="bg-muted flex size-10 items-center justify-center rounded">
                    <Icon className="text-muted-foreground size-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{entry.file.name}</p>
                  <p className="text-muted-foreground text-xs">{formatSize(entry.file.size)}</p>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="border-border text-muted-foreground hover:border-primary/50 hover:text-foreground flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm disabled:opacity-60"
      >
        <Paperclip className="size-4" />
        {files.length > 0 ? 'Añadir más archivos' : 'Adjuntar archivos'}
      </button>
    </div>
  );
}
