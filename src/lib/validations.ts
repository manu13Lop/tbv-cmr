import { z } from 'zod';

// --- Enums compartidos ---

const TALLAS = ['', 'XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
const POSICIONES = [
  '',
  'Portera',
  'Lateral izquierdo',
  'Lateral derecho',
  'Central',
  'Extremo izquierdo',
  'Extremo derecho',
  'Pivote',
] as const;
const TIPO_EVENTO = ['entrenamiento', 'partido', 'concentracion', 'otro'] as const;
const GRAVEDAD = ['', 'leve', 'moderada', 'grave'] as const;
const TIPO_BAJA = ['baja_total', 'baja_parcial', 'sin_baja'] as const;
const TIPO_SESION = ['individual', 'grupal'] as const;
const ESTADO_SESION = ['abierta', 'cerrada'] as const;
const TIPO_MOVIMIENTO = ['entrada', 'salida', 'ajuste'] as const;
const ESTADO_RECONOCIMIENTO = ['pendiente', 'apto', 'no_apto'] as const;
const TIPO_SEGUIMIENTO = ['revision', 'tratamiento', 'prueba_diagnostica', 'alta'] as const;
const PARENTESCOS = ['', 'Madre', 'Padre', 'Tutor legal'] as const;

// --- Schemas de Jugadoras ---

export const crearJugadoraSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  codigo_interno: z.string().optional(),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  talla_camiseta_entreno: z.enum(TALLAS).optional(),
  talla_camiseta_partido: z.enum(TALLAS).optional(),
  talla_calzona: z.enum(TALLAS).optional(),
  talla_chandal: z.enum(TALLAS).optional(),
  talla_chaqueton: z.enum(TALLAS).optional(),
});

export const actualizarJugadoraSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  codigo_interno: z.string().optional(),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  talla_camiseta_entreno: z.enum(TALLAS).optional(),
  talla_camiseta_partido: z.enum(TALLAS).optional(),
  talla_calzona: z.enum(TALLAS).optional(),
  talla_chandal: z.enum(TALLAS).optional(),
  talla_chaqueton: z.enum(TALLAS).optional(),
  reconocimiento_medico_estado: z.enum(ESTADO_RECONOCIMIENTO).optional(),
  activa: z.boolean().optional(),
});

export const asignarEquipoSchema = z.object({
  equipo_id: z.string().uuid('Selecciona un equipo válido'),
  temporada: z.string().min(1, 'La temporada es obligatoria'),
  dorsal: z.coerce.number().int().min(0).nullable().optional(),
  posicion: z.enum(POSICIONES).optional(),
});

export const crearTutorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email no válido').nullable().optional().or(z.literal('')),
  telefono: z.string().nullable().optional().or(z.literal('')),
  parentesco: z.enum(PARENTESCOS).nullable().optional(),
});

// --- Schemas de Equipos ---

export const crearEquipoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  temporada: z.string().min(1, 'La temporada es obligatoria'),
  federada: z.boolean().optional(),
});

export const actualizarEquipoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  temporada: z.string().min(1, 'La temporada es obligatoria'),
  federada: z.boolean().optional(),
});

// --- Schemas de Convocatorias ---

export const crearEventoSchema = z.object({
  equipo_id: z.string().uuid('Selecciona un equipo válido'),
  tipo: z.enum(TIPO_EVENTO, { message: 'Selecciona un tipo' }),
  fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias'),
  lugar: z.string().optional(),
  rival: z.string().optional(),
});

export const actualizarEventoSchema = z.object({
  tipo: z.enum(TIPO_EVENTO).optional(),
  fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias'),
  lugar: z.string().optional(),
  rival: z.string().optional(),
  observaciones: z.string().optional(),
});

// --- Schemas de Sanitario ---

export const crearLesionSchema = z.object({
  jugadora_id: z.string().uuid('Selecciona una jugadora válida'),
  tipo: z.string().min(1, 'El tipo de lesión es obligatorio'),
  fecha_lesion: z.string().min(1, 'La fecha es obligatoria'),
  gravedad: z.enum(GRAVEDAD).optional(),
  tipo_baja: z.enum(TIPO_BAJA).optional(),
  diagnostico_inicial: z.string().optional(),
});

export const seguimientoLesionSchema = z.object({
  tipo_entrada: z.enum(TIPO_SEGUIMIENTO, { message: 'Selecciona un tipo' }),
  tratamiento_aplicado: z.string().optional(),
  evolucion: z.string().optional(),
  tipo_baja: z.enum(TIPO_BAJA).optional(),
  es_alta: z.boolean().optional(),
});

