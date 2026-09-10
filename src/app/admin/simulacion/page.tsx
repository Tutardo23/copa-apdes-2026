"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
  TimerReset,
} from "lucide-react";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import { useSimulation } from "@/src/components/providers/SimulationProvider";
import type {
  DayKey,
  MatchItem,
} from "@/src/lib/tournament-types";

type Tanda = {
  key: string;
  day: DayKey;
  timeLabel: string;
  matches: MatchItem[];
};

export default function SimulationAdminPage() {
  const {
    matches,
    adminReady,
    adminError,
    authenticateAdmin,
  } = useTournament();

  const {
    simulatedResults,
    clearSimulation,
    setSimulationEnabled,
    refreshSimulation,
    runSimulationBatch,
    syncing,
    syncError,
  } = useSimulation();

  const [password, setPassword] = useState("");
  const [day, setDay] = useState<DayKey>("dia1");

  useEffect(() => {
    if (!adminReady) return;
    setSimulationEnabled(true);
    void refreshSimulation();
  }, [
    adminReady,
    refreshSimulation,
    setSimulationEnabled,
  ]);

  const tandas = useMemo(
    () => buildTandas(matches, day),
    [day, matches],
  );

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-[1350px] px-4 pb-28 pt-6 md:px-8">
        <header className="mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#62675d]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al admin
            </Link>

            <Link
              href="/estadisticas"
              className="inline-flex items-center gap-2 rounded-full bg-[#151711] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
            >
              <BarChart3 className="h-4 w-4" />
              Ver estadísticas
            </Link>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                Modo de práctica
              </p>
              <h1 className="mt-1 max-w-4xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.07em] md:text-6xl">
                Simulación por tandas
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-bold leading-6 text-[#62675d]">
                Practiquen igual que el día de la Copa: pueden manejar
                los seis partidos de un mismo horario juntos y entrar
                a cada partido para cargar goles, goleadoras y tarjetas.
                Todo es simulación y no modifica resultados reales.
              </p>
            </div>

            {adminReady && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-900">
                {syncing
                  ? "Sincronizando..."
                  : "Compartida · actualiza cada 2,5 s"}
              </div>
            )}
          </div>
        </header>

        {!adminReady && (
          <form
            className="mb-5 flex flex-col gap-3 rounded-[28px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center"
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
            <div className="flex flex-1 items-center gap-3">
              <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black">
                  Acceso de administrador
                </p>
                <p className="text-xs font-bold text-[#74786a]">
                  La sesión queda activa durante 12 horas.
                </p>
              </div>
            </div>

            <input
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              type="password"
              placeholder="Clave admin"
              className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none"
            />

            <button className="rounded-2xl bg-[#151711] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              Entrar
            </button>
          </form>
        )}

        {(adminError || syncError) && (
          <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
            {adminError ?? syncError}
          </p>
        )}

        {adminReady && (
          <>
            <section className="mb-5 rounded-[28px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex rounded-full border border-[#ded9cc] bg-[#f6f4ee] p-1">
                  <button
                    type="button"
                    onClick={() => setDay("dia1")}
                    className={`rounded-full px-5 py-2 text-xs font-black ${
                      day === "dia1"
                        ? "bg-[#151711] text-white"
                        : "text-[#74786a]"
                    }`}
                  >
                    Día 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setDay("dia2")}
                    className={`rounded-full px-5 py-2 text-xs font-black ${
                      day === "dia2"
                        ? "bg-[#151711] text-white"
                        : "text-[#74786a]"
                    }`}
                  >
                    Día 2
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "¿Borrar toda la simulación compartida? No toca resultados reales.",
                      )
                    ) {
                      void clearSimulation();
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#62675d]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpiar simulación
                </button>
              </div>
            </section>

            <HowTandaWorks />

            <section className="mt-5 space-y-5">
              {tandas.map((tanda) => (
                <TandaBlock
                  key={tanda.key}
                  tanda={tanda}
                  simulatedResults={simulatedResults}
                  onBatch={runSimulationBatch}
                  syncing={syncing}
                />
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function HowTandaWorks() {
  return (
    <section className="rounded-[28px] border border-[#ded9cc] bg-[#fffdf8] p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-center gap-2">
        <CircleHelp className="h-5 w-5 text-[#74786a]" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            Cómo funciona
          </p>
          <h2 className="text-xl font-black">
            Botones de cada tanda
          </h2>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HelpCard
          icon={Play}
          title="Iniciar tanda"
          text="Arranca o reanuda al mismo tiempo la cuenta regresiva de todos los partidos de ese horario."
        />
        <HelpCard
          icon={Pause}
          title="Pausar tanda"
          text="Pausa todos los cronómetros conservando exactamente el tiempo que quedaba."
        />
        <HelpCard
          icon={TimerReset}
          title="Reiniciar reloj"
          text="Vuelve los relojes al tiempo completo. No borra goles, tarjetas ni marcadores cargados."
        />
        <HelpCard
          icon={CheckCircle2}
          title="Finalizar tanda"
          text="Detiene los relojes y marca como finalizados los partidos de esa tanda que ya estaban en prueba."
        />
      </div>

      <p className="mt-4 rounded-2xl bg-[#f6f4ee] px-4 py-3 text-xs font-bold leading-5 text-[#62675d]">
        El botón <strong>Cargar resultado</strong> abre un partido en
        particular. Ahí pueden practicar el marcador, la cuenta
        regresiva, Q1–Q4, goles por nombre y cantidad, tarjetas verde,
        amarilla y roja, deshacer eventos y finalizar ese partido.
      </p>
    </section>
  );
}

function HelpCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Play;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e8e2d5] bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-black uppercase tracking-[0.08em]">
          {title}
        </p>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-[#74786a]">
        {text}
      </p>
    </article>
  );
}

function TandaBlock({
  tanda,
  simulatedResults,
  onBatch,
  syncing,
}: {
  tanda: Tanda;
  simulatedResults: ReturnType<typeof useSimulation>["simulatedResults"];
  onBatch: ReturnType<typeof useSimulation>["runSimulationBatch"];
  syncing: boolean;
}) {
  const matchIds = tanda.matches.map((match) => match.id);
  const states = tanda.matches
    .map((match) => simulatedResults[match.id])
    .filter(Boolean);

  const running = states.filter(
    (state) => state.isRunning,
  ).length;
  const finished = states.filter(
    (state) => state.status === "finalizado",
  ).length;
  const started = states.filter(
    (state) => state.status !== "por_jugar",
  ).length;

  const reference =
    states.find((state) => state.isRunning) ??
    states.find(
      (state) => state.status === "en_curso",
    ) ??
    states[0];

  const remaining = reference
    ? Math.max(
        0,
        reference.durationSeconds -
          reference.elapsedSeconds,
      )
    : 15 * 60;

  const doBatch = (
    operation: "start" | "pause" | "reset" | "finish",
  ) => {
    if (
      operation === "finish" &&
      !window.confirm(
        `¿Finalizar la tanda de ${displayTime(tanda.timeLabel)}?`,
      )
    ) {
      return;
    }

    void onBatch(matchIds, operation);
  };

  return (
    <section className="rounded-[30px] border border-[#ded9cc] bg-[#fbfaf6] p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#74786a]">
            Tanda horaria
          </p>
          <div className="mt-1 flex flex-wrap items-end gap-3">
            <h2 className="text-4xl font-black tracking-[-0.06em]">
              {displayTime(tanda.timeLabel)}
            </h2>
            <span className="mb-1 rounded-full bg-white px-3 py-1 text-xs font-black tabular-nums text-[#62675d]">
              Cuenta regresiva · {formatClock(remaining)}
            </span>
          </div>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-[#74786a]">
            {tanda.matches.length} partidos · {running} en juego ·{" "}
            {finished} finalizados
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <TandaButton
            icon={Play}
            label="Iniciar tanda"
            disabled={syncing || finished === tanda.matches.length}
            onClick={() => doBatch("start")}
          />
          <TandaButton
            icon={Pause}
            label="Pausar tanda"
            disabled={syncing || running === 0}
            onClick={() => doBatch("pause")}
            secondary
          />
          <TandaButton
            icon={TimerReset}
            label="Reiniciar reloj"
            disabled={syncing || started === 0}
            onClick={() => doBatch("reset")}
          />
          <TandaButton
            icon={CheckCircle2}
            label="Finalizar tanda"
            disabled={syncing || started === 0 || finished === started}
            onClick={() => doBatch("finish")}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tanda.matches.map((match) => (
          <TandaMatchCard
            key={match.id}
            match={match}
            state={simulatedResults[match.id]}
          />
        ))}
      </div>
    </section>
  );
}

function TandaButton({
  icon: Icon,
  label,
  disabled,
  onClick,
  secondary = false,
}: {
  icon: typeof Play;
  label: string;
  disabled: boolean;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] disabled:opacity-35 ${
        secondary
          ? "bg-[#aaa9a4] text-white"
          : "bg-[#151711] text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function TandaMatchCard({
  match,
  state,
}: {
  match: MatchItem;
  state?: ReturnType<typeof useSimulation>["simulatedResults"][number];
}) {
  const competition = getCompetition(match.category);
  const category = getBaseCategory(match.category);
  const remaining = Math.max(
    0,
    (state?.durationSeconds ?? 15 * 60) -
      (state?.elapsedSeconds ?? 0),
  );

  return (
    <article className="rounded-[24px] border border-[#e8e2d5] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#74786a]">
            {match.court} · {competition}
          </p>
          <p className="mt-1 text-sm font-black uppercase">
            {category}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${
            state?.status === "finalizado"
              ? "bg-emerald-50 text-emerald-700"
              : state?.isRunning
                ? "bg-red-50 text-red-700"
                : state
                  ? "bg-sky-50 text-sky-800"
                  : "bg-[#f0ede3] text-[#74786a]"
          }`}
        >
          {state?.status === "finalizado"
            ? "Finalizado"
            : state?.isRunning
              ? "En juego"
              : state
                ? "En prueba"
                : "Pendiente"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="truncate text-xs font-black">
          {match.teamA}
        </p>

        <div className="text-center">
          <p className="text-xl font-black">
            {state?.scoreA ?? 0}
            <span className="mx-1 text-[#d7c77a]">:</span>
            {state?.scoreB ?? 0}
          </p>
          <p className="mt-0.5 text-[9px] font-black tabular-nums text-[#74786a]">
            {formatClock(remaining)}
          </p>
        </div>

        <p className="truncate text-right text-xs font-black">
          {match.teamB}
        </p>
      </div>

      <Link
        href={`/admin/simulacion/partido/${match.id}`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#151711] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white"
      >
        <CheckCircle2 className="h-4 w-4" />
        Cargar resultado
      </Link>
    </article>
  );
}

function buildTandas(
  matches: MatchItem[],
  day: DayKey,
): Tanda[] {
  const map = new Map<string, MatchItem[]>();

  for (const match of matches) {
    if (match.day !== day) continue;

    const time = normalizeTime(match.timeLabel);
    const current = map.get(time) ?? [];
    current.push(match);
    map.set(time, current);
  }

  return [...map.entries()]
    .map(([timeLabel, tandaMatches]) => ({
      key: `${day}-${timeLabel}`,
      day,
      timeLabel,
      matches: [...tandaMatches].sort(
        (a, b) =>
          courtNumber(a.court) -
            courtNumber(b.court) ||
          a.id - b.id,
      ),
    }))
    .sort(
      (a, b) =>
        timeValue(a.timeLabel) -
        timeValue(b.timeLabel),
    );
}

function normalizeTime(value: string) {
  return value
    .trim()
    .replace(/^(\d{1,2}),(\d{2})/, "$1:$2")
    .replace(/\s*hs?\.?$/i, "");
}

function displayTime(value: string) {
  const time = normalizeTime(value);
  return `${time} hs`;
}

function timeValue(value: string) {
  const match = normalizeTime(value).match(
    /(\d{1,2}):(\d{2})/,
  );
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function courtNumber(court: string) {
  const match = court.match(/\d+/);
  return match ? Number(match[0]) : 99;
}

function getCompetition(category: string) {
  const normalized = normalizeText(category);
  if (normalized.includes("colegial")) {
    return "Colegial";
  }
  if (
    normalized.includes("federado") ||
    normalized.includes("federal")
  ) {
    return "Federado";
  }
  return "Competencia";
}

function getBaseCategory(category: string) {
  const normalized = normalizeText(category);
  if (normalized.includes("categoria 1")) {
    return "Categoría 1";
  }
  if (normalized.includes("categoria 2")) {
    return "Categoría 2";
  }
  if (normalized.includes("categoria 3")) {
    return "Categoría 3";
  }
  return category;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
