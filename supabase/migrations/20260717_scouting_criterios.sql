CREATE TABLE IF NOT EXISTS scouting_criterios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  etiqueta TEXT NOT NULL,
  categoria TEXT DEFAULT 'general',
  activo BOOLEAN DEFAULT TRUE,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scouting_criterios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados pueden ver criterios"
    ON scouting_criterios FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Master puede gestionar criterios"
    ON scouting_criterios FOR ALL
    USING (
      EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Insertar criterios por defecto
INSERT INTO scouting_criterios (clave, etiqueta, orden) VALUES
  ('influencia_equipo', 'Influencia en su equipo', 1),
  ('influencia_equipo_contrario', 'Influencia en el equipo contrario', 2),
  ('posicion_defensiva', 'Posición defensiva', 3),
  ('posicion_atacante', 'Posición atacante', 4),
  ('juego_con_pivote', 'Juego con pivote', 5),
  ('calidad_pase', 'Calidad de pase', 6),
  ('calidad_continuidad', 'Calidad de continuidad', 7),
  ('calidad_lanzamiento_6m', 'Calidad de lanzamiento 6m', 8),
  ('calidad_lanzamiento_9m', 'Calidad de lanzamiento 9m', 9),
  ('calidad_lanzamiento_contacto', 'Calidad de lanzamiento en contacto', 10),
  ('dureza_mental', 'Dureza mental', 11)
ON CONFLICT (clave) DO NOTHING;
