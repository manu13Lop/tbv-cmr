"use server"

import { createClient } from "@/lib/supabase-server"

export async function marcarComoLeida(notificacionId: string) {
  const supabase = await createClient()
  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("id", notificacionId)
}

export async function marcarTodasComoLeidas() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("usuario_id", user.id)
    .eq("leida", false)
}