export const crearReconocimientoSchema = z.object({
  temporada: z.string().min(1, 'La temporada es obligatoria'),
  fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias'),
  lugar: z.string().optional(),
  mensaje_instrucciones: z.string().optional(),
  notas: z.string().optional(),
  jugadora_id: z.array(z.string().uuid()).optional(),
});

export const actualizarReconocimientoSchema = z.object({
  temporada: z.string().min(1, 'La temporada es obligatoria'),
  fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias'),
  lugar: z.string().optional(),
  mensaje_instrucciones: z.string().optional(),
  notas: z.string().optional(),
});

// --- Schemas de Psicología ---

export const crearSesionPsicologiaSchema = z
  .object({
    tipo_sesion: z.enum(TIPO_SESION),
    fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias'),
    jugadora_id: z.string().uuid().nullable().optional(),
    equipo_id: z.string().uuid().nullable().optional(),
    tema: z.string().min(1, 'El tema es obligatorio'),
    objetivos: z.string().optional(),
    desarrollo: z.string().optional(),
    acuerdos: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tipo_sesion === 'individual') return !!data.jugadora_id;
      if (data.tipo_sesion === 'grupal') return !!data.equipo_id;
      return true;
    },
    { message: 'Selecciona una jugadora (individual) o un equipo (grupal)' }
  );

export const actualizarSesionPsicologiaSchema = z.object({
  tema: z.string().optional(),
  objetivos: z.string().optional(),
  desarrollo: z.string().optional(),
  acuerdos: z.string().optional(),
  estado: z.enum(ESTADO_SESION).optional(),
});

// --- Schemas de Scouting ---

export const crearFichaScoutingSchema = z.object({
  jugadora_id: z.string().uuid().nullable().optional(),
  nombre_externo: z.string().nullable().optional().or(z.literal('')),
  club_actual: z.string().optional(),
  posicion: z.string().optional(),
  fecha_nacimiento: z.string().nullable().optional().or(z.literal('')),
  notas_generales: z.string().optional(),
});

export const crearInformeScoutingSchema = z.object({
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  equipo_id: z.string().uuid().nullable().optional(),
  rival: z.string().optional(),
  temporada: z.string().min(1, 'La temporada es obligatoria'),
  minutos_jugados: z.coerce.number().int().min(0).nullable().optional(),
  nota_global: z.coerce.number().int().min(1).max(5).nullable().optional(),
  valoraciones: z.record(z.string(), z.string()).optional(),
  observaciones: z.string().optional(),
});

// --- Schemas de Logística ---

export const crearArticuloSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  unidad: z.string().min(1, 'La unidad es obligatoria'),
  equipo_id: z.string().uuid().nullable().optional(),
  stock_minimo: z.coerce.number().int().min(0).optional(),
  es_sanitario: z.boolean().optional(),
  descripcion: z.string().nullable().optional().or(z.literal('')),
  observaciones_stock: z.string().nullable().optional().or(z.literal('')),
});

export const crearMovimientoSchema = z.object({
  articulo_id: z.string().uuid('Selecciona un artículo válido'),
  tipo: z.enum(TIPO_MOVIMIENTO).optional(),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  equipo_id: z.string().uuid().nullable().optional(),
  motivo: z.string().nullable().optional().or(z.literal('')),
});

// --- Schemas de Mensajes ---

export const enviarMensajeSchema = z.object({
  equipo_id: z.string().uuid('Selecciona un equipo válido'),
  asunto: z.string().min(1, 'El asunto es obligatorio'),
  cuerpo: z.string().min(1, 'El mensaje es obligatorio'),
  requiere_confirmacion: z.boolean().optional(),
});

// --- Schemas de Usuarios ---

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol_id: z.string().uuid('Selecciona un rol válido'),
});

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  rol_id: z.string().uuid('Selecciona un rol válido').optional(),
});

// --- Schemas de Entrenadores ---

const CATEGORIA_EJERCICIO = ['táctico', 'técnica_individual', 'portero', 'físico'] as const;

export const crearEntrenadorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  titulacion: z.string().optional().or(z.literal('')),
  especialidad: z.string().optional().or(z.literal('')),
});

export const actualizarEntrenadorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  titulacion: z.string().optional().or(z.literal('')),
  especialidad: z.string().optional().or(z.literal('')),
  activo: z.boolean().optional(),
});

export const crearEjercicioSchema = z.object({
  categoria: z.enum(CATEGORIA_EJERCICIO, { message: 'Selecciona una categoría' }),
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().optional().or(z.literal('')),
  objetivo_principal: z.string().optional().or(z.literal('')),
  objetivo_secundario_1: z.string().optional().or(z.literal('')),
  objetivo_secundario_2: z.string().optional().or(z.literal('')),
  entrenador_creador_id: z.string().uuid().nullable().optional(),
});

