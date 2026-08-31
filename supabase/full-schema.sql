-- ============================================
-- FULL SCHEMA: CMR-TBV (New Project Setup)
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  rol_id UUID,
  es_master BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS rol_permiso (
  rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id UUID NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE IF NOT EXISTS usuario_permisos (
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  permiso_id UUID NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, permiso_id)
);

-- Now add FK for usuarios.rol_id
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL;

-- ============================================
-- SPORT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  temporada TEXT NOT NULL,
  federada BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS jugadoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  codigo_interno TEXT,
  email TEXT,
  talla_camiseta_entreno TEXT,
  talla_camiseta_partido TEXT,
  talla_calzona TEXT,
  talla_chandal TEXT,
  talla_chaqueton TEXT,
  reconocimiento_medico_estado TEXT DEFAULT 'pendiente',
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jugadora_equipo_temporada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jugadora_id UUID NOT NULL REFERENCES jugadoras(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  temporada TEXT NOT NULL,
  dorsal TEXT,
  posicion TEXT
);

CREATE TABLE IF NOT EXISTS tutores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jugadora_id UUID NOT NULL REFERENCES jugadoras(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  parentesco TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entrenadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  titulacion TEXT,
  especialidad TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entrenador_equipo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrenador_id UUID NOT NULL REFERENCES entrenadores(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  temporada TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'entrenador'
);

-- ============================================
-- EVENTS & CONVOCATORIAS
-- ============================================

CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL,
  lugar TEXT,
  rival TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS convocatorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  titulo TEXT,
  descripcion TEXT,
  fecha DATE,
  hora TIME,
  lugar TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EJERCICIOS
-- ============================================

CREATE TABLE IF NOT EXISTS ejercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  seccion_principal TEXT,
  seccion_secundaria TEXT,
  aspectos_individuales TEXT[] DEFAULT '{}',
  objetivo_primario TEXT,
  objetivo_secundario TEXT,
  objetivo_terciario TEXT,
  observaciones TEXT,
  puntos_clave TEXT,
  video_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entrenador_creador_id UUID REFERENCES entrenadores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sesion_entrenamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  objetivo_principal TEXT,
  objetivo_secundario_a TEXT,
  objetivo_secundario_b TEXT,
  observaciones_entrenador TEXT,
  valoracion_entrenamiento TEXT
);

CREATE TABLE IF NOT EXISTS sesion_entrenamiento_ejercicio (
  sesion_id UUID NOT NULL REFERENCES sesion_entrenamiento(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  orden INT DEFAULT 0,
  duracion_minutos INT,
  notas TEXT,
  PRIMARY KEY (sesion_id, ejercicio_id)
);

CREATE TABLE IF NOT EXISTS ejercicio_archivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ejercicio_id UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf', 'imagen', 'video', 'enlace')),
  url TEXT NOT NULL,
  nombre TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ejercicio_valoraciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ejercicio_id UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puntuacion INT NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ejercicio_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS ejercicio_variantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ejercicio_id UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  nivel_dificultad TEXT CHECK (nivel_dificultad IN ('basico', 'intermedio', 'avanzado')) DEFAULT 'intermedio',
  notas_entrenador TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MEDICAL
-- ============================================

CREATE TABLE IF NOT EXISTS lesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jugadora_id UUID NOT NULL REFERENCES jugadoras(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  fecha_lesion DATE NOT NULL,
  gravedad TEXT,
  diagnostico_inicial TEXT,
  tipo_baja TEXT NOT NULL DEFAULT 'baja_total',
  estado TEXT NOT NULL DEFAULT 'activa',
  medico_usuario_id UUID REFERENCES usuarios(id),
  autor_nombre_snapshot TEXT,
  autor_puesto_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seguimientos_lesion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesion_id UUID NOT NULL REFERENCES lesiones(id) ON DELETE CASCADE,
  tipo_entrada TEXT NOT NULL,
  tratamiento_aplicado TEXT,
  evolucion TEXT,
  tipo_baja TEXT,
  es_alta BOOLEAN DEFAULT false,
  fecha_hora TIMESTAMPTZ DEFAULT now(),
  autor_usuario_id UUID REFERENCES usuarios(id),
  autor_nombre_snapshot TEXT,
  autor_puesto_snapshot TEXT
);

CREATE TABLE IF NOT EXISTS psicologia_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_sesion TEXT NOT NULL,
  jugadora_id UUID REFERENCES jugadoras(id),
  equipo_id UUID REFERENCES equipos(id),
  fecha_hora TIMESTAMPTZ NOT NULL,
  tema TEXT NOT NULL,
  objetivos TEXT,
  desarrollo TEXT,
  acuerdos TEXT,
  estado TEXT NOT NULL DEFAULT 'abierta',
  autor_usuario_id UUID NOT NULL REFERENCES usuarios(id),
  autor_nombre_snapshot TEXT,
  autor_puesto_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reconocimientos_medicos_convocatoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temporada TEXT NOT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL,
  lugar TEXT,
  mensaje_instrucciones TEXT,
  notas TEXT,
  medico_usuario_id UUID REFERENCES usuarios(id),
  convocatoria_enviada BOOLEAN DEFAULT false,
  fecha_envio_convocatoria TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reconocimientos_medicos_jugadora (
  convocatoria_id UUID NOT NULL REFERENCES reconocimientos_medicos_convocatoria(id) ON DELETE CASCADE,
  jugadora_id UUID NOT NULL REFERENCES jugadoras(id) ON DELETE CASCADE,
  resultado TEXT DEFAULT 'pendiente',
  fecha_realizado DATE,
  observaciones TEXT,
  PRIMARY KEY (convocatoria_id, jugadora_id)
);

-- ============================================
-- FORMACION
-- ============================================

CREATE TABLE IF NOT EXISTS formacion_cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  duracion_horas INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formacion_lecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES formacion_cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  contenido TEXT,
  orden INT DEFAULT 0,
  duracion_minutos INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formacion_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES formacion_cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tiempo_limite_minutos INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formacion_quiz_preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES formacion_quizzes(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'multiple',
  opciones JSONB,
  respuesta_correcta TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formacion_progreso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES formacion_cursos(id) ON DELETE CASCADE,
  leccion_id UUID REFERENCES formacion_lecciones(id) ON DELETE SET NULL,
  completada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, leccion_id)
);

