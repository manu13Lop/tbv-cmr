-- ============================================
-- Migración: Módulo de Entrenadores y Ejercicios
-- Fecha: 2026-07-17
-- ============================================

-- 1. Tabla entrenadores
CREATE TABLE IF NOT EXISTS entrenadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  titulacion TEXT,
  especialidad TEXT,
  foto_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla ejercicios (biblioteca compartida del club)
CREATE TABLE IF NOT EXISTS ejercicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entrenador_creador_id UUID REFERENCES entrenadores(id) ON DELETE SET NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('táctico', 'técnica_individual', 'portero', 'físico')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  objetivo_principal TEXT,
  objetivo_secundario_1 TEXT,
  objetivo_secundario_2 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla entrenador_equipo (relación N:N entrenador ↔ equipo)
CREATE TABLE IF NOT EXISTS entrenador_equipo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entrenador_id UUID NOT NULL REFERENCES entrenadores(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  temporada TEXT NOT NULL,
  UNIQUE(entrenador_id, equipo_id, temporada)
);

-- 4. Tabla sesion_entrenamiento (planificación ligada a un evento tipo entrenamiento)
CREATE TABLE IF NOT EXISTS sesion_entrenamiento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE UNIQUE,
  objetivo_principal TEXT,
  objetivo_secundario_a TEXT,
  objetivo_secundario_b TEXT,
  observaciones_entrenador TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla sesion_entrenamiento_ejercicio (ejercicios de una sesión)
CREATE TABLE IF NOT EXISTS sesion_entrenamiento_ejercicio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sesion_id UUID NOT NULL REFERENCES sesion_entrenamiento(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  orden INT DEFAULT 0
);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE entrenadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrenador_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesion_entrenamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesion_entrenamiento_ejercicio ENABLE ROW LEVEL SECURITY;

-- entrenadores
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver entrenadores"
    ON entrenadores FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden crear entrenadores"
    ON entrenadores FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden actualizar entrenadores"
    ON entrenadores FOR UPDATE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden eliminar entrenadores"
    ON entrenadores FOR DELETE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ejercicios
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver ejercicios"
    ON ejercicios FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden crear ejercicios"
    ON ejercicios FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden actualizar ejercicios"
    ON ejercicios FOR UPDATE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden eliminar ejercicios"
    ON ejercicios FOR DELETE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- entrenador_equipo
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver asignaciones"
    ON entrenador_equipo FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden crear asignaciones"
    ON entrenador_equipo FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden eliminar asignaciones"
    ON entrenador_equipo FOR DELETE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- sesion_entrenamiento
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver sesiones"
    ON sesion_entrenamiento FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden crear sesiones"
    ON sesion_entrenamiento FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden actualizar sesiones"
    ON sesion_entrenamiento FOR UPDATE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden eliminar sesiones"
    ON sesion_entrenamiento FOR DELETE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- sesion_entrenamiento_ejercicio
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver ejercicios de sesion"
    ON sesion_entrenamiento_ejercicio FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden crear ejercicios de sesion"
    ON sesion_entrenamiento_ejercicio FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden eliminar ejercicios de sesion"
    ON sesion_entrenamiento_ejercicio FOR DELETE
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ejercicios_categoria ON ejercicios(categoria);
CREATE INDEX IF NOT EXISTS idx_entrenador_equipo_equipo ON entrenador_equipo(equipo_id);
CREATE INDEX IF NOT EXISTS idx_sesion_evento ON sesion_entrenamiento(evento_id);
CREATE INDEX IF NOT EXISTS idx_sesion_ejercicio_sesion ON sesion_entrenamiento_ejercicio(sesion_id);
