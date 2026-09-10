import "server-only";

import { neon } from "@neondatabase/serverless";
import type {
  SimulatedCard,
  SimulatedEvent,
  SimulatedGoal,
  SimulatedResult,
} from "@/src/lib/simulation-types";

const DEFAULT_DURATION_SECONDS = 15 * 60;

function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta configurar DATABASE_URL.");
  }
  return neon(connectionString);
}

type SimulationRow = Record<string, unknown>;

function toStringOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

function normalizeEvents(value: unknown): SimulatedEvent[] {
  if (!Array.isArray(value)) return [];

  return (value as Array<Record<string, unknown>>)
    .map((raw, index): SimulatedEvent | null => {
      const player = String(raw.player ?? "")
        .trim()
        .slice(0, 80);
      const team = String(raw.team ?? "");
      const type = String(raw.type ?? "");
      const count = Math.max(
        1,
        Math.min(20, Math.trunc(Number(raw.count) || 1)),
      );
      const period = Math.max(
        1,
        Math.min(4, Math.trunc(Number(raw.period) || 1)),
      ) as 1 | 2 | 3 | 4;

      if (
        !player ||
        !["teamA", "teamB"].includes(team) ||
        ![
          "goal",
          "green_card",
          "yellow_card",
          "red_card",
        ].includes(type)
      ) {
        return null;
      }

      return {
        id: String(raw.id ?? `event-${index}`),
        team: team as "teamA" | "teamB",
        type: type as SimulatedEvent["type"],
        player,
        count,
        elapsedSeconds: Math.max(
          0,
          Math.trunc(Number(raw.elapsedSeconds) || 0),
        ),
        period,
        createdAt:
          typeof raw.createdAt === "string"
            ? raw.createdAt
            : new Date(0).toISOString(),
      };
    })
    .filter(
      (event): event is SimulatedEvent => event !== null,
    );
}

function legacyEvents(row: SimulationRow): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  let serial = 0;

  const pushGoals = (
    team: "teamA" | "teamB",
    rawValue: unknown,
  ) => {
    if (!Array.isArray(rawValue)) return;

    for (const item of rawValue as Array<
      Record<string, unknown>
    >) {
      const player = String(item.player ?? "").trim();
      if (!player) continue;

      serial += 1;
      events.push({
        id: `legacy-goal-${serial}`,
        team,
        type: "goal",
        player,
        count: Math.max(
          1,
          Math.trunc(Number(item.count) || 1),
        ),
        elapsedSeconds: 0,
        period: 1,
        createdAt: new Date(0).toISOString(),
      });
    }
  };

  const pushCards = (
    team: "teamA" | "teamB",
    rawValue: unknown,
  ) => {
    if (!Array.isArray(rawValue)) return;

    for (const item of rawValue as Array<
      Record<string, unknown>
    >) {
      const player = String(item.player ?? "").trim();
      const type = String(item.type ?? "");

      if (
        !player ||
        ![
          "green_card",
          "yellow_card",
          "red_card",
        ].includes(type)
      ) {
        continue;
      }

      serial += 1;
      events.push({
        id: `legacy-card-${serial}`,
        team,
        type: type as
          | "green_card"
          | "yellow_card"
          | "red_card",
        player,
        count: Math.max(
          1,
          Math.trunc(Number(item.count) || 1),
        ),
        elapsedSeconds: 0,
        period: 1,
        createdAt: new Date(0).toISOString(),
      });
    }
  };

  pushGoals("teamA", row.goals_a);
  pushGoals("teamB", row.goals_b);
  pushCards("teamA", row.cards_a);
  pushCards("teamB", row.cards_b);

  return events;
}

function deriveLegacy(events: SimulatedEvent[]) {
  const goalsA: SimulatedGoal[] = [];
  const goalsB: SimulatedGoal[] = [];
  const cardsA: SimulatedCard[] = [];
  const cardsB: SimulatedCard[] = [];

  for (const event of events) {
    if (event.type === "goal") {
      const target =
        event.team === "teamA" ? goalsA : goalsB;
      target.push({
        player: event.player,
        count: event.count,
      });
    } else {
      const target =
        event.team === "teamA" ? cardsA : cardsB;
      target.push({
        player: event.player,
        type: event.type,
        count: event.count,
      });
    }
  }

  return { goalsA, goalsB, cardsA, cardsB };
}

