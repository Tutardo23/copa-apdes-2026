"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  BulkCreateMatchItem,
  DayKey,
  EventType,
  MatchEvent,
  MatchItem,
  MatchStage,
  TeamKey,
  TournamentAction,
} from "@/src/lib/tournament-types";

export type { BulkCreateMatchItem, DayKey, EventType, MatchEvent, MatchItem, MatchStage, TeamKey };

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
  createMatchesBulk: (payload: { mode: "append" | "replace"; matches: BulkCreateMatchItem[] }) => Promise<boolean>;
  addEvent: (matchId: number, payload: { team: TeamKey; type: EventType; player: string }) => Promise<boolean>;
  undoLastEvent: (matchId: number) => Promise<boolean>;
  toggleClock: (matchId: number) => Promise<boolean>;
  resetClock: (matchId: number) => Promise<boolean>;
  resetMatch: (matchId: number) => Promise<boolean>;
  setPeriod: (matchId: number, period: 1 | 2 | 3 | 4) => Promise<boolean>;
  setFinalScore: (matchId: number, payload: { scoreA: number; scoreB: number; finish?: boolean }) => Promise<boolean>;
  finishMatch: (matchId: number) => Promise<boolean>;
};

const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<number>(0);
  const [isLive, setIsLive] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminReady, setAdminReady] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/tournament", { cache: "no-store" });
      const result = (await response.json()) as { matches?: MatchItem[]; error?: string };

      if (!response.ok || !result.matches) {
        throw new Error(result.error ?? "No se pudieron leer los partidos.");
      }

      setMatches(result.matches);
      setActiveMatchId((current) =>
        result.matches!.some((match) => match.id === current) ? current : (result.matches![0]?.id ?? 0)
      );
      setIsLive(true);
      setConnectionError(null);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Sin conexion con la base.");
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => void refresh(), 0);
    const poll = setInterval(() => void refresh(), 5000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(poll);
    };
  }, [refresh]);

  useEffect(() => {
    const clock = setInterval(() => {
      setMatches((previous) =>
        previous.map((match) =>
          match.isRunning ? { ...match, clockSeconds: match.clockSeconds + 1 } : match
        )
      );
    }, 1000);

    return () => clearInterval(clock);
  }, []);

  const sendAdminAction = useCallback(
    async (action: TournamentAction) => {
      if (!adminReady || !adminPassword) {
        setAdminError("Ingresa la clave de administrador para cargar cambios.");
        return false;
      }

      setAdminError(null);
      const response = await fetch("/api/tournament", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(action),
      });
      const result = (await response.json()) as { matches?: MatchItem[]; error?: string };

      if (!response.ok || !result.matches) {
        setAdminError(result.error ?? "No se pudo guardar el cambio.");
        return false;
      }

      setMatches(result.matches);
      setActiveMatchId((current) =>
        result.matches!.some((match) => match.id === current) ? current : (result.matches![0]?.id ?? 0)
      );
      setIsLive(true);
      return true;
    },
    [adminPassword, adminReady]
  );

  const authenticateAdmin = useCallback(async (password: string) => {
    setAdminError(null);
    const response = await fetch("/api/tournament", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ action: "authenticate" }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setAdminReady(false);
      setAdminError(result.error ?? "Clave incorrecta.");
      return false;
    }

    setAdminPassword(password);
    setAdminReady(true);
    return true;
  }, []);

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
      createMatch: (payload) => sendAdminAction({ action: "create_match", payload }),
      createMatchesBulk: (payload) => sendAdminAction({ action: "bulk_create_matches", payload }),
      addEvent: (matchId, payload) => sendAdminAction({ action: "event", matchId, payload }),
      undoLastEvent: (matchId) => sendAdminAction({ action: "undo", matchId }),
      toggleClock: (matchId) => sendAdminAction({ action: "toggle_clock", matchId }),
      resetClock: (matchId) => sendAdminAction({ action: "reset_clock", matchId }),
      resetMatch: (matchId) => sendAdminAction({ action: "reset_match", matchId }),
      setPeriod: (matchId, period) => sendAdminAction({ action: "set_period", matchId, period }),
      setFinalScore: (matchId, payload) => sendAdminAction({ action: "set_final_score", matchId, payload }),
      finishMatch: (matchId) => sendAdminAction({ action: "finish", matchId }),
    }),
    [
      activeMatchId,
      adminError,
      adminReady,
      connectionError,
      isLive,
      matches,
      refresh,
      sendAdminAction,
      authenticateAdmin,
    ]
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const context = useContext(TournamentContext);

  if (!context) {
    throw new Error("useTournament debe usarse dentro de TournamentProvider");
  }

  return context;
}
