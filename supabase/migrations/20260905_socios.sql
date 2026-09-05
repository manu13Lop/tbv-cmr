-- =====================================================================
-- MIGRACIÓN: SOCIOS — Gestión de socios del club + consentimiento RGPD
-- =====================================================================

-- ============ TABLA SOCIOS ============
CREATE TABLE IF NOT EXISTS socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_socio TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni TEXT UNIQUE,
  email TEXT,
  telefono TEXT,
  fecha_nacimiento DATE,
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  token_consentimiento UUID DEFAULT gen_random_uuid(),
  consentimiento_estado TEXT NOT NULL DEFAULT 'pendiente',
  consentimiento_fecha TIMESTAMPTZ,
  consentimiento_ip TEXT,
  consentimiento_user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ TABLA PAGOS ============
CREATE TABLE IF NOT EXISTS socios_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id UUID NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  importe NUMERIC(10,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha_pago TIMESTAMPTZ,
  metodo_pago TEXT,
  referencia TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ PERMISOS ============
INSERT INTO permisos (nombre, descripcion) VALUES
  ('socios.leer', 'Ver socios y datos del club'),
  ('socios.editar', 'Crear, editar, eliminar socios y gestionar pagos')
ON CONFLICT (nombre) DO NOTHING;

-- ============ RLS SOCIOS ============
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Master full access" ON socios
    FOR ALL USING (EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Socios leer" ON socios
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM usuarios u
        JOIN rol_permiso rp ON rp.rol_id = u.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE u.id = auth.uid() AND p.nombre = 'socios.leer'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Socios editar" ON socios
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM usuarios u
        JOIN rol_permiso rp ON rp.rol_id = u.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE u.id = auth.uid() AND p.nombre = 'socios.editar'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Socios actualizar" ON socios
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM usuarios u
        JOIN rol_permiso rp ON rp.rol_id = u.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE u.id = auth.uid() AND p.nombre = 'socios.editar'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Socios eliminar" ON socios
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM usuarios u
        JOIN rol_permiso rp ON rp.rol_id = u.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE u.id = auth.uid() AND p.nombre = 'socios.editar'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ RLS PAGOS ============
ALTER TABLE socios_pagos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Master full access pagos" ON socios_pagos
    FOR ALL USING (EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_master = true
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Pagos leer" ON socios_pagos
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM usuarios u
        JOIN rol_permiso rp ON rp.rol_id = u.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE u.id = auth.uid() AND p.nombre = 'socios.leer'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Pagos editar" ON socios_pagos
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM usuarios u
        JOIN rol_permiso rp ON rp.rol_id = u.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE u.id = auth.uid() AND p.nombre = 'socios.editar'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Pagos actualizar" ON socios_pagos
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM usuarios u
        JOIN rol_permiso rp ON rp.rol_id = u.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE u.id = auth.uid() AND p.nombre = 'socios.editar'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Pagos eliminar" ON socios_pagos
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM usuarios u
        JOIN rol_permiso rp ON rp.rol_id = u.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE u.id = auth.uid() AND p.nombre = 'socios.editar'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ ÍNDICES ============
CREATE INDEX IF NOT EXISTS idx_socios_dni ON socios(dni);
CREATE INDEX IF NOT EXISTS idx_socios_email ON socios(email);
CREATE INDEX IF NOT EXISTS idx_socios_numero ON socios(numero_socio);
CREATE INDEX IF NOT EXISTS idx_socios_token ON socios(token_consentimiento);
CREATE INDEX IF NOT EXISTS idx_socios_pagos_socio ON socios_pagos(socio_id);
CREATE INDEX IF NOT EXISTS idx_socios_pagos_estado ON socios_pagos(estado);
