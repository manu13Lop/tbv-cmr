import { createClient } from "@/lib/supabase-server"

// Fallback local por si la BD no tiene los criterios
const CRITERIOS_DEFAULT = [
  { clave: "influencia_equipo", etiqueta: "Influencia en su equipo" },
  { clave: "influencia_equipo_contrario", etiqueta: "Influencia en el equipo contrario" },
  { clave: "posicion_defensiva", etiqueta: "Posición defensiva" },
  { clave: "posicion_atacante", etiqueta: "Posición atacante" },
  { clave: "juego_con_pivote", etiqueta: "Juego con pivote" },
  { clave: "calidad_pase", etiqueta: "Calidad de pase" },
  { clave: "calidad_continuidad", etiqueta: "Calidad de continuidad" },
  { clave: "calidad_lanzamiento_6m", etiqueta: "Calidad de lanzamiento 6m" },
  { clave: "calidad_lanzamiento_9m", etiqueta: "Calidad de lanzamiento 9m" },
  { clave: "calidad_lanzamiento_contacto", etiqueta: "Calidad de lanzamiento en contacto" },
  { clave: "dureza_mental", etiqueta: "Dureza mental" },
]

export async function getCriteriosScouting() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("scouting_criterios")
      .select("clave, etiqueta")
      .eq("activo", true)
      .order("orden")

    if (error || !data || data.length === 0) {
      return CRITERIOS_DEFAULT
    }

    return data
  } catch {
    return CRITERIOS_DEFAULT
  }
}

export const CRITERIOS_SCOUTING = CRITERIOS_DEFAULT
