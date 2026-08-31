export const SECCIONES_PRINCIPALES = [
  { value: 'dinamica_grupo', label: 'Dinámica de grupo' },
  { value: 'preparacion_fisica', label: 'Preparación física' },
  { value: 'calentamiento', label: 'Calentamiento' },
  { value: 'activacion', label: 'Activación' },
  { value: 'ataque', label: 'Ataque' },
  { value: 'defensa', label: 'Defensa' },
  { value: 'porteria', label: 'Portería' },
  { value: 'contraataque_1a', label: 'Contraataque 1ª oleada' },
  { value: 'contraataque_2a', label: 'Contraataque 2ª oleada' },
  { value: 'contraataque_3a', label: 'Contraataque 3ª oleada' },
  { value: 'transicion_at_def', label: 'Transición ataque→defensa' },
  { value: 'transicion_def_at', label: 'Transición defensa→ataque' },
  { value: 'juego_combinado', label: 'Juego combinado' },
  { value: 'otros', label: 'Otros' },
] as const;

export const SECCIONES_SECUNDARIAS = [
  { value: 'tecnica_individual', label: 'Técnica individual' },
  { value: 'tactica_individual', label: 'Táctica individual' },
  { value: 'tecnica_colectiva', label: 'Técnica colectiva' },
  { value: 'tactica_colectiva', label: 'Táctica colectiva' },
  { value: 'aspectos_psicologicos', label: 'Aspectos psicológicos' },
  { value: 'preparacion_fisica', label: 'Preparación física' },
  { value: 'otros', label: 'Otros' },
] as const;

export const ASPECTOS_INDIVIDUALES = [
  'Calidad de pase',
  'Capacidad de decisión',
  'Lanzamiento',
  'Fintas',
  'Desplazamientos defensivos',
  'Orientaciones',
  'Coordinación',
  'Resistencia',
  'Velocidad',
  'Velocidad segmentaria',
  'Fuerza',
  'Potencia',
  'Agilidad',
  'Flexibilidad',
  'Control de balón',
  'Recepción',
  'Conducción',
  'Cierre de espacios',
  'Marcaje',
  'Interceptación',
  'Recuperación',
  'Colocación',
  'Lectura de juego',
  'Comunicación',
  'Trabajo en equipo',
  'Concentración',
  'Gestión de la presión',
  'Liderazgo',
  'Creatividad',
  'Timing de ataque',
] as const;

export const NIVELES_DIFICULTAD = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
] as const;

export type SeccionPrincipal = (typeof SECCIONES_PRINCIPALES)[number]['value'];
export type SeccionSecundaria = (typeof SECCIONES_SECUNDARIAS)[number]['value'];
export type NivelDificultad = (typeof NIVELES_DIFICULTAD)[number]['value'];
