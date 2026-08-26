"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Target,
  Trophy,
  Wand2,
} from "lucide-react";
import {
  useSimulation,
  type SimulatedResult,
} from "@/src/components/providers/SimulationProvider";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import {
  buildGroupStandings,
  parsePenaltyScore,
} from "@/src/lib/tournament-engine";
import type { MatchItem } from "@/src/lib/tournament-types";

type CompetitionFilter = "Federado" | "Colegial";
type CategoryFilter =
  | "Categoría 1"
  | "Categoría 2"
  | "Categoría 3";

type ScorerRow = {
  name: string;
  team: string;
  goals: number;
};

const competitions: CompetitionFilter[] = [
  "Federado",
  "Colegial",
];
const categories: CategoryFilter[] = [
  "Categoría 1",
  "Categoría 2",
  "Categoría 3",
];

export default function SimulationAdminPage() {
  const {
    matches: realMatches,
    adminReady,
    adminError,
    authenticateAdmin,
  } = useTournament();

  const {
    simulatedResults,
    setSimulatedResult,
    removeSimulatedResult,
    clearSimulation,
    getEffectiveMatches,
    simulationEnabled,
  } = useSimulation();

  const [password, setPassword] = useState("");
  const [competition, setCompetition] =
    useState<CompetitionFilter>("Federado");
  const [category, setCategory] =
    useState<CategoryFilter>("Categoría 1");

  const matches = useMemo(
    () => getEffectiveMatches(realMatches),
    [getEffectiveMatches, realMatches],
  );

  const scopedMatches = useMemo(
    () =>
      matches
        .filter((match) =>
          matchBelongsTo(match, competition, category),
        )
        .sort(sortMatches),
    [category, competition, matches],
  );

  const groupMatches = scopedMatches.filter(
    (match) => match.stage === "grupo",
  );

  const bracketMatches = scopedMatches.filter(
    (match) => match.stage !== "grupo",
  );

  const table = buildGroupStandings(groupMatches);
  const scorers = buildScorers(scopedMatches);

  const bestDefense = [...table]
    .filter((row) => row.j > 0)
    .sort(
      (a, b) =>
        a.gc - b.gc ||
        b.pts - a.pts ||
        a.team.localeCompare(b.team),
    )[0];

  const totalGoals = scopedMatches.reduce((sum, match) => {
    if (
      match.status !== "finalizado" ||
      match.scoreA === null ||
      match.scoreB === null
    ) {
      return sum;
    }

    return sum + match.scoreA + match.scoreB;
  }, 0);

  const allGroupPlayed =
    groupMatches.length > 0 &&
    groupMatches.every(
      (match) =>
        match.status === "finalizado" &&
        match.scoreA !== null &&
        match.scoreB !== null,
    );

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#62675d]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al admin
            </Link>

            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
              Panel privado
            </p>

            <h1 className="max-w-4xl text-[2.55rem] font-black leading-[0.92] tracking-[-0.075em] md:text-7xl">
              Simulación del{" "}
              <span className="relative inline-block">
                <span className="relative z-10">
                  torneo
                </span>
                <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-sky-200 md:h-4" />
              </span>
            </h1>

            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#62675d]">
              Usa el mismo motor de clasificación, semifinales, final y penales
              que la página real. La única diferencia es que estos resultados
              quedan guardados en este dispositivo y no tocan Neon.
            </p>
          </div>

          {simulationEnabled && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-900">
              Modo simulación activo
            </div>
          )}
        </header>

        {!adminReady && (
          <form
            className="mb-5 flex flex-col gap-3 rounded-[28px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center"
            onSubmit={async (event) => {
              event.preventDefault();
              await authenticateAdmin(password);
            }}
          >
            <div className="flex flex-1 items-center gap-3">
              <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black">
                  Acceso privado de administrador
                </p>
                <p className="text-xs font-bold text-[#74786a]">
                  La simulación queda dentro del admin.
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
              className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none focus:border-[#151711]"
            />

            <button className="rounded-2xl bg-[#151711] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              Entrar
            </button>
          </form>
        )}

        {adminError && (
          <p className="mb-5 rounded-2xl border border-[#d7c77a]/50 bg-[#f5edc9] p-3 text-sm font-bold text-[#6f6125]">
            {adminError}
          </p>
        )}

        {adminReady && (
          <section className="space-y-6">
            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="grid gap-4 md:grid-cols-2">
                  <FilterBlock title="Competencia">
                    {competitions.map((item) => (
                      <PillButton
                        key={item}
                        active={competition === item}
                        onClick={() =>
                          setCompetition(item)
                        }
                      >
                        {item}
                      </PillButton>
                    ))}
                  </FilterBlock>

                  <FilterBlock title="Categoría">
                    {categories.map((item) => (
                      <PillButton
                        key={item}
                        active={category === item}
                        onClick={() => setCategory(item)}
                      >
                        {item}
                      </PillButton>
                    ))}
                  </FilterBlock>
                </div>

                <button
                  type="button"
                  onClick={clearSimulation}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#62675d] transition hover:-translate-y-0.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpiar simulación
                </button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
              <div className="space-y-4">
                <SectionTitle
                  label="Carga ficticia"
                  title={`Fase de grupos · ${category} ${competition}`}
                  help="Cargá resultados y, si querés, goleadoras. Cuando termina todo el grupo se completan automáticamente los cruces."
                />

                {groupMatches.length === 0 ? (
                  <EmptyMessage text="No hay partidos de grupo para esta categoría." />
                ) : (
                  groupMatches.map((match) => (
                    <SimulationRow
                      key={match.id}
                      match={match}
                      simulated={
                        simulatedResults[match.id]
                      }
                      onSave={setSimulatedResult}
                      onRemove={removeSimulatedResult}
                    />
                  ))
                )}
              </div>

              <aside className="space-y-4">
                <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Tabla simulada
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Clasificación
                  </h2>

                  <div className="mt-4 space-y-2">
                    {table.length === 0 ? (
                      <EmptyMessage text="Sin datos para la tabla." />
                    ) : (
                      table.map((row, index) => (
                        <div
                          key={row.team}
                          className={`grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-2xl p-3 ${
                            index < 4
                              ? "bg-sky-50"
                              : "bg-[#fbfaf6]"
                          }`}
                        >
                          <span className="text-sm font-black text-[#74786a]">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#151711]">
                              {row.team}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
                              {row.gf}:{row.gc} · Dif{" "}
                              {formatDiff(row.difValue)}
                            </p>
                          </div>
                          <span className="text-lg font-black">
                            {row.pts}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#f6f4ee] p-3">
                    <div className="flex items-center gap-2">
                      {allGroupPlayed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      ) : (
                        <Wand2 className="h-4 w-4 text-[#74786a]" />
                      )}
                      <p className="text-xs font-black text-[#62675d]">
                        {allGroupPlayed
                          ? "Grupo completo: cruces definidos."
                          : "Completá todos los partidos de grupo para definir los cruces."}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[30px] bg-[#151711] p-4 text-white shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                    Estadísticas simuladas
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Vista previa
                  </h2>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniStat
                      icon={Target}
                      label="Goles"
                      value={totalGoals}
                    />
                    <MiniStat
                      icon={ShieldCheck}
                      label="Valla"
                      value={bestDefense?.team ?? "—"}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/10 p-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                      Goleadoras
                    </p>

                    {scorers.length === 0 ? (
                      <p className="text-xs font-bold text-white/55">
                        Cargá nombres para ver el ranking.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {scorers
                          .slice(0, 6)
                          .map((scorer, index) => (
                            <div
                              key={`${scorer.name}-${scorer.team}`}
                              className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black">
                                  #{index + 1} ·{" "}
                                  {scorer.name}
                                </p>
                                <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                                  {scorer.team}
                                </p>
                              </div>
                              <span className="rounded-full bg-[#d7c77a] px-2 py-1 text-xs font-black text-[#151711]">
                                {scorer.goals}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </section>
              </aside>
            </section>

            <section className="space-y-4">
              <SectionTitle
                label="Fase final"
                title={
                  allGroupPlayed
                    ? "Cruces definidos"
                    : "Esperando cierre de grupos"
                }
                help="Probá 5°/6°, semifinales, 3°/4° y final. Si hay empate, aparece la definición por penales igual que en la carga real."
              />

              <div className="grid gap-4 lg:grid-cols-3">
                {bracketMatches.map((match) => (
                  <SimulationRow
                    key={match.id}
                    match={match}
                    simulated={
                      simulatedResults[match.id]
                    }
                    onSave={setSimulatedResult}
                    onRemove={removeSimulatedResult}
                    compact
                  />
                ))}
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}

function SimulationRow({
  match,
  simulated,
  onSave,
  onRemove,
  compact = false,
}: {
  match: MatchItem;
  simulated?: SimulatedResult;
  onSave: (
    matchId: number,
    scoreA: number,
    scoreB: number,
    goalsA?: string[],
    goalsB?: string[],
    penalties?: string | null,
  ) => void;
  onRemove: (matchId: number) => void;
  compact?: boolean;
}) {
  const [scoreA, setScoreA] = useState(
    String(simulated?.scoreA ?? match.scoreA ?? ""),
  );
  const [scoreB, setScoreB] = useState(
    String(simulated?.scoreB ?? match.scoreB ?? ""),
  );
  const [goalsA, setGoalsA] = useState(
    (simulated?.goalsA ?? [])
      .map((goal) => goal.player)
      .join(", "),
  );
  const [goalsB, setGoalsB] = useState(
    (simulated?.goalsB ?? [])
      .map((goal) => goal.player)
      .join(", "),
  );

  const initialPenalties =
    parsePenaltyScore(
      simulated?.penalties ?? match.penalties,
    );

  const [penaltyA, setPenaltyA] = useState(
    initialPenalties
      ? String(initialPenalties.scoreA)
      : "",
  );
  const [penaltyB, setPenaltyB] = useState(
    initialPenalties
      ? String(initialPenalties.scoreB)
      : "",
  );

  useEffect(() => {
    setScoreA(
      String(simulated?.scoreA ?? match.scoreA ?? ""),
    );
    setScoreB(
      String(simulated?.scoreB ?? match.scoreB ?? ""),
    );
    setGoalsA(
      (simulated?.goalsA ?? [])
        .map((goal) => goal.player)
        .join(", "),
    );
    setGoalsB(
      (simulated?.goalsB ?? [])
        .map((goal) => goal.player)
        .join(", "),
    );

    const penalties = parsePenaltyScore(
      simulated?.penalties ?? match.penalties,
    );
    setPenaltyA(
      penalties ? String(penalties.scoreA) : "",
    );
    setPenaltyB(
      penalties ? String(penalties.scoreB) : "",
    );
  }, [
    match.id,
    match.scoreA,
    match.scoreB,
    match.penalties,
    simulated,
  ]);

  const numericA = Number(scoreA);
  const numericB = Number(scoreB);
  const validScores =
    Number.isInteger(numericA) &&
    Number.isInteger(numericB) &&
    numericA >= 0 &&
    numericB >= 0;

  const needsPenalties =
    match.stage !== "grupo" &&
    validScores &&
    numericA === numericB;

  const save = () => {
    if (!validScores) {
      window.alert("Cargá un marcador válido.");
      return;
    }

    let penalties: string | null = null;

    if (needsPenalties) {
      const pA = Number(penaltyA);
      const pB = Number(penaltyB);

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

    onSave(
      match.id,
      numericA,
      numericB,
      parseNames(goalsA),
      parseNames(goalsB),
      penalties,
    );
  };

  return (
    <article className="rounded-[26px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#74786a]">
            {stageLabel(match)} · {displayTime(match.timeLabel)}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#9a9486]">
            {match.court}
          </p>
        </div>

        {simulated && (
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-sky-800">
            Simulado
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <MiniScoreInput
          label={match.teamA}
          value={scoreA}
          onChange={setScoreA}
        />
        <span className="pb-3 text-xl font-black text-[#d7c77a]">
          :
        </span>
        <MiniScoreInput
          label={match.teamB}
          value={scoreB}
          onChange={setScoreB}
        />
      </div>

      {!compact && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <NameInput
            label={`Goleadoras · ${shortTeam(match.teamA)}`}
            value={goalsA}
            onChange={setGoalsA}
          />
          <NameInput
            label={`Goleadoras · ${shortTeam(match.teamB)}`}
            value={goalsB}
            onChange={setGoalsB}
          />
        </div>
      )}

      {needsPenalties && (
        <div className="mt-3 rounded-2xl border border-[#d7c77a]/50 bg-[#fff8dc] p-3">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.15em] text-[#6f6125]">
            Penales
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <MiniScoreInput
              label={shortTeam(match.teamA)}
              value={penaltyA}
              onChange={setPenaltyA}
            />
            <span className="pb-3 text-lg font-black text-[#9c8737]">
              :
            </span>
            <MiniScoreInput
              label={shortTeam(match.teamB)}
              value={penaltyB}
              onChange={setPenaltyB}
            />
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={save}
          className="rounded-2xl bg-[#151711] px-3 py-3 text-[9px] font-black uppercase tracking-[0.13em] text-white"
        >
          Guardar prueba
        </button>
        <button
          type="button"
          disabled={!simulated}
          onClick={() => onRemove(match.id)}
          className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-3 text-[9px] font-black uppercase tracking-[0.13em] text-[#74786a] disabled:opacity-35"
        >
          Quitar prueba
        </button>
      </div>
    </article>
  );
}

function FilterBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-[#151711] bg-[#151711] text-white shadow-sm"
          : "border-[#ded9cc] bg-white text-[#62675d] hover:border-[#151711]/30"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({
  label,
  title,
  help,
}: {
  label: string;
  title: string;
  help: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
        {label}
      </p>
      <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
        {title}
      </h2>
      <p className="mt-1 text-sm font-bold text-[#62675d]">
        {help}
      </p>
    </div>
  );
}

function MiniScoreInput({
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
      <span className="mb-1 block truncate text-[8px] font-black uppercase tracking-[0.1em] text-[#74786a]">
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={99}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-[#ded9cc] bg-[#fbfaf6] px-2 py-2.5 text-center text-xl font-black outline-none focus:border-[#151711]"
      />
    </label>
  );
}

function NameInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block truncate text-[8px] font-black uppercase tracking-[0.1em] text-[#74786a]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Nombre, Nombre..."
        className="w-full rounded-xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-2.5 text-xs font-bold outline-none focus:border-[#151711]"
      />
    </label>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <Icon className="h-4 w-4 text-[#d7c77a]" />
      <p className="mt-3 text-[8px] font-black uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black">
        {value}
      </p>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-5 text-center text-sm font-bold text-[#74786a]">
      {text}
    </p>
  );
}

function buildScorers(matches: MatchItem[]) {
  const map = new Map<string, ScorerRow>();

  for (const match of matches) {
    for (const event of match.events) {
      if (event.type !== "goal" || !event.player.trim()) {
        continue;
      }

      const team =
        event.team === "teamA"
          ? match.teamA
          : match.teamB;

      const key = `${event.player.trim()}|${team}`;
      const previous = map.get(key);

      map.set(key, {
        name: event.player.trim(),
        team,
        goals: (previous?.goals ?? 0) + 1,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      b.goals - a.goals ||
      a.name.localeCompare(b.name),
  );
}

function matchBelongsTo(
  match: MatchItem,
  competition: CompetitionFilter,
  category: CategoryFilter,
) {
  const normalized = normalize(match.category);

  return (
    normalized.includes(normalize(competition)) &&
    normalized.includes(normalize(category))
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNames(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function shortTeam(value: string) {
  return value.replace(/\s*\([^)]+\)\s*$/g, "").trim();
}

function stageLabel(match: MatchItem) {
  if (match.stage === "grupo") return "Grupo";
  if (match.stage === "semifinal") return "Semifinal";

  const time = displayTime(match.timeLabel);
  if (time.startsWith("11:45")) return "5° / 6°";
  if (time.startsWith("14:15")) return "3° / 4°";
  if (time.startsWith("14:45")) return "1° / 2°";
  return "Definición";
}

function displayTime(value: string) {
  return value
    .trim()
    .replace(/^(\d{1,2}),(\d{2})/, "$1:$2")
    .replace(/\s*hs?\.?$/i, " hs");
}

function timeValue(value: string) {
  const match = displayTime(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function courtNumber(court: string) {
  const match = court.match(/\d+/);
  return match ? Number(match[0]) : 99;
}

function sortMatches(a: MatchItem, b: MatchItem) {
  return (
    (a.day === "dia1" ? 1 : 2) -
      (b.day === "dia1" ? 1 : 2) ||
    timeValue(a.timeLabel) - timeValue(b.timeLabel) ||
    courtNumber(a.court) - courtNumber(b.court) ||
    a.id - b.id
  );
}

function formatDiff(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
