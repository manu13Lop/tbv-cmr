-- Tabla de notificaciones in-app
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('convocatoria', 'lesion', 'mensaje', 'reconocimiento', 'general')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  enlace TEXT,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_no_leidas ON notificaciones(usuario_id) WHERE leida = FALSE;

-- RLS: solo ver las propias
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias notificaciones"
  ON notificaciones FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden insertar notificaciones"
  ON notificaciones FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden marcar las suyas como leidas"
  ON notificaciones FOR UPDATE
  USING (auth.uid() = usuario_id);
