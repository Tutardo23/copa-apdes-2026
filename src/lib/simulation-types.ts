export type SimulatedGoal = {
  player: string;
  count: number;
};

export type SimulatedCard = {
  player: string;
  type: "green_card" | "yellow_card" | "red_card";
  count: number;
};

export type SimulatedResult = {
  scoreA: number;
  scoreB: number;
  goalsA: SimulatedGoal[];
  goalsB: SimulatedGoal[];
  cardsA: SimulatedCard[];
  cardsB: SimulatedCard[];
  penalties: string | null;
  updatedAt?: string;
};
