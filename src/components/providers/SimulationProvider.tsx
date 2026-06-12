"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MatchEvent, MatchItem } from "@/src/lib/tournament-types";

export type SimulatedGoal = {
  player: string;
};

type SimulatedGoalInput = string | SimulatedGoal;

type SimulatedResult = {
  scoreA: number;
  scoreB: number;
  goalsA?: SimulatedGoal[];
  goalsB?: SimulatedGoal[];
};

type SimulationContextType = {
  simulationEnabled: boolean;
  simulatedResults: Record<number, SimulatedResult>;
  setSimulationEnabled: (enabled: boolean) => void;
  setSimulatedResult: (
    matchId: number,
    scoreA: number,
    scoreB: number,
    goalsA?: SimulatedGoalInput[],
    goalsB?: SimulatedGoalInput[],
  ) => void;
  removeSimulatedResult: (matchId: number) => void;
  clearSimulation: () => void;
  getEffectiveMatches: (matches: MatchItem[]) => MatchItem[];
};

const STORAGE_KEY = "copa-apdes-simulation-results";
const ENABLED_KEY = "copa-apdes-simulation-enabled";

const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [simulationEnabled, setSimulationEnabledState] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<Record<number, SimulatedResult>>({});

  useEffect(() => {
    try {
      const enabled = window.localStorage.getItem(ENABLED_KEY) === "true";
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};

      setSimulationEnabledState(enabled);
      setSimulatedResults(normalizeStoredResults(parsed));
    } catch {
      setSimulationEnabledState(false);
      setSimulatedResults({});
    }
  }, []);

  const persist = useCallback((nextResults: Record<number, SimulatedResult>, enabled = true) => {
    const cleanResults = normalizeStoredResults(nextResults);

    setSimulatedResults(cleanResults);
    setSimulationEnabledState(enabled);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanResults));
    window.localStorage.setItem(ENABLED_KEY, String(enabled));
  }, []);

  const setSimulationEnabled = useCallback((enabled: boolean) => {
    setSimulationEnabledState(enabled);
    window.localStorage.setItem(ENABLED_KEY, String(enabled));
  }, []);

  const setSimulatedResult = useCallback(
    (
      matchId: number,
      scoreA: number,
      scoreB: number,
      goalsA: SimulatedGoalInput[] = [],
      goalsB: SimulatedGoalInput[] = [],
    ) => {
      const cleanA = Number.isFinite(scoreA) ? Math.max(0, Math.trunc(scoreA)) : 0;
      const cleanB = Number.isFinite(scoreB) ? Math.max(0, Math.trunc(scoreB)) : 0;

      persist(
        {
          ...simulatedResults,
          [matchId]: {
            scoreA: cleanA,
            scoreB: cleanB,
            goalsA: normalizeGoalInputs(goalsA).slice(0, cleanA),
            goalsB: normalizeGoalInputs(goalsB).slice(0, cleanB),
          },
        },
        true,
      );
    },
    [persist, simulatedResults],
  );

  const removeSimulatedResult = useCallback(
    (matchId: number) => {
      const next = { ...simulatedResults };
      delete next[matchId];
      persist(next, Object.keys(next).length > 0);
    },
    [persist, simulatedResults],
  );

  const clearSimulation = useCallback(() => {
    persist({}, false);
  }, [persist]);

  const getEffectiveMatches = useCallback(
    (matches: MatchItem[]) => {
      if (!simulationEnabled) return matches;
      return applySimulationAndBracket(matches, simulatedResults);
    },
    [simulationEnabled, simulatedResults],
  );

  const value = useMemo<SimulationContextType>(
    () => ({
      simulationEnabled,
      simulatedResults,
      setSimulationEnabled,
      setSimulatedResult,
      removeSimulatedResult,
      clearSimulation,
      getEffectiveMatches,
    }),
    [
      simulationEnabled,
      simulatedResults,
      setSimulationEnabled,
      setSimulatedResult,
      removeSimulatedResult,
      clearSimulation,
      getEffectiveMatches,
    ],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSimulation debe usarse dentro de SimulationProvider");
  return context;
}

function applySimulationAndBracket(
  matches: MatchItem[],
  simulatedResults: Record<number, SimulatedResult>,
) {
  let effective = matches.map((match) => {
    const simulated = simulatedResults[match.id];
    if (!simulated) return match;

    return {
      ...match,
      scoreA: simulated.scoreA,
      scoreB: simulated.scoreB,
      status: "finalizado" as const,
      isRunning: false,
      events: buildSimulatedEvents(match, simulated),
    };
  });

  const scopes = Array.from(new Set(effective.map((match) => scopeKey(match.category))));

  for (const scope of scopes) {
    const scoped = effective.filter((match) => scopeKey(match.category) === scope);
    const groupMatches = scoped.filter((match) => match.stage === "grupo");
    const standings = buildStandings(groupMatches);
    if (standings.length === 0) continue;

    effective = effective.map((match) => {
      if (scopeKey(match.category) !== scope) return match;

      const marker = `${match.teamA} ${match.teamB}`.toLowerCase();

      if (match.stage === "semifinal") {
        if (marker.includes("1-4")) {
          return withTeams(match, standings[0]?.team ?? match.teamA, standings[3]?.team ?? match.teamB);
        }
        if (marker.includes("2-3")) {
          return withTeams(match, standings[1]?.team ?? match.teamA, standings[2]?.team ?? match.teamB);
        }
      }

      if (match.stage === "final" && marker.includes("5-6")) {
        return withTeams(match, standings[4]?.team ?? match.teamA, standings[5]?.team ?? match.teamB);
      }

      return match;
    });

    const updatedScoped = effective.filter((match) => scopeKey(match.category) === scope);
    const semis = updatedScoped.filter(
      (match) =>
        match.stage === "semifinal" &&
        match.status === "finalizado" &&
        match.scoreA !== null &&
        match.scoreB !== null,
    );
    const winners = semis.map(winnerOf).filter(Boolean) as string[];
    const losers = semis.map(loserOf).filter(Boolean) as string[];

    effective = effective.map((match) => {
      if (scopeKey(match.category) !== scope || match.stage !== "final") return match;
      const marker = `${match.teamA} ${match.teamB}`.toLowerCase();

      if (marker.includes("1-2") && winners.length >= 2) {
        return withTeams(match, winners[0], winners[1]);
      }

      if (marker.includes("3-4") && losers.length >= 2) {
        return withTeams(match, losers[0], losers[1]);
      }

      return match;
    });
  }

  return effective;
}

