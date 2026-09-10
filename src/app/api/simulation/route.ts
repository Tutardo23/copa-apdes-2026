import {
  clearSharedSimulation,
  emptySimulatedResult,
  getSharedSimulation,
  removeSharedSimulation,
  saveSharedSimulation,
} from "@/src/lib/simulation-data";
import { hasAdminAccess } from "@/src/lib/admin-session";
import type {
  SimulatedEvent,
  SimulatedResult,
} from "@/src/lib/simulation-types";
import type {
  EventType,
  TeamKey,
} from "@/src/lib/tournament-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasAdminAccess(request)) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 },
    );
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
          "Falta actualizar la tabla de simulación. Ejecutá database/2026-09-10-simulacion-tandas.sql en Neon.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!hasAdminAccess(request)) {
    return Response.json(
      {
        error:
          "La sesión de administrador venció. Volvé a ingresar.",
      },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      matchId?: number;
      matchIds?: number[];
      operation?: "start" | "pause" | "reset" | "finish";
      scoreA?: number;
      scoreB?: number;
      penalties?: string | null;
      finish?: boolean;
      team?: TeamKey;
      type?: EventType;
      player?: string;
      count?: number;
      durationSeconds?: number;
      period?: number;
    };

    if (body.action === "clear") {
      await clearSharedSimulation();
      return Response.json({
        results: await getSharedSimulation(),
      });
    }

    if (body.action === "batch_clock") {
      const matchIds = [
        ...new Set(
          (body.matchIds ?? [])
            .map(Number)
            .filter(Number.isInteger),
        ),
      ].slice(0, 30);

      if (matchIds.length === 0) {
        throw new Error("La tanda no tiene partidos válidos.");
      }

      const operation = body.operation;
      if (
        !operation ||
        !["start", "pause", "reset", "finish"].includes(
          operation,
        )
      ) {
        throw new Error("Acción de tanda inválida.");
      }

      const all = await getSharedSimulation();
      const nowIso = new Date().toISOString();

      for (const matchId of matchIds) {
        const existing = all[matchId];
        const current = normalizeForWrite(
          existing ?? emptySimulatedResult(),
        );

        if (operation === "start") {
          if (current.status === "finalizado") continue;

          if (
            current.elapsedSeconds >= current.durationSeconds
          ) {
            current.elapsedSeconds = 0;
          }

          current.isRunning = true;
          current.clockStartedAt = nowIso;
          current.status = "en_curso";
        }

        if (operation === "pause") {
          if (!existing || !current.isRunning) continue;
          stopClock(current);
        }

        if (operation === "reset") {
          if (!existing) continue;
          current.elapsedSeconds = 0;
          current.clockStartedAt = null;
          current.isRunning = false;
        }

        if (operation === "finish") {
          if (!existing) continue;
          stopClock(current);
          current.status = "finalizado";
        }

        current.updatedAt = nowIso;
        await saveSharedSimulation(
          matchId,
          normalizeForWrite(current),
        );
      }

      return Response.json({
        results: await getSharedSimulation(),
      });
    }

    const matchId = Number(body.matchId);
    if (!Number.isInteger(matchId)) {
      throw new Error("Partido inválido.");
    }

    if (body.action === "remove") {
      await removeSharedSimulation(matchId);
      return Response.json({
        results: await getSharedSimulation(),
      });
    }

    const all = await getSharedSimulation();
    const current = normalizeForWrite(
      all[matchId] ?? emptySimulatedResult(),
    );

    switch (body.action) {
      case "set_score": {
        current.scoreA = cleanScore(body.scoreA);
        current.scoreB = cleanScore(body.scoreB);
        current.penalties =
          current.scoreA === current.scoreB
            ? normalizePenalties(body.penalties)
            : null;

        if (body.finish) {
          current.status = "finalizado";
          stopClock(current);
        } else if (current.status === "por_jugar") {
          current.status = "en_curso";
        }
        break;
      }

      case "event": {
        const team = body.team;
        const type = body.type;
        const player = String(body.player ?? "")
          .trim()
          .slice(0, 80);
        const count = Math.max(
          1,
          Math.min(
            20,
            Math.trunc(Number(body.count) || 1),
          ),
        );

        if (!team || !["teamA", "teamB"].includes(team)) {
          throw new Error("Equipo inválido.");
        }

        if (
          !type ||
          ![
            "goal",
            "green_card",
            "yellow_card",
            "red_card",
          ].includes(type)
        ) {
          throw new Error("Evento inválido.");
        }

        if (!player) {
          throw new Error(
            "Ingresá el nombre de la jugadora.",
          );
        }

        const event: SimulatedEvent = {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`,
          team,
          type,
          player,
          count,
          elapsedSeconds: effectiveElapsed(current),
          period: current.period,
          createdAt: new Date().toISOString(),
        };

        current.events = [...current.events, event];

        if (type === "goal") {
          if (team === "teamA") {
            current.scoreA += count;
          } else {
            current.scoreB += count;
          }
          current.penalties = null;
        }

        if (current.status !== "finalizado") {
          current.status = "en_curso";
        }
        break;
      }

      case "undo": {
        const last = current.events.at(-1);

        if (last) {
          current.events = current.events.slice(0, -1);

          if (last.type === "goal") {
            if (last.team === "teamA") {
              current.scoreA = Math.max(
                0,
                current.scoreA - last.count,
              );
            } else {
              current.scoreB = Math.max(
                0,
                current.scoreB - last.count,
              );
            }
          }
        }
        break;
      }

      case "toggle_clock": {
        if (current.status === "finalizado") {
          throw new Error("El partido ya está finalizado.");
        }

        if (current.isRunning) {
          stopClock(current);
        } else {
          if (
            current.elapsedSeconds >= current.durationSeconds
          ) {
            current.elapsedSeconds = 0;
          }

          current.clockStartedAt =
            new Date().toISOString();
          current.isRunning = true;
          current.status = "en_curso";
        }
        break;
      }

      case "reset_clock": {
        current.elapsedSeconds = 0;
        current.clockStartedAt = null;
        current.isRunning = false;
        break;
      }

      case "set_duration": {
        const durationSeconds = Math.max(
          60,
          Math.min(
            3600,
            Math.trunc(
              Number(body.durationSeconds) || 15 * 60,
            ),
          ),
        );

        const elapsed = effectiveElapsed(current);
        current.durationSeconds = durationSeconds;
        current.elapsedSeconds = Math.min(
          elapsed,
          durationSeconds,
        );
        current.clockStartedAt = current.isRunning
          ? new Date().toISOString()
          : null;
        break;
      }

      case "set_period": {
        const period = Number(body.period);

        if (![1, 2, 3, 4].includes(period)) {
          throw new Error("Período inválido.");
        }

        current.period =
          period as 1 | 2 | 3 | 4;
        current.elapsedSeconds = 0;
        current.clockStartedAt = null;
        current.isRunning = false;
        break;
      }

      case "finish": {
        stopClock(current);
        current.status = "finalizado";
        break;
      }

      case "reset_match": {
        const durationSeconds =
          current.durationSeconds;
        Object.assign(
          current,
          emptySimulatedResult(),
          { durationSeconds },
        );
        break;
      }

      default:
        throw new Error(
          "Acción de simulación inválida.",
        );
    }

    current.updatedAt = new Date().toISOString();
    await saveSharedSimulation(
      matchId,
      normalizeForWrite(current),
    );

    return Response.json({
      results: await getSharedSimulation(),
    });
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

function cleanScore(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(
    0,
    Math.min(99, Math.trunc(number)),
  );
}

function normalizePenalties(value: unknown) {
  if (!value) return null;

  const normalized = String(value)
    .replace(/\s+/g, "")
    .replace(":", "-");
  const match = normalized.match(
    /^(\d{1,2})-(\d{1,2})$/,
  );

  if (!match) return null;

  const a = Number(match[1]);
  const b = Number(match[2]);
  if (a === b) return null;

  return `${a}-${b}`;
}

function effectiveElapsed(
  result: SimulatedResult,
) {
  if (
    !result.isRunning ||
    !result.clockStartedAt
  ) {
    return Math.min(
      result.durationSeconds,
      result.elapsedSeconds,
    );
  }

  const started = new Date(
    result.clockStartedAt,
  ).getTime();

  if (!Number.isFinite(started)) {
    return result.elapsedSeconds;
  }

  const extra = Math.max(
    0,
    Math.floor((Date.now() - started) / 1000),
  );

  return Math.min(
    result.durationSeconds,
    result.elapsedSeconds + extra,
  );
}

function stopClock(result: SimulatedResult) {
  result.elapsedSeconds = effectiveElapsed(result);
  result.clockStartedAt = null;
  result.isRunning = false;
}

function normalizeForWrite(
  result: SimulatedResult,
): SimulatedResult {
  const durationSeconds = Math.max(
    60,
    Math.min(
      3600,
      Math.trunc(
        result.durationSeconds || 15 * 60,
      ),
    ),
  );
  const elapsedSeconds = Math.max(
    0,
    Math.min(
      durationSeconds,
      Math.trunc(result.elapsedSeconds || 0),
    ),
  );
  const events = (result.events ?? []).filter(
    (event) => Boolean(event.player?.trim()),
  );

  const goalsA = events
    .filter(
      (event) =>
        event.type === "goal" &&
        event.team === "teamA",
    )
    .map((event) => ({
      player: event.player,
      count: event.count,
    }));

  const goalsB = events
    .filter(
      (event) =>
        event.type === "goal" &&
        event.team === "teamB",
    )
    .map((event) => ({
      player: event.player,
      count: event.count,
    }));

  const cardsA = events
    .filter(
      (event) =>
        event.type !== "goal" &&
        event.team === "teamA",
    )
    .map((event) => ({
      player: event.player,
      type: event.type as
        | "green_card"
        | "yellow_card"
        | "red_card",
      count: event.count,
    }));

  const cardsB = events
    .filter(
      (event) =>
        event.type !== "goal" &&
        event.team === "teamB",
    )
    .map((event) => ({
      player: event.player,
      type: event.type as
        | "green_card"
        | "yellow_card"
        | "red_card",
      count: event.count,
    }));

  return {
    ...result,
    durationSeconds,
    elapsedSeconds,
    goalsA,
    goalsB,
    cardsA,
    cardsB,
    events,
  };
}