CREATE TABLE IF NOT EXISTS formacion_quiz_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES formacion_quizzes(id) ON DELETE CASCADE,
  puntuacion INT DEFAULT 0,
  total_preguntas INT DEFAULT 0,
  aprobado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formacion_certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES formacion_cursos(id) ON DELETE CASCADE,
  fecha_emision TIMESTAMPTZ DEFAULT now(),
  codigo_verificacion TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SCOUTING
-- ============================================

CREATE TABLE IF NOT EXISTS scouting_criterios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL,
  etiqueta TEXT NOT NULL,
  orden INT DEFAULT 999,
  activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS scouting_fichas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jugadora_id UUID REFERENCES jugadoras(id),
  nombre_externo TEXT,
  club_actual TEXT,
  posicion TEXT,
  fecha_nacimiento DATE,
  notas_generales TEXT,
  estado TEXT DEFAULT 'seguimiento',
  autor_usuario_id UUID NOT NULL REFERENCES usuarios(id),
  autor_nombre_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scouting_informes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID REFERENCES scouting_fichas(id),
  jugadora_id UUID REFERENCES jugadoras(id),
  jugadora_externa TEXT,
  equipo_id UUID REFERENCES equipos(id),
  rival TEXT,
  temporada TEXT NOT NULL,
  posicion TEXT,
  edad INT,
  nota_global INT,
  valoraciones JSONB,
  observaciones TEXT,
  fecha TIMESTAMPTZ DEFAULT now(),
  autor_usuario_id UUID NOT NULL REFERENCES usuarios(id),
  autor_nombre_snapshot TEXT,
  autor_puesto_snapshot TEXT
);

CREATE TABLE IF NOT EXISTS scouting_rivales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  temporada TEXT,
  sistema_defensivo TEXT,
  sistema_ofensivo TEXT,
  puntos_fuertes TEXT,
  puntos_debiles TEXT,
  jugadas_pizarra TEXT,
  notas TEXT,
  autor_usuario_id UUID NOT NULL REFERENCES usuarios(id),
  autor_nombre_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scouting_rivales_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rival_id UUID NOT NULL REFERENCES scouting_rivales(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  descripcion TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LOGISTICS
-- ============================================

CREATE TABLE IF NOT EXISTS logistica_articulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  unidad TEXT NOT NULL,
  es_sanitario BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  stock_actual INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logistica_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID NOT NULL REFERENCES logistica_articulos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  cantidad INT NOT NULL,
  motivo TEXT,
  equipo_id UUID REFERENCES equipos(id),
  usuario_id UUID REFERENCES usuarios(id),
  usuario_nombre_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logistica_stock_minimos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID NOT NULL REFERENCES logistica_articulos(id) ON DELETE CASCADE,
  stock_minimo INT DEFAULT 0,
  equipo_id UUID REFERENCES equipos(id),
  observaciones TEXT
);

