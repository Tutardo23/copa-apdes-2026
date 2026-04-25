"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Flame,
  Medal,
  ShieldCheck,
  Square,
  Target,
  Trophy,
} from "lucide-react";

type Tab = "resumen" | "goleadoras" | "fairplay";

const scorers = [
  { id: 1, name: "Martina López", team: "Mirasoles Col.", goals: 14, category: "C1C" },
  { id: 2, name: "Lucía Díaz", team: "Crisol Fed.", goals: 11, category: "C1C" },
  { id: 3, name: "Ana Gómez", team: "Torreón Col.", goals: 9, category: "C1C" },
  { id: 4, name: "Sofía Pérez", team: "El Faro", goals: 6, category: "C2C" },
  { id: 5, name: "Valentina Ruiz", team: "Los Cerros Col.", goals: 5, category: "C1C" },
];

const teams = [
  { id: 1, team: "Mirasoles Col.", goals: 23, against: 4, pts: 24, trend: "Alta" },
  { id: 2, team: "Torreón Col.", goals: 18, against: 5, pts: 21, trend: "Alta" },
  { id: 3, team: "Los Cerros Col.", goals: 15, against: 8, pts: 18, trend: "Media" },
  { id: 4, team: "El Faro", goals: 13, against: 9, pts: 17, trend: "Media" },
];

const cards = [
  { id: 1, name: "Sofía Pérez", team: "El Faro", green: 3, yellow: 1 },
  { id: 2, name: "Julieta Sosa", team: "Mirasoles Col.", green: 2, yellow: 0 },
  { id: 3, name: "Ana Gómez", team: "Torreón Col.", green: 1, yellow: 1 },
  { id: 4, name: "Lucía Díaz", team: "Crisol Fed.", green: 1, yellow: 0 },
];

