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
import type {
  SimulatedCard,
  SimulatedGoal,
  SimulatedResult,
} from "@/src/lib/simulation-types";

export type { SimulatedCard, SimulatedGoal, SimulatedResult };

type SimulationContextType = {
  simulationEnabled: boolean;
  simulatedResults: Record<number, SimulatedResult>;
  syncing: boolean;
  syncError: string | null;
  setSimulationEnabled: (enabled: boolean) => void;
  refreshSimulation: () => Promise<boolean>;
  setSimulatedResult: (
    matchId: number,
    scoreA: number,
    scoreB: number,
    goalsA?: SimulatedGoal[],
    goalsB?: SimulatedGoal[],
    cardsA?: SimulatedCard[],
    cardsB?: SimulatedCard[],
    penalties?: string | null,
  ) => Promise<boolean>;
  removeSimulatedResult: (matchId: number) => Promise<boolean>;
  clearSimulation: () => Promise<boolean>;
  getEffectiveMatches: (matches: MatchItem[]) => MatchItem[];
};

const ENABLED_KEY = "copa-apdes-simulation-enabled";
const ADMIN_SESSION_KEY = "copa-apdes-admin-password";
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
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSimulationEnabledState(
        window.localStorage.getItem(ENABLED_KEY) === "true",
      );
    } catch {
      setSimulationEnabledState(false);
    }
  }, []);

  const setSimulationEnabled = useCallback((enabled: boolean) => {
    setSimulationEnabledState(enabled);

    try {
      window.localStorage.setItem(ENABLED_KEY, String(enabled));
    } catch {}
  }, []);

  const getAdminPassword = useCallback(() => {
    try {
      return window.sessionStorage.getItem(ADMIN_SESSION_KEY) ?? "";
    } catch {
      return "";
    }
  }, []);

  const refreshSimulation = useCallback(async () => {
    const adminPassword = getAdminPassword();
    if (!adminPassword) return false;

    try {
      const response = await fetch("/api/simulation", {
        cache: "no-store",
        headers: { "x-admin-password": adminPassword },
      });

      const result = (await response.json()) as {
        results?: Record<number, SimulatedResult>;
        error?: string;
      };

      if (!response.ok || !result.results) {
        throw new Error(
          result.error ?? "No se pudo leer la simulación compartida.",
        );
      }

      setSimulatedResults(normalizeResults(result.results));
      setSyncError(null);
      return true;
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "No se pudo sincronizar la simulación.",
      );
      return false;
    }
  }, [getAdminPassword]);

  useEffect(() => {
    const isSimulationPage = window.location.pathname.startsWith(
      "/admin/simulacion",
    );

    if (!simulationEnabled && !isSimulationPage) return;

    const tick = () => {
      if (!document.hidden) void refreshSimulation();
    };

    const initialLoad = window.setTimeout(tick, 0);
    const poll = window.setInterval(tick, 2500);

    const onVisibilityChange = () => {
      if (!document.hidden) void refreshSimulation();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshSimulation, simulationEnabled]);

  const postAction = useCallback(
    async (payload: unknown) => {
      const adminPassword = getAdminPassword();

      if (!adminPassword) {
        setSyncError("Ingresá nuevamente con la clave de administrador.");
        return false;
      }

      setSyncing(true);
      setSyncError(null);

      try {
        const response = await fetch("/api/simulation", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-password": adminPassword,
          },
          body: JSON.stringify(payload),
        });

        const result = (await response.json()) as {
          results?: Record<number, SimulatedResult>;
          error?: string;
        };

        if (!response.ok || !result.results) {
          throw new Error(
            result.error ?? "No se pudo guardar la simulación.",
          );
        }

        setSimulatedResults(normalizeResults(result.results));
        setSimulationEnabled(true);
        return true;
      } catch (error) {
        setSyncError(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la simulación.",
        );
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [getAdminPassword, setSimulationEnabled],
  );

  const setSimulatedResult = useCallback(
    async (
      matchId: number,
      scoreA: number,
      scoreB: number,
      goalsA: SimulatedGoal[] = [],
      goalsB: SimulatedGoal[] = [],
      cardsA: SimulatedCard[] = [],
      cardsB: SimulatedCard[] = [],
      penalties: string | null = null,
    ) => {
      const cleanA = clampScore(scoreA);
      const cleanB = clampScore(scoreB);

      return postAction({
        action: "save",
        matchId,
        result: {
          scoreA: cleanA,
          scoreB: cleanB,
          goalsA: normalizeGoals(goalsA, cleanA),
          goalsB: normalizeGoals(goalsB, cleanB),
          cardsA: normalizeCards(cardsA),
          cardsB: normalizeCards(cardsB),
          penalties:
            cleanA === cleanB ? normalizePenalties(penalties) : null,
        },
      });
    },
    [postAction],
  );

  const removeSimulatedResult = useCallback(
    async (matchId: number) =>
      postAction({ action: "remove", matchId }),
    [postAction],
  );

  const clearSimulation = useCallback(
    async () => postAction({ action: "clear" }),
    [postAction],
  );

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

      return applyTournamentProgression(simulatedMatches);
    },
    [simulationEnabled, simulatedResults],
  );

  const value = useMemo<SimulationContextType>(
    () => ({
      simulationEnabled,
      simulatedResults,
      syncing,
      syncError,
      setSimulationEnabled,
      refreshSimulation,
      setSimulatedResult,
      removeSimulatedResult,
      clearSimulation,
      getEffectiveMatches,
    }),
    [
      clearSimulation,
      getEffectiveMatches,
      refreshSimulation,
      removeSimulatedResult,
      setSimulatedResult,
      setSimulationEnabled,
      simulatedResults,
      simulationEnabled,
      syncError,
      syncing,
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
  const events: MatchEvent[] = [];
  let id = -(match.id * 10000 + 1);
  let order = 0;

  const addGoals = (
    team: "teamA" | "teamB",
    goals: SimulatedGoal[],
  ) => {
    for (const goal of goals) {
      for (let index = 0; index < goal.count; index += 1) {
        events.push({
          id: id--,
          minute: Math.min(59, 5 + Math.floor(order / 2)),
          second: (order * 7) % 60,
          period: 1,
          team,
          type: "goal",
          player: goal.player,
        });
        order += 1;
      }
    }
  };

  const addCards = (
    team: "teamA" | "teamB",
    cards: SimulatedCard[],
  ) => {
    for (const card of cards) {
      for (let index = 0; index < card.count; index += 1) {
        events.push({
          id: id--,
          minute: Math.min(59, 10 + Math.floor(order / 2)),
          second: (order * 11) % 60,
          period: 1,
          team,
          type: card.type,
          player: card.player,
        });
        order += 1;
      }
    }
  };

  addGoals("teamA", simulated.goalsA);
  addGoals("teamB", simulated.goalsB);
  addCards("teamA", simulated.cardsA);
  addCards("teamB", simulated.cardsB);

  return events.sort(
    (a, b) =>
      a.minute - b.minute || a.second - b.second || a.id - b.id,
  );
}

function clampScore(value: number) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(99, Math.trunc(value)))
    : 0;
}

