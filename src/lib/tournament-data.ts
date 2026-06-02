import "server-only";

import { neon } from "@neondatabase/serverless";
import type {
  BulkCreateMatchItem,
  EventType,
  MatchEvent,
  MatchItem,
  MatchStage,
  MatchStatus,
  TeamKey,
} from "@/src/lib/tournament-types";

type MatchRow = {
  id: number;
  day: MatchItem["day"];
  date_label: string;
  time_label: string;
  category: string;
  court: string;
  team_a: string;
  team_b: string;
  score_a: number | null;
  score_b: number | null;
  status: MatchStatus;
  clock_seconds: number;
  period: 1 | 2 | 3 | 4;
  is_running: boolean;
  featured: boolean;
  stage: MatchStage;
  penalties: string | null;
  events: MatchEvent[] | null;
};

function normalizeTimeLabel(value: string) {
  return value
    .trim()
    .replace(/^(\d{1,2}),(\d{2})(.*)$/g, "$1:$2$3")
    .replace(/\s*hs?\.?$/i, " hs");
}

function database() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Falta configurar DATABASE_URL.");
  }

  return neon(connectionString);
}

export async function getMatches(): Promise<MatchItem[]> {
  const sql = database();
  const rows = await sql`
    SELECT
      m.id,
      m.day,
      m.date_label,
      m.time_label,
      m.category,
      m.court,
      m.team_a,
      m.team_b,
      m.score_a,
      m.score_b,
      m.status,
      (
        m.clock_seconds +
        CASE
          WHEN m.is_running AND m.clock_started_at IS NOT NULL
            THEN FLOOR(EXTRACT(EPOCH FROM (NOW() - m.clock_started_at)))::int
          ELSE 0
        END
      )::int AS clock_seconds,
      m.period,
      m.is_running,
      m.featured,
      m.stage,
      m.penalties,
      COALESCE(
        json_agg(
          json_build_object(
            'id', e.id,
            'minute', e.minute,
            'second', e.second,
            'period', e.period,
            'team', e.team,
            'type', e.type,
            'player', e.player
          )
          ORDER BY e.created_at DESC, e.id DESC
        ) FILTER (WHERE e.id IS NOT NULL),
        '[]'::json
      ) AS events
    FROM copa_matches m
    LEFT JOIN copa_match_events e ON e.match_id = m.id
    GROUP BY m.id
    ORDER BY
      CASE m.day WHEN 'dia1' THEN 1 ELSE 2 END,
      replace(replace(m.time_label, ',', ':'), ' hs', ''),
      m.court,
      m.category,
      m.id;
  `;

  return (rows as MatchRow[]).map((row) => ({
    id: row.id,
    day: row.day,
    date: row.date_label,
    timeLabel: normalizeTimeLabel(row.time_label),
    category: row.category,
    court: row.court,
    teamA: row.team_a,
    teamB: row.team_b,
    scoreA: row.score_a,
    scoreB: row.score_b,
    status: row.status,
    clockSeconds: row.clock_seconds,
    period: row.period,
    isRunning: row.is_running,
    featured: row.featured,
    stage: row.stage,
    penalties: row.penalties,
    events: row.events ?? [],
  }));
}

export function verifyAdminPassword(password: string | null) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    throw new Error("Falta configurar ADMIN_PASSWORD.");
  }

  return password === configuredPassword;
}

export async function createMatch(payload: BulkCreateMatchItem) {
  const sql = database();
  await sql`
    INSERT INTO copa_matches (
      day, date_label, time_label, category, court, team_a, team_b, stage, featured
    )
    VALUES (
      ${payload.day}, ${payload.date}, ${normalizeTimeLabel(payload.timeLabel)}, ${payload.category}, ${payload.court},
      ${payload.teamA}, ${payload.teamB}, ${payload.stage}, ${payload.featured}
    );
  `;
}

export async function createMatchesBulk(payload: {
  mode: "append" | "replace";
  matches: BulkCreateMatchItem[];
}) {
  const sql = database();
  const cleanMatches = payload.matches.map((match) => ({
    day: match.day,
    date: match.date.trim(),
    time_label: normalizeTimeLabel(match.timeLabel),
    category: match.category.trim(),
    court: match.court.trim(),
    team_a: match.teamA.trim(),
    team_b: match.teamB.trim(),
    stage: match.stage,
    featured: Boolean(match.featured),
  }));

  if (cleanMatches.length === 0) return;

  const insertQuery = sql`
    INSERT INTO copa_matches (
      day, date_label, time_label, category, court, team_a, team_b, stage, featured
    )
    SELECT
      imported.day,
      imported.date,
      imported.time_label,
      imported.category,
      imported.court,
      imported.team_a,
      imported.team_b,
      imported.stage,
      imported.featured
    FROM jsonb_to_recordset(${JSON.stringify(cleanMatches)}::jsonb) AS imported(
      day text,
      date text,
      time_label text,
      category text,
      court text,
      team_a text,
      team_b text,
      stage text,
      featured boolean
    );
  `;

  if (payload.mode === "replace") {
    await sql.transaction([sql`DELETE FROM copa_matches;`, insertQuery]);
    return;
  }

  await insertQuery;
}

