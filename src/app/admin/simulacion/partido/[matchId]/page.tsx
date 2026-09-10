"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
  Square,
  Target,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import { useSimulation } from "@/src/components/providers/SimulationProvider";
import type {
  EventType,
  MatchItem,
  TeamKey,
} from "@/src/lib/tournament-types";

type ActionType = EventType;

export default function SimulationMatchPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = Number(params.matchId);

  const {
    matches,
    adminReady,
    adminError,
    authenticateAdmin,
  } = useTournament();
  const {
    simulatedResults,
    syncing,
    syncError,
    setSimulationEnabled,
    refreshSimulation,
    setSimulationScore,
    addSimulationEvent,
    undoSimulationEvent,
    toggleSimulationClock,
    resetSimulationClock,
    setSimulationDuration,
    setSimulationPeriod,
    finishSimulationMatch,
    resetSimulationMatch,
  } = useSimulation();

  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [eventCount, setEventCount] = useState("1");
  const [scoreAInput, setScoreAInput] = useState("0");
  const [scoreBInput, setScoreBInput] = useState("0");
  const [penaltyAInput, setPenaltyAInput] = useState("");
  const [penaltyBInput, setPenaltyBInput] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
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
  const simulated = simulatedResults[matchId];

  useEffect(() => {
    if (!adminReady) return;
    setSimulationEnabled(true);
    void refreshSimulation();
  }, [
    adminReady,
    refreshSimulation,
    setSimulationEnabled,
  ]);

  useEffect(() => {
    if (!simulated) return;
    setScoreAInput(String(simulated.scoreA));
    setScoreBInput(String(simulated.scoreB));
    setDurationMinutes(
      String(Math.max(1, Math.round(simulated.durationSeconds / 60))),
    );

    const penalties = parsePenalty(simulated.penalties);
    setPenaltyAInput(penalties ? String(penalties.a) : "");
    setPenaltyBInput(penalties ? String(penalties.b) : "");
  }, [
    simulated?.scoreA,
    simulated?.scoreB,
    simulated?.durationSeconds,
    simulated?.penalties,
  ]);

  const durationSeconds = simulated?.durationSeconds ?? 15 * 60;
  const elapsedSeconds = simulated?.elapsedSeconds ?? 0;
  const remainingSeconds = Math.max(
    0,
    durationSeconds - elapsedSeconds,
  );
  const period = simulated?.period ?? 1;
  const isRunning = simulated?.isRunning ?? false;
  const status = simulated?.status ?? "por_jugar";
  const events = simulated?.events ?? [];

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

  const confirmEvent = async () => {
    if (!modal.team || !modal.type || !playerName.trim()) return;

    const count =
      modal.type === "goal"
        ? Math.max(
            1,
            Math.min(20, Math.trunc(Number(eventCount) || 1)),
          )
        : 1;

    setSavingEvent(true);
    try {
      const ok = await addSimulationEvent(matchId, {
        team: modal.team,
        type: modal.type,
        player: playerName.trim(),
        count,
      });

      if (ok) closeModal();
    } finally {
      setSavingEvent(false);
    }
  };

  const scoreA = Number(scoreAInput);
  const scoreB = Number(scoreBInput);
  const validScores =
    Number.isInteger(scoreA) &&
    Number.isInteger(scoreB) &&
    scoreA >= 0 &&
    scoreB >= 0;
  const needsPenalties =
    Boolean(match && match.stage !== "grupo") &&
    validScores &&
    scoreA === scoreB;

  const saveScore = async (finish: boolean) => {
    if (!validScores) {
      window.alert("Cargá un marcador válido.");
      return;
    }

    let penalties: string | null = null;

    if (finish && needsPenalties) {
      const pA = Number(penaltyAInput);
      const pB = Number(penaltyBInput);

      if (
        !Number.isInteger(pA) ||
        !Number.isInteger(pB) ||
        pA < 0 ||
        pB < 0 ||
        pA === pB
      ) {
        window.alert(
          "La definición por penales necesita un ganador.",
        );
        return;
      }

      penalties = `${pA}-${pB}`;
    }

    await setSimulationScore(
      matchId,
      scoreA,
      scoreB,
      penalties,
      finish,
    );
  };

  if (!adminReady) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] px-4 py-8 text-[#151711]">
        <section className="mx-auto max-w-lg rounded-[28px] border border-[#ded9cc] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-black">Simulación privada</h1>
              <p className="text-sm font-bold text-[#74786a]">
                Ingresá con la clave del admin.
              </p>
            </div>
          </div>

          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await authenticateAdmin(password);
              if (ok) {
                setPassword("");
                setSimulationEnabled(true);
                window.setTimeout(
                  () => void refreshSimulation(),
                  0,
                );
              }
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Clave admin"
              className="w-full rounded-2xl border border-[#ded9cc] px-4 py-3 font-bold outline-none"
            />
            <button className="w-full rounded-2xl bg-[#151711] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              Entrar
            </button>
          </form>

          {adminError && (
            <p className="mt-3 text-sm font-bold text-red-700">
              {adminError}
            </p>
          )}
        </section>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] px-4 py-8">
        <p className="mx-auto max-w-lg rounded-2xl bg-white p-6 text-center font-black">
          Partido no encontrado.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      {modal.open && (
        <EventModal
          match={match}
          team={modal.team}
          type={modal.type}
          playerName={playerName}
          setPlayerName={setPlayerName}
          eventCount={eventCount}
          setEventCount={setEventCount}
          saving={savingEvent}
          remainingSeconds={remainingSeconds}
          period={period}
          onClose={closeModal}
          onConfirm={() => void confirmEvent()}
        />
      )}

      <section className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-6 md:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/simulacion"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#74786a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a simulación
          </Link>

          <span className="rounded-full bg-sky-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-sky-800">
            {syncing ? "Sincronizando..." : "Prueba compartida"}
          </span>
        </div>

        {syncError && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
            {syncError}
          </p>
        )}

        <section className="relative overflow-hidden rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_22px_55px_rgba(21,23,17,0.18)] md:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7c77a]">
                {match.category}
              </p>
              <p className="mt-1 text-xs font-bold text-white/45">
                {match.court} · {displayTime(match.timeLabel)}
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/65">
              {statusLabel(status)}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <p className="min-w-0 truncate text-sm font-black uppercase md:text-base">
              {match.teamA}
            </p>
            <p className="text-5xl font-black tracking-[-0.08em] md:text-7xl">
              {simulated?.scoreA ?? 0}
              <span className="mx-2 text-[#d7c77a]">:</span>
              {simulated?.scoreB ?? 0}
            </p>
            <p className="min-w-0 truncate text-right text-sm font-black uppercase md:text-base">
              {match.teamB}
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[30px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm md:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
              Carga desde mesa
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
              Resultado
            </h2>

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
              <div className="mt-4 rounded-2xl bg-[#fff8dc] p-3">
                <p className="mb-2 text-[10px] font-black uppercase text-[#6f6125]">
                  Penales si finalizás empatado
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <ScoreInput
                    label={match.teamA}
                    value={penaltyAInput}
                    onChange={setPenaltyAInput}
                  />
                  <span className="pb-4 font-black">:</span>
                  <ScoreInput
                    label={match.teamB}
                    value={penaltyBInput}
                    onChange={setPenaltyBInput}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void saveScore(false)}
                className="rounded-2xl border border-[#151711] px-3 py-3 text-[10px] font-black uppercase"
              >
                Guardar marcador
              </button>
              <button
                type="button"
                onClick={() => void saveScore(true)}
                className="rounded-2xl bg-[#151711] px-3 py-3 text-[10px] font-black uppercase text-white"
              >
                Guardar y finalizar
              </button>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm md:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Cuenta regresiva
                </p>
                <h2
                  className={`mt-1 text-6xl font-black tabular-nums tracking-[-0.08em] ${
                    remainingSeconds <= 60
                      ? "text-red-700"
                      : "text-[#151711]"
                  }`}
                >
                  {formatClock(remainingSeconds)}
                </h2>
              </div>
              <Clock3 className="h-6 w-6 text-[#74786a]" />
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <label>
                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.12em] text-[#74786a]">
                  Minutos por período
                </span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(event.target.value)
                  }
                  className="w-full rounded-xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-2.5 text-center font-black outline-none"
                />
              </label>
              <button
                type="button"
                disabled={isRunning}
                onClick={() =>
                  void setSimulationDuration(
                    matchId,
                    Math.max(
                      1,
                      Math.min(
                        60,
                        Number(durationMinutes) || 15,
                      ),
                    ) * 60,
                  )
                }
                className="self-end rounded-xl bg-[#f0ede3] px-4 py-2.5 text-[9px] font-black uppercase disabled:opacity-40"
              >
                Aplicar
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-1">
              {[1, 2, 3, 4].map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={status === "finalizado"}
                  onClick={() =>
                    void setSimulationPeriod(
                      matchId,
                      item as 1 | 2 | 3 | 4,
                    )
                  }
                  className={`rounded-full px-4 py-2 text-xs font-black disabled:opacity-40 ${
                    period === item
                      ? "bg-[#151711] text-white"
                      : "bg-[#f6f4ee] text-[#74786a]"
                  }`}
                >
                  Q{item}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <ActionBtn
                onClick={() =>
                  void toggleSimulationClock(matchId)
                }
                icon={isRunning ? Pause : Play}
                label={isRunning ? "Pausar" : "Iniciar"}
                disabled={status === "finalizado"}
              />
              <ActionBtn
                onClick={() =>
                  void resetSimulationClock(matchId)
                }
                icon={RotateCcw}
                label="Reiniciar reloj"
                disabled={status === "finalizado"}
              />
              <ActionBtn
                onClick={() =>
                  void undoSimulationEvent(matchId)
                }
                icon={Undo2}
                label="Deshacer evento"
                disabled={events.length === 0}
              />
              <ActionBtn
                onClick={() =>
                  void finishSimulationMatch(matchId)
                }
                icon={CheckCircle2}
                label="Finalizar"
                disabled={status === "finalizado"}
              />
            </div>
          </section>
        </section>

        <section className="mt-5 rounded-[30px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm md:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
            Carga detallada
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
            Eventos
          </h2>
          <p className="mt-2 text-sm font-bold text-[#62675d]">
            Igual que en la carga real: elegí equipo, evento y jugadora.
            Los goles permiten cargar cantidad.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <TeamPanel
              team="teamA"
              name={match.teamA}
              disabled={status === "finalizado"}
              onAction={openAction}
            />
            <TeamPanel
              team="teamB"
              name={match.teamB}
              disabled={status === "finalizado"}
              onAction={openAction}
            />
          </div>
        </section>

        <section className="mt-5 rounded-[30px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                Registro simulado
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Eventos del partido
              </h2>
            </div>
            <span className="text-xs font-black text-[#74786a]">
              {events.length} cargas
            </span>
          </div>

          {events.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#ded9cc] p-5 text-center text-sm font-bold text-[#74786a]">
              Todavía no hay eventos.
            </p>
          ) : (
            <div className="space-y-2">
              {[...events]
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl bg-[#fbfaf6] p-3"
                  >
                    <span className="text-right text-xs font-black text-[#74786a]">
                      Q{event.period} ·{" "}
                      {formatClock(
                        Math.max(
                          0,
                          durationSeconds -
                            event.elapsedSeconds,
                        ),
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">
                        {event.player}
                        {event.count > 1
                          ? ` ×${event.count}`
                          : ""}
                      </p>
                      <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-[#74786a]">
                        {event.team === "teamA"
                          ? match.teamA
                          : match.teamB}
                      </p>
                    </div>
                    <EventBadge type={event.type} />
                  </div>
                ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "¿Limpiar esta prueba completa? No toca el partido real.",
              )
            ) {
              void resetSimulationMatch(matchId);
            }
          }}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Limpiar esta prueba
        </button>
      </section>
    </main>
  );
}

function EventModal({
  match,
  team,
  type,
  playerName,
  setPlayerName,
  eventCount,
  setEventCount,
  saving,
  remainingSeconds,
  period,
  onClose,
  onConfirm,
}: {
  match: MatchItem;
  team: TeamKey | null;
  type: ActionType | null;
  playerName: string;
  setPlayerName: (value: string) => void;
  eventCount: string;
  setEventCount: (value: string) => void;
  saving: boolean;
  remainingSeconds: number;
  period: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[#151711]/70 p-3 backdrop-blur-sm md:items-center md:justify-center">
      <section className="w-full max-w-md rounded-[30px] bg-[#f6f4ee] p-4 shadow-2xl">
        <div className="rounded-[26px] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
                Evento simulado · Q{period} ·{" "}
                {formatClock(remainingSeconds)}
              </p>
              <h2 className="mt-1 text-3xl font-black">
                {eventLabel(type)}
              </h2>
              <p className="mt-1 text-sm font-bold text-[#62675d]">
                {team === "teamA" ? match.teamA : match.teamB}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#f6f4ee] p-2"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
            Jugadora
          </label>
          <input
            autoFocus
            value={playerName}
            onChange={(event) =>
              setPlayerName(event.target.value)
            }
            placeholder="Nombre y apellido"
            className="mt-2 w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-4 text-sm font-bold outline-none"
          />

          {type === "goal" && (
            <>
              <label className="mt-3 block text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
                Cantidad de goles
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={eventCount}
                onChange={(event) =>
                  setEventCount(event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-center text-xl font-black outline-none"
              />
            </>
          )}

          <button
            type="button"
            disabled={saving || !playerName.trim()}
            onClick={onConfirm}
            className="mt-3 w-full rounded-2xl bg-[#151711] px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Guardar evento"}
          </button>
        </div>
      </section>
    </div>
  );
}

function TeamPanel({
  team,
  name,
  disabled,
  onAction,
}: {
  team: TeamKey;
  name: string;
  disabled: boolean;
  onAction: (team: TeamKey, type: ActionType) => void;
}) {
  return (
    <article className="rounded-[24px] border border-[#e8e2d5] bg-[#fbfaf6] p-4">
      <p className="truncate text-sm font-black">{name}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <EventBtn
          label="Gol"
          icon={Target}
          disabled={disabled}
          onClick={() => onAction(team, "goal")}
        />
        <EventBtn
          label="Verde"
          icon={Square}
          disabled={disabled}
          onClick={() => onAction(team, "green_card")}
          tone="green"
        />
        <EventBtn
          label="Amarilla"
          icon={Square}
          disabled={disabled}
          onClick={() => onAction(team, "yellow_card")}
          tone="yellow"
        />
        <EventBtn
          label="Roja"
          icon={Square}
          disabled={disabled}
          onClick={() => onAction(team, "red_card")}
          tone="red"
        />
      </div>
    </article>
  );
}

function EventBtn({
  label,
  icon: Icon,
  disabled,
  onClick,
  tone = "normal",
}: {
  label: string;
  icon: LucideIcon;
  disabled: boolean;
  onClick: () => void;
  tone?: "normal" | "green" | "yellow" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-600"
      : tone === "yellow"
        ? "text-amber-500"
        : tone === "red"
          ? "text-red-600"
          : "text-[#151711]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#ded9cc] bg-white px-2 py-3 text-[9px] font-black uppercase disabled:opacity-35"
    >
      <Icon className={`h-4 w-4 ${toneClass}`} />
      {label}
    </button>
  );
}

function EventBadge({ type }: { type: EventType }) {
  const label = eventLabel(type);
  const className =
    type === "goal"
      ? "bg-[#151711] text-white"
      : type === "green_card"
        ? "bg-emerald-50 text-emerald-700"
        : type === "yellow_card"
          ? "bg-amber-50 text-amber-700"
          : "bg-red-50 text-red-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${className}`}
    >
      {label}
    </span>
  );
}

function ActionBtn({
  onClick,
  icon: Icon,
  label,
  disabled,
}: {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151711] px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-white disabled:opacity-35"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
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
    <label className="min-w-0">
      <span className="mb-2 block truncate text-[9px] font-black uppercase text-[#74786a]">
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={99}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-4 text-center text-3xl font-black outline-none"
      />
    </label>
  );
}

function eventLabel(type: EventType | null) {
  if (type === "goal") return "Gol";
  if (type === "green_card") return "Tarjeta verde";
  if (type === "yellow_card") return "Tarjeta amarilla";
  if (type === "red_card") return "Tarjeta roja";
  return "Evento";
}

function statusLabel(
  status: "por_jugar" | "en_curso" | "finalizado",
) {
  if (status === "finalizado") return "Finalizado";
  if (status === "en_curso") return "En juego";
  return "Pendiente";
}

function parsePenalty(value?: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d+)[-:](\d+)$/);
  if (!match) return null;
  return { a: Number(match[1]), b: Number(match[2]) };
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function displayTime(value: string) {
  return value
    .trim()
    .replace(/^(\d{1,2}),(\d{2})/, "$1:$2")
    .replace(/\s*hs?\.?$/i, " hs");
}
