"use client";

import { useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Square, Target, Undo2, X } from "lucide-react";
import { EventType, TeamKey, useTournament } from "@/src/components/providers/TournamentProvider";

const playersByTeam: Record<string, string[]> = {
  "Mirasoles Col.": ["Martina López", "Julieta Sosa", "Sofía Pérez", "Clara Díaz"],
  "Mirasoles Fed.": ["Lara Viale", "Emma Ruiz", "Delfina Arias", "Cata Rey"],
  "Torreón Col.": ["Ana Gómez", "Lucía Díaz", "Valentina Paz", "Camila Ruiz"],
  "Torreón Fed.": ["Paulina Rojas", "Mora Neri", "Josefina Soler", "Mia Roldán"],
  "Crisol Col.": ["Sofía Pérez", "Mica Varela", "Juana Costa", "Anto Blengio"],
  "Crisol Fed.": ["Mila Paz", "Eugenia Lago", "Noa Abreu", "Inés Pereira"],
  "Los Cerros Col.": ["Valentina Ruiz", "Renata Oliva", "Justina Lima", "Alma Torres"],
  "Los Cerros Fed.": ["Emma Rojas", "Clara Molina", "Olivia Noya", "Luna Curbelo"],
  "Buen Ayre Col.": ["Zoe Cabrera", "Marta Vilar", "Lila Gomez", "Rocío Vera"],
  "El Faro": ["Helena Santos", "Pilar Sena", "Candela Torres", "Francesca Rey"],
};

type ActionType = "goal" | "green_card" | "yellow_card";

