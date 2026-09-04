'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

export type FilterOption = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

export function FilterBar({ filters }: { filters: FilterOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams();
    router.push(`?${params.toString()}`);
  }

  const hasFilters = filters.some((f) => searchParams.get(f.key));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={searchParams.get(filter.key) ?? ''}
          onChange={(e) => setFilter(filter.key, e.target.value)}
          className="border-border bg-background focus-visible:ring-ring/50 rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="border-border text-muted-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
        >
          <X className="size-3" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
