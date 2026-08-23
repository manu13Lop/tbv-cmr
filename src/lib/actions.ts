import { revalidatePath } from "next/cache"

export type ActionResponse = {
  success: boolean
  error?: string
}

export function ok(path?: string): ActionResponse {
  if (path) revalidatePath(path)
  return { success: true }
}

export function fail(error: string): ActionResponse {
  return { success: false, error }
}
