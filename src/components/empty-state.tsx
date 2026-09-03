import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="border-border bg-muted/50 rounded-lg border border-dashed p-12 text-center">
      <Icon className="text-muted-foreground mx-auto mb-4 size-12" />
      <h3 className="text-foreground mb-1 font-medium">{title}</h3>
      <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