export const actualizarEjercicioSchema = z.object({
  categoria: z.enum(CATEGORIA_EJERCICIO).optional(),
  titulo: z.string().min(1, 'El título es obligatorio').optional(),
  descripcion: z.string().optional().or(z.literal('')),
  objetivo_principal: z.string().optional().or(z.literal('')),
  objetivo_secundario_1: z.string().optional().or(z.literal('')),
  objetivo_secundario_2: z.string().optional().or(z.literal('')),
});

export const crearSesionEntrenamientoSchema = z.object({
  evento_id: z.string().uuid('Evento no válido'),
  objetivo_principal: z.string().optional().or(z.literal('')),
  objetivo_secundario_a: z.string().optional().or(z.literal('')),
  objetivo_secundario_b: z.string().optional().or(z.literal('')),
  observaciones_entrenador: z.string().optional().or(z.literal('')),
  ejercicio_ids: z.array(z.string().uuid()).optional(),
});

export const asignarEquipoEntrenadorSchema = z.object({
  equipo_id: z.string().uuid('Selecciona un equipo válido'),
  temporada: z.string().min(1, 'La temporada es obligatoria'),
});

// --- Schemas de Formación ---

export const crearCursoFormacionSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  nivel: z.enum(['principiante', 'intermedio', 'avanzado']).optional(),
  descripcion: z.string().optional().or(z.literal('')),
  contenido_url: z.string().url('URL no válida').optional().or(z.literal('')),
  pdf_url: z.string().url('URL no válida').optional().or(z.literal('')),
  titulo_pdf: z.string().optional().or(z.literal('')),
  duracion_minutos: z.coerce.number().int().min(0).optional(),
});

export const actualizarCursoFormacionSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  nivel: z.enum(['principiante', 'intermedio', 'avanzado']).optional(),
  descripcion: z.string().optional().or(z.literal('')),
  contenido_url: z.string().url('URL no válida').optional().or(z.literal('')),
  pdf_url: z.string().url('URL no válida').optional().or(z.literal('')),
  titulo_pdf: z.string().optional().or(z.literal('')),
  duracion_minutos: z.coerce.number().int().min(0).optional(),
  activo: z.boolean().optional(),
  destacado: z.boolean().optional(),
});

// --- Schemas de Scouting Rivales ---

export const crearRivalScoutingSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  temporada: z.string().min(1, 'La temporada es obligatoria'),
  sistema_defensivo: z.string().optional().or(z.literal('')),
  sistema_ofensivo: z.string().optional().or(z.literal('')),
  puntos_fuertes: z.string().optional().or(z.literal('')),
  puntos_debiles: z.string().optional().or(z.literal('')),
  jugadas_pizarra: z.string().optional().or(z.literal('')),
  notas: z.string().optional().or(z.literal('')),
  videos: z
    .array(
      z.object({
        url: z.string().url('URL no válida'),
        descripcion: z.string().min(1, 'La descripción es obligatoria'),
      })
    )
    .optional(),
});

// --- Tipos exportados ---

export type CrearJugadora = z.infer<typeof crearJugadoraSchema>;
export type ActualizarJugadora = z.infer<typeof actualizarJugadoraSchema>;
export type AsignarEquipo = z.infer<typeof asignarEquipoSchema>;
export type CrearTutor = z.infer<typeof crearTutorSchema>;
export type CrearEquipo = z.infer<typeof crearEquipoSchema>;
export type CrearEvento = z.infer<typeof crearEventoSchema>;
export type CrearLesion = z.infer<typeof crearLesionSchema>;
export type CrearSesionPsicologia = z.infer<typeof crearSesionPsicologiaSchema>;
export type CrearFichaScouting = z.infer<typeof crearFichaScoutingSchema>;
export type CrearInformeScouting = z.infer<typeof crearInformeScoutingSchema>;
export type CrearArticulo = z.infer<typeof crearArticuloSchema>;
export type CrearMovimiento = z.infer<typeof crearMovimientoSchema>;
export type EnviarMensaje = z.infer<typeof enviarMensajeSchema>;
export type CrearUsuario = z.infer<typeof crearUsuarioSchema>;
export type CrearEntrenador = z.infer<typeof crearEntrenadorSchema>;
export type ActualizarEntrenador = z.infer<typeof actualizarEntrenadorSchema>;
export type CrearEjercicio = z.infer<typeof crearEjercicioSchema>;
export type ActualizarEjercicio = z.infer<typeof actualizarEjercicioSchema>;
export type CrearSesionEntrenamiento = z.infer<typeof crearSesionEntrenamientoSchema>;
export type AsignarEquipoEntrenador = z.infer<typeof asignarEquipoEntrenadorSchema>;
