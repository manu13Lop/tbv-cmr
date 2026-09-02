-- Add DNI column to jugadoras table
ALTER TABLE jugadoras ADD COLUMN IF NOT EXISTS dni TEXT;