export function emptySimulatedResult(): SimulatedResult {
  return {
    scoreA: 0,
    scoreB: 0,
    goalsA: [],
    goalsB: [],
    cardsA: [],
    cardsB: [],
    penalties: null,
    elapsedSeconds: 0,
    durationSeconds: DEFAULT_DURATION_SECONDS,
    isRunning: false,
    clockStartedAt: null,
    period: 1,
    status: "por_jugar",
    events: [],
  };
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
      elapsed_seconds,
      duration_seconds,
      is_running,
      clock_started_at,
      period,
      status,
      events,
      updated_at
    FROM copa_simulation_results
    ORDER BY match_id;
  `;

  const result: Record<number, SimulatedResult> = {};
  const snapshotNow = Date.now();
  const snapshotIso = new Date(snapshotNow).toISOString();

  for (const raw of rows as SimulationRow[]) {
    const matchId = Number(raw.match_id);
    if (!Number.isInteger(matchId)) continue;

    const storedEvents = normalizeEvents(raw.events);
    const events =
      storedEvents.length > 0
        ? storedEvents
        : legacyEvents(raw);
    const legacy = deriveLegacy(events);

    const durationSeconds = Math.max(
      60,
      Math.min(
        3600,
        Math.trunc(
          toNumber(
            raw.duration_seconds,
            DEFAULT_DURATION_SECONDS,
          ),
        ),
      ),
    );

    const storedElapsed = Math.max(
      0,
      Math.trunc(toNumber(raw.elapsed_seconds, 0)),
    );
    const running = toBoolean(raw.is_running);
    const startedAtRaw = raw.clock_started_at;
    const startedAtMs = startedAtRaw
      ? new Date(String(startedAtRaw)).getTime()
      : Number.NaN;
    const extra =
      running && Number.isFinite(startedAtMs)
        ? Math.max(
            0,
            Math.floor((snapshotNow - startedAtMs) / 1000),
          )
        : 0;
    const elapsedSeconds = Math.min(
      durationSeconds,
      storedElapsed + extra,
    );
    const isRunning =
      running && elapsedSeconds < durationSeconds;

    result[matchId] = {
      scoreA: Math.max(
        0,
        Math.trunc(toNumber(raw.score_a, 0)),
      ),
      scoreB: Math.max(
        0,
        Math.trunc(toNumber(raw.score_b, 0)),
      ),
      ...legacy,
      penalties: toStringOrNull(raw.penalties),
      elapsedSeconds,
      durationSeconds,
      isRunning,
      // Importante: al devolver elapsed ya actualizado, usamos
      // snapshotIso para no volver a sumar el mismo tramo al pausar.
      clockStartedAt: isRunning ? snapshotIso : null,
      period: Math.max(
        1,
        Math.min(
          4,
          Math.trunc(toNumber(raw.period, 1)),
        ),
      ) as 1 | 2 | 3 | 4,
      status:
        raw.status === "finalizado"
          ? "finalizado"
          : raw.status === "en_curso"
            ? "en_curso"
            : "por_jugar",
      events,
      updatedAt:
        raw.updated_at instanceof Date
          ? raw.updated_at.toISOString()
          : String(raw.updated_at ?? ""),
    };
  }

  return result;
}

export async function saveSharedSimulation(
  matchId: number,
  result: SimulatedResult,
) {
  const sql = database();
  const legacy = deriveLegacy(result.events);

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
      elapsed_seconds,
      duration_seconds,
      is_running,
      clock_started_at,
      period,
      status,
      events,
      updated_at
    )
    VALUES (
      ${matchId},
      ${result.scoreA},
      ${result.scoreB},
      ${JSON.stringify(legacy.goalsA)}::jsonb,
      ${JSON.stringify(legacy.goalsB)}::jsonb,
      ${JSON.stringify(legacy.cardsA)}::jsonb,
      ${JSON.stringify(legacy.cardsB)}::jsonb,
      ${result.penalties},
      ${result.elapsedSeconds},
      ${result.durationSeconds},
      ${result.isRunning},
      ${result.clockStartedAt},
      ${result.period},
      ${result.status},
      ${JSON.stringify(result.events)}::jsonb,
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
      elapsed_seconds = EXCLUDED.elapsed_seconds,
      duration_seconds = EXCLUDED.duration_seconds,
      is_running = EXCLUDED.is_running,
      clock_started_at = EXCLUDED.clock_started_at,
      period = EXCLUDED.period,
      status = EXCLUDED.status,
      events = EXCLUDED.events,
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
