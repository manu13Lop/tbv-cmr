import { Field } from "./field"

type TextareaFieldProps = {
  label: string
  name: string
  rows?: number
  defaultValue?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
}

export function TextareaField({ label, name, rows = 3, defaultValue, placeholder, required, disabled, error, className }: TextareaFieldProps) {
  return (
    <Field label={label} name={name} required={required} error={error} disabled={disabled} className={className}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
      />
    </Field>
  )
}
