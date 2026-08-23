export type CategoriaFormacion = "tactica" | "fisico" | "reglamento" | "videos" | "psicologia" | "liderazgo"
export type NivelFormacion = "principiante" | "intermedio" | "avanzado"
export type TipoContenido = "video" | "texto" | "pdf" | "imagen"

export type CursoFormacion = {
  id: string
  titulo: string
  slug: string | null
  categoria: CategoriaFormacion
  descripcion: string | null
  contenido_url: string | null
  duracion_minutos: number
  nivel: NivelFormacion
  activo: boolean
  destacado: boolean
  autor_usuario_id: string | null
  created_at: string
  updated_at: string
}

export type Leccion = {
  id: string
  curso_id: string
  titulo: string
  slug: string | null
  orden: number
  tipo: TipoContenido
  contenido_url: string | null
  contenido_texto: string | null
  duracion_minutos: number
  activo: boolean
  created_at: string
}

export type Quiz = {
  id: string
  curso_id: string
  titulo: string
  categoria: CategoriaFormacion
  activo: boolean
  created_at: string
}

export type PreguntaQuiz = {
  id: string
  quiz_id: string
  enunciado: string
  opciones: string[] | null
  respuesta_correcta: string | null
  orden: number
}

export type ProgresoCurso = {
  id: string
  usuario_id: string
  curso_id: string
  leccion_actual_id: string | null
  porcentaje: number
  completado: boolean
  completado_at: string | null
  created_at: string
  updated_at: string
}

export type QuizResultado = {
  id: string
  usuario_id: string
  quiz_id: string
  puntuacion: number
  respuestas: Record<string, string> | null
  completado_at: string
}

export type Certificado = {
  id: string
  usuario_id: string
  curso_id: string
  puntuacion_final: number | null
  emitido_at: string
  codigo_certificado: string
}

export const CATEGORIAS_FORMACION: { value: CategoriaFormacion; label: string; color: string; icon: string }[] = [
  { value: "tactica", label: "Táctica", color: "bg-primary/10 text-primary", icon: "LayoutDashboard" },
  { value: "fisico", label: "Físico", color: "bg-orange-500/10 text-orange-600", icon: "TrendingUp" },
  { value: "reglamento", label: "Reglamento", color: "bg-blue-500/10 text-blue-600", icon: "BookOpen" },
  { value: "videos", label: "Vídeos", color: "bg-purple-500/10 text-purple-600", icon: "Play" },
  { value: "psicologia", label: "Psicología", color: "bg-green-500/10 text-green-600", icon: "Brain" },
  { value: "liderazgo", label: "Liderazgo", color: "bg-emerald-500/10 text-emerald-600", icon: "Users" },
]

export const NIVELES_FORMACION: { value: NivelFormacion; label: string }[] = [
  { value: "principiante", label: "Principiante" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
]

export function getCategoriaLabel(value: string): string {
  return CATEGORIAS_FORMACION.find((c) => c.value === value)?.label ?? value
}

export function getCategoriaColor(value: string): string {
  return CATEGORIAS_FORMACION.find((c) => c.value === value)?.color ?? "bg-muted text-muted-foreground"
}

export function getNivelLabel(value: string): string {
  return NIVELES_FORMACION.find((n) => n.value === value)?.label ?? value
}
