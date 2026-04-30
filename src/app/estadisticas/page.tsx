"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, Flame, ShieldCheck, Square, Target, Trophy } from "lucide-react";
import { DayKey, MatchItem, useTournament } from "@/src/components/providers/TournamentProvider";

type Tab = "resumen" | "goleadoras" | "fairplay";
type DayFilter = "todos" | DayKey;

type TeamStats = {
  team: string;
  pts: number;
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

export default function EstadisticasPage() {
  const { matches } = useTournament();
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [dayFilter, setDayFilter] = useState<DayFilter>("todos");

  const filteredMatches = useMemo(
    () => matches.filter((match) => dayFilter === "todos" || match.day === dayFilter),
    [dayFilter, matches]
  );

  const { teamStats, scorers, cards, totalGoals } = useMemo(
    () => buildStats(filteredMatches),
    [filteredMatches]
  );

  const leader = scorers[0];
  const bestDefense = [...teamStats].sort((a, b) => a.against - b.against)[0];
  const maxGoals = Math.max(1, ...scorers.map((player) => player.goals));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-7">
          <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="max-w-3xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.075em] md:text-7xl">
                Estadísticas{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">APDES</span>
                  <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#d7c77a]/75 md:h-4" />
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#62675d]">
                Datos en vivo por día: se recalcula automáticamente según lo cargado en planilla.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <nav className="flex rounded-full border border-[#ded9cc] bg-white/75 p-1 shadow-sm">
                <TabButton active={activeTab === "resumen"} onClick={() => setActiveTab("resumen")} label="Resumen" />
                <TabButton active={activeTab === "goleadoras"} onClick={() => setActiveTab("goleadoras")} label="Goles" />
                <TabButton active={activeTab === "fairplay"} onClick={() => setActiveTab("fairplay")} label="Fair Play" />
              </nav>

              <div className="flex items-center gap-2 rounded-full border border-[#ded9cc] bg-white/75 p-1 shadow-sm">
                <CalendarDays className="ml-2 h-4 w-4 text-[#74786a]" />
                <DayButton active={dayFilter === "todos"} label="Todos" onClick={() => setDayFilter("todos")} />
                <DayButton active={dayFilter === "jueves"} label="Jue" onClick={() => setDayFilter("jueves")} />
                <DayButton active={dayFilter === "viernes"} label="Vie" onClick={() => setDayFilter("viernes")} />
                <DayButton active={dayFilter === "sabado"} label="Sáb" onClick={() => setDayFilter("sabado")} />
              </div>
            </div>
          </div>
        </header>

        {activeTab === "resumen" && (
          <section className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Goles totales" value={totalGoals} icon={Target} detail="En el filtro seleccionado" />
              <MetricCard label="Máxima goleadora" value={leader?.goals ?? 0} icon={Flame} detail={leader?.name ?? "Sin datos"} />
              <MetricCard label="Mejor defensa" value={bestDefense?.against ?? 0} icon={ShieldCheck} detail={bestDefense?.team ?? "Sin datos"} />
              <MetricCard label="Equipos activos" value={teamStats.length} icon={Trophy} detail="Con partidos cargados" />
            </div>

            <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-6">
                <div className="mb-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Rendimiento</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Goles por equipo</h2>
                </div>

                <div className="space-y-4">
                  {teamStats.length === 0 ? (
                    <Empty text="Todavía no hay partidos para este día." />
                  ) : (
                    teamStats.map((team) => <TeamBar key={team.team} team={team} max={Math.max(1, ...teamStats.map((t) => t.goals))} />)
                  )}
                </div>
              </div>

              <div className="rounded-[30px] bg-[#151711] p-5 text-white shadow-[0_18px_50px_rgba(21,23,17,0.16)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/40">Lectura rápida</p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Qué mirar</h2>
                  </div>
                  <BarChart3 className="h-6 w-6 text-[#d7c77a]" />
                </div>

                <div className="space-y-3">
                  <Insight text={leader ? `${leader.name} lidera con ${leader.goals} goles.` : "Sin goleadoras registradas aún."} />
                  <Insight text={bestDefense ? `${bestDefense.team} es la mejor defensa del filtro.` : "Sin datos de defensa todavía."} />
                  <Insight text="Estas métricas se actualizan a medida que cargás eventos en Planilla." />
                </div>
              </div>
            </section>
          </section>
        )}

        {activeTab === "goleadoras" && (
          <section className="space-y-6">
            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-6">
              <div className="mb-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Ranking</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Tabla de goleadoras</h2>
              </div>

              <div className="space-y-3">
                {scorers.length === 0 ? (
                  <Empty text="No hay goles cargados para este filtro." />
                ) : (
                  scorers.map((player, index) => (
                    <ScorerRow key={`${player.name}-${player.team}`} player={player} position={index + 1} maxGoals={maxGoals} />
                  ))
                )}
              </div>
            </section>
          </section>
        )}

        {activeTab === "fairplay" && (
          <section className="space-y-6">
            <div className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-6">
              <div className="mb-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Disciplina</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Tarjetas registradas</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {cards.length === 0 ? (
                  <Empty text="Sin tarjetas registradas para este filtro." />
                ) : (
                  cards.map((player) => <CardStatRow key={`${player.name}-${player.team}`} player={player} />)
                )}
              </div>
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
    registerTeam(teamMap, match.teamA, match.scoreA, match.scoreB);
    registerTeam(teamMap, match.teamB, match.scoreB, match.scoreA);

    if (match.scoreA > match.scoreB) {
      teamMap.get(match.teamA)!.pts += 3;
    } else if (match.scoreB > match.scoreA) {
      teamMap.get(match.teamB)!.pts += 3;
    } else if (match.scoreA === match.scoreB && (match.scoreA > 0 || match.status !== "por_jugar")) {
      teamMap.get(match.teamA)!.pts += 1;
      teamMap.get(match.teamB)!.pts += 1;
    }

    for (const event of match.events) {
      const teamName = event.team === "teamA" ? match.teamA : match.teamB;
      const key = `${event.player}-${teamName}`;

      if (event.type === "goal") {
        totalGoals += 1;
        const prev = scorersMap.get(key);
        scorersMap.set(key, {
          name: event.player,
          team: teamName,
          goals: prev ? prev.goals + 1 : 1,
        });
      }

      if (event.type === "green_card" || event.type === "yellow_card") {
        const prevCard = cardsMap.get(key);
        cardsMap.set(key, {
          name: event.player,
          team: teamName,
          green: event.type === "green_card" ? (prevCard?.green ?? 0) + 1 : (prevCard?.green ?? 0),
          yellow: event.type === "yellow_card" ? (prevCard?.yellow ?? 0) + 1 : (prevCard?.yellow ?? 0),
        });
      }
    }
  }

  return {
    teamStats: [...teamMap.values()].sort((a, b) => b.pts - a.pts || b.goals - a.goals),
    scorers: [...scorersMap.values()].sort((a, b) => b.goals - a.goals),
    cards: [...cardsMap.values()].sort((a, b) => b.green + b.yellow - (a.green + a.yellow)),
    totalGoals,
  };
}

function registerTeam(map: Map<string, TeamStats>, team: string, goals: number, against: number) {
  if (!map.has(team)) {
    map.set(team, { team, pts: 0, goals: 0, against: 0 });
  }

  const prev = map.get(team)!;
  prev.goals += goals;
  prev.against += against;
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-2.5 text-xs font-black transition sm:px-4 sm:text-sm ${
        active ? "bg-[#151711] text-white" : "text-[#74786a]"
      }`}
    >
      {label}
    </button>
  );
}

function DayButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${
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
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Trophy;
}) {
  return (
    <article className="rounded-[24px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.06em]">{value}</p>
          <p className="mt-2 text-xs font-bold text-[#62675d]">{detail}</p>
        </div>
        <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function TeamBar({ team, max }: { team: TeamStats; max: number }) {
  return (
    <article className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm font-black">
        <p className="truncate">{team.team}</p>
        <span className="text-[#74786a]">{team.goals} GF</span>
      </div>

      <div className="h-3 rounded-full bg-[#eee8d8]">
        <div className="h-full rounded-full bg-[#151711]" style={{ width: `${Math.max(10, (team.goals / max) * 100)}%` }} />
      </div>
    </article>
  );
}

function ScorerRow({ player, position, maxGoals }: { player: Scorer; position: number; maxGoals: number }) {
  return (
    <article className="rounded-2xl border border-[#ede7d8] bg-[#fbfaf6] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#151711]">#{position} · {player.name}</p>
          <p className="mt-1 truncate text-[11px] font-black uppercase tracking-[0.15em] text-[#74786a]">{player.team}</p>
        </div>
        <span className="rounded-full bg-[#151711] px-3 py-1 text-xs font-black text-[#d7c77a]">{player.goals} goles</span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-[#ede7d8]">
        <div className="h-full rounded-full bg-[#151711]" style={{ width: `${Math.max(8, (player.goals / maxGoals) * 100)}%` }} />
      </div>
    </article>
  );
}

function CardStatRow({ player }: { player: CardStat }) {
  return (
    <article className="rounded-2xl border border-[#ede7d8] bg-[#fbfaf6] p-4">
      <p className="text-sm font-black text-[#151711]">{player.name}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#74786a]">{player.team}</p>
      <div className="mt-3 flex items-center gap-2 text-xs font-black">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
          <Square className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" /> {player.green}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f5edc9] px-2 py-1 text-[#6f6125]">
          <Square className="h-3.5 w-3.5 fill-[#d7c77a] text-[#d7c77a]" /> {player.yellow}
        </span>
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-5 text-sm font-bold text-[#74786a]">{text}</p>;
}

function Insight({ text }: { text: string }) {
  return <p className="rounded-2xl bg-white/10 p-3 text-sm font-semibold text-white/75">{text}</p>;
}
