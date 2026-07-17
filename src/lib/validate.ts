import { ZodError, ZodSchema } from "zod"

export type ValidationError = {
  success: false
  errors: Record<string, string[]>
}

export type ValidationSuccess<T> = {
  success: true
  data: T
}

export function validateFormData<T>(
  schema: ZodSchema<T>,
  formData: FormData
): ValidationSuccess<T> | ValidationError {
  // Convert FormData to plain object
  const raw: Record<string, unknown> = {}

  for (const [key, value] of formData.entries()) {
    // Handle checkbox (only present when checked)
    if (value === "on") {
      raw[key] = true
    } else if (raw[key] !== undefined) {
      // Handle multiple values (e.g. multiple checkboxes with same name)
      if (Array.isArray(raw[key])) {
        ;(raw[key] as unknown[]).push(value)
      } else {
        raw[key] = [raw[key], value]
      }
    } else {
      raw[key] = value
    }
  }

  // Handle missing checkboxes (set to false)
  const shape = (schema as any)._def?.shape?.() || {}
  for (const key of Object.keys(shape)) {
    const fieldDef = shape[key]?._def
    if (fieldDef?.typeName === "ZodBoolean" && !(key in raw)) {
      raw[key] = false
    }
  }

  const result = schema.safeParse(raw)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string[]> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join(".")
    if (!errors[path]) errors[path] = []
    errors[path].push(issue.message)
  }

  return { success: false, errors }
}

export function getFirstError(errors: Record<string, string[]>): string {
  const firstKey = Object.keys(errors)[0]
  return errors[firstKey]?.[0] || "Error de validación"
}
