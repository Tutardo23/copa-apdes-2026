"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, KeyRound, RotateCcw, Wand2 } from "lucide-react";
import { useSimulation } from "@/src/components/providers/SimulationProvider";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import type { MatchItem } from "@/src/lib/tournament-types";

type CompetitionFilter = "Federado" | "Colegial";
type CategoryFilter = "Categoría 1" | "Categoría 2" | "Categoría 3";

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
  const allGroupPlayed = groupMatches.length > 0 && groupMatches.every((match) => match.status === "finalizado");

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/admin" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#62675d]">
              <ArrowLeft className="h-4 w-4" /> Volver al admin
            </Link>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Panel privado</p>
            <h1 className="max-w-4xl text-[2.55rem] font-black leading-[0.92] tracking-[-0.075em] md:text-7xl">
              Simulación de <span className="relative inline-block"><span className="relative z-10">llaves</span><span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-sky-200 md:h-4" /></span>
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#62675d]">
              Cargá resultados ficticios para probar cómo evoluciona la tabla y cómo se arman las semifinales. No toca Neon ni modifica los resultados reales.
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
              <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]"><KeyRound className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-black">Acceso privado de administrador</p>
                <p className="text-xs font-bold text-[#74786a]">La simulación también queda dentro del admin.</p>
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

        {adminError && (
          <p className="mb-5 rounded-2xl border border-[#d7c77a]/50 bg-[#f5edc9] p-3 text-sm font-bold text-[#6f6125]">{adminError}</p>
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

            <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <SectionTitle
                  label="Carga ficticia"
                  title={`Fase de grupos · ${category} ${competition}`}
                  help="Cargá goles como prueba. La tabla se recalcula automáticamente."
                />

                {groupMatches.map((match) => (
                  <SimulationRow
                    key={match.id}
                    match={match}
                    simulated={simulatedResults[match.id]}
                    onSave={setSimulatedResult}
                    onRemove={removeSimulatedResult}
                  />
                ))}
              </div>

              <aside className="space-y-4">
                <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Tabla simulada</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Clasificación</h2>
                  <div className="mt-4 space-y-2">
                    {table.map((row, index) => (
                      <div key={row.team} className={`grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-2xl p-3 ${index < 4 ? "bg-sky-50" : "bg-[#fbfaf6]"}`}>
                        <span className="text-sm font-black text-[#74786a]">{index + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[#151711]">{row.team}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">{row.gf}:{row.gc} · Dif {row.dif}</p>
                        </div>
                        <span className="text-lg font-black">{row.pts}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-2xl bg-[#f6f4ee] p-3 text-xs font-bold leading-5 text-[#62675d]">
                    Cuando estén cargados todos los partidos de grupo, los puestos 1º a 4º pasan a semifinales: 1º vs 4º y 2º vs 3º. El 5º y 6º juegan por el 5º puesto.
                  </p>
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
                    simulated={simulatedResults[match.id]}
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
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${active ? "border-[#151711] bg-[#151711] text-white shadow-sm" : "border-[#ded9cc] bg-white text-[#62675d] hover:border-[#151711]/30"}`}
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
  simulated?: { scoreA: number; scoreB: number };
  onSave: (matchId: number, scoreA: number, scoreB: number) => void;
  onRemove: (matchId: number) => void;
  compact?: boolean;
}) {
  const [scoreA, setScoreA] = useState(String(simulated?.scoreA ?? match.scoreA ?? ""));
  const [scoreB, setScoreB] = useState(String(simulated?.scoreB ?? match.scoreB ?? ""));
  const active = Boolean(simulated);

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

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onSave(match.id, Number(scoreA), Number(scoreB))}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#151711] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
        >
          <Wand2 className="h-4 w-4" /> Guardar ficticio
        </button>
        <button
          onClick={() => {
            onRemove(match.id);
            setScoreA("");
            setScoreB("");
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
