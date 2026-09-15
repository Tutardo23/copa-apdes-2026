"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { getTeamDisplayName } from "@/src/lib/schools";
import { applyTournamentProgression } from "@/src/lib/tournament-engine";
import type {
  BulkCreateMatchItem,
  DayKey,
  EventType,
  FinalScorePayload,
  MatchEvent,
  MatchItem,
  MatchStage,
  TeamKey,
  TournamentAction,
} from "@/src/lib/tournament-types";

export type {
  BulkCreateMatchItem,
  DayKey,
  EventType,
  MatchEvent,
  MatchItem,
  MatchStage,
  TeamKey,
};

type TournamentContextType = {
  matches: MatchItem[];
  activeMatchId: number;
  setActiveMatchId: (id: number) => void;
  isLive: boolean;
  connectionError: string | null;
  adminReady: boolean;
  adminError: string | null;
  refresh: () => Promise<void>;
  authenticateAdmin: (password: string) => Promise<boolean>;
  createMatch: (payload: BulkCreateMatchItem) => Promise<boolean>;
  createMatchesBulk: (payload: {
    mode: "append" | "replace";
    matches: BulkCreateMatchItem[];
  }) => Promise<boolean>;
  addEvent: (
    matchId: number,
    payload: {
      team: TeamKey;
      type: EventType;
      player: string;
      count?: number;
    },
  ) => Promise<boolean>;
  undoLastEvent: (matchId: number) => Promise<boolean>;
  toggleClock: (matchId: number) => Promise<boolean>;
  resetClock: (matchId: number) => Promise<boolean>;
  setMatchDuration: (matchId: number, durationSeconds: number) => Promise<boolean>;
  setBatchDuration: (matchIds: number[], durationSeconds: number) => Promise<boolean>;
  resetMatch: (matchId: number) => Promise<boolean>;
  setPeriod: (
    matchId: number,
    period: 1 | 2 | 3 | 4,
  ) => Promise<boolean>;
  setFinalScore: (
    matchId: number,
    payload: FinalScorePayload,
  ) => Promise<boolean>;
  finishMatch: (matchId: number) => Promise<boolean>;
};

