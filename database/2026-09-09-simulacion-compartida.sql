-- Copa APDES 2026
-- Ejecutar UNA sola vez en Neon antes de probar esta versión.
-- No borra partidos ni resultados reales.

BEGIN;

ALTER TABLE copa_match_events
  DROP CONSTRAINT IF EXISTS copa_match_events_type_check;

ALTER TABLE copa_match_events
  ADD CONSTRAINT copa_match_events_type_check
  CHECK (type IN ('goal', 'green_card', 'yellow_card', 'red_card'));

CREATE TABLE IF NOT EXISTS copa_simulation_results (
  match_id integer PRIMARY KEY
    REFERENCES copa_matches(id) ON DELETE CASCADE,
  score_a integer NOT NULL CHECK (score_a BETWEEN 0 AND 99),
  score_b integer NOT NULL CHECK (score_b BETWEEN 0 AND 99),
  goals_a jsonb NOT NULL DEFAULT '[]'::jsonb,
  goals_b jsonb NOT NULL DEFAULT '[]'::jsonb,
  cards_a jsonb NOT NULL DEFAULT '[]'::jsonb,
  cards_b jsonb NOT NULL DEFAULT '[]'::jsonb,
  penalties text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
