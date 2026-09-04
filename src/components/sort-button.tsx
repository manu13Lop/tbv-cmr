'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortDirection = 'asc' | 'desc';

export function SortButton({
  field,
  label,
  className,
}: {
  field: string;
  label: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort');
  const currentDir = searchParams.get('dir') as SortDirection | null;

  const isActive = currentSort === field;
  const nextDir: SortDirection = isActive && currentDir === 'asc' ? 'desc' : 'asc';

  const params = new URLSearchParams(searchParams.toString());
  params.set('sort', field);
  params.set('dir', nextDir);
  params.delete('page');

  const Icon = !isActive ? ArrowUpDown : nextDir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <Link
      href={`?${params.toString()}`}
      className={cn(
        'hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors',
        isActive ? 'text-foreground' : 'text-muted-foreground',
        className
      )}
    >
      {label}
      <Icon className="size-3" />
    </Link>
  );
}

export function applySort<T extends Record<string, unknown>>(
  data: T[],
  searchParams: URLSearchParams
): T[] {
  const sort = searchParams.get('sort');
  const dir = searchParams.get('dir');
  if (!sort || !data.length) return data;

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sort];
    const bVal = b[sort];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return dir === 'desc' ? bVal.localeCompare(aVal, 'es') : aVal.localeCompare(bVal, 'es');
    }
    return dir === 'desc' ? Number(bVal) - Number(aVal) : Number(aVal) - Number(bVal);
  });

  return sorted;
}
