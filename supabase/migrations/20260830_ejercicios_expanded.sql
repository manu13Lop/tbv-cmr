-- ============================================
-- Migración: Expansión del módulo de Ejercicios
-- Fecha: 2026-08-30
-- ============================================

-- 1. Expandir tabla ejercicios con todos los campos nuevos
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS seccion_principal TEXT CHECK (seccion_principal IN (
  'dinamica_grupo', 'preparacion_fisica', 'calentamiento', 'activacion',
  'ataque', 'defensa', 'porteria', 'contraataque_1a', 'contraataque_2a', 'contraataque_3a',
  'transicion_at_def', 'transicion_def_at', 'juego_combinado', 'otros'
));

ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS seccion_secundaria TEXT CHECK (seccion_secundaria IN (
  'tecnica_individual', 'tactica_individual', 'tecnica_colectiva', 'tactica_colectiva',
  'aspectos_psicologicos', 'preparacion_fisica', 'otros'
));

ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS aspectos_individuales TEXT[] DEFAULT '{}';

ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS objetivo_primario TEXT;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS objetivo_secundario TEXT;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS objetivo_terciario TEXT;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS puntos_clave TEXT;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Eliminar columnas antiguas que ya no se usan
ALTER TABLE ejercicios DROP COLUMN IF EXISTS categoria;
ALTER TABLE ejercicios DROP COLUMN IF EXISTS imagen_url;
ALTER TABLE ejercicios DROP COLUMN IF EXISTS objetivo_secundario_1;
ALTER TABLE ejercicios DROP COLUMN IF EXISTS objetivo_secundario_2;

-- 2. Tabla de archivos adjuntos de ejercicios
CREATE TABLE IF NOT EXISTS ejercicio_archivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ejercicio_id UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf', 'imagen', 'video', 'enlace')),
  url TEXT NOT NULL,
  nombre TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de valoraciones de ejercicios (sistema tipo Uber/Google)
CREATE TABLE IF NOT EXISTS ejercicio_valoraciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ejercicio_id UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puntuacion INT NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ejercicio_id, usuario_id)
);

-- 4. Tabla de variante de ejercicios
CREATE TABLE IF NOT EXISTS ejercicio_variantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ejercicio_id UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  nivel_dificultad TEXT CHECK (nivel_dificultad IN ('basico', 'intermedio', 'avanzado')) DEFAULT 'intermedio',
  notas_entrenador TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de relación ejercicio ↔ entrenamiento (sesión)
-- Ya existe sesion_entrenamiento_ejercicio, pero la expandimos
ALTER TABLE sesion_entrenamiento_ejercicio ADD COLUMN IF NOT EXISTS duracion_minutos INT;
ALTER TABLE sesion_entrenamiento_ejercicio ADD COLUMN IF NOT EXISTS notas TEXT;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE ejercicio_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicio_valoraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicio_variantes ENABLE ROW LEVEL SECURITY;

-- ejercicio_archivos
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver archivos"
    ON ejercicio_archivos FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden crear archivos"
    ON ejercicio_archivos FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden eliminar archivos"
    ON ejercicio_archivos FOR DELETE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ejercicio_valoraciones
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver valoraciones"
    ON ejercicio_valoraciones FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden crear valoraciones"
    ON ejercicio_valoraciones FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios pueden actualizar su propia valoración"
    ON ejercicio_valoraciones FOR UPDATE
    USING (auth.role() = 'authenticated' AND auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios pueden eliminar su propia valoración"
    ON ejercicio_valoraciones FOR DELETE
    USING (auth.role() = 'authenticated' AND auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ejercicio_variantes
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver variantes"
    ON ejercicio_variantes FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden crear variantes"
    ON ejercicio_variantes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden eliminar variantes"
    ON ejercicio_variantes FOR DELETE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ejercicios_seccion ON ejercicios(seccion_principal);
CREATE INDEX IF NOT EXISTS idx_ejercicios_created_by ON ejercicios(created_by);
CREATE INDEX IF NOT EXISTS idx_ejercicio_archivos_ejercicio ON ejercicio_archivos(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_ejercicio_valoraciones_ejercicio ON ejercicio_valoraciones(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_ejercicio_valoraciones_usuario ON ejercicio_valoraciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ejercicio_variantes_ejercicio ON ejercicio_variantes(ejercicio_id);
