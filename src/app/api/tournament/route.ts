import {
  addEvent,
  createMatch,
  createMatchesBulk,
  finishMatch,
  getMatches,
  resetClock,
  resetMatch,
  setPeriod,
  toggleClock,
  undoLastEvent,
  verifyAdminPassword,
} from "@/src/lib/tournament-data";
import type { TournamentAction } from "@/src/lib/tournament-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ matches: await getMatches() });
  } catch {
    return Response.json(
      { error: "Falta inicializar la base. Ejecuta database/setup.sql en Neon." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyAdminPassword(request.headers.get("x-admin-password"))) {
      return Response.json({ error: "Clave de administrador incorrecta." }, { status: 401 });
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
        throw new Error("Modo de carga invalido.");
      }

      if (!Array.isArray(action.payload.matches) || action.payload.matches.length === 0) {
        throw new Error("No hay partidos para importar.");
      }

      if (action.payload.matches.length > 300) {
        throw new Error("Importa como maximo 300 partidos por vez.");
      }

      for (const match of action.payload.matches) {
        validateMatch(match);
      }

      await createMatchesBulk(action.payload);
      return Response.json({ matches: await getMatches() });
    }

    if (!Number.isInteger(action.matchId)) {
      return Response.json({ error: "Partido invalido." }, { status: 400 });
    }

    switch (action.action) {
      case "event":
        validateEvent(action.payload);
        await addEvent(action.matchId, action.payload);
        break;
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
      case "set_period":
        if (![1, 2, 3, 4].includes(action.period)) {
          throw new Error("Periodo invalido.");
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
      { error: readableError(error, "No se pudo guardar el cambio.") },
      { status: 400 }
    );
  }
}

function validateEvent(payload: Extract<TournamentAction, { action: "event" }>["payload"]) {
  if (!["teamA", "teamB"].includes(payload.team)) throw new Error("Equipo invalido.");
  if (!["goal", "green_card", "yellow_card"].includes(payload.type)) {
    throw new Error("Evento invalido.");
  }
  if (!payload.player || payload.player.trim().length > 80) {
    throw new Error("Jugadora invalida.");
  }
}

function validateMatch(payload: Extract<TournamentAction, { action: "create_match" }>["payload"]) {
  if (!["dia1", "dia2"].includes(payload.day)) throw new Error("Dia invalido.");
  if (!["grupo", "cuartos", "semifinal", "final"].includes(payload.stage)) {
    throw new Error("Fase invalida.");
  }

  for (const field of [
    payload.date,
    payload.timeLabel,
    payload.category,
    payload.court,
    payload.teamA,
    payload.teamB,
  ]) {
    if (!field || field.trim().length > 80) throw new Error("Completa todos los datos del partido.");
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
    "El partido ya esta finalizado.",
    "Periodo invalido.",
    "Equipo invalido.",
    "Evento invalido.",
    "Jugadora invalida.",
    "Dia invalido.",
    "Fase invalida.",
    "Completa todos los datos del partido.",
    "Los equipos deben ser distintos.",
    "Modo de carga invalido.",
    "No hay partidos para importar.",
    "Importa como maximo 300 partidos por vez.",
  ];

  return publicMessages.includes(error.message) ? error.message : fallback;
}
