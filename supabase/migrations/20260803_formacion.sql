-- ============================================
-- Migración: Módulo de Formación Deportiva (Balonmano)
-- Fecha: 2026-08-03
-- ============================================

-- 1. Tabla formacion_cursos (cursos y talleres)
CREATE TABLE IF NOT EXISTS formacion_cursos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE,
  categoria TEXT NOT NULL CHECK (categoria IN ('tactica', 'fisico', 'reglamento', 'videos', 'psicologia', 'liderazgo')),
  descripcion TEXT,
  contenido_url TEXT,
  duracion_minutos INT DEFAULT 0,
  nivel TEXT CHECK (nivel IN ('principiante', 'intermedio', 'avanzado')) DEFAULT 'intermedio',
  activo BOOLEAN DEFAULT TRUE,
  destacado BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  titulo_pdf TEXT,
  autor_usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla formacion_lecciones (lecciones dentro de cursos)
CREATE TABLE IF NOT EXISTS formacion_lecciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES formacion_cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  slug TEXT,
  orden INT DEFAULT 0,
  tipo TEXT NOT NULL CHECK (tipo IN ('video', 'texto', 'pdf', 'imagen')) DEFAULT 'video',
  contenido_url TEXT,
  contenido_texto TEXT,
  duracion_minutos INT DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla formacion_quizzes (exámenes y quizzes)
CREATE TABLE IF NOT EXISTS formacion_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES formacion_cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('tactica', 'fisico', 'reglamento', 'videos', 'psicologia', 'liderazgo')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla formacion_quiz_preguntas (preguntas de quizzes)
CREATE TABLE IF NOT EXISTS formacion_quiz_preguntas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES formacion_quizzes(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  opciones JSONB,
  respuesta_correcta TEXT,
  orden INT DEFAULT 0
);

-- 5. Tabla formacion_progreso (progreso de usuarios en cursos)
CREATE TABLE IF NOT EXISTS formacion_progreso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES formacion_cursos(id) ON DELETE CASCADE,
  leccion_actual_id UUID REFERENCES formacion_lecciones(id) ON DELETE SET NULL,
  porcentaje INT DEFAULT 0 CHECK (porcentaje BETWEEN 0 AND 100),
  completado BOOLEAN DEFAULT FALSE,
  completado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, curso_id)
);

-- 6. Tabla formacion_quiz_resultados (resultados de quizzes)
CREATE TABLE IF NOT EXISTS formacion_quiz_resultados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES formacion_quizzes(id) ON DELETE CASCADE,
  puntuacion INT NOT NULL CHECK (puntuacion BETWEEN 0 AND 100),
  respuestas JSONB,
  completado_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla formacion_certificados (certificados obtenidos)
CREATE TABLE IF NOT EXISTS formacion_certificados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES formacion_cursos(id) ON DELETE CASCADE,
  puntuacion_final INT CHECK (puntuacion_final BETWEEN 0 AND 100),
  emitido_at TIMESTAMPTZ DEFAULT NOW(),
  codigo_certificado TEXT UNIQUE
);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE formacion_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_quiz_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_progreso ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_quiz_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacion_certificados ENABLE ROW LEVEL SECURITY;

-- formacion_cursos
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver cursos"
    ON formacion_cursos FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios master pueden gestionar cursos"
    ON formacion_cursos FOR ALL
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true))
    WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- formacion_lecciones
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver lecciones activas"
    ON formacion_lecciones FOR SELECT
    USING (auth.role() = 'authenticated' AND activo = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios master pueden gestionar lecciones"
    ON formacion_lecciones FOR ALL
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true))
    WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- formacion_quizzes
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver quizzes activos"
    ON formacion_quizzes FOR SELECT
    USING (auth.role() = 'authenticated' AND activo = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios master pueden gestionar quizzes"
    ON formacion_quizzes FOR ALL
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true))
    WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- formacion_quiz_preguntas
DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver preguntas"
    ON formacion_quiz_preguntas FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios master pueden gestionar preguntas"
    ON formacion_quiz_preguntas FOR ALL
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true))
    WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- formacion_progreso