function buildSimulatedEvents(match: MatchItem, simulated: SimulatedResult): MatchEvent[] {
  const previousNonGoalEvents = match.events.filter((event) => event.type !== "goal");
  const goalsA = normalizeGoalInputs(simulated.goalsA ?? []);
  const goalsB = normalizeGoalInputs(simulated.goalsB ?? []);

  const goalEventsA = goalsA.slice(0, simulated.scoreA).map((goal, index): MatchEvent => ({
    id: -Number(`${match.id}10${index + 1}`),
    minute: Math.min(59, 5 + index * 3),
    second: 0,
    period: 1,
    team: "teamA",
    type: "goal",
    player: goal.player || `Gol ${index + 1}`,
  }));

  const goalEventsB = goalsB.slice(0, simulated.scoreB).map((goal, index): MatchEvent => ({
    id: -Number(`${match.id}20${index + 1}`),
    minute: Math.min(59, 6 + index * 3),
    second: 0,
    period: 1,
    team: "teamB",
    type: "goal",
    player: goal.player || `Gol ${index + 1}`,
  }));

  return [...previousNonGoalEvents, ...goalEventsA, ...goalEventsB].sort(
    (a, b) => a.minute - b.minute || a.second - b.second || a.id - b.id,
  );
}

function normalizeGoalInputs(goals: SimulatedGoalInput[]): SimulatedGoal[] {
  return goals
    .map((goal) => {
      if (typeof goal === "string") return { player: goal.trim() };
      return { player: String(goal.player ?? "").trim() };
    })
    .filter((goal) => goal.player.length > 0);
}

function normalizeStoredResults(value: unknown): Record<number, SimulatedResult> {
  if (!value || typeof value !== "object") return {};

  const entries = Object.entries(value as Record<string, Partial<SimulatedResult>>);
  const next: Record<number, SimulatedResult> = {};

  for (const [rawId, result] of entries) {
    const matchId = Number(rawId);
    if (!Number.isInteger(matchId)) continue;

    const scoreA = Number(result.scoreA);
    const scoreB = Number(result.scoreB);

    next[matchId] = {
      scoreA: Number.isFinite(scoreA) ? Math.max(0, Math.trunc(scoreA)) : 0,
      scoreB: Number.isFinite(scoreB) ? Math.max(0, Math.trunc(scoreB)) : 0,
      goalsA: normalizeGoalInputs((result.goalsA ?? []) as SimulatedGoalInput[]),
      goalsB: normalizeGoalInputs((result.goalsB ?? []) as SimulatedGoalInput[]),
    };
  }

  return next;
}

function withTeams(match: MatchItem, teamA: string, teamB: string): MatchItem {
  return { ...match, teamA, teamB };
}

function winnerOf(match: MatchItem) {
  if (match.scoreA === null || match.scoreB === null || match.scoreA === match.scoreB) return null;
  return match.scoreA > match.scoreB ? match.teamA : match.teamB;
}

function loserOf(match: MatchItem) {
  if (match.scoreA === null || match.scoreB === null || match.scoreA === match.scoreB) return null;
  return match.scoreA > match.scoreB ? match.teamB : match.teamA;
}

type Row = {
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

function buildStandings(matches: MatchItem[]) {
  const map = new Map<string, Row>();

  const ensure = (team: string) => {
    if (!map.has(team)) {
      map.set(team, { team, pts: 0, j: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, difValue: 0 });
    }
    return map.get(team)!;
  };

  for (const match of matches) {
    ensure(match.teamA);
    ensure(match.teamB);

    if (match.status !== "finalizado" || match.scoreA === null || match.scoreB === null) continue;

    const a = ensure(match.teamA);
    const b = ensure(match.teamB);
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

  return Array.from(map.values())
    .map((row) => ({ ...row, difValue: row.gf - row.gc }))
    .sort((a, b) => b.pts - a.pts || b.difValue - a.difValue || b.gf - a.gf || a.team.localeCompare(b.team));
}

function scopeKey(category: string) {
  return `${getBaseCategory(category)} ${getCompetition(category)}`;
}

function getCompetition(category: string) {
  return category.toLowerCase().includes("colegial") ? "Colegial" : "Federado";
}

function getBaseCategory(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("3")) return "Categoría 3";
  if (normalized.includes("2")) return "Categoría 2";
  return "Categoría 1";
}
