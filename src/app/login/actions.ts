"use server"

import { createClient } from "@/lib/supabase-server"
import { rateLimiters } from "@/lib/rate-limit"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const clientIp = "unknown"
  const rateLimit = await rateLimiters.login(clientIp)

  if (!rateLimit.allowed) {
    const minutos = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
    return { error: `Demasiados intentos. Intenta de nuevo en ${minutos} minuto(s).` }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: "Email o contraseña incorrectos." }
  }

  redirect("/")
}
