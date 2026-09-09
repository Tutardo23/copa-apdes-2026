import {
  clearSharedSimulation,
  getSharedSimulation,
  removeSharedSimulation,
  saveSharedSimulation,
} from "@/src/lib/simulation-data";
import type {
  SimulatedCard,
  SimulatedGoal,
  SimulatedResult,
} from "@/src/lib/simulation-types";
import { verifyAdminPassword } from "@/src/lib/tournament-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password"))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    return Response.json(
      { results: await getSharedSimulation() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "Falta crear la tabla de simulación. Ejecutá database/2026-09-09-simulacion-compartida.sql en Neon.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password"))) {
    return Response.json(
      { error: "La sesión de administrador venció. Volvé a ingresar." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      matchId?: number;
      result?: unknown;
    };

    if (body.action === "clear") {
      await clearSharedSimulation();
    } else if (body.action === "remove") {
      const matchId = Number(body.matchId);
      if (!Number.isInteger(matchId)) throw new Error("Partido inválido.");
      await removeSharedSimulation(matchId);
    } else if (body.action === "save") {
      const matchId = Number(body.matchId);
      if (!Number.isInteger(matchId)) throw new Error("Partido inválido.");
      await saveSharedSimulation(matchId, normalizeResult(body.result));
    } else {
      throw new Error("Acción inválida.");
    }

    return Response.json({ results: await getSharedSimulation() });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la simulación.",
      },
      { status: 400 },
    );
  }
}

function normalizeResult(value: unknown): SimulatedResult {
  const raw = (value ?? {}) as Partial<SimulatedResult>;
  const scoreA = cleanScore(raw.scoreA);
  const scoreB = cleanScore(raw.scoreB);

  return {
    scoreA,
    scoreB,
    goalsA: normalizeGoals(raw.goalsA, scoreA),
    goalsB: normalizeGoals(raw.goalsB, scoreB),
    cardsA: normalizeCards(raw.cardsA),
    cardsB: normalizeCards(raw.cardsB),
    penalties:
      scoreA === scoreB ? normalizePenalties(raw.penalties) : null,
  };
}

function cleanScore(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(99, Math.trunc(number)));
}

function normalizeGoals(
  value: SimulatedGoal[] | undefined,
  max: number,
): SimulatedGoal[] {
  if (!Array.isArray(value)) return [];

  const next: SimulatedGoal[] = [];
  let assigned = 0;

  for (const item of value) {
    const player = String(item?.player ?? "").trim().slice(0, 80);
    const count = Math.max(
      1,
      Math.min(20, Math.trunc(Number(item?.count) || 1)),
    );

    if (!player || assigned >= max) continue;

    const allowed = Math.min(count, max - assigned);
    next.push({ player, count: allowed });
    assigned += allowed;
  }

  return next;
}

function normalizeCards(
  value: SimulatedCard[] | undefined,
): SimulatedCard[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      player: String(item?.player ?? "").trim().slice(0, 80),
      type: item?.type,
      count: Math.max(
        1,
        Math.min(10, Math.trunc(Number(item?.count) || 1)),
      ),
    }))
    .filter(
      (item): item is SimulatedCard =>
        Boolean(item.player) &&
        ["green_card", "yellow_card", "red_card"].includes(
          String(item.type),
        ),
    );
}

function normalizePenalties(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, "").replace(":", "-");
  const match = normalized.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match || match[1] === match[2]) return null;
  return `${Number(match[1])}-${Number(match[2])}`;
}
