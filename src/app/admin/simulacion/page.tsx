"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowLeft, KeyRound, RotateCcw, ShieldCheck, Target, Wand2 } from "lucide-react";
import { useSimulation } from "@/src/components/providers/SimulationProvider";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import type { MatchItem } from "@/src/lib/tournament-types";

type CompetitionFilter = "Federado" | "Colegial";
type CategoryFilter = "Categoría 1" | "Categoría 2" | "Categoría 3";

type SimulatedResultWithGoals = {
  scoreA: number;
  scoreB: number;
  goalsA?: string[];
  goalsB?: string[];
};

type ScorerRow = {
  name: string;
  team: string;
  goals: number;
};

const competitions: CompetitionFilter[] = ["Federado", "Colegial"];
const categories: CategoryFilter[] = ["Categoría 1", "Categoría 2", "Categoría 3"];

export default function SimulationAdminPage() {
  const { matches: realMatches, adminReady, adminError, authenticateAdmin } = useTournament();
  const {
    simulatedResults,
    setSimulatedResult,
    removeSimulatedResult,
    clearSimulation,
    getEffectiveMatches,
    simulationEnabled,
  } = useSimulation();

  const [password, setPassword] = useState("");
  const [competition, setCompetition] = useState<CompetitionFilter>("Federado");
  const [category, setCategory] = useState<CategoryFilter>("Categoría 1");

  const matches = useMemo(() => getEffectiveMatches(realMatches), [realMatches, getEffectiveMatches]);

  const scopedMatches = useMemo(
    () =>
      matches
        .filter((match) => matchBelongsTo(match, competition, category))
        .sort(sortMatches),
    [matches, competition, category],
  );

  const groupMatches = scopedMatches.filter((match) => match.stage === "grupo");
  const bracketMatches = scopedMatches.filter((match) => match.stage !== "grupo");
  const table = buildStandings(groupMatches);
  const scorers = buildScorers(scopedMatches);
  const bestDefense = table.filter((row) => row.j > 0).sort((a, b) => a.gc - b.gc || b.pts - a.pts)[0];
  const totalSimulatedGoals = scopedMatches.reduce((sum, match) => {
    if (match.status !== "finalizado" || match.scoreA === null || match.scoreB === null) return sum;
    return sum + match.scoreA + match.scoreB;
  }, 0);
  const allGroupPlayed = groupMatches.length > 0 && groupMatches.every((match) => match.status === "finalizado");

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#62675d]"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al admin
            </Link>

            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
              Panel privado
            </p>

            <h1 className="max-w-4xl text-[2.55rem] font-black leading-[0.92] tracking-[-0.075em] md:text-7xl">
              Simulación de{" "}
              <span className="relative inline-block">
                <span className="relative z-10">llaves</span>
                <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-sky-200 md:h-4" />
              </span>
            </h1>

            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#62675d]">
              Cargá resultados y goleadoras ficticias para probar cómo evolucionan la tabla, las estadísticas y las llaves. No toca Neon ni modifica los resultados reales.
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
                <p className="text-sm font-black">Acceso privado de administrador</p>
                <p className="text-xs font-bold text-[#74786a]">
                  La simulación también queda dentro del admin.
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
                      <PillButton key={item} active={competition === item} onClick={() => setCompetition(item)}>
                        {item}
                      </PillButton>
                    ))}
                  </FilterBlock>

                  <FilterBlock title="Categoría">
                    {categories.map((item) => (
                      <PillButton key={item} active={category === item} onClick={() => setCategory(item)}>
                        {item}
                      </PillButton>
                    ))}
                  </FilterBlock>
                </div>

                <button
                  onClick={clearSimulation}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#62675d] transition hover:-translate-y-0.5"
                >
                  <RotateCcw className="h-4 w-4" /> Limpiar simulación
                </button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
              <div className="space-y-4">
                <SectionTitle
                  label="Carga ficticia"
                  title={`Fase de grupos · ${category} ${competition}`}
                  help="Cargá resultado y goleadoras. La tabla y las estadísticas se recalculan automáticamente."
                />

                {groupMatches.length === 0 ? (
                  <EmptyMessage text="No hay partidos de grupo para esta categoría." />
                ) : (
                  groupMatches.map((match) => (
                    <SimulationRow
                      key={match.id}
                      match={match}
                      simulated={simulatedResults[match.id] as SimulatedResultWithGoals | undefined}
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
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Clasificación</h2>

                  <div className="mt-4 space-y-2">
                    {table.length === 0 ? (
                      <EmptyMessage text="Sin datos para la tabla." />
                    ) : (
                      table.map((row, index) => (
                        <div
                          key={row.team}
                          className={`grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-2xl p-3 ${
                            index < 4 ? "bg-sky-50" : "bg-[#fbfaf6]"
                          }`}
                        >
                          <span className="text-sm font-black text-[#74786a]">{index + 1}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#151711]">{row.team}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
                              {row.gf}:{row.gc} · Dif {row.dif}
                            </p>
                          </div>
                          <span className="text-lg font-black">{row.pts}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <p className="mt-4 rounded-2xl bg-[#f6f4ee] p-3 text-xs font-bold leading-5 text-[#62675d]">
                    Cuando estén cargados todos los partidos de grupo, los puestos 1º a 4º pasan a semifinales: 1º vs 4º y 2º vs 3º. El 5º y 6º juegan por el 5º puesto.
                  </p>
                </section>

                <section className="rounded-[30px] border border-[#ded9cc] bg-[#151711] p-4 text-white shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                    Estadísticas simuladas
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Vista previa</h2>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniStat icon={Target} label="Goles" value={totalSimulatedGoals} />
                    <MiniStat icon={ShieldCheck} label="Valla" value={bestDefense?.team ?? "—"} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/10 p-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                      Goleadoras
                    </p>

                    {scorers.length === 0 ? (
                      <p className="text-xs font-bold text-white/55">
                        Cargá nombres de goleadoras para ver el ranking.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {scorers.slice(0, 6).map((scorer, index) => (
                          <div key={`${scorer.name}-${scorer.team}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black">#{index + 1} · {scorer.name}</p>
                              <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/45">{scorer.team}</p>
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
                label="Llaves"
                title={allGroupPlayed ? "Cruces proyectados" : "Cargá todos los grupos para completar cruces"}
                help="Los nombres aparecen automáticamente según la tabla simulada. También podés simular semifinales y finales."
              />

              <div className="grid gap-4 lg:grid-cols-3">
                {bracketMatches.map((match) => (
                  <SimulationRow
                    key={match.id}
                    match={match}
                    simulated={simulatedResults[match.id] as SimulatedResultWithGoals | undefined}
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

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
        active ? "border-[#151711] bg-[#151711] text-white shadow-sm" : "border-[#ded9cc] bg-white text-[#62675d] hover:border-[#151711]/30"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ label, title, help }: { label: string; title: string; help: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">{label}</p>
      <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">{title}</h2>
      <p className="mt-1 text-sm font-bold text-[#62675d]">{help}</p>
    </div>
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
  simulated?: SimulatedResultWithGoals;
  onSave: (matchId: number, scoreA: number, scoreB: number, goalsA?: string[], goalsB?: string[]) => void;
  onRemove: (matchId: number) => void;
  compact?: boolean;
}) {
  const initialScoreA = simulated?.scoreA ?? match.scoreA ?? "";
  const initialScoreB = simulated?.scoreB ?? match.scoreB ?? "";
  const [scoreA, setScoreA] = useState(String(initialScoreA));
  const [scoreB, setScoreB] = useState(String(initialScoreB));
  const [goalsA, setGoalsA] = useState<string[]>(() => normalizeGoalInputs(simulated?.goalsA, Number(initialScoreA) || 0));
  const [goalsB, setGoalsB] = useState<string[]>(() => normalizeGoalInputs(simulated?.goalsB, Number(initialScoreB) || 0));
  const active = Boolean(simulated);

  const cleanScoreA = scoreToNumber(scoreA);
  const cleanScoreB = scoreToNumber(scoreB);

  useEffect(() => {
    setGoalsA((prev) => normalizeGoalInputs(prev, cleanScoreA));
  }, [cleanScoreA]);

  useEffect(() => {
    setGoalsB((prev) => normalizeGoalInputs(prev, cleanScoreB));
  }, [cleanScoreB]);

  return (
    <article className={`rounded-[26px] border p-4 shadow-sm ${active ? "border-sky-200 bg-sky-50" : "border-[#ded9cc] bg-white/80"}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            {dayLabel(match.day)} · {formatTime(match.timeLabel)} · {match.court}
          </p>
          <h3 className={`${compact ? "text-lg" : "text-xl"} mt-1 font-black tracking-[-0.04em]`}>
            {match.teamA} <span className="text-[#74786a]">vs</span> {match.teamB}
          </h3>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
            {match.stage === "grupo" ? "Fase de grupos" : labelStage(match.stage)}
          </p>
        </div>
        {active && <span className="rounded-full bg-sky-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">Simulado</span>}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <ScoreInput label={match.teamA} value={scoreA} onChange={setScoreA} />
        <span className="pb-3 text-2xl font-black text-[#74786a]">:</span>
        <ScoreInput label={match.teamB} value={scoreB} onChange={setScoreB} />
      </div>

      {(cleanScoreA > 0 || cleanScoreB > 0) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <GoalInputs
            team={match.teamA}
            goals={goalsA}
            setGoals={setGoalsA}
          />
          <GoalInputs
            team={match.teamB}
            goals={goalsB}
            setGoals={setGoalsB}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onSave(match.id, cleanScoreA, cleanScoreB, sanitizeGoals(goalsA, cleanScoreA, match.teamA), sanitizeGoals(goalsB, cleanScoreB, match.teamB))}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#151711] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
        >
          <Wand2 className="h-4 w-4" /> Guardar ficticio
        </button>
        <button
          onClick={() => {
            onRemove(match.id);
            setScoreA("");
            setScoreB("");
            setGoalsA([]);
            setGoalsB([]);
          }}
          className="rounded-2xl border border-[#ded9cc] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#62675d]"
        >
          Quitar
        </button>
      </div>
    </article>
  );
}

function ScoreInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ""))}
        inputMode="numeric"
        className="w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-center text-3xl font-black outline-none focus:border-[#151711]"
        placeholder="0"
      />
    </label>
  );
}

function GoalInputs({
  team,
  goals,
  setGoals,
}: {
  team: string;
  goals: string[];
  setGoals: Dispatch<SetStateAction<string[]>>;
}) {
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ded9cc] bg-white/70 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">{team}</p>
        <p className="mt-1 text-xs font-bold text-[#74786a]">Sin goles.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#ded9cc] bg-white/70 p-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">Goleadoras · {team}</p>
      <div className="space-y-2">
        {goals.map((goal, index) => (
          <input
            key={index}
            value={goal}
            onChange={(event) => {
              const next = [...goals];
              next[index] = event.target.value;
              setGoals(next);
            }}
            placeholder={`Nombre gol ${index + 1}`}
            className="w-full rounded-xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-2 text-sm font-bold outline-none focus:border-[#151711]"
          />
        ))}
      </div>
    </div>
  );
}

type TableRow = {
  team: string;
  pts: number;
  j: number;
  gf: number;
  gc: number;
  dif: string;
  difValue: number;
};

function buildStandings(matches: MatchItem[]): TableRow[] {
  const map = new Map<string, { team: string; pts: number; j: number; gf: number; gc: number; difValue: number }>();
  const ensure = (team: string) => {
    if (!map.has(team)) map.set(team, { team, pts: 0, j: 0, gf: 0, gc: 0, difValue: 0 });
    return map.get(team)!;
  };

  for (const match of matches) {
    ensure(match.teamA);
    ensure(match.teamB);
    if (match.status !== "finalizado" || match.scoreA === null || match.scoreB === null) continue;
    const a = ensure(match.teamA);
    const b = ensure(match.teamB);
    a.j += 1;
    b.j += 1;
    a.gf += match.scoreA;
    a.gc += match.scoreB;
    b.gf += match.scoreB;
    b.gc += match.scoreA;
    if (match.scoreA > match.scoreB) a.pts += 3;
    else if (match.scoreB > match.scoreA) b.pts += 3;
    else {
      a.pts += 1;
      b.pts += 1;
    }
  }

  return Array.from(map.values())
    .map((row) => ({ ...row, difValue: row.gf - row.gc, dif: formatDiff(row.gf - row.gc) }))
    .sort((a, b) => b.pts - a.pts || b.difValue - a.difValue || b.gf - a.gf || a.team.localeCompare(b.team));
}

function buildScorers(matches: MatchItem[]): ScorerRow[] {
  const map = new Map<string, ScorerRow>();

  for (const match of matches) {
    for (const event of match.events ?? []) {
      if (event.type !== "goal") continue;
      const team = event.team === "teamA" ? match.teamA : match.teamB;
      const key = `${event.player}-${team}`;
      const prev = map.get(key);
      map.set(key, {
        name: event.player,
        team,
        goals: prev ? prev.goals + 1 : 1,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <Icon className="mb-2 h-5 w-5 text-[#d7c77a]" />
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-1 truncate text-lg font-black">{value}</p>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-4 text-sm font-bold text-[#74786a]">
      {text}
    </p>
  );
}

function matchBelongsTo(match: MatchItem, competition: CompetitionFilter, category: CategoryFilter) {
  return getCompetitionFromCategory(match.category) === competition && getCleanCategory(match.category) === category;
}

function getCompetitionFromCategory(category: string): CompetitionFilter {
  return category.toLowerCase().includes("colegial") ? "Colegial" : "Federado";
}

function getCleanCategory(category: string): CategoryFilter {
  const normalized = category.toLowerCase();
  if (normalized.includes("3")) return "Categoría 3";
  if (normalized.includes("2")) return "Categoría 2";
  return "Categoría 1";
}

function sortMatches(a: MatchItem, b: MatchItem) {
  return dayOrder(a.day) - dayOrder(b.day) || timeToMinutes(a.timeLabel) - timeToMinutes(b.timeLabel) || a.court.localeCompare(b.court);
}

function dayOrder(day: string) {
  return day === "dia2" ? 2 : 1;
}

function dayLabel(day: string) {
  return day === "dia2" ? "Día 2" : "Día 1";
}

function formatTime(value: string) {
  return value.replace(/^(\d{1,2}),(\d{2})/, "$1:$2");
}

function timeToMinutes(value: string) {
  const match = formatTime(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function labelStage(stage: MatchItem["stage"]) {
  if (stage === "semifinal") return "Semifinal";
  if (stage === "final") return "Final / puesto";
  if (stage === "cuartos") return "Cuartos";
  return "Grupo";
}

function formatDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function scoreToNumber(value: string) {
  const parsed = Number.parseInt(value || "0", 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, parsed);
}

function normalizeGoalInputs(current: string[] | undefined, total: number) {
  return Array.from({ length: Math.max(0, total) }, (_, index) => current?.[index] ?? "");
}

function sanitizeGoals(goals: string[], total: number, team: string) {
  return Array.from({ length: total }, (_, index) => {
    const value = goals[index]?.trim();
    return value || `${team} · Gol ${index + 1}`;
  });
}
