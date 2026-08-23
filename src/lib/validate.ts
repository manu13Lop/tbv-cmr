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
  const raw: Record<string, unknown> = {}

  for (const [key, value] of formData.entries()) {
    if (value === "on") {
      raw[key] = true
    } else if (raw[key] !== undefined) {
      if (Array.isArray(raw[key])) {
        ;(raw[key] as unknown[]).push(value)
      } else {
        raw[key] = [raw[key], value]
      }
    } else {
      raw[key] = value
    }
  }

  const innerType = (schema as any)["_def"]?.["innerType"] ?? schema
  const shape = (innerType as any)["_def"]?.shape ?? {}
  for (const key of Object.keys(shape)) {
    const fieldDef = (shape[key]?._def ?? shape[key]?._def?.innerType?._def)
    if (fieldDef?.typeName === "ZodBoolean" && !(key in raw)) {
      raw[key] = false
    }
  }

  const videos: { url?: string; descripcion?: string }[] = []
  for (const [key, value] of Object.entries(raw)) {
    const match = key.match(/^videos\[(\d+)\]\[(\w+)\]$/)
    if (match) {
      const idx = parseInt(match[1], 10)
      const field = match[2] as "url" | "descripcion"
      if (!videos[idx]) videos[idx] = {}
      videos[idx][field] = String(value)
    }
  }
  if (videos.length > 0 && videos.some((v) => v.url || v.descripcion)) {
    raw.videos = videos
  }
  for (const key of Object.keys(raw)) {
    if (/^videos\[\d+\]\[\w+\]$/.test(key)) {
      delete raw[key]
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
