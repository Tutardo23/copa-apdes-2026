"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyTournamentProgression,
  parsePenaltyScore,
} from "@/src/lib/tournament-engine";
import type {
  MatchEvent,
  MatchItem,
} from "@/src/lib/tournament-types";

export type SimulatedGoal = {
  player: string;
};

type SimulatedGoalInput = string | SimulatedGoal;

export type SimulatedResult = {
  scoreA: number;
  scoreB: number;
  goalsA?: SimulatedGoal[];
  goalsB?: SimulatedGoal[];
  penalties?: string | null;
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
    penalties?: string | null,
  ) => void;
  removeSimulatedResult: (matchId: number) => void;
  clearSimulation: () => void;
  getEffectiveMatches: (matches: MatchItem[]) => MatchItem[];
};

const STORAGE_KEY = "copa-apdes-simulation-results";
const ENABLED_KEY = "copa-apdes-simulation-enabled";

const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [simulationEnabled, setSimulationEnabledState] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<
    Record<number, SimulatedResult>
  >({});

  useEffect(() => {
    try {
      const enabled =
        window.localStorage.getItem(ENABLED_KEY) === "true";
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};

      setSimulationEnabledState(enabled);
      setSimulatedResults(normalizeStoredResults(parsed));
    } catch {
      setSimulationEnabledState(false);
      setSimulatedResults({});
    }
  }, []);

  const persist = useCallback(
    (
      nextResults: Record<number, SimulatedResult>,
      enabled = true,
    ) => {
      const cleanResults = normalizeStoredResults(nextResults);

      setSimulatedResults(cleanResults);
      setSimulationEnabledState(enabled);

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(cleanResults),
      );
      window.localStorage.setItem(ENABLED_KEY, String(enabled));
    },
    [],
  );

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
      penalties: string | null = null,
    ) => {
      const cleanA = Number.isFinite(scoreA)
        ? Math.max(0, Math.trunc(scoreA))
        : 0;
      const cleanB = Number.isFinite(scoreB)
        ? Math.max(0, Math.trunc(scoreB))
        : 0;

      const cleanPenalties =
        cleanA === cleanB ? normalizePenalties(penalties) : null;

      persist(
        {
          ...simulatedResults,
          [matchId]: {
            scoreA: cleanA,
            scoreB: cleanB,
            goalsA: normalizeGoalInputs(goalsA).slice(0, cleanA),
            goalsB: normalizeGoalInputs(goalsB).slice(0, cleanB),
            penalties: cleanPenalties,
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

      const simulatedMatches = matches.map((match) => {
        const simulated = simulatedResults[match.id];
        if (!simulated) return match;

        return {
          ...match,
          scoreA: simulated.scoreA,
          scoreB: simulated.scoreB,
          penalties: simulated.penalties ?? null,
          status: "finalizado" as const,
          isRunning: false,
          events: buildSimulatedEvents(match, simulated),
        };
      });

      // Mismo motor que usa el torneo real.
      return applyTournamentProgression(simulatedMatches);
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
      clearSimulation,
      getEffectiveMatches,
      removeSimulatedResult,
      setSimulatedResult,
      setSimulationEnabled,
      simulatedResults,
      simulationEnabled,
    ],
  );

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);

  if (!context) {
    throw new Error(
      "useSimulation debe usarse dentro de SimulationProvider",
    );
  }

  return context;
}

function buildSimulatedEvents(
  match: MatchItem,
  simulated: SimulatedResult,
): MatchEvent[] {
  const previousNonGoalEvents = match.events.filter(
    (event) => event.type !== "goal",
  );
  const goalsA = normalizeGoalInputs(simulated.goalsA ?? []);
  const goalsB = normalizeGoalInputs(simulated.goalsB ?? []);

  const goalEventsA = goalsA
    .slice(0, simulated.scoreA)
    .map(
      (goal, index): MatchEvent => ({
        id: -Number(`${match.id}10${index + 1}`),
        minute: Math.min(59, 5 + index * 3),
        second: 0,
        period: 1,
        team: "teamA",
        type: "goal",
        player: goal.player || `Gol ${index + 1}`,
      }),
    );

  const goalEventsB = goalsB
    .slice(0, simulated.scoreB)
    .map(
      (goal, index): MatchEvent => ({
        id: -Number(`${match.id}20${index + 1}`),
        minute: Math.min(59, 6 + index * 3),
        second: 0,
        period: 1,
        team: "teamB",
        type: "goal",
        player: goal.player || `Gol ${index + 1}`,
      }),
    );

  return [
    ...previousNonGoalEvents,
    ...goalEventsA,
    ...goalEventsB,
  ].sort(
    (a, b) =>
      a.minute - b.minute ||
      a.second - b.second ||
      a.id - b.id,
  );
}

function normalizeGoalInputs(
  goals: SimulatedGoalInput[],
): SimulatedGoal[] {
  return goals
    .map((goal) => {
      if (typeof goal === "string") {
        return { player: goal.trim() };
      }

      return { player: String(goal.player ?? "").trim() };
    })
    .filter((goal) => goal.player.length > 0);
}

function normalizeStoredResults(
  value: unknown,
): Record<number, SimulatedResult> {
  if (!value || typeof value !== "object") return {};

  const entries = Object.entries(
    value as Record<string, Partial<SimulatedResult>>,
  );
  const next: Record<number, SimulatedResult> = {};

  for (const [rawId, result] of entries) {
    const matchId = Number(rawId);
    if (!Number.isInteger(matchId)) continue;

    const scoreA = Number(result.scoreA);
    const scoreB = Number(result.scoreB);

    const cleanA = Number.isFinite(scoreA)
      ? Math.max(0, Math.trunc(scoreA))
      : 0;
    const cleanB = Number.isFinite(scoreB)
      ? Math.max(0, Math.trunc(scoreB))
      : 0;

    next[matchId] = {
      scoreA: cleanA,
      scoreB: cleanB,
      goalsA: normalizeGoalInputs(
        (result.goalsA ?? []) as SimulatedGoalInput[],
      ),
      goalsB: normalizeGoalInputs(
        (result.goalsB ?? []) as SimulatedGoalInput[],
      ),
      penalties:
        cleanA === cleanB
          ? normalizePenalties(result.penalties ?? null)
          : null,
    };
  }

  return next;
}

function normalizePenalties(value?: string | null) {
  const parsed = parsePenaltyScore(value);
  if (!parsed || parsed.scoreA === parsed.scoreB) return null;
  return `${parsed.scoreA}-${parsed.scoreB}`;
}
