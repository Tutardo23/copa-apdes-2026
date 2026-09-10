-- COPA APDES 2026
-- Simulación por tandas + cuenta regresiva.
-- Ejecutar UNA VEZ en Neon SQL Editor.
-- NO borra ni modifica copa_matches ni copa_match_events.

BEGIN;

ALTER TABLE copa_simulation_results
  ADD COLUMN IF NOT EXISTS elapsed_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 900,
  ADD COLUMN IF NOT EXISTS is_running boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS clock_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS period integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'por_jugar',
  ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'copa_simulation_elapsed_seconds_check'
  ) THEN
    ALTER TABLE copa_simulation_results
      ADD CONSTRAINT copa_simulation_elapsed_seconds_check
      CHECK (elapsed_seconds >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'copa_simulation_duration_seconds_check'
  ) THEN
    ALTER TABLE copa_simulation_results
      ADD CONSTRAINT copa_simulation_duration_seconds_check
      CHECK (duration_seconds BETWEEN 60 AND 3600);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'copa_simulation_period_check'
  ) THEN
    ALTER TABLE copa_simulation_results
      ADD CONSTRAINT copa_simulation_period_check
      CHECK (period BETWEEN 1 AND 4);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'copa_simulation_status_check'
  ) THEN
    ALTER TABLE copa_simulation_results
      ADD CONSTRAINT copa_simulation_status_check
      CHECK (status IN ('por_jugar', 'en_curso', 'finalizado'));
  END IF;
END $$;

COMMIT;
