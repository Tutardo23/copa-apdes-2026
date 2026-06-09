"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
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
import type { LucideIcon } from "lucide-react";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import type { MatchItem, TeamKey } from "@/src/lib/tournament-types";

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
    setFinalScore,
    finishMatch,
    connectionError,
    adminReady,
    adminError,
    authenticateAdmin,
  } = useTournament();

  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [scoreAInput, setScoreAInput] = useState("0");
  const [scoreBInput, setScoreBInput] = useState("0");
  const [modal, setModal] = useState<{ open: boolean; team: TeamKey | null; type: ActionType | null }>({
    open: false,
    team: null,
    type: null,
  });

  const match = useMemo(() => matches.find((item) => item.id === matchId), [matchId, matches]);
  const formattedTime = formatTime(match?.clockSeconds ?? 0);

  const sameTimeMatches = useMemo(() => {
    if (!match) return [];
    return matches
      .filter((item) => item.day === match.day && normalizeTimeLabel(item.timeLabel) === normalizeTimeLabel(match.timeLabel))
      .sort(compareMatchesForAdmin);
  }, [match, matches]);

  const nextSameTimeMatch = useMemo(() => {
    if (!match || sameTimeMatches.length === 0) return null;
    const index = sameTimeMatches.findIndex((item) => item.id === match.id);
    return sameTimeMatches.slice(index + 1).find((item) => item.status !== "finalizado") ?? null;
  }, [match, sameTimeMatches]);

  const nextPendingMatch = useMemo(() => {
    if (!match) return null;
    return matches
      .filter((item) => item.status !== "finalizado" && item.id !== match.id)
      .sort(compareMatchesForAdmin)[0] ?? null;
  }, [match, matches]);

  useEffect(() => {
    if (Number.isInteger(matchId) && matchId > 0) setActiveMatchId(matchId);
  }, [matchId, setActiveMatchId]);

  useEffect(() => {
    if (!match) return;
    setScoreAInput(String(match.scoreA ?? 0));
    setScoreBInput(String(match.scoreB ?? 0));
  }, [match?.id, match?.scoreA, match?.scoreB]);

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

  const saveFinalScore = async () => {
    if (!match) return;
    const scoreA = Number(scoreAInput);
    const scoreB = Number(scoreBInput);

    if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
      window.alert("Revisá el marcador. Tiene que ser un número válido.");
      return;
    }

    await setFinalScore(match.id, { scoreA, scoreB, finish: true });
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

      <section className="mx-auto w-full max-w-[1100px] px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#74786a] shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a agenda
          </button>

          {nextSameTimeMatch && (
            <button
              type="button"
              onClick={() => router.push(`/admin/partido/${nextSameTimeMatch.id}`)}
              className="inline-flex items-center gap-2 rounded-full bg-[#151711] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-sm"
            >
              Siguiente de esta hora
            </button>
          )}

          {nextPendingMatch && (
            <button
              type="button"
              onClick={() => router.push(`/admin/partido/${nextPendingMatch.id}`)}
              className="inline-flex items-center gap-2 rounded-full bg-[#f0ede3] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#74786a] shadow-sm"
            >
              Siguiente pendiente
            </button>
          )}
        </div>

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

            <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Carga desde mesa</p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">Resultado final</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#62675d]">
                  Pensado para cuando el árbitro trae el papel a mesa: cargás el marcador final y el partido queda finalizado.
                </p>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                  <ScoreInput label={match.teamA} value={scoreAInput} onChange={setScoreAInput} />
                  <span className="pb-4 text-3xl font-black text-[#d7c77a]">:</span>
                  <ScoreInput label={match.teamB} value={scoreBInput} onChange={setScoreBInput} />
                </div>

                <button
                  type="button"
                  onClick={() => void saveFinalScore()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#151711] px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Guardar resultado final
                </button>
              </section>

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
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Carga detallada opcional</p>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">Eventos</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#62675d]">
                Usalo si quieren registrar goleadoras o tarjetas por jugadora. Si solo necesitan resultado final, alcanza con la carga desde mesa.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <TeamEventPanel team="teamA" name={match.teamA} onAction={openAction} />
                <TeamEventPanel team="teamB" name={match.teamB} onAction={openAction} />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Timeline</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">Registro</h2>
                </div>
                <span className="rounded-full bg-[#f0ede3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
                  {match.events.length} eventos
                </span>
              </div>

              {match.events.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#ded9cc] p-6 text-center text-sm font-bold text-[#74786a]">Sin eventos.</p>
              ) : (
                <div className="space-y-2">
                  {match.events.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 rounded-2xl bg-[#fbfaf6] p-4">
                      <span className="w-10 text-right text-sm font-black text-[#74786a]">{event.minute}&apos;</span>
                      <EventIcon type={event.type} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{event.player}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
                          {event.team === "teamA" ? match.teamA : match.teamB}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>
        )}
      </section>
    </main>
  );
}

function Scoreboard({ match }: { match: MatchItem }) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_22px_70px_rgba(21,23,17,0.25)] md:p-8">
      <div className="absolute inset-4 rounded-[28px] border border-white/10" />
      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d7c77a]">
          {dayLabel(match.day)} · {getCompetitionFromCategory(match.category)} · {getCleanCategory(match.category)} · {shortCourt(match.court)}
        </p>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/70">
          {statusLabel(match.status)}
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <ScoreTeam name={match.teamA} />
        <div className="text-center">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Marcador</p>
          <p className="text-6xl font-black tracking-[-0.08em] text-[#d7c77a]">
            {match.scoreA ?? "-"}<span className="text-white">:</span>{match.scoreB ?? "-"}
          </p>
        </div>
        <ScoreTeam name={match.teamB} align="right" />
      </div>
    </section>
  );
}

