"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Target,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import type { EventType, MatchItem, TeamKey } from "@/src/lib/tournament-types";

type ActionType = "goal" | "green_card" | "yellow_card";

export default function AdminPartidoPage() {
  const router = useRouter();
  const params = useParams<{ matchId: string }>();
  const matchId = Number(params.matchId);

  const {
    matches,
    setActiveMatchId,
    addEvent,
    undoLastEvent,
    toggleClock,
    resetClock,
    resetMatch,
    setPeriod,
    finishMatch,
    connectionError,
    adminReady,
    adminError,
    authenticateAdmin,
  } = useTournament();

  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [modal, setModal] = useState<{ open: boolean; team: TeamKey | null; type: ActionType | null }>({
    open: false,
    team: null,
    type: null,
  });

  const match = useMemo(() => matches.find((item) => item.id === matchId), [matchId, matches]);
  const formattedTime = formatTime(match?.clockSeconds ?? 0);

  useEffect(() => {
    if (Number.isInteger(matchId) && matchId > 0) setActiveMatchId(matchId);
  }, [matchId, setActiveMatchId]);

  const openAction = (team: TeamKey, type: ActionType) => setModal({ open: true, team, type });
  const closeModal = () => {
    setPlayerName("");
    setModal({ open: false, team: null, type: null });
  };

  const confirmAction = async () => {
    if (!match || !modal.team || !modal.type || !playerName.trim()) return;

    const saved = await addEvent(match.id, {
      team: modal.team,
      type: modal.type,
      player: playerName.trim(),
    });

    if (saved) closeModal();
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      {modal.open && match && (
        <div className="fixed inset-0 z-[80] flex items-end bg-[#151711]/70 px-3 pb-3 backdrop-blur-sm md:items-center md:justify-center md:p-4">
          <section className="w-full max-w-md rounded-[30px] bg-[#f6f4ee] p-4 shadow-2xl">
            <div className="rounded-[26px] bg-white p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">Cargar evento</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">{actionLabel(modal.type)}</h2>
                  <p className="mt-2 text-sm font-bold text-[#62675d]">
                    {modal.team === "teamA" ? match.teamA : match.teamB} · {formattedTime} · Q{match.period}
                  </p>
                </div>

                <button onClick={closeModal} className="rounded-full bg-[#f6f4ee] p-2 text-[#74786a]" aria-label="Cerrar">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[#74786a]">Jugadora</label>
              <input
                autoFocus
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Nombre y apellido"
                className="mt-2 w-full rounded-2xl border border-[#eee9dd] bg-[#fbfaf6] px-4 py-4 text-sm font-bold outline-none focus:border-[#151711]"
              />
              <button
                onClick={confirmAction}
                disabled={!playerName.trim()}
                className="mt-3 w-full rounded-2xl bg-[#151711] px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-40"
              >
                Guardar evento
              </button>
            </div>
          </section>
        </div>
      )}

      <section className="mx-auto w-full max-w-[980px] px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#74786a] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a agenda
        </button>

        {!adminReady && (
          <form
            className="mb-5 flex flex-col gap-3 rounded-[28px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center"
            onSubmit={async (event) => {
              event.preventDefault();
              await authenticateAdmin(password);
            }}
          >
            <div className="flex flex-1 items-center gap-3">
              <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]"><KeyRound className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-black">Acceso privado de administrador</p>
                <p className="text-xs font-bold text-[#74786a]">Entrá con la clave admin para cargar este partido.</p>
              </div>
            </div>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Clave admin"
              className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none focus:border-[#151711]"
            />
            <button className="rounded-2xl bg-[#151711] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Entrar</button>
          </form>
        )}

        {(connectionError || adminError) && (
          <p className="mb-5 rounded-2xl border border-[#d7c77a]/50 bg-[#f5edc9] p-3 text-sm font-bold text-[#6f6125]">
            {adminError ?? `No se pudo conectar con Neon: ${connectionError}`}
          </p>
        )}

        {adminReady && !match && (
          <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-8 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#74786a]">Partido no encontrado</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.07em]">No existe ese partido</h1>
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="mt-5 rounded-2xl bg-[#151711] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
            >
              Volver a agenda
            </button>
          </section>
        )}

        {adminReady && match && (
          <section className="space-y-5">
            <Scoreboard match={match} />

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Cronómetro</p>
                  <h2 className="mt-1 text-5xl font-black tracking-[-0.08em]">{formattedTime}</h2>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((period) => (
                    <button
                      key={period}
                      onClick={() => setPeriod(match.id, period as 1 | 2 | 3 | 4)}
                      className={`rounded-full px-4 py-2 text-xs font-black ${match.period === period ? "bg-[#151711] text-white" : "bg-[#f6f4ee] text-[#74786a]"}`}
                    >
                      Q{period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <ActionBtn onClick={() => toggleClock(match.id)} icon={match.isRunning ? Pause : Play} label={match.isRunning ? "Pausar" : "Iniciar"} />
                <ActionBtn onClick={() => resetClock(match.id)} icon={RotateCcw} label="Reloj a 0" />
                <ActionBtn onClick={() => undoLastEvent(match.id)} icon={Undo2} label="Deshacer" />
                <ActionBtn onClick={() => finishMatch(match.id)} icon={CheckCircle2} label="Finalizar" />
              </div>

              <button
                onClick={() => {
                  if (window.confirm("Esto borra eventos, goles y deja el partido como pendiente. ¿Seguro?")) {
                    void resetMatch(match.id);
                  }
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar prueba y dejar pendiente
              </button>
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Carga rápida</p>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">Eventos del partido</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TeamActionBox title={match.teamA} onGoal={() => openAction("teamA", "goal")} onGreen={() => openAction("teamA", "green_card")} onYellow={() => openAction("teamA", "yellow_card")} />
                <TeamActionBox title={match.teamB} onGoal={() => openAction("teamB", "goal")} onGreen={() => openAction("teamB", "green_card")} onYellow={() => openAction("teamB", "yellow_card")} />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Timeline</p>
              <div className="mt-3 space-y-2">
                {match.events.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#ded9cc] p-4 text-sm font-bold text-[#74786a]">Sin eventos.</p>
                ) : (
                  match.events.map((event) => (
                    <article key={event.id} className="rounded-xl bg-[#fbfaf6] p-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#74786a]">
                        {event.minute}:{event.second.toString().padStart(2, "0")} · Q{event.period}
                      </p>
                      <p className="mt-1 text-sm font-black">{event.player}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#62675d]">
                        {labelEvent(event.type)} · {event.team === "teamA" ? match.teamA : match.teamB}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}

function Scoreboard({ match }: { match: MatchItem }) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_18px_50px_rgba(21,23,17,0.18)] md:p-8">
      <div className="relative z-10 mb-7 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
            {dayLabel(match.day)} · {getCompetitionFromCategory(match.category)} · {getCleanCategory(match.category)}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] md:text-5xl">
            {normalizeTimeLabel(match.timeLabel)} · {shortCourt(match.court)}
          </h1>
        </div>

        <div className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
          {statusLabel(match.status)}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamScore name={match.teamA} score={match.scoreA} />
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Marcador</p>
          <p className="mt-1 text-3xl font-black text-[#d7c77a]">vs</p>
        </div>
        <TeamScore name={match.teamB} score={match.scoreB} />
      </div>
    </section>
  );
}

function ActionBtn({ onClick, icon: Icon, label }: { onClick: () => void; icon: typeof Play; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151711] px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function TeamActionBox({ title, onGoal, onGreen, onYellow }: { title: string; onGoal: () => void; onGreen: () => void; onYellow: () => void }) {
  return (
    <article className="rounded-3xl border border-[#e9e3d4] bg-[#fbfaf6] p-4">
      <div className="flex items-center gap-3">
        <TeamShield name={title} size="md" />
        <p className="truncate text-lg font-black">{title}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button onClick={onGoal} className="rounded-2xl bg-[#151711] px-2 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-white"><Target className="mx-auto mb-1 h-5 w-5" />Gol</button>
        <button onClick={onGreen} className="rounded-2xl bg-emerald-50 px-2 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700"><Square className="mx-auto mb-1 h-5 w-5 fill-emerald-600 text-emerald-600" />Verde</button>
        <button onClick={onYellow} className="rounded-2xl bg-[#f5edc9] px-2 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#6f6125]"><Square className="mx-auto mb-1 h-5 w-5 fill-[#d7c77a] text-[#d7c77a]" />Amarilla</button>
      </div>
    </article>
  );
}

function TeamScore({ name, score }: { name: string; score: number | null }) {
  return (
    <div className="flex flex-col items-center text-center">
      <TeamShield name={name} size="lg" dark />
      <p className="mt-3 max-w-[160px] truncate text-xs font-black uppercase tracking-[0.16em] text-white/60">{name}</p>
      <p className="mt-1 text-7xl font-black tracking-[-0.08em]">{score ?? "-"}</p>
    </div>
  );
}

function TeamShield({ name, size = "md", dark = false }: { name: string; size?: "md" | "lg"; dark?: boolean }) {
  const src = getSchoolShield(name);
  const sizeClass = size === "lg" ? "h-20 w-20" : "h-12 w-12";

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border ${dark ? "border-white/15 bg-white" : "border-[#ded9cc] bg-white"} ${sizeClass}`}>
      {src ? (
        <Image src={src} alt={`Escudo de ${name}`} width={96} height={96} className="h-full w-full object-contain p-1.5" />
      ) : (
        <span className="text-[10px] font-black text-[#151711]"><ShieldCheck className="mx-auto h-4 w-4" />{getInitials(name)}</span>
      )}
    </div>
  );
}

function getSchoolShield(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("portezuelo")) return "/escudos/portezuelo.png";
  if (normalized.includes("torreon")) return "/escudos/torreon.png";
  if (normalized.includes("lcd") || normalized.includes("candiles")) return "/escudos/los-candiles.png";
  if (normalized.includes("crisol")) return "/escudos/crisol.png";
  if (normalized.includes("buen ayre")) return "/escudos/buen-ayre.png";
  if (normalized.includes("mirasoles")) return "/escudos/mirasoles.png";
  if (normalized.includes("cerros")) return "/escudos/los-cerros.png";
  return null;
}

function getInitials(name: string) {
  return name
    .replace(/[^a-zA-ZÁÉÍÓÚÜÑáéíóúüñ ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
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

function dayLabel(day: string) {
  return day === "dia1" ? "Día 1" : "Día 2";
}

function statusLabel(status: string) {
  if (status === "en_curso") return "En juego";
  if (status === "finalizado") return "Finalizado";
  return "Pendiente";
}

function normalizeTimeLabel(value?: string) {
  return (value ?? "")
    .trim()
    .replace(/^(\d{1,2}),(\d{2})(.*)$/g, "$1:$2$3")
    .replace(/\s*hs?\.?$/i, " hs");
}

function shortCourt(value: string) {
  return value.replace(/\s*\((.*?)\)/g, "").trim();
}

function getCleanCategory(category: string) {
  return category.replace(/\s*(federado|colegial)\s*$/i, "").trim();
}

function getCompetitionFromCategory(category: string) {
  const normalized = category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("federado")) return "Federado";
  if (normalized.includes("colegial")) return "Colegial";
  return "General";
}
