import { Field } from './field';

type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
};

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  required,
  disabled,
  error,
  placeholder,
  className,
}: SelectFieldProps) {
  return (
    <Field
      label={label}
      name={name}
      required={required}
      error={error}
      disabled={disabled}
      className={className}
    >
      <select
        id={name}
        name={name}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue ?? ''}
        className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