export default function EstadisticasPage() {
  const [activeTab, setActiveTab] = useState<Tab>("resumen");

  const totalGoals = useMemo(
    () => teams.reduce((acc, team) => acc + team.goals, 0),
    []
  );

  const leader = scorers[0];
  const bestDefense = [...teams].sort((a, b) => a.against - b.against)[0];
  const maxGoals = Math.max(...scorers.map((player) => player.goals));

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
                Rendimiento, goleadoras, tarjetas y datos clave del torneo.
              </p>
            </div>

            <nav className="flex rounded-full border border-[#ded9cc] bg-white/75 p-1 shadow-sm">
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
        </header>

        {activeTab === "resumen" && (
          <section className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Goles totales"
                value={totalGoals}
                icon={Target}
                detail="En partidos registrados"
              />
              <MetricCard
                label="Máxima goleadora"
                value={leader.goals}
                icon={Flame}
                detail={leader.name}
              />
              <MetricCard
                label="Mejor defensa"
                value={bestDefense.against}
                icon={ShieldCheck}
                detail={bestDefense.team}
              />
              <MetricCard
                label="Equipos activos"
                value={teams.length}
                icon={Trophy}
                detail="Con estadísticas cargadas"
              />
            </div>

            <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-6">
                <div className="mb-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Rendimiento
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Goles por equipo
                  </h2>
                </div>

                <div className="space-y-4">
                  {teams.map((team) => (
                    <TeamBar key={team.id} team={team} max={23} />
                  ))}
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
                  <Insight text="Mirasoles Col. lidera en puntos y también en goles convertidos." />
                  <Insight text="Torreón Col. mantiene una diferencia alta con pocos goles recibidos." />
                  <Insight text="El Faro y Los Cerros están cerca en rendimiento general." />
                </div>
              </div>
            </section>
          </section>
        )}

        {activeTab === "goleadoras" && (
          <section className="space-y-6">
            <Podium players={scorers.slice(0, 3)} />

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-6">
              <div className="mb-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Ranking
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                  Tabla de goleadoras
                </h2>
              </div>

              <div className="space-y-3">
                {scorers.map((player, index) => (
                  <ScorerRow
                    key={player.id}
                    player={player}
                    position={index + 1}
                    maxGoals={maxGoals}
                  />
                ))}
              </div>
            </section>
          </section>
        )}

        {activeTab === "fairplay" && (
          <section className="space-y-6">
            <div className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-6">
              <div className="mb-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Disciplina
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                  Tarjetas registradas
                </h2>
                <p className="mt-2 text-sm font-medium text-[#62675d]">
                  Seguimiento simple de tarjetas verdes y amarillas.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {cards.map((player) => (
                  <CardStat key={player.id} player={player} />
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-[#151711] p-5 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
                Fair Play
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                Mejor lectura
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-white/55">
                Conviene mirar no solo la cantidad de tarjetas, sino también si se
                concentran en un mismo equipo o en una misma categoría.
              </p>
            </div>
          </section>
        )}
      </section>
    </main>
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
      onClick={onClick}
      className={`rounded-full px-3 py-2.5 text-xs font-black transition sm:px-4 sm:text-sm ${
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
    <article className="rounded-[26px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <Icon className="h-5 w-5 text-[#74786a]" />
        <span className="h-2 w-2 rounded-full bg-[#d7c77a]" />
      </div>

      <p className="text-3xl font-black tracking-[-0.07em]">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
        {label}
      </p>
      <p className="mt-2 truncate text-xs font-bold text-[#62675d]">
        {detail}
      </p>
    </article>
  );
}

function TeamBar({
  team,
  max,
}: {
  team: { team: string; goals: number; against: number; pts: number; trend: string };
  max: number;
}) {
  const width = `${Math.max(8, (team.goals / max) * 100)}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{team.team}</p>
          <p className="text-xs font-bold text-[#74786a]">
            {team.pts} pts · {team.against} goles recibidos
          </p>
        </div>
        <p className="shrink-0 text-lg font-black">{team.goals}</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-[#eee9dd]">
        <div className="h-full rounded-full bg-[#151711]" style={{ width }} />
      </div>
    </div>
  );
}

function Insight({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-sm font-medium leading-6 text-white/70">{text}</p>
    </div>
  );
}

function Podium({
  players,
}: {
  players: {
    id: number;
    name: string;
    team: string;
    goals: number;
    category: string;
  }[];
}) {
  const ordered = [players[1], players[0], players[2]];

  return (
    <section className="rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_18px_50px_rgba(21,23,17,0.16)] md:p-7">
      <div className="mb-7">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
          Podio
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
          Goleadoras destacadas
        </h2>
      </div>

      <div className="grid grid-cols-3 items-end gap-2 md:gap-5">
        {ordered.map((player, index) => {
          const realPosition = player.id === players[0].id ? 1 : player.id === players[1].id ? 2 : 3;
          const isFirst = realPosition === 1;

          return (
            <div key={player.id} className="text-center">
              {isFirst && (
                <Trophy className="mx-auto mb-2 h-7 w-7 text-[#d7c77a]" />
              )}

              <div
                className={`mx-auto flex items-center justify-center rounded-full border font-black ${
                  isFirst
                    ? "h-16 w-16 border-[#d7c77a] bg-white text-[#151711]"
                    : "h-12 w-12 border-white/15 bg-white/10 text-white"
                }`}
              >
                {getInitials(player.name)}
              </div>

              <div
                className={`mt-3 rounded-t-3xl border border-b-0 border-white/10 bg-white/[0.06] p-3 ${
                  isFirst ? "h-32" : realPosition === 2 ? "h-24" : "h-20"
                } flex flex-col justify-end`}
              >
                <p className="text-3xl font-black tracking-[-0.07em]">
                  {player.goals}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                  goles
                </p>
              </div>

              <p className="mt-3 truncate text-xs font-black">{player.name}</p>
              <p className="truncate text-[10px] font-bold text-white/45">
                {realPosition}° · {player.team}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ScorerRow({
  player,
  position,
  maxGoals,
}: {
  player: {
    id: number;
    name: string;
    team: string;
    goals: number;
    category: string;
  };
  position: number;
  maxGoals: number;
}) {
  const width = `${Math.max(10, (player.goals / maxGoals) * 100)}%`;

  return (
    <article className="rounded-2xl border border-[#eee9dd] bg-[#fbfaf6] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
              position <= 3 ? "bg-[#151711] text-[#d7c77a]" : "bg-[#eee9dd] text-[#74786a]"
            }`}
          >
            {position}
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-black">{player.name}</p>
            <p className="truncate text-xs font-bold text-[#74786a]">
              {player.team} · {player.category}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xl font-black">{player.goals}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#74786a]">
            goles
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee9dd]">
        <div className="h-full rounded-full bg-[#151711]" style={{ width }} />
      </div>
    </article>
  );
}

function CardStat({
  player,
}: {
  player: { id: number; name: string; team: string; green: number; yellow: number };
}) {
  return (
    <article className="rounded-[24px] border border-[#eee9dd] bg-[#fbfaf6] p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0ede3] text-xs font-black text-[#74786a]">
          {getInitials(player.name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-black">{player.name}</p>
          <p className="truncate text-xs font-bold text-[#74786a]">
            {player.team}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-3">
          <div className="mb-2 flex items-center gap-2">
            <Square className="h-4 w-4 fill-emerald-600 text-emerald-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
              Verde
            </p>
          </div>
          <p className="text-2xl font-black">{player.green}</p>
        </div>

        <div className="rounded-2xl bg-white p-3">
          <div className="mb-2 flex items-center gap-2">
            <Square className="h-4 w-4 fill-[#d7c77a] text-[#d7c77a]" />
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
              Amarilla
            </p>
          </div>
          <p className="text-2xl font-black">{player.yellow}</p>
        </div>
      </div>
    </article>
  );
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