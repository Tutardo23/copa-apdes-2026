"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type DayKey = "jueves" | "viernes" | "sabado";
export type TeamKey = "teamA" | "teamB";
export type EventType = "goal" | "green_card" | "yellow_card";

export type MatchEvent = {
  id: number;
  minute: number;
  second: number;
  period: 1 | 2 | 3 | 4;
  team: TeamKey;
  type: EventType;
  player: string;
};

export type MatchItem = {
  id: number;
  day: DayKey;
  date: string;
  timeLabel: string;
  category: string;
  court: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: "por_jugar" | "en_curso" | "finalizado";
  clockSeconds: number;
  period: 1 | 2 | 3 | 4;
  isRunning: boolean;
  events: MatchEvent[];
};

type TournamentContextType = {
  matches: MatchItem[];
  activeMatchId: number;
  setActiveMatchId: (id: number) => void;
  addEvent: (matchId: number, payload: { team: TeamKey; type: EventType; player: string }) => void;
  undoLastEvent: (matchId: number) => void;
  toggleClock: (matchId: number) => void;
  resetClock: (matchId: number) => void;
  setPeriod: (matchId: number, period: 1 | 2 | 3 | 4) => void;
};

const TournamentContext = createContext<TournamentContextType | null>(null);

const INITIAL_MATCHES: MatchItem[] = [
  {
    id: 1,
    day: "jueves",
    date: "23 Abr",
    timeLabel: "08:30",
    category: "C1C",
    court: "Cancha 1",
    teamA: "Mirasoles Col.",
    teamB: "Crisol Col.",
    scoreA: 1,
    scoreB: 0,
    status: "finalizado",
    clockSeconds: 2400,
    period: 4,
    isRunning: false,
    events: [
      {
        id: 101,
        minute: 14,
        second: 10,
        period: 2,
        team: "teamA",
        type: "goal",
        player: "Martina López",
      },
      {
        id: 102,
        minute: 30,
        second: 55,
        period: 3,
        team: "teamB",
        type: "green_card",
        player: "Sofía Pérez",
      },
    ],
  },
  {
    id: 2,
    day: "viernes",
    date: "24 Abr",
    timeLabel: "10:00",
    category: "C1C",
    court: "Cancha 1",
    teamA: "Torreón Col.",
    teamB: "Los Cerros Col.",
    scoreA: 1,
    scoreB: 1,
    status: "en_curso",
    clockSeconds: 960,
    period: 2,
    isRunning: true,
    events: [
      {
        id: 201,
        minute: 5,
        second: 20,
        period: 1,
        team: "teamA",
        type: "goal",
        player: "Ana Gómez",
      },
      {
        id: 202,
        minute: 15,
        second: 5,
        period: 2,
        team: "teamB",
        type: "goal",
        player: "Valentina Ruiz",
      },
    ],
  },
  {
    id: 3,
    day: "viernes",
    date: "24 Abr",
    timeLabel: "10:15",
    category: "C2C",
    court: "Cancha 2",
    teamA: "Buen Ayre Col.",
    teamB: "El Faro",
    scoreA: 0,
    scoreB: 0,
    status: "en_curso",
    clockSeconds: 420,
    period: 1,
    isRunning: true,
    events: [],
  },
  {
    id: 4,
    day: "sabado",
    date: "25 Abr",
    timeLabel: "12:30",
    category: "C3C",
    court: "Cancha 3",
    teamA: "Mirasoles Fed.",
    teamB: "Torreón Fed.",
    scoreA: 0,
    scoreB: 0,
    status: "por_jugar",
    clockSeconds: 0,
    period: 1,
    isRunning: false,
    events: [],
  },
];

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<MatchItem[]>(INITIAL_MATCHES);
  const [activeMatchId, setActiveMatchId] = useState<number>(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setMatches((prev) =>
        prev.map((match) => {
          if (!match.isRunning) return match;

          return {
            ...match,
            status: "en_curso",
            clockSeconds: match.clockSeconds + 1,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const value = useMemo<TournamentContextType>(
    () => ({
      matches,
      activeMatchId,
      setActiveMatchId,
      addEvent(matchId, payload) {
        setMatches((prev) =>
          prev.map((match) => {
            if (match.id !== matchId) return match;

            const event: MatchEvent = {
              id: match.events.length > 0 ? match.events[0].id + 1 : match.id * 1000 + 1,
              minute: Math.floor(match.clockSeconds / 60) + 1,
              second: match.clockSeconds % 60,
              period: match.period,
              team: payload.team,
              type: payload.type,
              player: payload.player,
            };

            const nextScoreA =
              payload.type === "goal" && payload.team === "teamA"
                ? match.scoreA + 1
                : match.scoreA;
            const nextScoreB =
              payload.type === "goal" && payload.team === "teamB"
                ? match.scoreB + 1
                : match.scoreB;

            return {
              ...match,
              status: "en_curso",
              scoreA: nextScoreA,
              scoreB: nextScoreB,
              events: [event, ...match.events],
            };
          })
        );
      },
      undoLastEvent(matchId) {
        setMatches((prev) =>
          prev.map((match) => {
            if (match.id !== matchId || match.events.length === 0) return match;

            const [lastEvent, ...rest] = match.events;
            if (lastEvent.type !== "goal") {
              return { ...match, events: rest };
            }

            return {
              ...match,
              scoreA:
                lastEvent.team === "teamA" ? Math.max(0, match.scoreA - 1) : match.scoreA,
              scoreB:
                lastEvent.team === "teamB" ? Math.max(0, match.scoreB - 1) : match.scoreB,
              events: rest,
            };
          })
        );
      },
      toggleClock(matchId) {
        setMatches((prev) =>
          prev.map((match) =>
            match.id === matchId
              ? {
                  ...match,
                  status: "en_curso",
                  isRunning: !match.isRunning,
                }
              : match
          )
        );
      },
      resetClock(matchId) {
        setMatches((prev) =>
          prev.map((match) =>
            match.id === matchId
              ? {
                  ...match,
                  isRunning: false,
                  clockSeconds: 0,
                  period: 1,
                }
              : match
          )
        );
      },
      setPeriod(matchId, period) {
        setMatches((prev) =>
          prev.map((match) => (match.id === matchId ? { ...match, period } : match))
        );
      },
    }),
    [activeMatchId, matches]
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
