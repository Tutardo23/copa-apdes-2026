"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Square,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type TeamKey = "teamA" | "teamB";
type ActionType = "goal" | "green" | "yellow";

type EventItem = {
  id: number;
  minute: number;
  period: string;
  team: TeamKey;
  type: ActionType;
  player: string;
};

export default function AdminPlanillaPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [period, setPeriod] = useState<1 | 2 | 3 | 4>(1);

  const [matchState, setMatchState] = useState({
    teamA: { name: "Mirasoles", score: 1 },
    teamB: { name: "Torreón", score: 0 },
    events: [] as EventItem[],
  });

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    team: TeamKey | null;
    type: ActionType | null;
  }>({
    isOpen: false,
    team: null,
    type: null,
  });

  const mockPlayers = [
    "Martina López",
    "Ana Gómez",
    "Lucía Díaz",
    "Sofía Pérez",
    "Julieta Sosa",
  ];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((current) => current + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const openAction = (team: TeamKey, type: ActionType) => {
    setIsRunning(false);
    setActionModal({ isOpen: true, team, type });
  };

  const confirmAction = (playerName: string) => {
    const { team, type } = actionModal;

    if (!team || !type) return;

    const currentMinute = Math.floor(time / 60) + 1;

    if (type === "goal") {
      setMatchState((prev) => ({
        ...prev,
        [team]: {
          ...prev[team],
          score: prev[team].score + 1,
        },
        events: [
          {
            id: Date.now(),
            minute: currentMinute,
            period: `Q${period}`,
            team,
            type,
            player: playerName,
          },
          ...prev.events,
        ],
      }));
    } else {
      setMatchState((prev) => ({
        ...prev,
        events: [
          {
            id: Date.now(),
            minute: currentMinute,
            period: `Q${period}`,
            team,
            type,
            player: playerName,
          },
          ...prev.events,
        ],
      }));
    }

    setActionModal({ isOpen: false, team: null, type: null });
    setIsRunning(true);
  };

  const getActionLabel = (type: ActionType | null) => {
    if (type === "goal") return "Gol";
    if (type === "green") return "Tarjeta verde";
    if (type === "yellow") return "Tarjeta amarilla";
    return "Acción";
  };

  const selectedTeamName =
    actionModal.team === "teamA"
      ? matchState.teamA.name
      : actionModal.team === "teamB"
        ? matchState.teamB.name
        : "";

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950">
      <AnimatePresence>
        {actionModal.isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Cargar evento
                  </p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    {getActionLabel(actionModal.type)}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {selectedTeamName} · {formatTime(time)} · Q{period}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setActionModal({ isOpen: false, team: null, type: null })
                  }
                  className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                {mockPlayers.map((player) => (
                  <button
                    key={player}
                    onClick={() => confirmAction(player)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
                  >
                    <span className="font-bold text-slate-900">{player}</span>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Seleccionar
                    </span>
                  </button>
                ))}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-6 sm:px-6 md:pb-10">
        <header className="mb-6 flex flex-col gap-4 rounded-[30px] border border-white bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <Trophy className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                Copa APDES 2026
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
              Planilla del partido
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 md:text-base">
              Control rápido de tiempo, goles y tarjetas. Pensado para cargar
              lo importante sin perder el ritmo del partido.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:min-w-[280px]">
            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Cancha
              </p>
              <p className="mt-1 text-xl font-black">1</p>
            </div>

            <div className="rounded-2xl bg-emerald-600 p-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                Categoría
              </p>
              <p className="mt-1 text-xl font-black">C1C</p>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[34px] bg-slate-950 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] md:p-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                  En vivo
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Control del tiempo
                </h2>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isRunning ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                <span className="text-xs font-bold text-slate-300">
                  {isRunning ? "Corriendo" : "Pausado"}
                </span>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  onClick={() => setPeriod(q as 1 | 2 | 3 | 4)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-black transition active:scale-[0.98] ${
                    period === q
                      ? "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]"
                      : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  Q{q}
                </button>
              ))}
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 text-center">
              <div className="mb-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                <Clock className="h-4 w-4" />
                Cronómetro
              </div>

              <p className="font-mono text-[4.8rem] font-black leading-none tracking-[-0.08em] text-white sm:text-[6rem]">
                {formatTime(time)}
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setTime(0)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 transition hover:bg-white/[0.1] hover:text-white active:scale-95"
                  aria-label="Reiniciar cronómetro"
                >
                  <RotateCcw size={24} />
                </button>

                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex h-16 flex-1 items-center justify-center gap-3 rounded-2xl text-lg font-black transition active:scale-[0.98] ${
                    isRunning
                      ? "bg-rose-500 text-white hover:bg-rose-400"
                      : "bg-emerald-500 text-white hover:bg-emerald-400"
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-6 w-6" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-6 w-6 fill-current" />
                      Iniciar
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-5">
            <div className="rounded-[34px] border border-white bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Marcador
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Partido actual
                  </h2>
                </div>

                <Shield className="h-8 w-8 text-slate-300" />
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <TeamScore
                  label="Local"
                  name={matchState.teamA.name}
                  score={matchState.teamA.score}
                  highlight
                />

                <span className="text-xl font-black text-slate-300">vs</span>

                <TeamScore
                  label="Visita"
                  name={matchState.teamB.name}
                  score={matchState.teamB.score}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionPanel
                title={matchState.teamA.name}
                label="Local"
                onGoal={() => openAction("teamA", "goal")}
                onGreen={() => openAction("teamA", "green")}
                onYellow={() => openAction("teamA", "yellow")}
              />

              <ActionPanel
                title={matchState.teamB.name}
                label="Visita"
                onGoal={() => openAction("teamB", "goal")}
                onGreen={() => openAction("teamB", "green")}
                onYellow={() => openAction("teamB", "yellow")}
              />
            </div>

            <div className="rounded-[30px] border border-white bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Registro
                  </p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                    Últimas acciones
                  </h3>
                </div>

                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>

              <div className="space-y-2">
                {matchState.events.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                    <AlertCircle className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                    <p className="text-sm font-bold text-slate-500">
                      Todavía no se cargaron eventos.
                    </p>
                  </div>
                ) : (
                  matchState.events.slice(0, 4).map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      teamName={
                        event.team === "teamA"
                          ? matchState.teamA.name
                          : matchState.teamB.name
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function TeamScore({
  label,
  name,
  score,
  highlight = false,
}: {
  label: string;
  name: string;
  score: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[26px] p-4 text-center ${
        highlight ? "bg-emerald-50" : "bg-slate-50"
      }`}
    >
      <p
        className={`mb-2 text-[10px] font-black uppercase tracking-[0.2em] ${
          highlight ? "text-emerald-700" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <h3 className="min-h-[40px] text-sm font-black leading-tight text-slate-950">
        {name}
      </h3>

      <p
        className={`mt-3 text-6xl font-black tracking-[-0.08em] ${
          highlight ? "text-emerald-700" : "text-slate-950"
        }`}
      >
        {score}
      </p>
    </div>
  );
}

function ActionPanel({
  title,
  label,
  onGoal,
  onGreen,
  onYellow,
}: {
  title: string;
  label: string;
  onGoal: () => void;
  onGreen: () => void;
  onYellow: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-white bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>

      <h3 className="mb-4 min-h-[40px] text-base font-black leading-tight text-slate-950">
        {title}
      </h3>

      <button
        onClick={onGoal}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white transition hover:bg-slate-800 active:scale-[0.98]"
      >
        <Target className="h-5 w-5 text-emerald-400" />
        Gol
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onGreen}
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 transition hover:bg-white active:scale-[0.98]"
          aria-label="Tarjeta verde"
        >
          <Square className="h-5 w-5 fill-emerald-500 text-emerald-500" />
        </button>

        <button
          onClick={onYellow}
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 transition hover:bg-white active:scale-[0.98]"
          aria-label="Tarjeta amarilla"
        >
          <Square className="h-5 w-5 fill-amber-400 text-amber-400" />
        </button>
      </div>
    </div>
  );
}

function EventRow({
  event,
  teamName,
}: {
  event: EventItem;
  teamName: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-white">
        <span className="text-[10px] font-black text-slate-400">
          {event.period}
        </span>
        <span className="text-sm font-black text-slate-950">
          {event.minute}'
        </span>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
        {event.type === "goal" && (
          <Target className="h-5 w-5 text-emerald-600" />
        )}

        {event.type === "green" && (
          <Square className="h-5 w-5 fill-emerald-500 text-emerald-500" />
        )}

        {event.type === "yellow" && (
          <Square className="h-5 w-5 fill-amber-400 text-amber-400" />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950">
          {event.player}
        </p>
        <p className="truncate text-xs font-semibold text-slate-500">
          {teamName}
        </p>
      </div>
    </div>
  );
}