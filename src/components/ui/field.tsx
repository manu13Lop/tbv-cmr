import { cn } from '@/lib/utils';

type FieldProps = {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, name, required, error, className, children }: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type InputFieldProps = Omit<FieldProps, 'children'> & {
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  list?: string;
  step?: string;
  min?: string;
  max?: string;
};

export function InputField({
  label,
  name,
  required,
  error,
  disabled,
  className,
  type = 'text',
  defaultValue,
  placeholder,
  list,
  step,
  min,
  max,
}: InputFieldProps) {
  const errorId = `${name}-error`;
  return (
    <Field
      label={label}
      name={name}
      required={required}
      error={error}
      disabled={disabled}
      className={className}
    >
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
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
      />
    </Field>
  );
}