function normalizeGoals(
  goals: SimulatedGoal[],
  max: number,
): SimulatedGoal[] {
  const next: SimulatedGoal[] = [];
  let assigned = 0;

  for (const goal of goals ?? []) {
    const player = String(goal.player ?? "").trim();
    const count = Math.max(1, Math.trunc(Number(goal.count) || 1));

    if (!player || assigned >= max) continue;

    const allowed = Math.min(count, max - assigned);
    next.push({ player, count: allowed });
    assigned += allowed;
  }

  return next;
}

function normalizeCards(cards: SimulatedCard[]): SimulatedCard[] {
  return (cards ?? [])
    .map((card) => ({
      player: String(card.player ?? "").trim(),
      type: card.type,
      count: Math.max(
        1,
        Math.min(10, Math.trunc(Number(card.count) || 1)),
      ),
    }))
    .filter(
      (card) =>
        card.player &&
        ["green_card", "yellow_card", "red_card"].includes(card.type),
    );
}

function normalizeResults(
  value: Record<number, SimulatedResult>,
): Record<number, SimulatedResult> {
  const next: Record<number, SimulatedResult> = {};

  for (const [rawId, result] of Object.entries(value ?? {})) {
    const matchId = Number(rawId);
    if (!Number.isInteger(matchId)) continue;

    const scoreA = clampScore(Number(result.scoreA));
    const scoreB = clampScore(Number(result.scoreB));

    next[matchId] = {
      scoreA,
      scoreB,
      goalsA: normalizeGoals(result.goalsA ?? [], scoreA),
      goalsB: normalizeGoals(result.goalsB ?? [], scoreB),
      cardsA: normalizeCards(result.cardsA ?? []),
      cardsB: normalizeCards(result.cardsB ?? []),
      penalties:
        scoreA === scoreB
          ? normalizePenalties(result.penalties)
          : null,
      updatedAt: result.updatedAt,
    };
  }

  return next;
}

function normalizePenalties(value?: string | null) {
  const parsed = parsePenaltyScore(value);
  if (!parsed || parsed.scoreA === parsed.scoreB) return null;
  return `${parsed.scoreA}-${parsed.scoreB}`;
}
