import { cn } from "@/lib/utils"

type FormCardProps = {
  title?: string
  className?: string
  children: React.ReactNode
}

export function FormCard({ title, className, children }: FormCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-muted/50 p-4", className)}>
      {title && (
        <h3 className="mb-3 text-sm font-medium text-primary">{title}</h3>
      )}
      {children}
    </div>
  )
}
