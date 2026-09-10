import type {
  EventType,
  MatchStatus,
  TeamKey,
} from "@/src/lib/tournament-types";

export type SimulatedGoal = {
  player: string;
  count: number;
};

export type SimulatedCard = {
  player: string;
  type: Exclude<EventType, "goal">;
  count: number;
};

export type SimulatedEvent = {
  id: string;
  team: TeamKey;
  type: EventType;
  player: string;
  count: number;
  elapsedSeconds: number;
  period: 1 | 2 | 3 | 4;
  createdAt: string;
};

export type SimulatedResult = {
  scoreA: number;
  scoreB: number;
  goalsA: SimulatedGoal[];
  goalsB: SimulatedGoal[];
  cardsA: SimulatedCard[];
  cardsB: SimulatedCard[];
  penalties: string | null;
  elapsedSeconds: number;
  durationSeconds: number;
  isRunning: boolean;
  clockStartedAt: string | null;
  period: 1 | 2 | 3 | 4;
  status: MatchStatus;
  events: SimulatedEvent[];
  updatedAt?: string;
};
