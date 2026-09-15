-- Copa APDES 2026 — tiempo configurable también en la carga real
-- Ejecutar UNA SOLA VEZ en Neon. No borra partidos, resultados ni eventos.

BEGIN;

ALTER TABLE copa_matches
  ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 900;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copa_matches_duration_seconds_check') THEN
    ALTER TABLE copa_matches ADD CONSTRAINT copa_matches_duration_seconds_check CHECK (duration_seconds BETWEEN 60 AND 3600);
  END IF;
END $$;

COMMIT;
