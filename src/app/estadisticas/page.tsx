"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Flame,
  ShieldCheck,
  Square,
  Target,
  Trophy,
} from "lucide-react";
import {
  DayKey,
  MatchItem,
  useTournament,
} from "@/src/components/providers/TournamentProvider";
import { useSimulation } from "@/src/components/providers/SimulationProvider";

type Tab = "resumen" | "goleadoras" | "fairplay";
type DayFilter = "todos" | DayKey;
type CompetitionFilter = "Federado" | "Colegial";
type CategoryFilter = "Categoría 1" | "Categoría 2" | "Categoría 3";

type TeamStats = {
  team: string;
  pts: number;
  played: number;
  goals: number;
  against: number;
};

type Scorer = {
  name: string;
  team: string;
  goals: number;
};

type CardStat = {
  name: string;
  team: string;
  green: number;
  yellow: number;
};

const COMPETITIONS: CompetitionFilter[] = ["Federado", "Colegial"];
const CATEGORIES: CategoryFilter[] = ["Categoría 1", "Categoría 2", "Categoría 3"];

export default function EstadisticasPage() {
  const { matches } = useTournament();
  const { simulationEnabled, getEffectiveMatches } = useSimulation();

  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [competitionFilter, setCompetitionFilter] =
    useState<CompetitionFilter>("Federado");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("Categoría 1");
  const [dayFilter, setDayFilter] = useState<DayFilter>("todos");

  const effectiveMatches = useMemo(
    () => getEffectiveMatches(matches),
    [getEffectiveMatches, matches],
  );

  const filteredMatches = useMemo(
    () =>
      effectiveMatches.filter((match) => {
        if (match.stage !== "grupo") return false;
        if (getCompetition(match.category) !== competitionFilter) return false;
        if (getBaseCategory(match.category) !== categoryFilter) return false;
        if (dayFilter !== "todos" && match.day !== dayFilter) return false;
        return true;
      }),
    [categoryFilter, competitionFilter, dayFilter, effectiveMatches],
  );

  const { teamStats, scorers, cards, totalGoals } = useMemo(
    () => buildStats(filteredMatches),
    [filteredMatches],
  );

  const leader = scorers[0];
  const bestDefense = [...teamStats]
    .filter((team) => team.played > 0)
    .sort((a, b) => a.against - b.against || b.pts - a.pts)[0];
  const maxGoals = Math.max(1, ...scorers.map((player) => player.goals));
  const maxTeamGoals = Math.max(1, ...teamStats.map((team) => team.goals));

  const contextLabel = `${categoryFilter} · ${competitionFilter}`;
  const dayLabel =
    dayFilter === "dia1" ? "Día 1" : dayFilter === "dia2" ? "Día 2" : "Todos los días";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-6">
          <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Estadísticas
                </p>

                {simulationEnabled && (
                  <span className="rounded-full bg-[#151711] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#d7c77a]">
                    Modo simulación
                  </span>
                )}
              </div>

              <h1 className="max-w-3xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.075em] md:text-7xl">
                Estadísticas{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">APDES</span>
                  <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#d7c77a]/75 md:h-4" />
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#62675d]">
                Métricas separadas por competencia y categoría. Los filtros
                afectan resumen, goleadoras y fair play.
              </p>
            </div>

            <nav className="flex w-fit rounded-full border border-[#ded9cc] bg-white/75 p-1 shadow-sm">
              <TabButton
                active={activeTab === "resumen"}
                onClick={() => setActiveTab("resumen")}
                label="Resumen"
              />
              <TabButton
                active={activeTab === "goleadoras"}
                onClick={() => setActiveTab("goleadoras")}
                label="Goles"
              />
              <TabButton
                active={activeTab === "fairplay"}
                onClick={() => setActiveTab("fairplay")}
                label="Fair Play"
              />
            </nav>
          </div>

          <section className="rounded-[28px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <FilterGroup title="Competencia">
                {COMPETITIONS.map((competition) => (
                  <FilterButton
                    key={competition}
                    active={competitionFilter === competition}
                    onClick={() => setCompetitionFilter(competition)}
                  >
                    {competition}
                  </FilterButton>
                ))}
              </FilterGroup>

              <FilterGroup title="Categoría">
                {CATEGORIES.map((category) => (
                  <FilterButton
                    key={category}
                    active={categoryFilter === category}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </FilterButton>
                ))}
              </FilterGroup>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
                  Día
                </p>
                <div className="flex items-center gap-1 rounded-full border border-[#ded9cc] bg-[#f6f4ee] p-1">
                  <CalendarDays className="ml-2 h-4 w-4 shrink-0 text-[#74786a]" />
                  <DayButton
                    active={dayFilter === "todos"}
                    label="Todos"
                    onClick={() => setDayFilter("todos")}
                  />
                  <DayButton
                    active={dayFilter === "dia1"}
                    label="Día 1"
                    onClick={() => setDayFilter("dia1")}
                  />
                  <DayButton
                    active={dayFilter === "dia2"}
                    label="Día 2"
                    onClick={() => setDayFilter("dia2")}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-[#f6f4ee] px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
                Mostrando
              </span>
              <span className="rounded-full bg-[#151711] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                {contextLabel}
              </span>
              <span className="rounded-full border border-[#ded9cc] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#62675d]">
                {dayLabel}
              </span>
              <span className="ml-auto text-xs font-black text-[#74786a]">
                {filteredMatches.length} partidos
              </span>
            </div>
          </section>
        </header>

        {simulationEnabled && (
          <section className="mb-6 rounded-[24px] border border-[#ded9cc] bg-[#151711] p-4 text-white shadow-sm">
            <p className="text-sm font-bold leading-6 text-white/75">
              Estás viendo estadísticas simuladas. Sirven para probar cómo
              quedarían las goleadoras, goles por equipo, defensas y fair play
              sin modificar los resultados reales.
            </p>
          </section>
        )}

        {activeTab === "resumen" && (
          <section className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Goles totales"
                value={totalGoals}
                icon={Target}
                detail={contextLabel}
              />
              <MetricCard
                label="Máxima goleadora"
                value={leader?.goals ?? 0}
                icon={Flame}
                detail={leader?.name ?? "Sin datos"}
              />
              <MetricCard
                label="Mejor defensa"
                value={bestDefense?.against ?? 0}
                icon={ShieldCheck}
                detail={bestDefense?.team ?? "Sin datos"}
              />
              <MetricCard
                label="Equipos activos"
                value={teamStats.filter((team) => team.played > 0).length}
                icon={Trophy}
                detail="Con partidos jugados"
              />
            </div>

            <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-6">
                <div className="mb-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Rendimiento · {contextLabel}
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Goles por colegio
                  </h2>
                </div>

                <div className="space-y-4">
                  {teamStats.length === 0 ? (
                    <Empty text="No hay partidos para esta selección." />
                  ) : (
                    teamStats.map((team) => (
                      <TeamBar key={team.team} team={team} max={maxTeamGoals} />
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[30px] bg-[#151711] p-5 text-white shadow-[0_18px_50px_rgba(21,23,17,0.16)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/40">
                      Lectura rápida
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                      Qué mirar
                    </h2>
                  </div>
                  <BarChart3 className="h-6 w-6 text-[#d7c77a]" />
                </div>

                <div className="space-y-3">
                  <Insight
                    text={
                      leader
                        ? `${leader.name} lidera ${contextLabel} con ${leader.goals} goles.`
                        : `Sin goleadoras registradas en ${contextLabel}.`
                    }
                  />
                  <Insight
                    text={
                      bestDefense
                        ? `${bestDefense.team} es la mejor defensa de ${contextLabel}.`
                        : `Sin datos de defensa en ${contextLabel}.`
                    }
                  />
                  <Insight
                    text={
                      simulationEnabled
                        ? "Estas métricas son de prueba y no impactan en la web real."
                        : "Se actualizan automáticamente con los resultados del panel de administración."
                    }
                  />
                </div>
              </div>
            </section>
          </section>
        )}

        {activeTab === "goleadoras" && (
          <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                Ranking · {contextLabel}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                Tabla de goleadoras
              </h2>
            </div>

            <div className="space-y-3">
              {scorers.length === 0 ? (
                <Empty text="No hay goles cargados para esta competencia y categoría." />
              ) : (
                scorers.map((player, index) => (
                  <ScorerRow
                    key={`${player.name}-${player.team}`}
                    player={player}
                    position={index + 1}
                    maxGoals={maxGoals}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "fairplay" && (
          <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                Disciplina · {contextLabel}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                Tarjetas registradas
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {cards.length === 0 ? (
                <Empty text="Sin tarjetas registradas para esta competencia y categoría." />
              ) : (
                cards.map((player) => (
                  <CardStatRow
                    key={`${player.name}-${player.team}`}
                    player={player}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function buildStats(matches: MatchItem[]) {
  const teamMap = new Map<string, TeamStats>();
  const scorersMap = new Map<string, Scorer>();
  const cardsMap = new Map<string, CardStat>();

  let totalGoals = 0;

  for (const match of matches) {
    const schoolA = getSchoolName(match.teamA);
    const schoolB = getSchoolName(match.teamB);

    registerTeam(teamMap, schoolA, 0, 0, false);
    registerTeam(teamMap, schoolB, 0, 0, false);

    const hasFinishedScore =
      match.status === "finalizado" &&
      match.scoreA !== null &&
      match.scoreB !== null;

    if (hasFinishedScore) {
      const scoreA = match.scoreA ?? 0;
      const scoreB = match.scoreB ?? 0;

      totalGoals += scoreA + scoreB;

      registerTeam(teamMap, schoolA, scoreA, scoreB, true);
      registerTeam(teamMap, schoolB, scoreB, scoreA, true);

      if (scoreA > scoreB) {
        teamMap.get(schoolA)!.pts += 3;
      } else if (scoreB > scoreA) {
        teamMap.get(schoolB)!.pts += 3;
      } else {
        teamMap.get(schoolA)!.pts += 1;
        teamMap.get(schoolB)!.pts += 1;
      }
    }

    for (const event of match.events) {
      const rawTeam = event.team === "teamA" ? match.teamA : match.teamB;
      const teamName = getSchoolName(rawTeam);
      const playerName = event.player.trim();
      const key = `${playerName}-${teamName}`;

      if (event.type === "goal" && playerName) {
        const prev = scorersMap.get(key);
        scorersMap.set(key, {
          name: playerName,
          team: teamName,
          goals: prev ? prev.goals + 1 : 1,
        });
      }

      if (
        (event.type === "green_card" || event.type === "yellow_card") &&
        playerName
      ) {
        const prevCard = cardsMap.get(key);
        cardsMap.set(key, {
          name: playerName,
          team: teamName,
          green:
            event.type === "green_card"
              ? (prevCard?.green ?? 0) + 1
              : (prevCard?.green ?? 0),
          yellow:
            event.type === "yellow_card"
              ? (prevCard?.yellow ?? 0) + 1
              : (prevCard?.yellow ?? 0),
        });
      }
    }
  }

  return {
    teamStats: [...teamMap.values()].sort(
      (a, b) =>
        b.pts - a.pts ||
        b.goals - a.goals ||
        a.against - b.against ||
        a.team.localeCompare(b.team),
    ),
    scorers: [...scorersMap.values()].sort(
      (a, b) => b.goals - a.goals || a.name.localeCompare(b.name),
    ),
    cards: [...cardsMap.values()].sort(
      (a, b) =>
        b.green + b.yellow - (a.green + a.yellow) ||
        a.name.localeCompare(b.name),
    ),
    totalGoals,
  };
}

function registerTeam(
  map: Map<string, TeamStats>,
  team: string,
  goals: number,
  against: number,
  played: boolean,
) {
  if (!map.has(team)) {
    map.set(team, {
      team,
      pts: 0,
      played: 0,
      goals: 0,
      against: 0,
    });
  }

  const prev = map.get(team)!;
  prev.goals += goals;
  prev.against += against;
  if (played) prev.played += 1;
}

function getCompetition(category: string): CompetitionFilter | "Otro" {
  const normalized = normalizeText(category);
  if (normalized.includes("colegial")) return "Colegial";
  if (normalized.includes("federado") || normalized.includes("federal")) {
    return "Federado";
  }
  return "Otro";
}

function getBaseCategory(category: string): CategoryFilter | "Otra" {
  const normalized = normalizeText(category);
  if (normalized.includes("categoria 1")) return "Categoría 1";
  if (normalized.includes("categoria 2")) return "Categoría 2";
  if (normalized.includes("categoria 3")) return "Categoría 3";
  return "Otra";
}

function getSchoolName(team: string) {
  const normalized = normalizeText(team);

  if (normalized.includes("candiles") || normalized === "lcd" || normalized.startsWith("lcd ")) {
    return "Los Candiles";
  }
  if (normalized.includes("mirasoles")) return "Mirasoles";
  if (normalized.includes("torreon")) return "Torreón";
  if (normalized.includes("crisol")) return "Crisol";
  if (normalized.includes("buen ayre")) return "Buen Ayre";
  if (normalized.includes("cerros")) return "Los Cerros";
  if (normalized.includes("portezuelo")) return "Portezuelo";

  return team.replace(/\s*\([123][CF]\)\s*$/i, "").trim();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterButton({
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
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.1em] transition ${
        active
          ? "border-[#151711] bg-[#151711] text-white shadow-sm"
          : "border-[#ded9cc] bg-[#fbfaf6] text-[#62675d] hover:border-[#151711]/30"
      }`}
    >
      {children}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2.5 text-xs font-black transition sm:px-4 sm:text-sm ${
        active ? "bg-[#151711] text-white" : "text-[#74786a]"
      }`}
    >
      {label}
    </button>
  );
}

function DayButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${
        active ? "bg-[#151711] text-white" : "text-[#74786a]"
      }`}
    >
      {label}
    </button>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: string | number;
  icon: typeof Target;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-[-0.06em]">{value}</p>
        </div>
        <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[10px] font-bold text-[#74786a]">{detail}</p>
    </article>
  );
}

function TeamBar({ team, max }: { team: TeamStats; max: number }) {
  const width = team.goals === 0 ? 8 : Math.max(8, (team.goals / max) * 100);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="truncate text-xs font-black uppercase">{team.team}</span>
        <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.1em] text-[#74786a]">
          {team.goals} GF
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eee9dd]">
        <div
          className="h-full rounded-full bg-[#151711] transition-[width]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function Insight({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold leading-5 text-white/75">
      {text}
    </div>
  );
}

function ScorerRow({
  player,
  position,
  maxGoals,
}: {
  player: Scorer;
  position: number;
  maxGoals: number;
}) {
  const width = Math.max(8, (player.goals / maxGoals) * 100);

  return (
    <article className="rounded-2xl border border-[#e8e2d5] bg-[#fbfaf6] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#151711] text-xs font-black text-[#d7c77a]">
          {position}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{player.name}</p>
              <p className="truncate text-[10px] font-black uppercase tracking-[0.13em] text-[#74786a]">
                {player.team}
              </p>
            </div>
            <span className="shrink-0 text-xl font-black">{player.goals}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee9dd]">
            <div
              className="h-full rounded-full bg-[#151711]"
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function CardStatRow({ player }: { player: CardStat }) {
  return (
    <article className="rounded-2xl border border-[#e8e2d5] bg-[#fbfaf6] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{player.name}</p>
          <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.13em] text-[#74786a]">
            {player.team}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
            <Square className="h-3 w-3 fill-emerald-600 text-emerald-600" />
            {player.green}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
            <Square className="h-3 w-3 fill-amber-400 text-amber-400" />
            {player.yellow}
          </span>
        </div>
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-6 text-center text-sm font-bold text-[#74786a]">
      {text}
    </div>
  );
}
