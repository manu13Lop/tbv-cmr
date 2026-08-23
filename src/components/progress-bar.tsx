interface ProgressBarProps {
  porcentaje: number
  label?: string
  className?: string
}

export function ProgressBar({ porcentaje, label, className = "" }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, porcentaje))

  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-primary">{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
