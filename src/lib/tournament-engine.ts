import type { MatchItem } from "@/src/lib/tournament-types";

export type StandingRow = {
  team: string;
  pts: number;
  j: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  difValue: number;
};

export type PenaltyScore = {
  scoreA: number;
  scoreB: number;
};

export function parsePenaltyScore(value?: string | null): PenaltyScore | null {
  if (!value) return null;

  const normalized = value.trim().replace(/\s+/g, "");
  const match = normalized.match(/^(\d{1,2})[-:](\d{1,2})$/);
  if (!match) return null;

  const scoreA = Number(match[1]);
  const scoreB = Number(match[2]);

  if (
    !Number.isInteger(scoreA) ||
    !Number.isInteger(scoreB) ||
    scoreA < 0 ||
    scoreB < 0 ||
    scoreA > 99 ||
    scoreB > 99
  ) {
    return null;
  }

  return { scoreA, scoreB };
}

export function formatPenaltyScore(scoreA: number, scoreB: number) {
  return `${Math.trunc(scoreA)}-${Math.trunc(scoreB)}`;
}

export function getMatchWinner(match: MatchItem): string | null {
  if (
    match.status !== "finalizado" ||
    match.scoreA === null ||
    match.scoreB === null
  ) {
    return null;
  }

  if (match.scoreA > match.scoreB) return match.teamA;
  if (match.scoreB > match.scoreA) return match.teamB;

  const penalties = parsePenaltyScore(match.penalties);
  if (!penalties || penalties.scoreA === penalties.scoreB) return null;

  return penalties.scoreA > penalties.scoreB ? match.teamA : match.teamB;
}

export function getMatchLoser(match: MatchItem): string | null {
  const winner = getMatchWinner(match);
  if (!winner) return null;
  return winner === match.teamA ? match.teamB : match.teamA;
}

export function buildGroupStandings(matches: MatchItem[]): StandingRow[] {
  const map = new Map<string, StandingRow>();

  const ensure = (team: string) => {
    if (!map.has(team)) {
      map.set(team, {
        team,
        pts: 0,
        j: 0,
        g: 0,
        e: 0,
        p: 0,
        gf: 0,
        gc: 0,
        difValue: 0,
      });
    }
    return map.get(team)!;
  };

  for (const match of matches) {
    const a = ensure(match.teamA);
    const b = ensure(match.teamB);

    if (
      match.status !== "finalizado" ||
      match.scoreA === null ||
      match.scoreB === null
    ) {
      continue;
    }

    a.j += 1;
    b.j += 1;
    a.gf += match.scoreA;
    a.gc += match.scoreB;
    b.gf += match.scoreB;
    b.gc += match.scoreA;

    if (match.scoreA > match.scoreB) {
      a.g += 1;
      a.pts += 3;
      b.p += 1;
    } else if (match.scoreB > match.scoreA) {
      b.g += 1;
      b.pts += 3;
      a.p += 1;
    } else {
      a.e += 1;
      b.e += 1;
      a.pts += 1;
      b.pts += 1;
    }
  }

  return [...map.values()]
    .map((row) => ({ ...row, difValue: row.gf - row.gc }))
    .sort(
      (a, b) =>
        b.pts - a.pts ||
        b.difValue - a.difValue ||
        b.gf - a.gf ||
        a.team.localeCompare(b.team),
    );
}

/**
 * Una sola lógica para torneo real y simulación.
 *
 * - Espera a que termine TODA la fase de grupos de cada categoría/competencia.
 * - Completa 1° vs 4°, 2° vs 3° y 5° vs 6°.
 * - Luego usa ganadores/perdedores (incluyendo penales) para completar
 *   1°/2° y 3°/4°.
 *
 * No escribe en Neon: deriva los nombres que debe mostrar cada partido.
 * Los resultados siguen asociados al ID/costado original del partido.
 */