async function getWritableMatch(matchId: number) {
  const sql = database();
  const [match] = await sql`
    SELECT
      id,
      status,
      score_a,
      score_b,
      period,
      (
        clock_seconds +
        CASE
          WHEN is_running AND clock_started_at IS NOT NULL
            THEN FLOOR(EXTRACT(EPOCH FROM (NOW() - clock_started_at)))::int
          ELSE 0
        END
      )::int AS clock_seconds
    FROM copa_matches
    WHERE id = ${matchId};
  `;

  if (!match) {
    throw new Error("El partido no existe.");
  }

  return match as {
    id: number;
    status: MatchStatus;
    score_a: number | null;
    score_b: number | null;
    period: 1 | 2 | 3 | 4;
    clock_seconds: number;
  };
}

export async function addEvent(
  matchId: number,
  payload: { team: TeamKey; type: EventType; player: string }
) {
  const sql = database();
  const match = await getWritableMatch(matchId);

  if (match.status === "finalizado") {
    throw new Error("El partido ya esta finalizado.");
  }

  const minute = Math.floor(match.clock_seconds / 60);
  const second = match.clock_seconds % 60;

  await sql.transaction([
    sql`
      INSERT INTO copa_match_events (match_id, minute, second, period, team, type, player)
      VALUES (${matchId}, ${minute}, ${second}, ${match.period}, ${payload.team}, ${payload.type}, ${payload.player});
    `,
    sql`
      UPDATE copa_matches
      SET
        status = 'en_curso',
        score_a = COALESCE(score_a, 0) + CASE WHEN ${payload.type} = 'goal' AND ${payload.team} = 'teamA' THEN 1 ELSE 0 END,
        score_b = COALESCE(score_b, 0) + CASE WHEN ${payload.type} = 'goal' AND ${payload.team} = 'teamB' THEN 1 ELSE 0 END,
        updated_at = NOW()
      WHERE id = ${matchId};
    `,
  ]);
}

export async function undoLastEvent(matchId: number) {
  const sql = database();
  const [event] = await sql`
    SELECT id, team, type
    FROM copa_match_events
    WHERE match_id = ${matchId}
    ORDER BY created_at DESC, id DESC
    LIMIT 1;
  `;

  if (!event) return;

  await sql.transaction([
    sql`DELETE FROM copa_match_events WHERE id = ${event.id};`,
    sql`
      UPDATE copa_matches
      SET
        score_a = GREATEST(0, COALESCE(score_a, 0) - CASE WHEN ${event.type} = 'goal' AND ${event.team} = 'teamA' THEN 1 ELSE 0 END),
        score_b = GREATEST(0, COALESCE(score_b, 0) - CASE WHEN ${event.type} = 'goal' AND ${event.team} = 'teamB' THEN 1 ELSE 0 END),
        updated_at = NOW()
      WHERE id = ${matchId};
    `,
  ]);
}

export async function toggleClock(matchId: number) {
  const sql = database();
  await sql`
    UPDATE copa_matches
    SET
      clock_seconds = clock_seconds +
        CASE
          WHEN is_running AND clock_started_at IS NOT NULL
            THEN FLOOR(EXTRACT(EPOCH FROM (NOW() - clock_started_at)))::int
          ELSE 0
        END,
      clock_started_at = CASE WHEN is_running THEN NULL ELSE NOW() END,
      is_running = NOT is_running,
      status = CASE WHEN status = 'finalizado' THEN status ELSE 'en_curso' END,
      updated_at = NOW()
    WHERE id = ${matchId} AND status <> 'finalizado';
  `;
}

export async function resetClock(matchId: number) {
  const sql = database();
  await sql`
    UPDATE copa_matches
    SET clock_seconds = 0, clock_started_at = NULL, is_running = FALSE, period = 1, updated_at = NOW()
    WHERE id = ${matchId} AND status <> 'finalizado';
  `;
}

export async function resetMatch(matchId: number) {
  const sql = database();
  await sql.transaction([
    sql`DELETE FROM copa_match_events WHERE match_id = ${matchId};`,
    sql`
      UPDATE copa_matches
      SET
        score_a = NULL,
        score_b = NULL,
        status = 'por_jugar',
        clock_seconds = 0,
        clock_started_at = NULL,
        is_running = FALSE,
        period = 1,
        updated_at = NOW()
      WHERE id = ${matchId};
    `,
  ]);
}

export async function setPeriod(matchId: number, period: 1 | 2 | 3 | 4) {
  const sql = database();
  await sql`
    UPDATE copa_matches SET period = ${period}, updated_at = NOW()
    WHERE id = ${matchId} AND status <> 'finalizado';
  `;
}

export async function finishMatch(matchId: number) {
  const sql = database();
  await sql`
    UPDATE copa_matches
    SET
      clock_seconds = clock_seconds +
        CASE
          WHEN is_running AND clock_started_at IS NOT NULL
            THEN FLOOR(EXTRACT(EPOCH FROM (NOW() - clock_started_at)))::int
          ELSE 0
        END,
      clock_started_at = NULL,
      is_running = FALSE,
      status = 'finalizado',
      updated_at = NOW()
    WHERE id = ${matchId};
  `;
}
