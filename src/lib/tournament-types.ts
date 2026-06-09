export type DayKey = "dia1" | "dia2";
export type TeamKey = "teamA" | "teamB";
export type EventType = "goal" | "green_card" | "yellow_card";
export type MatchStatus = "por_jugar" | "en_curso" | "finalizado";
export type MatchStage = "grupo" | "cuartos" | "semifinal" | "final";

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
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  clockSeconds: number;
  period: 1 | 2 | 3 | 4;
  isRunning: boolean;
  featured: boolean;
  stage: MatchStage;
  penalties: string | null;
  events: MatchEvent[];
};

export type BulkCreateMatchItem = {
  day: DayKey;
  date: string;
  timeLabel: string;
  category: string;
  court: string;
  teamA: string;
  teamB: string;
  stage: MatchStage;
  featured: boolean;
};

export type TournamentAction =
  | {
      action: "create_match";
      payload: BulkCreateMatchItem;
    }
  | {
      action: "bulk_create_matches";
      payload: {
        mode: "append" | "replace";
        matches: BulkCreateMatchItem[];
      };
    }
  | {
      action: "event";
      matchId: number;
      payload: { team: TeamKey; type: EventType; player: string };
    }
  | {
      action: "set_final_score";
      matchId: number;
      payload: { scoreA: number; scoreB: number; finish?: boolean };
    }
  | { action: "undo"; matchId: number }
  | { action: "toggle_clock"; matchId: number }
  | { action: "reset_clock"; matchId: number }
  | { action: "reset_match"; matchId: number }
  | { action: "set_period"; matchId: number; period: 1 | 2 | 3 | 4 }
  | { action: "finish"; matchId: number }
  | { action: "authenticate" };