export default function AdminPlanillaPage() {
  const { matches, activeMatchId, setActiveMatchId, addEvent, undoLastEvent, toggleClock, resetClock, setPeriod } =
    useTournament();

  const [modal, setModal] = useState<{
    open: boolean;
    team: TeamKey | null;
    type: ActionType | null;
  }>({
    open: false,
    team: null,
    type: null,
  });

  const activeMatch = useMemo(
    () => matches.find((match) => match.id === activeMatchId) ?? matches[0],
    [activeMatchId, matches]
  );

  if (!activeMatch) return null;

  const formattedTime = formatTime(activeMatch.clockSeconds);

  const openAction = (team: TeamKey, type: ActionType) => {
    setModal({ open: true, team, type });
  };

  const closeModal = () => setModal({ open: false, team: null, type: null });

  const confirmAction = (player: string) => {
    if (!modal.team || !modal.type) return;

    addEvent(activeMatch.id, {
      team: modal.team,
      type: modal.type,
      player,
    });

    closeModal();
  };

  const players =
    modal.team === "teamA"
      ? playersByTeam[activeMatch.teamA] ?? []
      : modal.team === "teamB"
        ? playersByTeam[activeMatch.teamB] ?? []
        : [];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      {modal.open && (
        <div className="fixed inset-0 z-[80] flex items-end bg-[#151711]/70 px-3 pb-3 backdrop-blur-sm md:items-center md:justify-center md:p-4">
          <section className="w-full max-w-md rounded-[30px] bg-[#f6f4ee] p-4 shadow-2xl">
            <div className="rounded-[26px] bg-white p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">Cargar evento</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">{actionLabel(modal.type)}</h2>
                  <p className="mt-2 text-sm font-bold text-[#62675d]">
                    {modal.team === "teamA" ? activeMatch.teamA : activeMatch.teamB} · {formattedTime} · Q
                    {activeMatch.period}
                  </p>
                </div>

                <button onClick={closeModal} className="rounded-full bg-[#f6f4ee] p-2 text-[#74786a]" aria-label="Cerrar">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                {players.map((player) => (
                  <button
                    key={player}
                    onClick={() => confirmAction(player)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#eee9dd] bg-[#fbfaf6] px-4 py-4 text-left active:scale-[0.99]"
                  >
                    <span className="text-sm font-black">{player}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">Elegir</span>
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
                Planilla <span className="relative inline-block"><span className="relative z-10">en vivo</span><span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#d7c77a]/75 md:h-4" /></span>
              </h1>

              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#62675d]">
                Cargá múltiples partidos en paralelo. Todo impacta en estadísticas al instante.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ded9cc] bg-white/75 px-4 py-2">
              <span className={`h-2.5 w-2.5 rounded-full ${activeMatch.isRunning ? "bg-emerald-600" : "bg-[#d7c77a]"}`} />
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#74786a]">
                {activeMatch.isRunning ? "En juego" : "Pausado"}
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="relative overflow-hidden rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_18px_50px_rgba(21,23,17,0.18)] md:p-7">
              <div className="relative z-10 mb-7 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">{activeMatch.day} · {activeMatch.category}</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">{activeMatch.court}</h2>
                </div>

                <div className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                  {activeMatch.status.replace("_", " ")}
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <TeamScore name={activeMatch.teamA} score={activeMatch.scoreA} />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Marcador</p>
                  <p className="mt-1 text-2xl font-black text-[#d7c77a]">vs</p>
                </div>
                <TeamScore name={activeMatch.teamB} score={activeMatch.scoreB} />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Cronómetro</p>
                  <h3 className="mt-1 text-3xl font-black tracking-[-0.06em]">{formattedTime}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((period) => (
                    <button
                      key={period}
                      onClick={() => setPeriod(activeMatch.id, period as 1 | 2 | 3 | 4)}
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${
                        activeMatch.period === period ? "bg-[#151711] text-white" : "bg-[#f6f4ee] text-[#74786a]"
                      }`}
                    >
                      Q{period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <ActionBtn onClick={() => toggleClock(activeMatch.id)} icon={activeMatch.isRunning ? Pause : Play} label={activeMatch.isRunning ? "Pausar" : "Iniciar"} />
                <ActionBtn onClick={() => resetClock(activeMatch.id)} icon={RotateCcw} label="Reiniciar" />
                <ActionBtn onClick={() => undoLastEvent(activeMatch.id)} icon={Undo2} label="Deshacer" />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Carga rápida</p>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.05em]">Eventos</h3>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <TeamActionBox
                  title={activeMatch.teamA}
                  onGoal={() => openAction("teamA", "goal")}
                  onGreen={() => openAction("teamA", "green_card")}
                  onYellow={() => openAction("teamA", "yellow_card")}
                />
                <TeamActionBox
                  title={activeMatch.teamB}
                  onGoal={() => openAction("teamB", "goal")}
                  onGreen={() => openAction("teamB", "green_card")}
                  onYellow={() => openAction("teamB", "yellow_card")}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Partidos activos</p>
              <div className="mt-3 space-y-2">
                {matches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => setActiveMatchId(match.id)}
                    className={`w-full rounded-2xl border p-3 text-left ${
                      match.id === activeMatch.id ? "border-[#151711] bg-[#151711] text-white" : "border-[#e9e3d4] bg-[#fbfaf6]"
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{match.category} · {match.court}</p>
                    <p className="mt-1 text-sm font-black">{match.teamA} vs {match.teamB}</p>
                    <p className="mt-1 text-xs font-bold opacity-80">{formatTime(match.clockSeconds)} · {match.scoreA}-{match.scoreB}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Timeline</p>
              <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">
                {activeMatch.events.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#ded9cc] p-4 text-sm font-bold text-[#74786a]">Sin eventos.</p>
                ) : (
                  activeMatch.events.map((event) => (
                    <article key={event.id} className="rounded-xl bg-[#fbfaf6] p-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#74786a]">{event.minute}:{event.second.toString().padStart(2, "0")} · Q{event.period}</p>
                      <p className="mt-1 text-sm font-black">{event.player}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#62675d]">{labelEvent(event.type)} · {event.team === "teamA" ? activeMatch.teamA : activeMatch.teamB}</p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function actionLabel(type: ActionType | null) {
  if (type === "goal") return "Gol";
  if (type === "green_card") return "Tarjeta verde";
  if (type === "yellow_card") return "Tarjeta amarilla";
  return "Evento";
}

function labelEvent(type: EventType) {
  if (type === "goal") return "Gol";
  if (type === "green_card") return "Tarjeta verde";
  return "Tarjeta amarilla";
}

function TeamScore({ name, score }: { name: string; score: number }) {
  return (
    <div className="text-center">
      <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-white/60">{name}</p>
      <p className="mt-1 text-6xl font-black tracking-[-0.08em]">{score}</p>
    </div>
  );
}

function ActionBtn({ onClick, icon: Icon, label }: { onClick: () => void; icon: typeof Play; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151711] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function TeamActionBox({
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
    <article className="rounded-2xl border border-[#e9e3d4] bg-[#fbfaf6] p-4">
      <p className="truncate text-sm font-black">{title}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button onClick={onGoal} className="rounded-xl bg-[#151711] px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white">
          <Target className="mx-auto mb-1 h-4 w-4" />
          Gol
        </button>
        <button onClick={onGreen} className="rounded-xl bg-emerald-50 px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
          <Square className="mx-auto mb-1 h-4 w-4 fill-emerald-600 text-emerald-600" />
          Verde
        </button>
        <button onClick={onYellow} className="rounded-xl bg-[#f5edc9] px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#6f6125]">
          <Square className="mx-auto mb-1 h-4 w-4 fill-[#d7c77a] text-[#d7c77a]" />
          Amarilla
        </button>
      </div>
    </article>
  );
}
