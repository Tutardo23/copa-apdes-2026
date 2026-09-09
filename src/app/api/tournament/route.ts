import {
  addEvent,
  createMatch,
  createMatchesBulk,
  finishMatch,
  getMatches,
  resetClock,
  resetMatch,
  setFinalScore,
  setPeriod,
  toggleClock,
  undoLastEvent,
  verifyAdminPassword,
} from "@/src/lib/tournament-data";
import type { TournamentAction } from "@/src/lib/tournament-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(
      { matches: await getMatches() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "Falta inicializar la base. Ejecutá database/setup.sql en Neon.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyAdminPassword(request.headers.get("x-admin-password"))) {
      return Response.json(
        { error: "Clave de administrador incorrecta." },
        { status: 401 },
      );
    }

    const action = (await request.json()) as TournamentAction;

    if (action.action === "authenticate") {
      return Response.json({ ok: true });
    }

    if (action.action === "create_match") {
      validateMatch(action.payload);
      await createMatch(action.payload);
      return Response.json({ matches: await getMatches() });
    }

    if (action.action === "bulk_create_matches") {
      if (!["append", "replace"].includes(action.payload.mode)) {
        throw new Error("Modo de carga inválido.");
      }

      if (
        !Array.isArray(action.payload.matches) ||
        action.payload.matches.length === 0
      ) {
        throw new Error("No hay partidos para importar.");
      }

      if (action.payload.matches.length > 300) {
        throw new Error("Importá como máximo 300 partidos por vez.");
      }

      for (const match of action.payload.matches) {
        validateMatch(match);
      }

      await createMatchesBulk(action.payload);
      return Response.json({ matches: await getMatches() });
    }

    if (!Number.isInteger(action.matchId)) {
      return Response.json(
        { error: "Partido inválido." },
        { status: 400 },
      );
    }

    switch (action.action) {
      case "event": {
        validateEvent(action.payload);
        const count = Math.max(
          1,
          Math.min(20, Math.trunc(Number(action.payload.count ?? 1))),
        );

        for (let index = 0; index < count; index += 1) {
          await addEvent(action.matchId, {
            team: action.payload.team,
            type: action.payload.type,
            player: action.payload.player,
          });
        }
        break;
      }

      case "undo":
        await undoLastEvent(action.matchId);
        break;

      case "toggle_clock":
        await toggleClock(action.matchId);
        break;

      case "reset_clock":
        await resetClock(action.matchId);
        break;

      case "reset_match":
        await resetMatch(action.matchId);
        break;

      case "set_final_score":
        validateFinalScore(action.payload);
        await setFinalScore(action.matchId, action.payload);
        break;

      case "set_period":
        if (![1, 2, 3, 4].includes(action.period)) {
          throw new Error("Período inválido.");
        }
        await setPeriod(action.matchId, action.period);
        break;

      case "finish":
        await finishMatch(action.matchId);
        break;
    }

    return Response.json({ matches: await getMatches() });
  } catch (error) {
    return Response.json(
      {
        error: readableError(error, "No se pudo guardar el cambio."),
      },
      { status: 400 },
    );
  }
}

function validateEvent(
  payload: Extract<TournamentAction, { action: "event" }>["payload"],
) {
  if (!["teamA", "teamB"].includes(payload.team)) {
    throw new Error("Equipo inválido.");
  }

  if (
    !["goal", "green_card", "yellow_card", "red_card"].includes(
      payload.type,
    )
  ) {
    throw new Error("Evento inválido.");
  }

  if (!payload.player || payload.player.trim().length > 80) {
    throw new Error("Jugadora inválida.");
  }

  if (
    payload.count !== undefined &&
    (!Number.isInteger(Number(payload.count)) ||
      Number(payload.count) < 1 ||
      Number(payload.count) > 20)
  ) {
    throw new Error("Cantidad de eventos inválida.");
  }
}

function validateFinalScore(
  payload: Extract<
    TournamentAction,
    { action: "set_final_score" }
  >["payload"],
) {
  if (
    !Number.isInteger(payload.scoreA) ||
    !Number.isInteger(payload.scoreB)
  ) {
    throw new Error("Marcador inválido.");
  }

  if (
    payload.scoreA < 0 ||
    payload.scoreB < 0 ||
    payload.scoreA > 99 ||
    payload.scoreB > 99
  ) {
    throw new Error("Marcador inválido.");
  }

  if (
    payload.penalties !== undefined &&
    payload.penalties !== null &&
    !/^\d{1,2}[-:]\d{1,2}$/.test(
      payload.penalties.replace(/\s+/g, ""),
    )
  ) {
    throw new Error("Marcador de penales inválido.");
  }
}

function validateMatch(
  payload: Extract<
    TournamentAction,
    { action: "create_match" }
  >["payload"],
) {
  if (!["dia1", "dia2"].includes(payload.day)) {
    throw new Error("Día inválido.");
  }

  if (
    !["grupo", "cuartos", "semifinal", "final"].includes(payload.stage)
  ) {
    throw new Error("Fase inválida.");
  }

  for (const field of [
    payload.date,
    payload.timeLabel,
    payload.category,
    payload.court,
    payload.teamA,
    payload.teamB,
  ]) {
    if (!field || field.trim().length > 80) {
      throw new Error("Completá todos los datos del partido.");
    }
  }

  if (payload.teamA.trim() === payload.teamB.trim()) {
    throw new Error("Los equipos deben ser distintos.");
  }
}

function readableError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;

  const publicMessages = [
    "Falta configurar ADMIN_PASSWORD.",
    "El partido no existe.",
    "El partido ya está finalizado.",
    "Período inválido.",
    "Equipo inválido.",
    "Evento inválido.",
    "Jugadora inválida.",
    "Cantidad de eventos inválida.",
    "Marcador inválido.",
    "Marcador de penales inválido.",
    "Día inválido.",
    "Fase inválida.",
    "Completá todos los datos del partido.",
    "Los equipos deben ser distintos.",
    "Modo de carga inválido.",
    "No hay partidos para importar.",
    "Importá como máximo 300 partidos por vez.",
    "En fase final, un empate necesita definición por penales.",
    "Los penales no pueden terminar empatados.",
    "Cargá un resultado antes de finalizar este partido.",
  ];

  return publicMessages.includes(error.message) ? error.message : fallback;
}