-- ============================================
-- COMMUNICATION
-- ============================================

CREATE TABLE IF NOT EXISTS mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asunto TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  equipo_id UUID REFERENCES equipos(id),
  requiere_confirmacion BOOLEAN DEFAULT false,
  enviado_por_nombre TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mensajes_destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_id UUID NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
  jugadora_id UUID REFERENCES jugadoras(id),
  tipo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  enviado BOOLEAN DEFAULT false,
  token_confirmacion UUID DEFAULT gen_random_uuid(),
  leido_en TIMESTAMPTZ
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  enlace TEXT,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla TEXT NOT NULL,
  registro_id UUID,
  operacion TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rol_permiso ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadora_equipo_temporada ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrenadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrenador_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE convocatorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesion_entrenamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicio_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicio_valoraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicio_variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimientos_lesion ENABLE ROW LEVEL SECURITY;
ALTER TABLE psicologia_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconocimientos_medicos_convocatoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconocimientos_medicos_jugadora ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_quiz_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_progreso ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_quiz_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_criterios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_fichas ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_informes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_rivales ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_rivales_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistica_articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistica_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistica_stock_minimos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Master bypass for all tables
DO $$ BEGIN
  CREATE POLICY "Master full access" ON usuarios FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON roles FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON permisos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON rol_permiso FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON usuario_permisos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON equipos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON jugadoras FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON jugadora_equipo_temporada FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON tutores FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON entrenadores FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON entrenador_equipo FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON eventos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON convocatorias FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON ejercicios FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON sesion_entrenamiento FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON ejercicio_archivos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON ejercicio_valoraciones FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON ejercicio_variantes FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON lesiones FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON seguimientos_lesion FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON psicologia_sesiones FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON reconocimientos_medicos_convocatoria FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON reconocimientos_medicos_jugadora FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON formacion_cursos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON formacion_lecciones FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON formacion_quizzes FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON formacion_quiz_preguntas FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON formacion_progreso FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON formacion_quiz_resultados FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON formacion_certificados FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON scouting_criterios FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON scouting_fichas FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON scouting_informes FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON scouting_rivales FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON scouting_rivales_videos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON logistica_articulos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON logistica_movimientos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON logistica_stock_minimos FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON mensajes FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON mensajes_destinatarios FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON notificaciones FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Master full access" ON audit_log FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated read access for all tables
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON usuarios FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON roles FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON permisos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON rol_permiso FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON usuario_permisos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON equipos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON jugadoras FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON jugadora_equipo_temporada FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON tutores FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON entrenadores FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON entrenador_equipo FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON eventos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON convocatorias FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON ejercicios FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON sesion_entrenamiento FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON ejercicio_archivos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON ejercicio_valoraciones FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON ejercicio_variantes FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON lesiones FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON seguimientos_lesion FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON psicologia_sesiones FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON reconocimientos_medicos_convocatoria FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON reconocimientos_medicos_jugadora FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON formacion_cursos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON formacion_lecciones FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON formacion_quizzes FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON formacion_quiz_preguntas FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON formacion_progreso FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON formacion_quiz_resultados FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON formacion_certificados FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON scouting_criterios FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON scouting_fichas FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON scouting_informes FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON scouting_rivales FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON scouting_rivales_videos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON logistica_articulos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON logistica_movimientos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON logistica_stock_minimos FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON mensajes FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON mensajes_destinatarios FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON notificaciones FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated read" ON audit_log FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Insert/update/delete policies for authenticated users (own data)
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON ejercicio_valoraciones FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated update own" ON ejercicio_valoraciones FOR UPDATE USING (auth.role() = 'authenticated' AND auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated delete own" ON ejercicio_valoraciones FOR DELETE USING (auth.role() = 'authenticated' AND auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated create" ON notificaciones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated update own" ON notificaciones FOR UPDATE USING (auth.role() = 'authenticated' AND auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON audit_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON ejercicios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON ejercicio_archivos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON ejercicio_variantes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated delete" ON ejercicio_archivos FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated delete" ON ejercicio_variantes FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON equipos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON jugadoras FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON entrenadores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON eventos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON convocatorias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON mensajes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON mensajes_destinatarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON logistica_articulos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON logistica_movimientos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON scouting_fichas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON scouting_informes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON scouting_rivales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON scouting_rivales_videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON lesiones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON seguimientos_lesion FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON psicologia_sesiones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON formacion_progreso FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated write" ON formacion_quiz_resultados FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- SEED DATA: Permisos
-- ============================================

INSERT INTO permisos (nombre, descripcion) VALUES
  ('usuarios.gestionar', 'Gestionar usuarios: crear, editar, eliminar, cambiar roles'),
  ('equipos.leer', 'Ver equipos y jugadoras'),
  ('equipos.editar', 'Crear, editar, eliminar equipos y jugadoras'),
  ('entrenadores.leer', 'Ver entrenadores y asignaciones'),
  ('entrenadores.editar', 'Gestionar entrenadores y asignaciones a equipos'),
  ('convocatorias.leer', 'Ver convocatorias y eventos'),
  ('convocatorias.editar', 'Crear, editar, eliminar convocatorias'),
  ('jugadoras.leer', 'Ver información de jugadoras'),
  ('jugadoras.editar', 'Crear, editar jugadoras'),
  ('sanitario.leer', 'Ver módulo sanitario (lesiones, reconocimientos, psicología)'),
  ('sanitario.editar', 'Gestionar lesiones, reconocimientos, sesiones de psicología'),
  ('scouting.leer', 'Ver módulo scouting (fichas, informes, rivales)'),
  ('scouting.editar', 'Crear, editar, eliminar fichas e informes de scouting'),
  ('formacion.leer', 'Ver módulo formación (cursos, lecciones, quizzes)'),
  ('formacion.editar', 'Crear, editar cursos, lecciones y quizzes'),
  ('logistica.leer', 'Ver módulo logística (artículos, stock, movimientos)'),
  ('logistica.editar', 'Gestionar artículos, stock y movimientos'),
  ('mensajes.leer', 'Ver y enviar mensajes al equipo'),
  ('mensajes.editar', 'Crear, gestionar y eliminar mensajes')
ON CONFLICT (nombre) DO NOTHING;

-- Seed default roles
INSERT INTO roles (nombre) VALUES
  ('directiva'),
  ('director_tecnico'),
  ('entrenador'),
  ('auxiliar'),
  ('sanitario')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_equipos_temporada ON equipos(temporada);
CREATE INDEX IF NOT EXISTS idx_jugadoras_activa ON jugadoras(activa);
CREATE INDEX IF NOT EXISTS idx_jugadora_equipo ON jugadora_equipo_temporada(jugadora_id);
CREATE INDEX IF NOT EXISTS idx_entrenador_equipo ON entrenador_equipo(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_eventos_equipo ON eventos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_convocatorias_evento ON convocatorias(evento_id);
CREATE INDEX IF NOT EXISTS idx_lesiones_jugadora ON lesiones(jugadora_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_lesion ON seguimientos_lesion(lesion_id);
CREATE INDEX IF NOT EXISTS idx_ejercicios_seccion ON ejercicios(seccion_principal);
CREATE INDEX IF NOT EXISTS idx_ejercicios_created_by ON ejercicios(created_by);
CREATE INDEX IF NOT EXISTS idx_ejercicio_archivos_ejercicio ON ejercicio_archivos(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_ejercicio_valoraciones_ejercicio ON ejercicio_valoraciones(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_ejercicio_valoraciones_usuario ON ejercicio_valoraciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ejercicio_variantes_ejercicio ON ejercicio_variantes(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_scouting_fichas_estado ON scouting_fichas(estado);
CREATE INDEX IF NOT EXISTS idx_scouting_informes_ficha ON scouting_informes(ficha_id);
CREATE INDEX IF NOT EXISTS idx_logistica_articulos ON logistica_articulos(categoria);
CREATE INDEX IF NOT EXISTS idx_logistica_movimientos ON logistica_movimientos(articulo_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabla ON audit_log(tabla);
CREATE INDEX IF NOT EXISTS idx_mensajes_destinatarios ON mensajes_destinatarios(mensaje_id);
CREATE INDEX IF NOT EXISTS idx_formacion_progreso_usuario ON formacion_progreso(usuario_id);
