import "server-only";

import { neon } from "@neondatabase/serverless";
import type { SimulatedResult } from "@/src/lib/simulation-types";

function database() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Falta configurar DATABASE_URL.");
  }

  return neon(connectionString);
}

export async function getSharedSimulation(): Promise<
  Record<number, SimulatedResult>
> {
  const sql = database();

  const rows = await sql`
    SELECT
      match_id,
      score_a,
      score_b,
      goals_a,
      goals_b,
      cards_a,
      cards_b,
      penalties,
      updated_at
    FROM copa_simulation_results
    ORDER BY match_id;
  `;

  const result: Record<number, SimulatedResult> = {};

  for (const row of rows as Array<Record<string, unknown>>) {
    const matchId = Number(row.match_id);

    result[matchId] = {
      scoreA: Number(row.score_a),
      scoreB: Number(row.score_b),
      goalsA: Array.isArray(row.goals_a) ? row.goals_a : [],
      goalsB: Array.isArray(row.goals_b) ? row.goals_b : [],
      cardsA: Array.isArray(row.cards_a) ? row.cards_a : [],
      cardsB: Array.isArray(row.cards_b) ? row.cards_b : [],
      penalties:
        typeof row.penalties === "string" ? row.penalties : null,
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at ?? ""),
    } as SimulatedResult;
  }

  return result;
}

export async function saveSharedSimulation(
  matchId: number,
  result: SimulatedResult,
) {
  const sql = database();

  await sql`
    INSERT INTO copa_simulation_results (
      match_id,
      score_a,
      score_b,
      goals_a,
      goals_b,
      cards_a,
      cards_b,
      penalties,
      updated_at
    )
    VALUES (
      ${matchId},
      ${result.scoreA},
      ${result.scoreB},
      ${JSON.stringify(result.goalsA)}::jsonb,
      ${JSON.stringify(result.goalsB)}::jsonb,
      ${JSON.stringify(result.cardsA)}::jsonb,
      ${JSON.stringify(result.cardsB)}::jsonb,
      ${result.penalties},
      NOW()
    )
    ON CONFLICT (match_id)
    DO UPDATE SET
      score_a = EXCLUDED.score_a,
      score_b = EXCLUDED.score_b,
      goals_a = EXCLUDED.goals_a,
      goals_b = EXCLUDED.goals_b,
      cards_a = EXCLUDED.cards_a,
      cards_b = EXCLUDED.cards_b,
      penalties = EXCLUDED.penalties,
      updated_at = NOW();
  `;
}

export async function removeSharedSimulation(matchId: number) {
  const sql = database();

  await sql`
    DELETE FROM copa_simulation_results
    WHERE match_id = ${matchId};
  `;
}

export async function clearSharedSimulation() {
  const sql = database();
  await sql`DELETE FROM copa_simulation_results;`;
}
