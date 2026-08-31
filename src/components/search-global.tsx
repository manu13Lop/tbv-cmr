'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';

type SearchResult = {
  tipo: string;
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
};

export function SearchGlobal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const pattern = `%${q}%`;

        const [jugadoras, equipos, entrenadores, convocatorias] = await Promise.all([
          supabase
            .from('jugadoras')
            .select('id, nombre, apellidos')
            .or(`nombre.ilike.${pattern},apellidos.ilike.${pattern}`)
            .limit(5),
          supabase
            .from('equipos')
            .select('id, nombre, categoria')
            .or(`nombre.ilike.${pattern},categoria.ilike.${pattern}`)
            .limit(5),
          supabase
            .from('entrenadores')
            .select('id, nombre, apellidos')
            .or(`nombre.ilike.${pattern},apellidos.ilike.${pattern}`)
            .limit(5),
          supabase
            .from('eventos')
            .select('id, tipo, equipos(nombre, categoria)')
            .or(`tipo.ilike.${pattern},lugar.ilike.${pattern},rival.ilike.${pattern}`)
            .limit(5),
        ]);

        const items: SearchResult[] = [];

        for (const j of jugadoras.data ?? []) {
          items.push({
            tipo: 'Jugadora',
            id: j.id,
            titulo: `${j.nombre} ${j.apellidos}`,
            subtitulo: '',
            href: `/jugadoras/${j.id}`,
          });
        }

        for (const e of equipos.data ?? []) {
          items.push({
            tipo: 'Equipo',
            id: e.id,
            titulo: e.nombre,
            subtitulo: e.categoria,
            href: `/equipos/${e.id}`,
          });
        }

        for (const e of entrenadores.data ?? []) {
          items.push({
            tipo: 'Entrenador',
            id: e.id,
            titulo: `${e.nombre} ${e.apellidos}`,
            subtitulo: '',
            href: `/entrenadores/${e.id}`,
          });
        }

        for (const c of convocatorias.data ?? []) {
          const eq = c.equipos as unknown as { nombre: string; categoria: string } | null;
          items.push({
            tipo: 'Convocatoria',
            id: c.id,
            titulo: `${c.tipo} ${eq?.nombre ?? ''}`,
            subtitulo: eq?.categoria ?? '',
            href: `/convocatorias/${c.id}`,
          });
        }

        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query) search(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);

      if (e.key === 'Tab' && open && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'input, button, [href], [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-border bg-background text-muted-foreground hover:bg-muted flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs"
      >
        <Search className="size-3" />
        Buscar...
        <kbd className="border-border bg-muted ml-2 rounded border px-1 py-0.5 text-[10px]">
          Ctrl+K
        </kbd>
      </button>
    );
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda global"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh]"
    >
      <div className="border-border bg-card w-full max-w-lg rounded-lg border shadow-2xl">
        <div className="border-border flex items-center border-b p-3">
          <Search className="text-muted-foreground mr-2 size-4" aria-hidden="true" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugadoras, equipos, entrenadores..."
            aria-label="Buscar"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar búsqueda"
            className="text-muted-foreground hover:text-foreground ml-2"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading && <p className="text-muted-foreground p-3 text-center text-xs">Buscando...</p>}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="text-muted-foreground p-3 text-center text-xs">Sin resultados</p>
          )}

          {results.map((r) => (
            <button
              key={`${r.tipo}-${r.id}`}
              onClick={() => {
                router.push(r.href);
                setOpen(false);
                setQuery('');
              }}
              className="hover:bg-muted flex w-full items-center gap-3 rounded-md p-3 text-left"
            >
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                {r.tipo}
              </span>
              <div>
                <p className="text-sm font-medium">{r.titulo}</p>
                {r.subtitulo && <p className="text-muted-foreground text-xs">{r.subtitulo}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
