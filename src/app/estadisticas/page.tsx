"use client";

import { useMemo, useState } from "react";
import { Activity, BarChart3, Trophy } from "lucide-react";
import { useSimulation } from "@/src/components/providers/SimulationProvider";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import type { MatchItem } from "@/src/lib/tournament-types";

type CompetitionFilter = "Federado" | "Colegial";
type CategoryFilter = "Categoría 1" | "Categoría 2" | "Categoría 3";

const competitions: CompetitionFilter[] = ["Federado", "Colegial"];
const categories: CategoryFilter[] = ["Categoría 1", "Categoría 2", "Categoría 3"];

export default function EstadisticasPage() {
  const { matches: realMatches } = useTournament();
  const { getEffectiveMatches, simulationEnabled } = useSimulation();
  const [competition, setCompetition] = useState<CompetitionFilter>("Federado");
  const [category, setCategory] = useState<CategoryFilter>("Categoría 1");

  const matches = useMemo(() => getEffectiveMatches(realMatches), [realMatches, getEffectiveMatches]);
  const scoped = useMemo(
    () => matches.filter((match) => matchBelongsTo(match, competition, category)),
    [matches, competition, category],
  );
  const groupMatches = scoped.filter((match) => match.stage === "grupo");
  const table = buildStandings(groupMatches);
  const finished = scoped.filter((match) => match.status === "finalizado" && match.scoreA !== null && match.scoreB !== null);
  const goals = finished.reduce((acc, match) => acc + (match.scoreA ?? 0) + (match.scoreB ?? 0), 0);
  const draws = finished.filter((match) => match.scoreA === match.scoreB).length;

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        {simulationEnabled && (
          <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-900">
            Modo simulación activo: las estadísticas incluyen resultados ficticios.
          </div>
        )}

        <header className="mb-7">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-[#74786a]">Datos del torneo</p>
          <h1 className="text-[2.65rem] font-black leading-[0.92] tracking-[-0.075em] text-[#151711] md:text-7xl">
            Estadísticas
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#62675d]">
            Resumen por competencia y categoría. Si el modo simulación está activo, estos números se actualizan con la carga ficticia.
          </p>
        </header>

        <section className="mb-6 rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <FilterBlock title="Competencia">
              {competitions.map((item) => (
                <PillButton key={item} active={competition === item} onClick={() => setCompetition(item)}>{item}</PillButton>
              ))}
            </FilterBlock>
            <FilterBlock title="Categoría">
              {categories.map((item) => (
                <PillButton key={item} active={category === item} onClick={() => setCategory(item)}>{item}</PillButton>
              ))}
            </FilterBlock>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard icon={Activity} label="Partidos cargados" value={scoped.length} />
          <StatCard icon={Trophy} label="Finalizados" value={finished.length} />
          <StatCard icon={BarChart3} label="Goles" value={goals} />
          <StatCard icon={BarChart3} label="Empates" value={draws} />
        </section>

        <section className="mt-6 rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Tabla</p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">{category} {competition}</h2>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-[#ded9cc]">
            <div className="grid grid-cols-[44px_1fr_repeat(5,48px)] bg-[#151711] px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
              <span>#</span><span>Equipo</span><span>Pts</span><span>PJ</span><span>GF</span><span>GC</span><span>Dif</span>
            </div>
            {table.map((row, index) => (
              <div key={row.team} className={`grid grid-cols-[44px_1fr_repeat(5,48px)] items-center px-3 py-3 text-sm font-black ${index < 4 ? "bg-sky-50" : "bg-white"}`}>
                <span className="text-[#74786a]">{index + 1}</span>
                <span className="truncate">{row.team}</span>
                <span>{row.pts}</span>
                <span>{row.j}</span>
                <span>{row.gf}</span>
                <span>{row.gc}</span>
                <span>{row.dif}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">{title}</p><div className="flex flex-wrap gap-2">{children}</div></div>;
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-full border px-4 py-2 text-sm font-black transition ${active ? "border-[#151711] bg-[#151711] text-white shadow-sm" : "border-[#ded9cc] bg-white text-[#62675d] hover:border-[#151711]/30"}`}>{children}</button>;
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <article className="rounded-[28px] border border-[#ded9cc] bg-white/80 p-5 shadow-sm">
      <Icon className="mb-4 h-6 w-6 text-[#74786a]" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74786a]">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-[-0.07em]">{value}</p>
    </article>
  );
}

type TableRow = { team: string; pts: number; j: number; gf: number; gc: number; dif: string; difValue: number };

function buildStandings(matches: MatchItem[]): TableRow[] {
  const map = new Map<string, { team: string; pts: number; j: number; gf: number; gc: number; difValue: number }>();
  const ensure = (team: string) => {
    if (!map.has(team)) map.set(team, { team, pts: 0, j: 0, gf: 0, gc: 0, difValue: 0 });
    return map.get(team)!;
  };
  for (const match of matches) {
    ensure(match.teamA); ensure(match.teamB);
    if (match.status !== "finalizado" || match.scoreA === null || match.scoreB === null) continue;
    const a = ensure(match.teamA); const b = ensure(match.teamB);
    a.j += 1; b.j += 1; a.gf += match.scoreA; a.gc += match.scoreB; b.gf += match.scoreB; b.gc += match.scoreA;
    if (match.scoreA > match.scoreB) a.pts += 3;
    else if (match.scoreB > match.scoreA) b.pts += 3;
    else { a.pts += 1; b.pts += 1; }
  }
  return Array.from(map.values()).map((row) => ({ ...row, difValue: row.gf - row.gc, dif: formatDiff(row.gf - row.gc) })).sort((a, b) => b.pts - a.pts || b.difValue - a.difValue || b.gf - a.gf || a.team.localeCompare(b.team));
}

function matchBelongsTo(match: MatchItem, competition: CompetitionFilter, category: CategoryFilter) {
  return getCompetition(match.category) === competition && getBaseCategory(match.category) === category;
}
function getCompetition(category: string): CompetitionFilter { return category.toLowerCase().includes("colegial") ? "Colegial" : "Federado"; }
function getBaseCategory(category: string): CategoryFilter { const n = category.toLowerCase(); if (n.includes("3")) return "Categoría 3"; if (n.includes("2")) return "Categoría 2"; return "Categoría 1"; }
function formatDiff(value: number) { return value > 0 ? `+${value}` : String(value); }
