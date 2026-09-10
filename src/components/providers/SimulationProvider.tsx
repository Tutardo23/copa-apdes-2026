"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { applyTournamentProgression } from "@/src/lib/tournament-engine";
import type {
  MatchEvent,
  MatchItem,
} from "@/src/lib/tournament-types";
import type {
  SimulatedCard,
  SimulatedEvent,
  SimulatedGoal,
  SimulatedResult,
} from "@/src/lib/simulation-types";

export type {
  SimulatedCard,
  SimulatedEvent,
  SimulatedGoal,
  SimulatedResult,
};

type BatchOperation =
  | "start"
  | "pause"
  | "reset"
  | "finish";

type SimulationContextType = {
  simulationEnabled: boolean;
  simulatedResults: Record<number, SimulatedResult>;
  syncing: boolean;
  syncError: string | null;
  setSimulationEnabled: (enabled: boolean) => void;
  refreshSimulation: () => Promise<boolean>;
  clearSimulation: () => Promise<boolean>;
  removeSimulatedResult: (
    matchId: number,
  ) => Promise<boolean>;
  setSimulationScore: (
    matchId: number,
    scoreA: number,
    scoreB: number,
    penalties?: string | null,
    finish?: boolean,
  ) => Promise<boolean>;
  addSimulationEvent: (
    matchId: number,
    payload: {
      team: "teamA" | "teamB";
      type:
        | "goal"
        | "green_card"
        | "yellow_card"
        | "red_card";
      player: string;
      count?: number;
    },
  ) => Promise<boolean>;
  undoSimulationEvent: (
    matchId: number,
  ) => Promise<boolean>;
  toggleSimulationClock: (
    matchId: number,
  ) => Promise<boolean>;
  resetSimulationClock: (
    matchId: number,
  ) => Promise<boolean>;
  setSimulationDuration: (
    matchId: number,
    durationSeconds: number,
  ) => Promise<boolean>;
  setSimulationPeriod: (
    matchId: number,
    period: 1 | 2 | 3 | 4,
  ) => Promise<boolean>;
  finishSimulationMatch: (
    matchId: number,
  ) => Promise<boolean>;
  resetSimulationMatch: (
    matchId: number,
  ) => Promise<boolean>;
  runSimulationBatch: (
    matchIds: number[],
    operation: BatchOperation,
  ) => Promise<boolean>;
  getEffectiveMatches: (
    matches: MatchItem[],
  ) => MatchItem[];
};

const ENABLED_KEY =
  "copa-apdes-simulation-enabled";
const SimulationContext =
  createContext<SimulationContextType | null>(null);

