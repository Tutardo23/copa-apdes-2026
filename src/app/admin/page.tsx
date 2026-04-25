"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Pause,
  Play,
  RotateCcw,
  Square,
  Target,
  Trophy,
  Undo2,
  X,
} from "lucide-react";

type TeamKey = "teamA" | "teamB";
type ActionType = "goal" | "green" | "yellow";

type EventItem = {
  id: number;
  minute: number;
  second: number;
  period: string;
  team: TeamKey;
  type: ActionType;
  player: string;
};

const players = {
  teamA: ["Martina López", "Ana Gómez", "Lucía Díaz", "Sofía Pérez", "Julieta Sosa"],
  teamB: ["Camila Ruiz", "Valentina Paz", "Emma Rojas", "Clara Molina", "Delfina Arias"],
};

export default function AdminPlanillaPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [period, setPeriod] = useState<1 | 2 | 3 | 4>(1);

  const [matchState, setMatchState] = useState({
    teamA: { name: "Mirasoles Col.", score: 1 },
    teamB: { name: "Torreón Col.", score: 0 },
    events: [] as EventItem[],
  });

  const [modal, setModal] = useState<{
    open: boolean;
    team: TeamKey | null;
    type: ActionType | null;
  }>({
    open: false,
    team: null,
    type: null,
  });

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTime((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(time / 60).toString().padStart(2, "0");
    const seconds = (time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [time]);

  const currentMinute = Math.floor(time / 60) + 1;
  const selectedTeamName =
    modal.team === "teamA"
      ? matchState.teamA.name
      : modal.team === "teamB"
        ? matchState.teamB.name
        : "";

  const openAction = (team: TeamKey, type: ActionType) => {
    setIsRunning(false);
    setModal({ open: true, team, type });
  };

  const closeModal = () => {
    setModal({ open: false, team: null, type: null });
  };

  const confirmAction = (player: string) => {
    if (!modal.team || !modal.type) return;

    const event: EventItem = {
      id: Date.now(),
      minute: Math.floor(time / 60) + 1,
      second: time % 60,
      period: `Q${period}`,
      team: modal.team,
      type: modal.type,
      player,
    };

    setMatchState((prev) => ({
      ...prev,
      [modal.team as TeamKey]:
        modal.type === "goal"
          ? {
              ...prev[modal.team as TeamKey],
              score: prev[modal.team as TeamKey].score + 1,
            }
          : prev[modal.team as TeamKey],
      events: [event, ...prev.events],
    }));

    closeModal();
    setIsRunning(true);
  };

  const undoLastEvent = () => {
    const lastEvent = matchState.events[0];
    if (!lastEvent) return;

    setMatchState((prev) => {
      const nextEvents = prev.events.slice(1);

      if (lastEvent.type !== "goal") {
        return { ...prev, events: nextEvents };
      }

      return {
        ...prev,
        [lastEvent.team]: {
          ...prev[lastEvent.team],
          score: Math.max(0, prev[lastEvent.team].score - 1),
        },
        events: nextEvents,
      };
    });
  };

  const actionLabel = (type: ActionType | null) => {
    if (type === "goal") return "Gol";
    if (type === "green") return "Tarjeta verde";
    if (type === "yellow") return "Tarjeta amarilla";
    return "Evento";
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      {modal.open && (
        <div className="fixed inset-0 z-[80] flex items-end bg-[#151711]/70 px-3 pb-3 backdrop-blur-sm md:items-center md:justify-center md:p-4">
          <section className="w-full max-w-md rounded-[30px] bg-[#f6f4ee] p-4 shadow-2xl">
            <div className="rounded-[26px] bg-white p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">
                    Cargar evento
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
                    {actionLabel(modal.type)}
                  </h2>
                  <p className="mt-2 text-sm font-bold text-[#62675d]">
                    {selectedTeamName} · {formattedTime} · Q{period}
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-full bg-[#f6f4ee] p-2 text-[#74786a]"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                {modal.team &&
                  players[modal.team].map((player) => (
                    <button
                      key={player}
                      onClick={() => confirmAction(player)}
                      className="flex w-full items-center justify-between rounded-2xl border border-[#eee9dd] bg-[#fbfaf6] px-4 py-4 text-left active:scale-[0.99]"
                    >
                      <span className="text-sm font-black">{player}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
                        Elegir
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </section>
        </div>
      )}

      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-6">
          <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="max-w-3xl text-[2.55rem] font-black leading-[0.92] tracking-[-0.075em] md:text-7xl">
                Planilla{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">en vivo</span>
                  <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#d7c77a]/75 md:h-4" />
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#62675d]">
                Panel para cargar tiempo, goles y tarjetas durante el partido.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ded9cc] bg-white/75 px-4 py-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isRunning ? "bg-emerald-600" : "bg-[#d7c77a]"
                }`}
              />
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#74786a]">
                {isRunning ? "En juego" : "Pausado"}
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="relative overflow-hidden rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_18px_50px_rgba(21,23,17,0.18)] md:p-7">
              <FieldLines />

              <div className="relative z-10 mb-7 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
                    Copa APDES 2026
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Partido actual
                  </h2>
                </div>

                <div className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                  Cancha 1 · C1C
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <TeamScore name={matchState.teamA.name} score={matchState.teamA.score} />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                    Marcador
                  </p>
                  <p className="mt-1 text-2xl font-black text-[#d7c77a]">vs</p>
                </div>
                <TeamScore name={matchState.teamB.name} score={matchState.teamB.score} />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Cronómetro
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Tiempo de partido
                  </h2>
                </div>

                <Clock className="h-6 w-6 text-[#74786a]" />
              </div>

              <div className="rounded-[28px] bg-[#fbfaf6] p-5 text-center">
                <p className="font-mono text-[4.5rem] font-black leading-none tracking-[-0.08em] text-[#151711] md:text-[6rem]">
                  {formattedTime}
                </p>

                <div className="mt-5 grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((q) => (
                    <button
                      key={q}
                      onClick={() => setPeriod(q as 1 | 2 | 3 | 4)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-black ${
                        period === q
                          ? "border-[#151711] bg-[#151711] text-white"
                          : "border-[#ded9cc] bg-white text-[#74786a]"
                      }`}
                    >
                      Q{q}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setTime(0)}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ded9cc] bg-white text-[#74786a]"
                    aria-label="Reiniciar"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setIsRunning((prev) => !prev)}
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#151711] text-base font-black text-white"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-5 w-5" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 fill-current" />
                        Iniciar
                      </>
                    )}
                  </button>

                  <button
                    onClick={undoLastEvent}
                    disabled={matchState.events.length === 0}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ded9cc] bg-white text-[#74786a] disabled:opacity-40"
                    aria-label="Deshacer último evento"
                  >
                    <Undo2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                Acciones rápidas
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                Cargar evento
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <ActionTeam
                  title={matchState.teamA.name}
                  onGoal={() => openAction("teamA", "goal")}
                  onGreen={() => openAction("teamA", "green")}
                  onYellow={() => openAction("teamA", "yellow")}
                />

                <ActionTeam
                  title={matchState.teamB.name}
                  onGoal={() => openAction("teamB", "goal")}
                  onGreen={() => openAction("teamB", "green")}
                  onYellow={() => openAction("teamB", "yellow")}
                />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Registro
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Eventos
                  </h2>
                </div>

                <span className="rounded-full bg-[#f6f4ee] px-3 py-1 text-xs font-black text-[#74786a]">
                  {matchState.events.length}
                </span>
              </div>

              {matchState.events.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-6 text-center">
                  <p className="text-sm font-bold text-[#74786a]">
                    Todavía no se cargaron eventos.
                  </p>
                </div>
              ) : (
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {matchState.events.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      teamName={
                        event.team === "teamA"
                          ? matchState.teamA.name
                          : matchState.teamB.name
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

function TeamScore({ name, score }: { name: string; score: number }) {
  return (
    <div className="min-w-0 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-black">
        {getInitials(name)}
      </div>
      <p className="truncate text-sm font-black text-white">{name}</p>
      <p className="mt-2 text-6xl font-black tracking-[-0.08em]">{score}</p>
    </div>
  );
}

function ActionTeam({
  title,
  onGoal,
  onGreen,
  onYellow,
}: {
  title: string;
  onGoal: () => void;
  onGreen: () => void;
  onYellow: () => void;
}) {
  return (
    <div className="rounded-[24px] bg-[#fbfaf6] p-3">
      <p className="mb-3 truncate text-sm font-black">{title}</p>

      <button
        onClick={onGoal}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#151711] px-3 py-3 text-sm font-black text-white"
      >
        <Target className="h-4 w-4 text-[#d7c77a]" />
        Gol
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onGreen}
          className="flex items-center justify-center rounded-2xl bg-white py-3"
          aria-label="Tarjeta verde"
        >
          <Square className="h-5 w-5 fill-emerald-600 text-emerald-600" />
        </button>

        <button
          onClick={onYellow}
          className="flex items-center justify-center rounded-2xl bg-white py-3"
          aria-label="Tarjeta amarilla"
        >
          <Square className="h-5 w-5 fill-[#d7c77a] text-[#d7c77a]" />
        </button>
      </div>
    </div>
  );
}

function EventRow({ event, teamName }: { event: EventItem; teamName: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fbfaf6] p-3">
      <div className="w-12 text-right">
        <p className="text-sm font-black">{event.minute}'</p>
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#74786a]">
          {event.period}
        </p>
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
        {event.type === "goal" && <Target className="h-5 w-5 text-[#151711]" />}
        {event.type === "green" && (
          <Square className="h-4 w-4 fill-emerald-600 text-emerald-600" />
        )}
        {event.type === "yellow" && (
          <Square className="h-4 w-4 fill-[#d7c77a] text-[#d7c77a]" />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-black">{event.player}</p>
        <p className="truncate text-xs font-bold text-[#74786a]">{teamName}</p>
      </div>
    </div>
  );
}

function FieldLines() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.16]">
      <div className="absolute inset-4 rounded-[28px] border border-white" />
      <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px bg-white" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
      <div className="absolute left-4 top-1/2 h-28 w-16 -translate-y-1/2 rounded-r-full border border-l-0 border-white" />
      <div className="absolute right-4 top-1/2 h-28 w-16 -translate-y-1/2 rounded-l-full border border-r-0 border-white" />
    </div>
  );
}

function getInitials(name: string) {
  return name
    .replace(".", "")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}