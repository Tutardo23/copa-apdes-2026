"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
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
import { parsePenaltyScore } from "@/src/lib/tournament-engine";
import type {
  EventType,
  MatchItem,
  TeamKey,
} from "@/src/lib/tournament-types";

type ActionType = Extract<
  EventType,
  "goal" | "green_card" | "yellow_card" | "red_card"
>;

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
  const [eventCount, setEventCount] = useState("1");
  const [scoreAInput, setScoreAInput] = useState("0");
  const [scoreBInput, setScoreBInput] = useState("0");
  const [penaltyAInput, setPenaltyAInput] = useState("");
  const [penaltyBInput, setPenaltyBInput] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    team: TeamKey | null;
    type: ActionType | null;
  }>({ open: false, team: null, type: null });

  const match = useMemo(
    () => matches.find((item) => item.id === matchId),
    [matchId, matches],
  );

  useEffect(() => {
    if (Number.isInteger(matchId) && matchId > 0) {
      setActiveMatchId(matchId);
    }
  }, [matchId, setActiveMatchId]);

  useEffect(() => {
    if (!match) return;

    setScoreAInput(String(match.scoreA ?? 0));
    setScoreBInput(String(match.scoreB ?? 0));

    const penalties = parsePenaltyScore(match.penalties);
    setPenaltyAInput(penalties ? String(penalties.scoreA) : "");
    setPenaltyBInput(penalties ? String(penalties.scoreB) : "");
  }, [match?.id, match?.scoreA, match?.scoreB, match?.penalties]);

  const formattedTime = formatClock(match?.clockSeconds ?? 0);
  const scoreA = Number(scoreAInput);
  const scoreB = Number(scoreBInput);
  const isFinalPhase = Boolean(match && match.stage !== "grupo");
  const needsPenalties =
    isFinalPhase &&
    Number.isInteger(scoreA) &&
    Number.isInteger(scoreB) &&
    scoreA === scoreB;

  const sameTimeMatches = useMemo(() => {
    if (!match) return [];

    return matches
      .filter(
        (item) =>
          item.day === match.day &&
          normalizeTimeLabel(item.timeLabel) ===
            normalizeTimeLabel(match.timeLabel),
      )
      .sort(compareMatchesForAdmin);
  }, [match, matches]);

  const nextSameTimeMatch = useMemo(() => {
    if (!match || sameTimeMatches.length === 0) return null;
    const index = sameTimeMatches.findIndex((item) => item.id === match.id);
    return (
      sameTimeMatches
        .slice(index + 1)
        .find((item) => item.status !== "finalizado") ?? null
    );
  }, [match, sameTimeMatches]);

  const nextPendingMatch = useMemo(() => {
    if (!match) return null;
    return (
      matches
        .filter(
          (item) =>
            item.status !== "finalizado" && item.id !== match.id,
        )
        .sort(compareMatchesForAdmin)[0] ?? null
    );
  }, [match, matches]);

  const openAction = (team: TeamKey, type: ActionType) => {
    setPlayerName("");
    setEventCount("1");
    setModal({ open: true, team, type });
  };

  const closeModal = () => {
    if (savingEvent) return;
    setPlayerName("");
    setEventCount("1");
    setModal({ open: false, team: null, type: null });
  };

  const confirmAction = async () => {
    if (!match || !modal.team || !modal.type || !playerName.trim()) return;

    const count =
      modal.type === "goal"
        ? Math.max(1, Math.min(20, Math.trunc(Number(eventCount) || 1)))
        : 1;

    setSavingEvent(true);
    try {
      const saved = await addEvent(match.id, {
        team: modal.team,
        type: modal.type,
        player: playerName.trim(),
        count,
      });

      if (saved) {
        setPlayerName("");
        setEventCount("1");
        setModal({ open: false, team: null, type: null });
      }
    } finally {
      setSavingEvent(false);
    }
  };

  const saveFinalScore = async () => {
    if (!match) return;

    if (
      !Number.isInteger(scoreA) ||
      !Number.isInteger(scoreB) ||
      scoreA < 0 ||
      scoreB < 0
    ) {
      window.alert("Revisá el marcador. Tiene que ser un número válido.");
      return;
    }

    let penalties: string | null = null;

    if (needsPenalties) {
      const penaltyA = Number(penaltyAInput);
      const penaltyB = Number(penaltyBInput);

      if (
        !Number.isInteger(penaltyA) ||
        !Number.isInteger(penaltyB) ||
        penaltyA < 0 ||
        penaltyB < 0 ||
        penaltyA === penaltyB
      ) {
        window.alert("La definición por penales necesita un ganador.");
        return;
      }

      penalties = `${penaltyA}-${penaltyB}`;
    }

    await setFinalScore(match.id, {
      scoreA,
      scoreB,
      penalties,
      finish: true,
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      {modal.open && match && (
        <EventModal
          match={match}
          modal={modal}
          playerName={playerName}
          setPlayerName={setPlayerName}
          eventCount={eventCount}
          setEventCount={setEventCount}
          saving={savingEvent}
          onClose={closeModal}
          onConfirm={() => void confirmAction()}
          formattedTime={formattedTime}
        />
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
              onClick={() =>
                router.push(`/admin/partido/${nextSameTimeMatch.id}`)
              }
              className="rounded-full bg-[#151711] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
            >
              Siguiente de esta hora
            </button>
          )}

          {nextPendingMatch && (
            <button
              type="button"
              onClick={() => router.push(`/admin/partido/${nextPendingMatch.id}`)}
              className="rounded-full bg-[#f0ede3] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#74786a]"
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
              const ok = await authenticateAdmin(password);
              if (ok) setPassword("");
            }}
          >
            <div className="flex flex-1 items-center gap-3">
              <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black">Acceso de administrador</p>
                <p className="text-xs font-bold text-[#74786a]">
                  La sesión se recupera si refrescás la página.
                </p>
              </div>
            </div>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Clave admin"
              className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none focus:border-[#151711]"
            />
            <button className="rounded-2xl bg-[#151711] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              Entrar
            </button>
          </form>
        )}

        {(connectionError || adminError) && (
          <p className="mb-5 rounded-2xl border border-[#d7c77a]/50 bg-[#f5edc9] p-3 text-sm font-bold text-[#6f6125]">
            {adminError ?? `No se pudo conectar con Neon: ${connectionError}`}
          </p>
        )}

        {adminReady && !match && (
          <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-8 text-center shadow-sm">
            <h1 className="text-4xl font-black">Partido no encontrado</h1>
          </section>
        )}

        {adminReady && match && (
          <section className="space-y-5">
            <Scoreboard match={match} />

            <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Carga desde mesa
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
                  Resultado final
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#62675d]">
                  Para una carga rápida, alcanza con el marcador. Las goleadoras
                  y tarjetas se cargan debajo si quieren el detalle.
                </p>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                  <ScoreInput
                    label={match.teamA}
                    value={scoreAInput}
                    onChange={setScoreAInput}
                  />
                  <span className="pb-4 text-3xl font-black text-[#d7c77a]">
                    :
                  </span>
                  <ScoreInput
                    label={match.teamB}
                    value={scoreBInput}
                    onChange={setScoreBInput}
                  />
                </div>

                {needsPenalties && (
                  <section className="mt-4 rounded-[24px] border border-[#d7c77a]/50 bg-[#fff8dc] p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#6f6125]">
                      Definición por penales
                    </p>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                      <ScoreInput
                        label={match.teamA}
                        value={penaltyAInput}
                        onChange={setPenaltyAInput}
                      />
                      <span className="pb-4 text-2xl font-black text-[#9c8737]">
                        :
                      </span>
                      <ScoreInput
                        label={match.teamB}
                        value={penaltyBInput}
                        onChange={setPenaltyBInput}
                      />
                    </div>
                  </section>
                )}

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
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Cronómetro
                </p>
                <h2 className="mt-1 text-5xl font-black tracking-[-0.08em]">
                  {formattedTime}
                </h2>

                <div className="mt-4 flex flex-wrap gap-1">
                  {[1, 2, 3, 4].map((period) => (
                    <button
                      key={period}
                      onClick={() =>
                        void setPeriod(
                          match.id,
                          period as 1 | 2 | 3 | 4,
                        )
                      }
                      disabled={match.status === "finalizado"}
                      className={`rounded-full px-4 py-2 text-xs font-black disabled:opacity-40 ${
                        match.period === period
                          ? "bg-[#151711] text-white"
                          : "bg-[#f6f4ee] text-[#74786a]"
                      }`}
                    >
                      Q{period}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <ActionBtn
                    onClick={() => void toggleClock(match.id)}
                    icon={match.isRunning ? Pause : Play}
                    label={match.isRunning ? "Pausar" : "Iniciar"}
                    disabled={match.status === "finalizado"}
                  />
                  <ActionBtn
                    onClick={() => void resetClock(match.id)}
                    icon={RotateCcw}
                    label="Reloj a 0"
                    disabled={match.status === "finalizado"}
                  />
                  <ActionBtn
                    onClick={() => void undoLastEvent(match.id)}
                    icon={Undo2}
                    label="Deshacer"
                    disabled={match.events.length === 0}
                  />
                  <ActionBtn
                    onClick={() => void finishMatch(match.id)}
                    icon={CheckCircle2}
                    label="Finalizar"
                    disabled={match.status === "finalizado"}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Esto borra eventos, goles, penales y deja el partido pendiente. ¿Seguro?",
                      )
                    ) {
                      void resetMatch(match.id);
                    }
                  }}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar partido
                </button>
              </section>
            </section>

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                Carga detallada
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
                Goleadoras y tarjetas
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#62675d]">
                Para un gol podés poner el nombre una sola vez y la cantidad de
                goles. Las tarjetas disponibles son verde, amarilla y roja.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <TeamEventPanel
                  team="teamA"
                  name={match.teamA}
                  onAction={openAction}
                  disabled={match.status === "finalizado"}
                />
                <TeamEventPanel
                  team="teamB"
                  name={match.teamB}
                  onAction={openAction}
                  disabled={match.status === "finalizado"}
                />
              </div>
            </section>

            <EventsSection match={match} />
          </section>
        )}
      </section>
    </main>
  );
}