function ScoreTeam({ name, align = "left" }: { name: string; align?: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-3 ${align === "right" ? "text-right" : "text-left"}`}>
      <TeamShield name={name} size="lg" />
      <p className="max-w-[150px] truncate text-sm font-black uppercase tracking-[0.14em] text-white">{name}</p>
    </div>
  );
}

function ScoreInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block truncate text-center text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 2))}
        className="w-full rounded-[24px] border border-[#ded9cc] bg-[#fbfaf6] px-4 py-5 text-center text-5xl font-black tracking-[-0.08em] outline-none focus:border-[#151711]"
      />
    </label>
  );
}

function TeamEventPanel({ team, name, onAction }: { team: TeamKey; name: string; onAction: (team: TeamKey, type: ActionType) => void }) {
  return (
    <section className="rounded-[26px] border border-[#ded9cc] bg-[#fbfaf6] p-4">
      <div className="mb-4 flex items-center gap-3">
        <TeamShield name={name} />
        <h3 className="truncate text-lg font-black">{name}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <EventBtn label="Gol" icon={Target} onClick={() => onAction(team, "goal")} />
        <EventBtn label="Verde" icon={Square} onClick={() => onAction(team, "green_card")} tone="green" />
        <EventBtn label="Amarilla" icon={Square} onClick={() => onAction(team, "yellow_card")} tone="yellow" />
      </div>
    </section>
  );
}

function ActionBtn({ onClick, icon: Icon, label }: { onClick: () => void; icon: LucideIcon; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151711] px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function EventBtn({ label, icon: Icon, onClick, tone = "dark" }: { label: string; icon: LucideIcon; onClick: () => void; tone?: "dark" | "green" | "yellow" }) {
  const toneClass = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "yellow" ? "bg-[#f5edc9] text-[#7a6618]" : "bg-[#151711] text-white";

  return (
    <button onClick={onClick} className={`inline-flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-4 text-[10px] font-black uppercase tracking-[0.14em] ${toneClass}`}>
      <Icon className={`h-4 w-4 ${tone === "green" ? "fill-emerald-600" : tone === "yellow" ? "fill-[#d7c77a]" : ""}`} />
      {label}
    </button>
  );
}

function EventIcon({ type }: { type: ActionType }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
      {type === "goal" && <Target className="h-5 w-5" />}
      {type === "green_card" && <Square className="h-4 w-4 fill-emerald-600 text-emerald-600" />}
      {type === "yellow_card" && <Square className="h-4 w-4 fill-[#d7c77a] text-[#d7c77a]" />}
    </div>
  );
}

function compareMatchesForAdmin(a: MatchItem, b: MatchItem) {
  return (
    dayOrder(a.day) - dayOrder(b.day) ||
    timeToMinutes(a.timeLabel) - timeToMinutes(b.timeLabel) ||
    compareCourts(a.court, b.court) ||
    getCompetitionFromCategory(a.category).localeCompare(getCompetitionFromCategory(b.category)) ||
    categoryNumber(getCleanCategory(a.category)) - categoryNumber(getCleanCategory(b.category)) ||
    a.id - b.id
  );
}

function dayOrder(day: string) {
  return day === "dia1" ? 1 : 2;
}

function compareCourts(a: string, b: string) {
  return courtNumber(a) - courtNumber(b) || a.localeCompare(b);
}

function categoryNumber(value: string) {
  const match = value.match(/categor[ií]a\s*(\d+)/i);
  return match ? Number(match[1]) : 99;
}

function courtNumber(value: string) {
  const match = value.match(/cancha\s*(\d+)/i);
  return match ? Number(match[1]) : 99;
}

function timeToMinutes(value: string) {
  const match = normalizeTimeLabel(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function normalizeTimeLabel(value?: string) {
  return (value ?? "")
    .trim()
    .replace(/^(\d{1,2}),(\d{2})(.*)$/g, "$1:$2$3")
    .replace(/\s*hs?\.?$/i, " hs");
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function dayLabel(day: string) {
  return day === "dia1" ? "Día 1" : "Día 2";
}

function statusLabel(status: string) {
  if (status === "en_curso") return "En juego";
  if (status === "finalizado") return "Finalizado";
  return "Pendiente";
}

function actionLabel(type: ActionType | null) {
  if (type === "goal") return "Gol";
  if (type === "green_card") return "Tarjeta verde";
  if (type === "yellow_card") return "Tarjeta amarilla";
  return "Evento";
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

function TeamShield({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const src = getSchoolShield(name);
  const sizeClass = size === "lg" ? "h-16 w-16 md:h-20 md:w-20" : "h-10 w-10";

  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#ded9cc] bg-white`}>
      {src ? (
        <Image src={src} alt={`Escudo de ${name}`} width={96} height={96} className="h-full w-full object-contain p-1.5" />
      ) : (
        <span className="text-[9px] font-black text-[#151711]"><ShieldCheck className="mx-auto h-3 w-3" />{getInitials(name)}</span>
      )}
    </div>
  );
}