export function SimulationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    simulationEnabled,
    setSimulationEnabledState,
  ] = useState(false);
  const [
    simulatedResults,
    setSimulatedResults,
  ] = useState<
    Record<number, SimulatedResult>
  >({});
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] =
    useState<string | null>(null);

  useEffect(() => {
    try {
      setSimulationEnabledState(
        window.localStorage.getItem(
          ENABLED_KEY,
        ) === "true",
      );
    } catch {
      setSimulationEnabledState(false);
    }
  }, []);

  const setSimulationEnabled = useCallback(
    (enabled: boolean) => {
      setSimulationEnabledState(enabled);

      try {
        window.localStorage.setItem(
          ENABLED_KEY,
          String(enabled),
        );
      } catch {}
    },
    [],
  );

  const refreshSimulation =
    useCallback(async () => {
      try {
        const response = await fetch(
          "/api/simulation",
          {
            cache: "no-store",
            credentials: "same-origin",
          },
        );

        if (response.status === 401) {
          return false;
        }

        const result =
          (await response.json()) as {
            results?: Record<
              number,
              SimulatedResult
            >;
            error?: string;
          };

        if (
          !response.ok ||
          !result.results
        ) {
          throw new Error(
            result.error ??
              "No se pudo leer la simulación compartida.",
          );
        }

        setSimulatedResults(result.results);
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
    }, []);

  useEffect(() => {
    const isSimulationPage =
      window.location.pathname.startsWith(
        "/admin/simulacion",
      );

    if (
      !simulationEnabled &&
      !isSimulationPage
    ) {
      return;
    }

    const tick = () => {
      if (!document.hidden) {
        void refreshSimulation();
      }
    };

    const initialLoad =
      window.setTimeout(tick, 0);
    const poll = window.setInterval(
      tick,
      2500,
    );

    const onVisibilityChange = () => {
      if (!document.hidden) {
        void refreshSimulation();
      }
    };

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange,
    );

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(poll);
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
      );
    };
  }, [
    refreshSimulation,
    simulationEnabled,
  ]);

  useEffect(() => {
    const clock = window.setInterval(() => {
      setSimulatedResults((previous) => {
        let changed = false;
        const next: Record<
          number,
          SimulatedResult
        > = {};

        for (const [
          id,
          result,
        ] of Object.entries(previous)) {
          if (
            result.isRunning &&
            result.elapsedSeconds <
              result.durationSeconds
          ) {
            changed = true;
            const elapsedSeconds = Math.min(
              result.durationSeconds,
              result.elapsedSeconds + 1,
            );

            next[Number(id)] = {
              ...result,
              elapsedSeconds,
              isRunning:
                elapsedSeconds <
                result.durationSeconds,
            };
          } else {
            next[Number(id)] = result;
          }
        }

        return changed ? next : previous;
      });
    }, 1000);

    return () =>
      window.clearInterval(clock);
  }, []);

  const postAction = useCallback(
    async (
      payload: Record<string, unknown>,
    ) => {
      setSyncing(true);
      setSyncError(null);

      try {
        const response = await fetch(
          "/api/simulation",
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "content-type":
                "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        const result =
          (await response.json()) as {
            results?: Record<
              number,
              SimulatedResult
            >;
            error?: string;
          };

        if (
          !response.ok ||
          !result.results
        ) {
          throw new Error(
            result.error ??
              "No se pudo guardar la simulación.",
          );
        }

        setSimulatedResults(
          result.results,
        );
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
    [setSimulationEnabled],
  );

  const clearSimulation = useCallback(
    () =>
      postAction({
        action: "clear",
      }),
    [postAction],
  );

  const removeSimulatedResult =
    useCallback(
      (matchId: number) =>
        postAction({
          action: "remove",
          matchId,
        }),
      [postAction],
    );

  const setSimulationScore =
    useCallback(
      (
        matchId: number,
        scoreA: number,
        scoreB: number,
        penalties: string | null = null,
        finish = false,
      ) =>
        postAction({
          action: "set_score",
          matchId,
          scoreA,
          scoreB,
          penalties,
          finish,
        }),
      [postAction],
    );

  const addSimulationEvent =
    useCallback(
      (
        matchId: number,
        payload: {
          team: "teamA" | "teamB";
          type:
            | "goal"
            | "green_card"
            | "yellow_card"
            | "red_card";
          player: string;
          count?: number;
        },
      ) =>
        postAction({
          action: "event",
          matchId,
          ...payload,
        }),
      [postAction],
    );

  const undoSimulationEvent =
    useCallback(
      (matchId: number) =>
        postAction({
          action: "undo",
          matchId,
        }),
      [postAction],
    );

  const toggleSimulationClock =
    useCallback(
      (matchId: number) =>
        postAction({
          action: "toggle_clock",
          matchId,
        }),
      [postAction],
    );

  const resetSimulationClock =
    useCallback(
      (matchId: number) =>
        postAction({
          action: "reset_clock",
          matchId,
        }),
      [postAction],
    );

  const setSimulationDuration =
    useCallback(
      (
        matchId: number,
        durationSeconds: number,
      ) =>
        postAction({
          action: "set_duration",
          matchId,
          durationSeconds,
        }),
      [postAction],
    );

  const setSimulationPeriod =
    useCallback(
      (
        matchId: number,
        period: 1 | 2 | 3 | 4,
      ) =>
        postAction({
          action: "set_period",
          matchId,
          period,
        }),
      [postAction],
    );

  const finishSimulationMatch =
    useCallback(
      (matchId: number) =>
        postAction({
          action: "finish",
          matchId,
        }),
      [postAction],
    );

  const resetSimulationMatch =
    useCallback(
      (matchId: number) =>
        postAction({
          action: "reset_match",
          matchId,
        }),
      [postAction],
    );

  const runSimulationBatch =
    useCallback(
      (
        matchIds: number[],
        operation: BatchOperation,
      ) =>
        postAction({
          action: "batch_clock",
          matchIds,
          operation,
        }),
      [postAction],
    );

  const getEffectiveMatches =
    useCallback(
      (matches: MatchItem[]) => {
        if (!simulationEnabled) {
          return matches;
        }

        const simulated = matches.map(
          (match) => {
            const result =
              simulatedResults[match.id];

            if (!result) return match;

            return {
              ...match,
              scoreA: result.scoreA,
              scoreB: result.scoreB,
              penalties:
                result.penalties,
              status: result.status,
              isRunning:
                result.isRunning,
              clockSeconds:
                result.elapsedSeconds,
              period: result.period,
              events: buildMatchEvents(
                match.id,
                result.events,
              ),
            };
          },
        );

        return applyTournamentProgression(
          simulated,
        );
      },
      [
        simulationEnabled,
        simulatedResults,
      ],
    );

  const value =
    useMemo<SimulationContextType>(
      () => ({
        simulationEnabled,
        simulatedResults,
        syncing,
        syncError,
        setSimulationEnabled,
        refreshSimulation,
        clearSimulation,
        removeSimulatedResult,
        setSimulationScore,
        addSimulationEvent,
        undoSimulationEvent,
        toggleSimulationClock,
        resetSimulationClock,
        setSimulationDuration,
        setSimulationPeriod,
        finishSimulationMatch,
        resetSimulationMatch,
        runSimulationBatch,
        getEffectiveMatches,
      }),
      [
        addSimulationEvent,
        clearSimulation,
        finishSimulationMatch,
        getEffectiveMatches,
        refreshSimulation,
        removeSimulatedResult,
        resetSimulationClock,
        resetSimulationMatch,
        runSimulationBatch,
        setSimulationDuration,
        setSimulationEnabled,
        setSimulationPeriod,
        setSimulationScore,
        simulatedResults,
        simulationEnabled,
        syncError,
        syncing,
        toggleSimulationClock,
        undoSimulationEvent,
      ],
    );

  return (
    <SimulationContext.Provider
      value={value}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context =
    useContext(SimulationContext);

  if (!context) {
    throw new Error(
      "useSimulation debe usarse dentro de SimulationProvider",
    );
  }

  return context;
}

function buildMatchEvents(
  matchId: number,
  events: SimulatedEvent[],
): MatchEvent[] {
  const output: MatchEvent[] = [];
  let serial = 1;

  for (const event of events ?? []) {
    for (
      let index = 0;
      index < event.count;
      index += 1
    ) {
      output.push({
        id: -(
          matchId * 100000 +
          serial
        ),
        minute: Math.floor(
          event.elapsedSeconds / 60,
        ),
        second:
          event.elapsedSeconds % 60,
        period: event.period,
        team: event.team,
        type: event.type,
        player: event.player,
      });

      serial += 1;
    }
  }

  return output;
}
