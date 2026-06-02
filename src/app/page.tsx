"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CalendarDays, LayoutGrid, MapPin, Trophy, X } from "lucide-react";
import { useSchoolPreference } from "@/src/components/providers/SchoolPreferenceProvider";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import { useSimulation } from "@/src/components/providers/SimulationProvider";
import { getSchoolNameFromTeam, isSchoolInMatch } from "@/src/lib/schools";
import type { MatchItem } from "@/src/lib/tournament-types";

type TabType = "fixture" | "tabla" | "llaves";
type CompetitionFilter = "Federado" | "Colegial";
type CategoryFilter = "Categoría 1" | "Categoría 2" | "Categoría 3";
type DayFilter = "todos" | "dia1" | "dia2";

type TableRow = {
  pos: number;
  team: string;
  pts: number;
  j: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dif: string;
  qualifies: boolean;
};

const competitions: CompetitionFilter[] = ["Federado", "Colegial"];
const baseCategories: CategoryFilter[] = [
  "Categoría 1",
  "Categoría 2",
  "Categoría 3",
];
const dayOptions: { id: DayFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "dia1", label: "Día 1" },
  { id: "dia2", label: "Día 2" },
];

export default function Home() {
  const { matches: realMatches } = useTournament();
  const { selectedSchool, viewingAllSchools, clearSelectedSchool } = useSchoolPreference();
  const { getEffectiveMatches, simulationEnabled } = useSimulation();

  const matches = useMemo(
    () => getEffectiveMatches(realMatches),
    [realMatches, getEffectiveMatches],
  );
  const [activeTab, setActiveTab] = useState<TabType>("fixture");
  const [competition, setCompetition] = useState<CompetitionFilter>("Federado");
  const [category, setCategory] = useState<CategoryFilter>("Categoría 1");
  const [activeDay, setActiveDay] = useState<DayFilter>("todos");
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);

  const scopedMatches = useMemo(
    () =>
      matches
        .filter((match) => matchBelongsTo(match, competition, category))
        .sort(sortMatches),
    [matches, competition, category],
  );

  const groupMatches = useMemo(
    () => scopedMatches.filter((match) => match.stage === "grupo"),
    [scopedMatches],
  );

  const visibleFixture = useMemo(
    () =>
      groupMatches.filter((match) =>
        activeDay === "todos" ? true : normalizeDay(match.day) === activeDay,
      ),
    [groupMatches, activeDay],
  );

  const groupedByDayAndTime = useMemo(() => {
    const map = new Map<string, MatchItem[]>();
    for (const match of visibleFixture) {
      const key = `${dayLabel(match.day)} · ${displayTime(match.timeLabel)}`;
      map.set(key, [...(map.get(key) ?? []), match]);
    }

    return Array.from(map.entries()).map(([label, items]) => ({
      label,
      matches: items.sort(sortMatches),
    }));
  }, [visibleFixture]);

  const standings = useMemo(() => buildStandings(groupMatches), [groupMatches]);

  const bracket = useMemo(
    () => ({
      cuartos: scopedMatches.filter((match) => match.stage === "cuartos"),
      semis: scopedMatches.filter((match) => match.stage === "semifinal"),
      final: scopedMatches.filter((match) => match.stage === "final"),
    }),
    [scopedMatches],
  );

  const featuredMatch =
    scopedMatches.find((match) => match.status === "en_curso") ??
    scopedMatches.find((match) => match.status === "finalizado") ??
    scopedMatches[0] ??
    null;

  const featuredMatches = scopedMatches
    .filter((match) => match.featured)
    .slice(0, 4);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      {selectedMatch && (
        <MatchModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        {simulationEnabled && (
          <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-900">
            Modo simulación activo: los resultados y llaves se muestran con carga ficticia. No modifica la base real.
          </div>
        )}
        <header className="mb-7">
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="max-w-3xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.075em] md:text-7xl">
                Copa{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">APDES</span>
                  <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#d7c77a]/75 md:h-4" />
                </span>{" "}
                2026
              </h1>

              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#62675d]">
                Fixture completo, tabla y cruces por competencia y categoría. Tu colegio queda marcado de forma sutil para encontrarlo rápido.
              </p>
            </div>

            <nav className="flex rounded-full border border-[#ded9cc] bg-white/75 p-1 shadow-sm">
              <TabButton
                active={activeTab === "fixture"}
                onClick={() => setActiveTab("fixture")}
                icon={CalendarDays}
                label="Fixture"
              />
              <TabButton
                active={activeTab === "tabla"}
                onClick={() => setActiveTab("tabla")}
                icon={Trophy}
                label="Tabla"
              />
              <TabButton
                active={activeTab === "llaves"}
                onClick={() => setActiveTab("llaves")}
                icon={LayoutGrid}
                label="Llaves"
              />
            </nav>
          </div>

          <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <FilterBlock title="Elegí competencia">
                {competitions.map((item) => (
                  <PillButton
                    key={item}
                    active={competition === item}
                    onClick={() => setCompetition(item)}
                  >
                    {item}
                  </PillButton>
                ))}
              </FilterBlock>

              <FilterBlock title="Elegí categoría">
                {baseCategories.map((item) => (
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

            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#f6f4ee] px-4 py-3 text-sm font-black text-[#151711] md:flex-row md:items-center md:justify-between">
              <span>
                Mostrando: {category} {competition}
              </span>

              {(selectedSchool || viewingAllSchools) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#151711]/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#62675d]">
                    {selectedSchool ? `Mi colegio: ${selectedSchool}` : "Modo control: todos"}
                  </span>

                  <button
                    type="button"
                    onClick={clearSelectedSchool}
                    className="rounded-full border border-[#151711]/15 bg-[#151711] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#2a2d22]"
                  >
                    Cambiar colegio
                  </button>
                </div>
              )}
            </div>
          </section>
        </header>

        {activeTab === "fixture" && (
          <section className="space-y-7">
            <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
              {featuredMatch ? (
                <FeaturedMatch
                  match={featuredMatch}
                  selectedSchool={selectedSchool}
                  onClick={() => setSelectedMatch(featuredMatch)}
                />
              ) : (
                <EmptyFixture />
              )}

              <section className="rounded-[28px] border border-[#ded9cc] bg-white/75 p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Partidos a seguir
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                  {category} {competition}
                </h2>

                <div className="mt-4 space-y-3">
                  {featuredMatches.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-[#ded9cc] bg-[#f6f4ee] p-4 text-sm font-bold text-[#74786a]">
                      Los partidos destacados aparecerán cuando se marquen desde
                      administración.
                    </p>
                  )}
                  {featuredMatches.map((match) => (
                    <FollowMatchCard
                      key={match.id}
                      match={match}
                      selectedSchool={selectedSchool}
                      onClick={() => setSelectedMatch(match)}
                    />
                  ))}
                </div>
              </section>
            </section>

            <section>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Fixture
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                    Partidos · {category} {competition}
                  </h2>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {dayOptions.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => setActiveDay(day.id)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                        activeDay === day.id
                          ? "border-[#151711] bg-[#151711] text-white"
                          : "border-[#ded9cc] bg-white/75 text-[#62675d]"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {groupedByDayAndTime.length === 0 ? (
                <p className="rounded-[24px] border border-dashed border-[#ded9cc] bg-white/70 p-6 text-sm font-bold text-[#74786a]">
                  No hay partidos cargados para esta competencia y categoría.
                </p>
              ) : (
                <div className="space-y-5">
                  {groupedByDayAndTime.map((group) => (
                    <section
                      key={group.label}
                      className="rounded-[28px] border border-[#ded9cc] bg-white/75 p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-2xl font-black tracking-[-0.05em] text-[#151711]">
                          {group.label}
                        </h3>
                        <span className="rounded-full bg-[#f6f4ee] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
                          {group.matches.length} partidos
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {group.matches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            selectedSchool={selectedSchool}
                            onClick={() => setSelectedMatch(match)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>
          </section>
        )}

        {activeTab === "tabla" && (
          <TableSection
            table={standings}
            title={`Tabla · ${category} ${competition}`}
            selectedSchool={selectedSchool}
          />
        )}

        {activeTab === "llaves" && (
          <BracketSection
            title={`Llaves · ${category} ${competition}`}
            bracket={bracket}
            onOpenMatch={setSelectedMatch}
          />
        )}
      </section>
    </main>
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
      <div className="flex flex-wrap gap-2">{children}</div>
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

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
        active ? "bg-[#151711] text-white" : "text-[#62675d] hover:bg-[#f6f4ee]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function FeaturedMatch({
  match,
  selectedSchool,
  onClick,
}: {
  match: MatchItem;
  selectedSchool: string | null;
  onClick: () => void;
}) {
  const mine = isSchoolInMatch(match.teamA, match.teamB, selectedSchool);

  return (
    <button
      onClick={onClick}
      className={`relative min-h-[260px] overflow-hidden rounded-[34px] bg-[#151711] p-5 text-left text-white shadow-[0_18px_50px_rgba(21,23,17,0.18)] md:p-7 ${mine ? "ring-2 ring-white/45" : ""}`}
    >
      <FieldLines />
      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={match.status} dark />
            {isDraw(match) && (
              <span className="rounded-full bg-[#d7c77a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#151711]">
                Empate
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-white/65">
            <MapPin className="h-4 w-4" />
            {match.court}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <HeroTeam name={match.teamA} />
          <div className="text-center">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Marcador
            </p>
            <p className="text-5xl font-black tracking-[-0.08em] md:text-6xl">
              {match.scoreA ?? "-"}
              <span className="mx-2 text-[#d7c77a]">:</span>
              {match.scoreB ?? "-"}
            </p>
          </div>
          <HeroTeam name={match.teamB} align="right" />
        </div>

        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d7c77a]">
          {dayLabel(match.day)} · {displayTime(match.timeLabel)} ·{" "}
          {match.category}
        </div>
      </div>
    </button>
  );
}

function HeroTeam({
  name,
  align = "left",
}: {
  name: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-3 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <TeamShield name={name} size="lg" dark />
      <p className="max-w-[120px] truncate text-center text-sm font-black uppercase tracking-[0.08em] text-white">
        {displayTeam(name)}
      </p>
    </div>
  );
}

function FollowMatchCard({
  match,
  selectedSchool,
  onClick,
}: {
  match: MatchItem;
  selectedSchool: string | null;
  onClick: () => void;
}) {
  const mine = isSchoolInMatch(match.teamA, match.teamB, selectedSchool);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:bg-white ${mine ? "border-[#151711]/45 bg-[#f1f0eb] shadow-[inset_4px_0_0_#151711]" : "border-[#ded9cc] bg-[#fbfaf6]"}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
          {dayLabel(match.day)} · {displayTime(match.timeLabel)}
        </p>
        <StatusBadge status={match.status} />
      </div>
      <MiniResultLine match={match} selectedSchool={selectedSchool} />
    </button>
  );
}

function MatchCard({
  match,
  selectedSchool,
  onClick,
}: {
  match: MatchItem;
  selectedSchool: string | null;
  onClick: () => void;
}) {
  const mine = isSchoolInMatch(match.teamA, match.teamB, selectedSchool);

  return (
    <button
      onClick={onClick}
      className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-[#151711]/25 hover:bg-white hover:shadow-sm ${mine ? "border-[#151711]/45 bg-[#f1f0eb] shadow-[inset_4px_0_0_#151711]" : "border-[#ded9cc] bg-[#fbfaf6]"}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            {match.court}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#151711]">
            {match.category}
          </p>
        </div>
        <StatusBadge status={match.status} />
      </div>
      <MiniResultLine match={match} selectedSchool={selectedSchool} />
    </button>
  );
}

function MiniResultLine({
  match,
  selectedSchool,
}: {
  match: MatchItem;
  selectedSchool: string | null;
}) {
  const teamAMine = getSchoolNameFromTeam(match.teamA) === selectedSchool;
  const teamBMine = getSchoolNameFromTeam(match.teamB) === selectedSchool;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <TeamShield name={match.teamA} size="sm" />
        <span
          className={`truncate text-sm font-black ${teamAMine ? "text-[#151711]" : ""}`}
        >
          {displayTeam(match.teamA)}
        </span>
      </div>
      <span className="shrink-0 text-sm font-black text-[#74786a]">
        {match.scoreA ?? "-"} - {match.scoreB ?? "-"}
      </span>
      <div className="flex min-w-0 items-center justify-end gap-2">
        <span
          className={`truncate text-right text-sm font-black ${teamBMine ? "text-[#151711]" : ""}`}
        >
          {displayTeam(match.teamB)}
        </span>
        <TeamShield name={match.teamB} size="sm" />
      </div>
    </div>
  );
}

function TableSection({
  table,
  title,
  selectedSchool,
}: {
  table: TableRow[];
  title: string;
  selectedSchool: string | null;
}) {
  return (
    <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-8">
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
          Clasificación
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">{title}</h2>

        <div className="mt-3 flex items-center gap-2 rounded-full bg-[#f6f4ee] px-3 py-2 text-xs font-bold text-[#74786a] md:inline-flex">
          <span className="h-3 w-3 rounded-full bg-emerald-700" />
          Verde: clasifica a fase final
        </div>
      </div>

      {table.length === 0 ? (
        <p className="rounded-[24px] border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-8 text-center text-sm font-bold text-[#74786a]">
          La tabla se arma automáticamente cuando se finalizan partidos de
          grupo.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-[#e6e0d3] bg-[#fbfaf6]">
          <div className="hidden grid-cols-[64px_1fr_70px_58px_58px_58px_58px_70px] border-b border-[#e6e0d3] px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#74786a] md:grid">
            <div>#</div>
            <div>Equipo</div>
            <div className="text-center">PTS</div>
            <div className="text-center">J</div>
            <div className="text-center">G</div>
            <div className="text-center">E</div>
            <div className="text-center">P</div>
            <div className="text-center">DIF</div>
          </div>
          {table.map((row) => {
            const mine = getSchoolNameFromTeam(row.team) === selectedSchool;

            return (
              <div
                key={row.team}
                className={`grid grid-cols-[44px_1fr_54px] gap-3 border-b border-[#eee9dd] p-4 last:border-b-0 md:grid-cols-[64px_1fr_70px_58px_58px_58px_58px_70px] md:items-center md:px-5 ${mine ? "bg-[#f1f0eb] shadow-[inset_4px_0_0_#151711]" : ""}`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black md:h-auto md:w-auto md:rounded-none ${row.qualifies ? "bg-emerald-700 text-white md:bg-transparent md:text-emerald-700" : "bg-[#eee9dd] text-[#74786a] md:bg-transparent"}`}
                >
                  {row.pos}
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <TeamShield name={row.team} size="sm" />
                  <p className="truncate text-sm font-black">
                    {displayTeam(row.team)}
                  </p>
                </div>
                <div className="text-center text-xl font-black md:text-lg">
                  {row.pts}
                </div>
                <div className="hidden text-center text-sm font-bold text-[#74786a] md:block">
                  {row.j}
                </div>
                <div className="hidden text-center text-sm font-bold text-[#74786a] md:block">
                  {row.g}
                </div>
                <div className="hidden text-center text-sm font-bold text-[#74786a] md:block">
                  {row.e}
                </div>
                <div className="hidden text-center text-sm font-bold text-[#74786a] md:block">
                  {row.p}
                </div>
                <div className="hidden text-center text-sm font-black md:block">
                  {row.dif}
                </div>
                <div className="col-span-3 grid grid-cols-5 rounded-2xl bg-white/70 text-center text-xs font-black text-[#74786a] md:hidden">
                  <SmallStat label="J" value={row.j} />
                  <SmallStat label="G" value={row.g} />
                  <SmallStat label="E" value={row.e} />
                  <SmallStat label="P" value={row.p} />
                  <SmallStat label="DIF" value={row.dif} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="px-2 py-2">
      <p>{value}</p>
      <p className="text-[9px] opacity-70">{label}</p>
    </div>
  );
}

function BracketSection({
  title,
  bracket,
  onOpenMatch,
}: {
  title: string;
  bracket: { cuartos: MatchItem[]; semis: MatchItem[]; final: MatchItem[] };
  onOpenMatch: (match: MatchItem) => void;
}) {
  const hasMatches =
    bracket.cuartos.length + bracket.semis.length + bracket.final.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#151711] p-5 text-white md:p-8">
      <FieldLines />
      <div className="relative z-10 mb-7">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
          Fase final
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">{title}</h2>

        <p className="mt-2 text-sm font-medium text-white/45">
          Solo se muestran los cruces de la selección actual.
        </p>
      </div>

      {!hasMatches ? (
        <p className="relative z-10 rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-sm font-bold text-white/55">
          Las llaves aparecerán cuando se carguen partidos de fase final para
          esta categoría.
        </p>
      ) : (
        <div className="relative z-10 grid gap-5 md:grid-cols-3">
          <BracketColumn
            title="Cuartos"
            matches={bracket.cuartos}
            onOpenMatch={onOpenMatch}
          />
          <BracketColumn
            title="Semifinales"
            matches={bracket.semis}
            onOpenMatch={onOpenMatch}
          />
          <BracketColumn
            title="Finales"
            matches={bracket.final}
            onOpenMatch={onOpenMatch}
            final
          />
        </div>
      )}
    </section>
  );
}

function BracketColumn({
  title,
  matches,
  final = false,
  onOpenMatch,
}: {
  title: string;
  matches: MatchItem[];
  final?: boolean;
  onOpenMatch: (match: MatchItem) => void;
}) {
  return (
    <div>
      <h3
        className={`mb-4 text-center text-[11px] font-black uppercase tracking-[0.2em] ${final ? "text-[#d7c77a]" : "text-white/45"}`}
      >
        {title}
      </h3>
      <div className="space-y-4">
        {matches.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center text-xs font-bold text-white/35">
            Sin cruces
          </p>
        ) : (
          matches.map((match) => (
            <BracketMatch
              key={match.id}
              match={match}
              final={final}
              onOpen={() => onOpenMatch(match)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BracketMatch({
  match,
  final = false,
  onOpen,
}: {
  match: MatchItem;
  final?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className={`w-full overflow-hidden rounded-2xl border text-left transition hover:scale-[1.01] ${final ? "border-[#d7c77a]/40 bg-[#d7c77a]/10" : "border-white/10 bg-white/[0.06]"}`}
    >
      <BracketTeam
        name={match.teamA}
        score={match.scoreA}
        active={isWinner(match, "teamA")}
      />
      <BracketTeam
        name={match.teamB}
        score={match.scoreB}
        active={isWinner(match, "teamB")}
      />
      {match.penalties && (
        <p className="border-t border-white/10 px-4 py-2 text-right text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
          Penales: {match.penalties}
        </p>
      )}
    </button>
  );
}

function BracketTeam({
  name,
  score,
  active,
}: {
  name: string;
  score: number | null;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2">
        <TeamShield name={name} size="sm" />
        <span
          className={`truncate pr-3 text-sm ${active ? "font-black text-white" : "font-bold text-white/50"}`}
        >
          {displayTeam(name)}
        </span>
      </div>
      <span
        className={`text-lg font-black ${active ? "text-[#d7c77a]" : "text-white/35"}`}
      >
        {score ?? "-"}
      </span>
    </div>
  );
}

function MatchModal({
  match,
  onClose,
}: {
  match: MatchItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#151711]/70 px-3 pb-3 backdrop-blur-sm md:items-center md:justify-center md:p-4">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-[30px] bg-[#f6f4ee] shadow-2xl md:max-w-[520px]">
        <div className="relative bg-white p-4">
          <button
            onClick={onClose}
            className="absolute right-7 top-7 z-20 rounded-full bg-[#151711]/80 p-2 text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative overflow-hidden rounded-[28px] bg-[#151711] p-5 text-white">
            <FieldLines />
            <div className="relative z-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={match.status} dark />
                <span className="text-xs font-bold text-white/55">
                  {dayLabel(match.day)} · {displayTime(match.timeLabel)}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <HeroTeam name={match.teamA} />
                <p className="text-5xl font-black tracking-[-0.08em]">
                  {match.scoreA ?? "-"}
                  <span className="mx-2 text-[#d7c77a]">:</span>
                  {match.scoreB ?? "-"}
                </p>
                <HeroTeam name={match.teamB} align="right" />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-[#eee9dd] bg-[#fbfaf6] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#74786a]">
              Detalle
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-[-0.05em]">
              {match.category}
            </h3>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[#62675d]">
              <MapPin className="h-4 w-4" />
              {match.court}
            </p>
          </div>

          <div className="mt-4 rounded-[24px] border border-[#eee9dd] bg-[#fbfaf6] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#74786a]">
              Eventos
            </p>
            {match.events.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-[#ded9cc] p-4 text-sm font-bold text-[#74786a]">
                Sin eventos cargados.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {match.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold"
                  >
                    <span>
                      {event.minute}' · {event.player}
                    </span>
                    <span className="text-[#74786a]">
                      {event.type === "goal"
                        ? "Gol"
                        : event.type === "green_card"
                          ? "Verde"
                          : "Amarilla"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function TeamShield({
  name,
  size = "md",
  dark = false,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}) {
  const shield = getSchoolShield(name);
  const sizeClass =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-14 w-14 md:h-16 md:w-16"
        : "h-12 w-12";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border ${dark ? "border-white/15 bg-white" : "border-[#ded9cc] bg-white"} ${sizeClass}`}
    >
      {shield ? (
        <Image
          src={shield}
          alt={`Escudo de ${displayTeam(name)}`}
          width={80}
          height={80}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span className="text-xs font-black text-[#151711]">
          {getInitials(displayTeam(name))}
        </span>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  dark = false,
}: {
  status: MatchItem["status"];
  dark?: boolean;
}) {
  const label =
    status === "finalizado"
      ? "Final"
      : status === "en_curso"
        ? "En vivo"
        : "Pendiente";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${dark ? "bg-white/10 text-white" : "bg-[#eee9dd] text-[#62675d]"}`}
    >
      {label}
    </span>
  );
}

function EmptyFixture() {
  return (
    <section className="relative flex min-h-[260px] w-full items-center justify-center overflow-hidden rounded-[34px] bg-[#151711] p-7 text-center text-white shadow-[0_18px_50px_rgba(21,23,17,0.18)]">
      <FieldLines />
      <div className="relative z-10">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
          Fixture
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
          Sin partidos en esta selección
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm font-medium text-white/55">
          Probá otra competencia o categoría.
        </p>
      </div>
    </section>
  );
}

function FieldLines() {
  return (
    <div className="pointer-events-none absolute inset-4 rounded-[24px] border border-white/10 opacity-70">
      <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute left-0 top-1/2 h-24 w-12 -translate-y-1/2 rounded-r-full border border-l-0 border-white/10" />
      <div className="absolute right-0 top-1/2 h-24 w-12 -translate-y-1/2 rounded-l-full border border-r-0 border-white/10" />
    </div>
  );
}

function matchBelongsTo(
  match: MatchItem,
  competition: CompetitionFilter,
  category: CategoryFilter,
) {
  return (
    getCompetition(match.category) === competition &&
    getBaseCategory(match.category) === category
  );
}

function getCompetition(category: string): CompetitionFilter | "Otro" {
  const normalized = normalizeText(category);
  if (normalized.includes("colegial")) return "Colegial";
  if (normalized.includes("federado") || normalized.includes("federal"))
    return "Federado";
  return "Otro";
}

function getBaseCategory(category: string): CategoryFilter | "Otra" {
  const normalized = normalizeText(category);
  if (normalized.includes("categoria 1")) return "Categoría 1";
  if (normalized.includes("categoria 2")) return "Categoría 2";
  if (normalized.includes("categoria 3")) return "Categoría 3";
  return "Otra";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDay(day: string): "dia1" | "dia2" | string {
  const normalized = normalizeText(day).replace(/\s+/g, "");
  if (["dia1", "jueves", "d1", "1"].includes(normalized)) return "dia1";
  if (["dia2", "viernes", "sabado", "d2", "2"].includes(normalized))
    return "dia2";
  return normalized;
}

function dayLabel(day: string) {
  return normalizeDay(day) === "dia2" ? "Día 2" : "Día 1";
}

function displayTime(value: string) {
  return value.replace(/^(\d{1,2}),(\d{2})/, "$1:$2");
}

function timeValue(value: string) {
  const match = displayTime(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function courtNumber(court: string) {
  const match = court.match(/\d+/);
  return match ? Number(match[0]) : 99;
}

function sortMatches(a: MatchItem, b: MatchItem) {
  const dayDiff =
    (normalizeDay(a.day) === "dia1" ? 1 : 2) -
    (normalizeDay(b.day) === "dia1" ? 1 : 2);
  if (dayDiff !== 0) return dayDiff;
  const timeDiff = timeValue(a.timeLabel) - timeValue(b.timeLabel);
  if (timeDiff !== 0) return timeDiff;
  return courtNumber(a.court) - courtNumber(b.court);
}

function buildStandings(matches: MatchItem[]): TableRow[] {
  const stats = new Map<string, Omit<TableRow, "pos" | "dif" | "qualifies">>();

  for (const match of matches) {
    for (const team of [match.teamA, match.teamB]) {
      if (!stats.has(team))
        stats.set(team, { team, pts: 0, j: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 });
    }

    if (
      match.status !== "finalizado" ||
      match.scoreA === null ||
      match.scoreB === null
    )
      continue;

    const a = stats.get(match.teamA)!;
    const b = stats.get(match.teamB)!;
    a.j += 1;
    b.j += 1;
    a.gf += match.scoreA;
    a.gc += match.scoreB;
    b.gf += match.scoreB;
    b.gc += match.scoreA;

    if (match.scoreA > match.scoreB) {
      a.g += 1;
      a.pts += 3;
      b.p += 1;
    } else if (match.scoreB > match.scoreA) {
      b.g += 1;
      b.pts += 3;
      a.p += 1;
    } else {
      a.e += 1;
      b.e += 1;
      a.pts += 1;
      b.pts += 1;
    }
  }

  return Array.from(stats.values())
    .sort(
      (a, b) =>
        b.pts - a.pts ||
        b.gf - b.gc - (a.gf - a.gc) ||
        b.gf - a.gf ||
        a.team.localeCompare(b.team),
    )
    .map((row, index) => ({
      ...row,
      pos: index + 1,
      dif: `${row.gf - row.gc >= 0 ? "+" : ""}${row.gf - row.gc}`,
      qualifies: index < 4,
    }));
}

function getSchoolShield(name: string) {
  const normalized = normalizeText(name);
  if (normalized.includes("mirasoles")) return "/escudos/mirasoles.png";
  if (normalized.includes("torreon")) return "/escudos/torreon.png";
  if (normalized.includes("crisol")) return "/escudos/crisol.png";
  if (normalized.includes("cerros")) return "/escudos/los-cerros.png";
  if (normalized.includes("buen ayre")) return "/escudos/buen-ayre.png";
  if (normalized.includes("portezuelo")) return "/escudos/portezuelo.png";
  if (normalized === "lcd" || normalized.includes("candiles"))
    return "/escudos/los-candiles.png";
  return null;
}

function displayTeam(name: string) {
  return name === "LCD" ? "LCD" : name;
}

function getInitials(name: string) {
  return name
    .replace(".", "")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function isDraw(match: MatchItem) {
  return (
    match.status === "finalizado" &&
    match.scoreA !== null &&
    match.scoreB !== null &&
    match.scoreA === match.scoreB
  );
}

function isWinner(match: MatchItem, team: "teamA" | "teamB") {
  if (
    match.status !== "finalizado" ||
    match.scoreA === null ||
    match.scoreB === null
  )
    return false;
  return team === "teamA"
    ? match.scoreA > match.scoreB
    : match.scoreB > match.scoreA;
}
