-- COPA APDES 2026 — endurecimiento para operación real.
-- Ejecutar UNA VEZ en Neon SQL Editor antes de la Copa.
-- No borra partidos, resultados ni eventos.

BEGIN;

ALTER TABLE copa_matches
  ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 900;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'copa_matches_duration_seconds_check'
  ) THEN
    ALTER TABLE copa_matches
      ADD CONSTRAINT copa_matches_duration_seconds_check
      CHECK (duration_seconds BETWEEN 60 AND 3600);
  END IF;
END $$;

-- El setup original no contemplaba tarjeta roja.
-- Quitamos únicamente el CHECK de la columna type y lo recreamos con los 4 eventos válidos.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'copa_match_events'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%type%'
  LOOP
    EXECUTE format(
      'ALTER TABLE copa_match_events DROP CONSTRAINT %I',
      constraint_name
    );
  END LOOP;
END $$;

ALTER TABLE copa_match_events
  ADD CONSTRAINT copa_match_events_type_check
  CHECK (type IN ('goal', 'green_card', 'yellow_card', 'red_card'));

COMMIT;
