import { cn } from "@/lib/utils"

type FieldProps = {
  label: string
  name: string
  required?: boolean
  error?: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function Field({ label, name, required, error, disabled, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

type InputFieldProps = Omit<FieldProps, "children"> & {
  type?: string
  defaultValue?: string
  placeholder?: string
  list?: string
  step?: string
  min?: string
  max?: string
}

export function InputField({ label, name, required, error, disabled, className, type = "text", defaultValue, placeholder, list, step, min, max }: InputFieldProps) {
  return (
    <Field label={label} name={name} required={required} error={error} disabled={disabled} className={className}>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        placeholder={placeholder}
        list={list}
        step={step}
        min={min}
        max={max}
        className="w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60"
      />
    </Field>
  )
}