DO $$ BEGIN
  CREATE POLICY "Usuarios pueden ver y actualizar su propio progreso"
    ON formacion_progreso FOR SELECT
    USING (usuario_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios pueden crear/actualizar su progreso"
    ON formacion_progreso FOR INSERT
    WITH CHECK (usuario_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios pueden actualizar su progreso"
    ON formacion_progreso FOR UPDATE
    USING (usuario_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios master pueden ver todo el progreso"
    ON formacion_progreso FOR SELECT
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- formacion_quiz_resultados
DO $$ BEGIN
  CREATE POLICY "Usuarios pueden ver sus resultados"
    ON formacion_quiz_resultados FOR SELECT
    USING (usuario_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios pueden crear sus resultados"
    ON formacion_quiz_resultados FOR INSERT
    WITH CHECK (usuario_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios master pueden ver todos los resultados"
    ON formacion_quiz_resultados FOR SELECT
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- formacion_certificados
DO $$ BEGIN
  CREATE POLICY "Usuarios pueden ver sus certificados"
    ON formacion_certificados FOR SELECT
    USING (usuario_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios master pueden ver todos los certificados"
    ON formacion_certificados FOR SELECT
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_formacion_cursos_categoria ON formacion_cursos(categoria);
CREATE INDEX IF NOT EXISTS idx_formacion_cursos_destacado ON formacion_cursos(destacado, activo);
CREATE INDEX IF NOT EXISTS idx_formacion_lecciones_curso ON formacion_lecciones(curso_id, orden);
CREATE INDEX IF NOT EXISTS idx_formacion_quiz_preguntas_quiz ON formacion_quiz_preguntas(quiz_id, orden);
CREATE INDEX IF NOT EXISTS idx_formacion_progreso_usuario ON formacion_progreso(usuario_id, curso_id);
CREATE INDEX IF NOT EXISTS idx_formacion_quiz_resultados_usuario ON formacion_quiz_resultados(usuario_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_formacion_certificados_usuario ON formacion_certificados(usuario_id, curso_id);

-- ============================================
-- Datos iniciales: Cursos de balonmano
-- ============================================
INSERT INTO formacion_cursos (titulo, slug, categoria, descripcion, duracion_minutos, nivel, destacado) VALUES
  ('Tácticas de Ataque en Balonmano', 'tecnicas-ataque-balonmano', 'tactica',
   'Domina las tácticas Ofensivas más efectivas: juego posicional, contraataque, 6-0, 5+1, 4+2.',
   120, 'intermedio', true),
  ('Tácticas Defensivas en Balonmano', 'tecnicas-defensa-balonmano', 'tactica',
   'Aprende las defensas 6-0, 5+1, 4+2, la defensa de portero y cómo neutralizar el juego del rival.',
   90, 'intermedio', true),
  ('Reglamento de Balonmano 2024', 'reglamento-balonmano-2024', 'reglamento',
   'Todo lo que necesitas saber sobre el reglamento oficial de la Liga de Fútbol Sala y Balonmano femenino.',
   180, 'intermedio', false),
  ('Ejercicios de Calentamiento Específico', 'calentamiento-balonmano', 'fisico',
   'Prepara a tu equipo con ejercicios de movilidad, activación neuromuscular y coordinación con balón.',
   60, 'principiante', true),
  ('Porteras: Técnicas y Posicionamiento', 'porteras-tecnicas-posicionamiento', 'tecnica',
   'Domina las paradas, el juego aéreo, el posicionamiento en 6m y la comunicación con la defensa.',
   100, 'avanzado', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Storage: Bucket para PDFs de formación
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('formacion', 'formacion', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'video/mp4', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- RLS para storage.objects
CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden ver archivos de formación"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'formacion' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuarios master pueden subir archivos de formación"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'formacion' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuarios master pueden actualizar archivos de formación"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'formacion' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuarios master pueden eliminar archivos de formación"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'formacion' AND auth.role() = 'authenticated');