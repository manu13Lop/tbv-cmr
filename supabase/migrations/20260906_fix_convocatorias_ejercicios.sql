-- Migration: Add missing columns for convocatorias junction table and ejercicios
-- Date: 2026-09-06
-- Purpose: Fix convocatorias/[id] and entrenadores/[id] detail pages (runtime errors)

-- 1. convocatorias: add junction table columns (player call-up tracking)
ALTER TABLE convocatorias ADD COLUMN IF NOT EXISTS jugadora_id UUID REFERENCES jugadoras(id) ON DELETE CASCADE;
ALTER TABLE convocatorias ADD COLUMN IF NOT EXISTS convocada BOOLEAN DEFAULT false;
ALTER TABLE convocatorias ADD COLUMN IF NOT EXISTS confirmada BOOLEAN DEFAULT false;
ALTER TABLE convocatorias ADD COLUMN IF NOT EXISTS asistio BOOLEAN DEFAULT false;
ALTER TABLE convocatorias ADD COLUMN IF NOT EXISTS notificacion_enviada BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_convocatorias_jugadora ON convocatorias(jugadora_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_convocatorias_evento_jugadora ON convocatorias(evento_id, jugadora_id) WHERE jugadora_id IS NOT NULL;

-- 2. ejercicios: add columns referenced by code but missing from DB
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'sin_categoria';
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS objetivo_principal TEXT;