export function applyTournamentProgression(matches: MatchItem[]): MatchItem[] {
  let effective = matches.map((match) => ({ ...match }));
  const scopes = Array.from(new Set(effective.map((match) => scopeKey(match.category))));

  for (const scope of scopes) {
    const scoped = effective.filter(
      (match) => scopeKey(match.category) === scope,
    );
    const groupMatches = scoped.filter((match) => match.stage === "grupo");

    if (groupMatches.length === 0 || !groupPhaseComplete(groupMatches)) {
      continue;
    }

    const standings = buildGroupStandings(groupMatches);
    if (standings.length < 4) continue;

    const semis = scoped
      .filter((match) => match.stage === "semifinal")
      .sort(compareBySchedule);

    const definitionMatches = scoped
      .filter((match) => match.stage === "final")
      .sort(compareBySchedule);

    const fifthSixth =
      definitionMatches.find((match) => startsAt(match, "11:45")) ??
      definitionMatches.find((match) => hasMarker(match, "5-6", "6-5"));

    const thirdFourth =
      definitionMatches.find((match) => startsAt(match, "14:15")) ??
      definitionMatches.find((match) => hasMarker(match, "3-4", "4-3"));

    const firstSecond =
      definitionMatches.find((match) => startsAt(match, "14:45")) ??
      definitionMatches.find((match) => hasMarker(match, "1-2", "2-1"));

    const team1 = standings[0]?.team;
    const team2 = standings[1]?.team;
    const team3 = standings[2]?.team;
    const team4 = standings[3]?.team;
    const team5 = standings[4]?.team;
    const team6 = standings[5]?.team;

    effective = effective.map((match) => {
      if (scopeKey(match.category) !== scope) return match;

      if (semis[0] && match.id === semis[0].id && team1 && team4) {
        return withTeams(match, team1, team4);
      }

      if (semis[1] && match.id === semis[1].id && team2 && team3) {
        return withTeams(match, team2, team3);
      }

      if (
        fifthSixth &&
        match.id === fifthSixth.id &&
        team5 &&
        team6
      ) {
        return withTeams(match, team5, team6);
      }

      return match;
    });

    const updatedSemis = effective
      .filter(
        (match) =>
          scopeKey(match.category) === scope && match.stage === "semifinal",
      )
      .sort(compareBySchedule);

    if (updatedSemis.length < 2) continue;

    const winnerA = getMatchWinner(updatedSemis[0]);
    const winnerB = getMatchWinner(updatedSemis[1]);
    const loserA = getMatchLoser(updatedSemis[0]);
    const loserB = getMatchLoser(updatedSemis[1]);

    effective = effective.map((match) => {
      if (scopeKey(match.category) !== scope) return match;

      if (
        firstSecond &&
        match.id === firstSecond.id &&
        winnerA &&
        winnerB
      ) {
        return withTeams(match, winnerA, winnerB);
      }

      if (
        thirdFourth &&
        match.id === thirdFourth.id &&
        loserA &&
        loserB
      ) {
        return withTeams(match, loserA, loserB);
      }

      return match;
    });
  }

  return effective;
}

function groupPhaseComplete(matches: MatchItem[]) {
  return matches.every(
    (match) =>
      match.status === "finalizado" &&
      match.scoreA !== null &&
      match.scoreB !== null,
  );
}

function withTeams(match: MatchItem, teamA: string, teamB: string): MatchItem {
  if (match.teamA === teamA && match.teamB === teamB) return match;
  return { ...match, teamA, teamB };
}

function scopeKey(category: string) {
  return `${getBaseCategory(category)}|${getCompetition(category)}`;
}

function getCompetition(category: string) {
  const normalized = normalize(category);
  return normalized.includes("colegial") ? "Colegial" : "Federado";
}

function getBaseCategory(category: string) {
  const normalized = normalize(category);
  if (normalized.includes("categoria 3")) return "Categoría 3";
  if (normalized.includes("categoria 2")) return "Categoría 2";
  return "Categoría 1";
}

function startsAt(match: MatchItem, time: string) {
  return normalizeTimeLabel(match.timeLabel).startsWith(time);
}

function hasMarker(match: MatchItem, ...markers: string[]) {
  const text = normalize(`${match.teamA} ${match.teamB}`);
  return markers.some((marker) => text.includes(marker));
}

function compareBySchedule(a: MatchItem, b: MatchItem) {
  return (
    timeToMinutes(a.timeLabel) - timeToMinutes(b.timeLabel) ||
    courtNumber(a.court) - courtNumber(b.court) ||
    a.id - b.id
  );
}

function normalizeTimeLabel(value: string) {
  return value
    .trim()
    .replace(/^(\d{1,2}),(\d{2})(.*)$/g, "$1:$2$3")
    .replace(/\s*hs?\.?$/i, " hs");
}

function timeToMinutes(value: string) {
  const match = normalizeTimeLabel(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function courtNumber(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 99;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