const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const recentAgendaBatchRef = useRef(new Map<string, number>());
  const [rawMatches, setRawMatches] = useState<MatchItem[]>([]);
  const [activeMatchId, setActiveMatchId] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [connectionError, setConnectionError] =
    useState<string | null>(null);
  const [adminReady, setAdminReady] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const matches = useMemo(
    () =>
      applyTournamentProgression(
        rawMatches.map((match) => ({
          ...match,
          teamA: getTeamDisplayName(match.teamA),
          teamB: getTeamDisplayName(match.teamB),
        })),
      ),
    [rawMatches],
  );

  const useReturnedMatches = useCallback(
    (nextMatches: MatchItem[]) => {
      setRawMatches(nextMatches);
      setActiveMatchId((current) =>
        nextMatches.some((match) => match.id === current)
          ? current
          : (nextMatches[0]?.id ?? 0),
      );
      setIsLive(true);
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const needsFullPayload =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/estadisticas");
      const endpoint = needsFullPayload
        ? "/api/tournament"
        : "/api/tournament/public";
      const response = await fetch(
        endpoint,
        needsFullPayload ? { cache: "no-store" } : undefined,
      );
      const result = (await response.json()) as {
        matches?: MatchItem[];
        error?: string;
      };

      if (!response.ok || !result.matches) {
        throw new Error(
          result.error ?? "No se pudieron leer los partidos.",
        );
      }

      useReturnedMatches(result.matches);
      setConnectionError(null);
    } catch (error) {
      setIsLive(false);
      setConnectionError(
        error instanceof Error
          ? error.message
          : "Sin conexión con la base.",
      );
    }
  }, [pathname, useReturnedMatches]);

  useEffect(() => {
    let lastPublicRefresh = 0;

    const tick = (force = false) => {
      if (document.hidden) return;

      const isAdmin =
        window.location.pathname.startsWith("/admin");
      const now = Date.now();

      if (
        force ||
        isAdmin ||
        now - lastPublicRefresh >= 10000
      ) {
        if (!isAdmin) lastPublicRefresh = now;
        void refresh();
      }
    };

    const initialLoad = window.setTimeout(
      () => tick(true),
      0,
    );
    const poll = window.setInterval(
      () => tick(false),
      5000,
    );

    const onVisibilityChange = () => {
      if (!document.hidden) tick(true);
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
  }, [refresh]);

  useEffect(() => {
    const clock = window.setInterval(() => {
      setRawMatches((previous) =>
        previous.map((match) =>
          match.isRunning
            ? (() => {
                const clockSeconds = Math.min(
                  match.durationSeconds,
                  match.clockSeconds + 1,
                );
                return {
                  ...match,
                  clockSeconds,
                  isRunning: clockSeconds < match.durationSeconds,
                };
              })()
            : match,
        ),
      );
    }, 1000);

    return () => window.clearInterval(clock);
  }, []);

  const authenticateAdmin = useCallback(
    async (password: string) => {
      setAdminError(null);

      try {
        const response = await fetch("/api/tournament", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
            "x-admin-password": password,
          },
          body: JSON.stringify({ action: "authenticate" }),
        });

        const result = (await response.json()) as {
          error?: string;
        };

        if (!response.ok) {
          setAdminReady(false);
          setAdminError(
            result.error ?? "Clave incorrecta.",
          );
          return false;
        }

        setAdminReady(true);
        return true;
      } catch {
        setAdminReady(false);
        setAdminError("No se pudo validar la clave.");
        return false;
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const response = await fetch("/api/tournament", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ action: "authenticate" }),
        });

        if (!cancelled && response.ok) {
          setAdminReady(true);
          setAdminError(null);
        }
      } catch {
        // Si no hay sesión previa, se muestra el login normal.
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const sendAdminAction = useCallback(
    async (action: TournamentAction) => {
      if (!adminReady) {
        setAdminError(
          "Ingresá la clave de administrador para cargar cambios.",
        );
        return false;
      }

      setAdminError(null);

      try {
        const response = await fetch("/api/tournament", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(action),
        });

        const result = (await response.json()) as {
          matches?: MatchItem[];
          error?: string;
        };

        if (!response.ok || !result.matches) {
          if (response.status === 401) {
            setAdminReady(false);
          }

          setAdminError(
            result.error ?? "No se pudo guardar el cambio.",
          );
          return false;
        }

        useReturnedMatches(result.matches);
        return true;
      } catch {
        setAdminError(
          "No se pudo conectar con el servidor para guardar el cambio.",
        );
        return false;
      }
    },
    [adminReady, useReturnedMatches],
  );

  const sendAgendaBatch = useCallback(
    async (
      matchId: number,
      operation: "start" | "pause" | "reset" | "finish",
    ) => {
      const isAgenda = pathname === "/admin" || pathname === "/admin/";
      if (!isAgenda) return null;

      const match = matches.find((item) => item.id === matchId);
      if (!match) return false;

      const group = matches.filter(
        (item) =>
          item.day === match.day &&
          item.timeLabel.trim() === match.timeLabel.trim(),
      );
      const matchIds = group.map((item) => item.id);
      const key = `${match.day}|${match.timeLabel}|${operation}`;
      const now = Date.now();
      const previous = recentAgendaBatchRef.current.get(key) ?? 0;

      if (now - previous < 3000) {
        return true;
      }

      recentAgendaBatchRef.current.set(key, now);

      if (operation === "finish") {
        const pendingWithoutScore = group.filter(
          (item) =>
            item.status !== "finalizado" &&
            (item.scoreA === null || item.scoreB === null),
        );

        if (pendingWithoutScore.length > 0) {
          setAdminError(
            `No se puede finalizar la tanda: faltan ${pendingWithoutScore.length} marcador(es).`,
          );
          return false;
        }
      }

      return sendAdminAction({
        action: "batch_clock",
        matchIds,
        operation,
      });
    },
    [matches, pathname, sendAdminAction],
  );

  const value = useMemo<TournamentContextType>(
    () => ({
      matches,
      activeMatchId,
      setActiveMatchId,
      isLive,
      connectionError,
      adminReady,
      adminError,
      refresh,
      authenticateAdmin,
      createMatch: (payload) =>
        sendAdminAction({
          action: "create_match",
          payload,
        }),
      createMatchesBulk: (payload) =>
        sendAdminAction({
          action: "bulk_create_matches",
          payload,
        }),
      addEvent: (matchId, payload) =>
        sendAdminAction({
          action: "event",
          matchId,
          payload,
        }),
      undoLastEvent: (matchId) =>
        sendAdminAction({
          action: "undo",
          matchId,
        }),
      toggleClock: async (matchId) => {
        const match = matches.find((item) => item.id === matchId);
        const agendaResult = await sendAgendaBatch(
          matchId,
          match?.isRunning ? "pause" : "start",
        );
        if (agendaResult !== null) return agendaResult;

        return sendAdminAction({
          action: "toggle_clock",
          matchId,
        });
      },
      resetClock: async (matchId) => {
        const agendaResult = await sendAgendaBatch(matchId, "reset");
        if (agendaResult !== null) return agendaResult;

        return sendAdminAction({
          action: "reset_clock",
          matchId,
        });
      },
      setMatchDuration: (matchId, durationSeconds) =>
        sendAdminAction({
          action: "set_duration",
          matchId,
          durationSeconds,
        }),
      setBatchDuration: (matchIds, durationSeconds) =>
        sendAdminAction({
          action: "batch_duration",
          matchIds,
          durationSeconds,
        }),
      resetMatch: (matchId) =>
        sendAdminAction({
          action: "reset_match",
          matchId,
        }),
      setPeriod: (matchId, period) =>
        sendAdminAction({
          action: "set_period",
          matchId,
          period,
        }),
      setFinalScore: (matchId, payload) =>
        sendAdminAction({
          action: "set_final_score",
          matchId,
          payload,
        }),
      finishMatch: async (matchId) => {
        const agendaResult = await sendAgendaBatch(matchId, "finish");
        if (agendaResult !== null) return agendaResult;

        return sendAdminAction({
          action: "finish",
          matchId,
        });
      },
    }),
    [
      activeMatchId,
      adminError,
      adminReady,
      authenticateAdmin,
      connectionError,
      isLive,
      matches,
      refresh,
      sendAdminAction,
      sendAgendaBatch,
    ],
  );

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);

  if (!context) {
    throw new Error(
      "useTournament debe usarse dentro de TournamentProvider",
    );
  }

  return context;
}