function EventModal({
  match,
  modal,
  playerName,
  setPlayerName,
  eventCount,
  setEventCount,
  saving,
  onClose,
  onConfirm,
  formattedTime,
}: {
  match: MatchItem;
  modal: {
    open: boolean;
    team: TeamKey | null;
    type: ActionType | null;
  };
  playerName: string;
  setPlayerName: (value: string) => void;
  eventCount: string;
  setEventCount: (value: string) => void;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formattedTime: string;
}) {
  return (
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
                {modal.team === "teamA" ? match.teamA : match.teamB} · {formattedTime} · Q{match.period}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full bg-[#f6f4ee] p-2 text-[#74786a] disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            Jugadora
          </label>
          <input
            autoFocus
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Nombre y apellido"
            className="mt-2 w-full rounded-2xl border border-[#eee9dd] bg-[#fbfaf6] px-4 py-4 text-sm font-bold outline-none focus:border-[#151711]"
          />

          {modal.type === "goal" && (
            <label className="mt-3 block text-[11px] font-black uppercase tracking-[0.18em] text-[#74786a]">
              Cantidad de goles
              <input
                type="number"
                min={1}
                max={20}
                value={eventCount}
                onChange={(event) => setEventCount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#eee9dd] bg-[#fbfaf6] px-4 py-3 text-center text-xl font-black outline-none focus:border-[#151711]"
              />
            </label>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={!playerName.trim() || saving}
            className="mt-3 w-full rounded-2xl bg-[#151711] px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Guardar evento"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Scoreboard({ match }: { match: MatchItem }) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_22px_55px_rgba(21,23,17,0.18)] md:p-7">
      <div className="relative z-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7c77a]">
              {match.category}
            </p>
            <p className="mt-1 text-xs font-bold text-white/45">
              {match.court} · {displayTime(match.timeLabel)}
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/65">
            {statusLabel(match.status)}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <ScoreTeam name={match.teamA} />
          <div className="text-center">
            <p className="text-5xl font-black tracking-[-0.08em] md:text-7xl">
              {match.scoreA ?? 0}
              <span className="mx-2 text-[#d7c77a]">:</span>
              {match.scoreB ?? 0}
            </p>
            {match.penalties && (
              <p className="mt-2 rounded-full bg-[#d7c77a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#151711]">
                Penales {match.penalties.replace("-", " : ")}
              </p>
            )}
          </div>
          <ScoreTeam name={match.teamB} align="right" />
        </div>
      </div>
    </section>
  );
}

function ScoreTeam({
  name,
  align = "left",
}: {
  name: string;
  align?: "left" | "right";
}) {
  const crest = getSchoolShield(name);

  return (
    <div
      className={`flex min-w-0 flex-col gap-2 ${
        align === "right" ? "items-end text-right" : "items-start"
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white md:h-16 md:w-16">
        {crest ? (
          <Image
            src={crest}
            alt=""
            width={72}
            height={72}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <ShieldCheck className="h-6 w-6 text-[#151711]" />
        )}
      </div>
      <p className="max-w-[180px] truncate text-sm font-black uppercase tracking-[0.04em] md:text-base">
        {name}
      </p>
    </div>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#74786a]">
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={99}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-4 text-center text-3xl font-black outline-none focus:border-[#151711]"
      />
    </label>
  );
}

function ActionBtn({
  onClick,
  icon: Icon,
  label,
  disabled = false,
}: {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151711] px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-35"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function TeamEventPanel({
  team,
  name,
  onAction,
  disabled,
}: {
  team: TeamKey;
  name: string;
  onAction: (team: TeamKey, type: ActionType) => void;
  disabled: boolean;
}) {
  return (
    <article className="rounded-[24px] border border-[#e8e2d5] bg-[#fbfaf6] p-4">
      <p className="truncate text-sm font-black">{name}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <EventButton
          disabled={disabled}
          label="Gol"
          icon={Target}
          onClick={() => onAction(team, "goal")}
        />
        <EventButton
          disabled={disabled}
          label="Verde"
          icon={Square}
          onClick={() => onAction(team, "green_card")}
          tone="green"
        />
        <EventButton
          disabled={disabled}
          label="Amarilla"
          icon={Square}
          onClick={() => onAction(team, "yellow_card")}
          tone="yellow"
        />
        <EventButton
          disabled={disabled}
          label="Roja"
          icon={Square}
          onClick={() => onAction(team, "red_card")}
          tone="red"
        />
      </div>
    </article>
  );
}

function EventButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone = "default",
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled: boolean;
  tone?: "default" | "green" | "yellow" | "red";
}) {
  const iconClass =
    tone === "green"
      ? "fill-emerald-600 text-emerald-600"
      : tone === "yellow"
        ? "fill-amber-400 text-amber-400"
        : tone === "red"
          ? "fill-red-600 text-red-600"
          : "text-[#151711]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#ded9cc] bg-white px-2 py-3 text-[9px] font-black uppercase tracking-[0.1em] text-[#62675d] disabled:opacity-35"
    >
      <Icon className={`h-4 w-4 ${iconClass}`} />
      {label}
    </button>
  );
}

function EventsSection({ match }: { match: MatchItem }) {
  return (
    <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
            Registro
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
            Eventos del partido
          </h2>
        </div>
        <Clock3 className="h-5 w-5 text-[#74786a]" />
      </div>

      {match.events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-6 text-center text-sm font-bold text-[#74786a]">
          Todavía no hay eventos cargados.
        </p>
      ) : (
        <div className="space-y-2">
          {[...match.events]
            .sort(
              (a, b) =>
                b.minute - a.minute ||
                b.second - a.second ||
                b.id - a.id,
            )
            .map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-2xl bg-[#fbfaf6] p-3"
              >
                <span className="text-right text-xs font-black text-[#74786a]">
                  {event.minute}&apos;{String(event.second).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{event.player}</p>
                  <p className="truncate text-[9px] font-black uppercase tracking-[0.13em] text-[#74786a]">
                    {event.team === "teamA" ? match.teamA : match.teamB} · Q{event.period}
                  </p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#62675d]">
                  {eventLabel(event.type)}
                </span>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

function actionLabel(type: ActionType | null) {
  if (type === "goal") return "Gol";
  if (type === "green_card") return "Tarjeta verde";
  if (type === "yellow_card") return "Tarjeta amarilla";
  if (type === "red_card") return "Tarjeta roja";
  return "Evento";
}

function eventLabel(type: EventType) {
  if (type === "goal") return "Gol";
  if (type === "green_card") return "Verde";
  if (type === "yellow_card") return "Amarilla";
  return "Roja";
}

function statusLabel(status: MatchItem["status"]) {
  if (status === "finalizado") return "Finalizado";
  if (status === "en_curso") return "En juego";
  return "Pendiente";
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function normalizeTimeLabel(value: string) {
  return value
    .trim()
    .replace(/^(\d{1,2}),(\d{2})(.*)$/g, "$1:$2$3")
    .replace(/\s*hs?\.?$/i, " hs");
}

function displayTime(value: string) {
  return normalizeTimeLabel(value);
}

function timeToMinutes(value: string) {
  const match = normalizeTimeLabel(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function courtNumber(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 99;
}

function compareMatchesForAdmin(a: MatchItem, b: MatchItem) {
  return (
    (a.day === "dia1" ? 1 : 2) - (b.day === "dia1" ? 1 : 2) ||
    timeToMinutes(a.timeLabel) - timeToMinutes(b.timeLabel) ||
    courtNumber(a.court) - courtNumber(b.court) ||
    a.id - b.id
  );
}

function getSchoolShield(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("portezuelo")) return "/escudos/portezuelo.png";
  if (normalized.includes("torreon")) return "/escudos/torreon.png";
  if (normalized.includes("lcd") || normalized.includes("candiles")) {
    return "/escudos/los-candiles.png";
  }
  if (normalized.includes("crisol")) return "/escudos/crisol.png";
  if (normalized.includes("buen ayre")) return "/escudos/buen-ayre.png";
  if (normalized.includes("mirasoles")) return "/escudos/mirasoles.png";
  if (normalized.includes("cerros")) return "/escudos/los-cerros.png";

  return null;
}
