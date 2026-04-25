"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  LayoutGrid,
  MapPin,
  Square,
  Target,
  Trophy,
  X,
} from "lucide-react";

type MatchStatus = "finalizado" | "en_curso" | "por_jugar";
type EventType = "goal" | "green_card" | "yellow_card";
type TabType = "fixture" | "tabla" | "llaves";
type DayId = "todos" | "jueves" | "viernes" | "sabado";

type MatchEvent = {
  id: number;
  minute: number;
  type: EventType;
  player: string;
  team: "teamA" | "teamB";
};

type Match = {
  id: number;
  day: Exclude<DayId, "todos">;
  date: string;
  time: string;
  category: string;
  court: string;
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  featured?: boolean;
  events: MatchEvent[];
};

type BracketMatchType = {
  id: number;
  round: string;
  teamA: string;
  scoreA: number | null;
  teamB: string;
  scoreB: number | null;
  penalties?: string;
  court?: string;
  time?: string;
  category?: string;
  events?: MatchEvent[];
};

const matches: Match[] = [
  {
    id: 1,
    day: "jueves",
    date: "23 Abr",
    time: "8:30",
    category: "C1C",
    court: "Cancha 1",
    teamA: "Mirasoles Col.",
    teamB: "Crisol Col.",
    scoreA: 1,
    scoreB: 0,
    status: "finalizado",
    featured: true,
    events: [
      { id: 1, minute: 14, type: "goal", player: "Martina López", team: "teamA" },
      { id: 2, minute: 32, type: "green_card", player: "Sofía Pérez", team: "teamB" },
    ],
  },
  {
    id: 2,
    day: "jueves",
    date: "23 Abr",
    time: "9:00",
    category: "C3C",
    court: "Cancha 2",
    teamA: "Mirasoles Fed.",
    teamB: "Crisol Fed.",
    scoreA: 3,
    scoreB: 2,
    status: "finalizado",
    featured: true,
    events: [
      { id: 3, minute: 8, type: "goal", player: "Laura Viale", team: "teamA" },
      { id: 4, minute: 22, type: "goal", player: "Camila Ruiz", team: "teamB" },
    ],
  },
  {
    id: 3,
    day: "viernes",
    date: "24 Abr",
    time: "10:00",
    category: "C1C",
    court: "Cancha 1",
    teamA: "Torreón Col.",
    teamB: "Los Cerros Col.",
    scoreA: 1,
    scoreB: 1,
    status: "en_curso",
    featured: true,
    events: [
      { id: 5, minute: 5, type: "goal", player: "Ana Gómez", team: "teamA" },
      { id: 6, minute: 18, type: "goal", player: "Lucía Díaz", team: "teamB" },
    ],
  },
  {
    id: 4,
    day: "viernes",
    date: "24 Abr",
    time: "11:00",
    category: "C2C",
    court: "Cancha 3",
    teamA: "Mirasoles Col.",
    teamB: "Buen Ayre Col.",
    scoreA: null,
    scoreB: null,
    status: "por_jugar",
    featured: true,
    events: [],
  },
  {
    id: 5,
    day: "sabado",
    date: "25 Abr",
    time: "12:30",
    category: "C3C",
    court: "Cancha 1",
    teamA: "El Faro",
    teamB: "Torreón Fed.",
    scoreA: null,
    scoreB: null,
    status: "por_jugar",
    events: [],
  },
  {
    id: 6,
    day: "sabado",
    date: "25 Abr",
    time: "13:30",
    category: "C2C",
    court: "Cancha 2",
    teamA: "Crisol Col.",
    teamB: "Los Cerros Fed.",
    scoreA: null,
    scoreB: null,
    status: "por_jugar",
    events: [],
  },
];

const table = [
  { pos: 1, team: "Mirasoles Col.", pts: 24, j: 8, g: 8, e: 0, p: 0, dif: "+19", qualifies: true },
  { pos: 2, team: "Torreón Col.", pts: 21, j: 8, g: 7, e: 0, p: 1, dif: "+14", qualifies: true },
  { pos: 3, team: "Los Cerros Col.", pts: 18, j: 8, g: 6, e: 0, p: 2, dif: "+12", qualifies: true },
  { pos: 4, team: "El Faro", pts: 17, j: 8, g: 5, e: 2, p: 1, dif: "+10", qualifies: true },
  { pos: 5, team: "Crisol Fed.", pts: 16, j: 8, g: 5, e: 1, p: 2, dif: "+8", qualifies: false },
  { pos: 6, team: "Buen Ayre Col.", pts: 15, j: 8, g: 4, e: 3, p: 1, dif: "+5", qualifies: false },
];

const bracket: {
  cuartos: BracketMatchType[];
  semis: BracketMatchType[];
  final: BracketMatchType[];
} = {
  cuartos: [
    {
      id: 101,
      round: "Cuartos de final",
      teamA: "Mirasoles Col.",
      scoreA: 3,
      teamB: "Torreón Fed.",
      scoreB: 0,
      court: "Cancha 1",
      time: "16:00",
      category: "C1C",
      events: [
        { id: 1011, minute: 12, type: "goal", player: "Martina López", team: "teamA" },
      ],
    },
    {
      id: 102,
      round: "Cuartos de final",
      teamA: "El Faro",
      scoreA: 1,
      teamB: "Crisol Fed.",
      scoreB: 2,
      court: "Cancha 2",
      time: "16:30",
      category: "C1C",
      events: [
        { id: 1021, minute: 20, type: "goal", player: "Camila Ruiz", team: "teamB" },
      ],
    },
    {
      id: 103,
      round: "Cuartos de final",
      teamA: "Torreón Col.",
      scoreA: 2,
      teamB: "Mirasoles Fed.",
      scoreB: 1,
      court: "Cancha 3",
      time: "17:00",
      category: "C1C",
      events: [],
    },
    {
      id: 104,
      round: "Cuartos de final",
      teamA: "Los Cerros Col.",
      scoreA: 0,
      teamB: "Buen Ayre Col.",
      scoreB: 0,
      penalties: "4-5",
      court: "Cancha 1",
      time: "17:30",
      category: "C1C",
      events: [],
    },
  ],
  semis: [
    {
      id: 201,
      round: "Semifinal",
      teamA: "Mirasoles Col.",
      scoreA: 2,
      teamB: "Crisol Fed.",
      scoreB: 1,
      court: "Cancha 1",
      time: "18:30",
      category: "C1C",
      events: [],
    },
    {
      id: 202,
      round: "Semifinal",
      teamA: "Torreón Col.",
      scoreA: null,
      teamB: "Buen Ayre Col.",
      scoreB: null,
      court: "Cancha 2",
      time: "19:00",
      category: "C1C",
      events: [],
    },
  ],
  final: [
    {
      id: 301,
      round: "Final",
      teamA: "Ganador SF1",
      scoreA: null,
      teamB: "Ganador SF2",
      scoreB: null,
      court: "Cancha principal",
      time: "20:00",
      category: "C1C",
      events: [],
    },
  ],
};

const days: { id: DayId; label: string; date: string }[] = [
  { id: "todos", label: "Completo", date: "Todos" },
  { id: "jueves", label: "Jueves", date: "23 Abr" },
  { id: "viernes", label: "Viernes", date: "24 Abr" },
  { id: "sabado", label: "Sábado", date: "25 Abr" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("fixture");
  const [activeDay, setActiveDay] = useState<DayId>("viernes");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const featuredMatch =
    matches.find((match) => match.status === "en_curso") ?? matches[0];

  const featuredMatches = matches.filter((match) => match.featured).slice(0, 3);

  const visibleMatches = useMemo(() => {
    if (activeDay === "todos") return matches;
    return matches.filter((match) => match.day === activeDay);
  }, [activeDay]);

  const groupedMatches = useMemo(() => {
    return days
      .filter((day) => day.id !== "todos")
      .map((day) => ({
        ...day,
        matches: matches.filter((match) => match.day === day.id),
      }));
  }, []);

  const openBracketMatch = (match: BracketMatchType) => {
    setSelectedMatch({
      id: match.id,
      day: "sabado",
      date: match.round,
      time: match.time ?? "-",
      category: match.category ?? "Fase final",
      court: match.court ?? "Cancha principal",
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      status: match.scoreA === null || match.scoreB === null ? "por_jugar" : "finalizado",
      events: match.events ?? [],
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      {selectedMatch && (
        <MatchModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}

      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-7">
          <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
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
                Fixture, posiciones y cruces finales de forma simple y clara.
              </p>
            </div>

            <nav className="flex rounded-full border border-[#ded9cc] bg-white/75 p-1 shadow-sm">
              <TabButton active={activeTab === "fixture"} onClick={() => setActiveTab("fixture")} icon={CalendarDays} label="Fixture" />
              <TabButton active={activeTab === "tabla"} onClick={() => setActiveTab("tabla")} icon={Trophy} label="Tabla" />
              <TabButton active={activeTab === "llaves"} onClick={() => setActiveTab("llaves")} icon={LayoutGrid} label="Llaves" />
            </nav>
          </div>
        </header>

        {activeTab === "fixture" && (
          <section className="space-y-7">
            <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <FeaturedMatch match={featuredMatch} onClick={() => setSelectedMatch(featuredMatch)} />

              <section className="rounded-[28px] border border-[#ded9cc] bg-white/75 p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Partidos a seguir
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                  Claves del día
                </h2>

                <div className="mt-4 space-y-3">
                  {featuredMatches.map((match) => (
                    <FollowMatchCard
                      key={match.id}
                      match={match}
                      onClick={() => setSelectedMatch(match)}
                    />
                  ))}
                </div>
              </section>
            </section>

            <section>
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Fixture
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                  Partidos
                </h2>
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setActiveDay(day.id)}
                    className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
                      activeDay === day.id
                        ? "border-[#151711] bg-[#151711] text-white"
                        : "border-[#ded9cc] bg-white/75 text-[#62675d]"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                      {day.label}
                    </p>
                    <p className="mt-1 text-sm font-black">{day.date}</p>
                  </button>
                ))}
              </div>

              {activeDay === "todos" ? (
                <div className="space-y-5">
                  {groupedMatches.map((group) => (
                    <section key={group.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#151711]">
                          {group.label}
                        </h3>
                        <p className="text-xs font-bold text-[#74786a]">
                          {group.date}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {group.matches.map((match) => (
                          <CompactMatchRow
                            key={match.id}
                            match={match}
                            onClick={() => setSelectedMatch(match)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleMatches.map((match) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      onClick={() => setSelectedMatch(match)}
                    />
                  ))}
                </div>
              )}
            </section>
          </section>
        )}

        {activeTab === "tabla" && <TableSection />}

        {activeTab === "llaves" && (
          <BracketSection onOpenMatch={openBracketMatch} />
        )}
      </section>
    </main>
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
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border ${
        dark ? "border-white/15 bg-white" : "border-[#ded9cc] bg-white"
      } ${sizeClass}`}
    >
      {shield ? (
        <Image
          src={shield}
          alt={`Escudo de ${name}`}
          width={80}
          height={80}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span className="text-xs font-black text-[#151711]">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function getSchoolShield(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("mirasoles")) return "/escudos/mirasoles.png";
  if (normalized.includes("torreón") || normalized.includes("torreon")) return "/escudos/torreon.png";
  if (normalized.includes("crisol")) return "/escudos/crisol.png";
  if (normalized.includes("cerros")) return "/escudos/los-cerros.png";
  if (normalized.includes("buen ayre")) return "/escudos/buen-ayre.png";
  if (normalized.includes("faro")) return "/escudos/el-faro.png";

  return null;
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
      className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-black transition sm:px-4 sm:text-sm md:flex-none ${
        active ? "bg-[#151711] text-white" : "text-[#74786a]"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-[#d7c77a]" : ""}`} />
      <span>{label}</span>
    </button>
  );
}

function FeaturedMatch({ match, onClick }: { match: Match; onClick: () => void }) {
  const draw = isDraw(match);

  return (
    <button
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-[34px] bg-[#151711] p-5 text-left text-white shadow-[0_18px_50px_rgba(21,23,17,0.18)] md:p-7"
    >
      <HorizontalFieldBackground />

      <div className="relative z-10 mb-7 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
            {statusLabel(match.status)}
          </span>
          {draw && (
            <span className="rounded-full bg-[#d7c77a]/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#e8db98]">
              Empate
            </span>
          )}
        </div>

        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-white/50">
          <MapPin className="h-4 w-4" />
          {match.court}
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <HeroTeam name={match.teamA} winner={isWinner(match, "A")} draw={draw} />
        <ScoreBlock match={match} />
        <HeroTeam name={match.teamB} winner={isWinner(match, "B")} draw={draw} />
      </div>
    </button>
  );
}

function HorizontalFieldBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.16]">
      <div className="absolute inset-4 rounded-[28px] border border-white" />
      <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px bg-white" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
      <div className="absolute left-4 top-1/2 h-28 w-16 -translate-y-1/2 rounded-r-full border border-l-0 border-white" />
      <div className="absolute right-4 top-1/2 h-28 w-16 -translate-y-1/2 rounded-l-full border border-r-0 border-white" />
    </div>
  );
}

function HeroTeam({
  name,
  winner,
  draw,
}: {
  name: string;
  winner: boolean;
  draw: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div
        className={`rounded-full ${
          winner
            ? "ring-2 ring-emerald-400/70"
            : draw
              ? "ring-2 ring-[#d7c77a]/70"
              : ""
        }`}
      >
        <TeamShield name={name} size="lg" dark />
      </div>

      <p className="w-full max-w-[96px] truncate text-xs font-black leading-tight text-white md:max-w-[130px] md:text-sm">
        {name}
      </p>
    </div>
  );
}

function ScoreBlock({ match }: { match: Match }) {
  if (match.status === "por_jugar") {
    return (
      <div className="px-1 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
          Inicio
        </p>
        <p className="mt-1 text-4xl font-black tracking-[-0.07em] md:text-5xl">
          {match.time}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-center md:gap-3">
      <span className="text-4xl font-black tracking-[-0.08em] md:text-6xl">
        {match.scoreA}
      </span>
      <span className="text-2xl font-black text-[#d7c77a]">:</span>
      <span className="text-4xl font-black tracking-[-0.08em] md:text-6xl">
        {match.scoreB}
      </span>
    </div>
  );
}

function FollowMatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const draw = isDraw(match);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl bg-[#f6f4ee] p-3 text-left"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-black">{match.time}</p>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
          {statusLabel(match.status)}
        </span>
      </div>

      <div className="space-y-1.5">
        <MiniResultLine
          name={match.teamA}
          score={match.scoreA}
          winner={isWinner(match, "A")}
          draw={draw}
        />
        <MiniResultLine
          name={match.teamB}
          score={match.scoreB}
          winner={isWinner(match, "B")}
          draw={draw}
        />
      </div>

      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
        {match.date} · {match.category} · {match.court}
      </p>
    </button>
  );
}

function MiniResultLine({
  name,
  score,
  winner,
  draw,
}: {
  name: string;
  score: number | null;
  winner: boolean;
  draw: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 ${
        winner ? "bg-emerald-50" : draw ? "bg-[#f5edc9]" : "bg-white"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <TeamShield name={name} size="sm" />
        <p
          className={`truncate text-sm ${
            winner || draw ? "font-black text-[#151711]" : "font-bold text-[#62675d]"
          }`}
        >
          {name}
        </p>
      </div>
      <span className="shrink-0 text-sm font-black">{score ?? "-"}</span>
    </div>
  );
}

function MatchRow({ match, onClick }: { match: Match; onClick: () => void }) {
  const draw = isDraw(match);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-[24px] border border-[#ded9cc] bg-white/80 p-4 text-left shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black">{match.time}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
            {match.date} · {match.category}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#f6f4ee] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
          {match.court}
        </span>
      </div>

      <div className="space-y-2">
        <TeamLine
          name={match.teamA}
          score={match.scoreA}
          winner={isWinner(match, "A")}
          draw={draw}
        />
        <TeamLine
          name={match.teamB}
          score={match.scoreB}
          winner={isWinner(match, "B")}
          draw={draw}
        />
      </div>
    </button>
  );
}

function CompactMatchRow({ match, onClick }: { match: Match; onClick: () => void }) {
  const draw = isDraw(match);

  return (
    <button
      onClick={onClick}
      className="grid w-full grid-cols-[54px_1fr_auto] items-center gap-3 rounded-2xl border border-[#ded9cc] bg-white/80 px-3 py-3 text-left"
    >
      <div>
        <p className="text-sm font-black">{match.time}</p>
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#74786a]">
          {match.category}
        </p>
      </div>

      <div className="min-w-0 space-y-1">
        <CompactTeamLine
          name={match.teamA}
          winner={isWinner(match, "A")}
          draw={draw}
        />
        <CompactTeamLine
          name={match.teamB}
          winner={isWinner(match, "B")}
          draw={draw}
        />
      </div>

      <div className="text-right">
        {match.scoreA === null || match.scoreB === null ? (
          <p className="text-sm font-black text-[#74786a]">-</p>
        ) : (
          <p className="text-sm font-black">
            {match.scoreA}:{match.scoreB}
          </p>
        )}
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#74786a]">
          {match.court}
        </p>
      </div>
    </button>
  );
}

function CompactTeamLine({
  name,
  winner,
  draw,
}: {
  name: string;
  winner: boolean;
  draw: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-lg px-2 py-0.5 ${
        winner
          ? "bg-emerald-50"
          : draw
            ? "bg-[#f5edc9]"
            : ""
      }`}
    >
      <TeamShield name={name} size="sm" />
      <p
        className={`truncate text-sm ${
          winner || draw ? "font-black text-[#151711]" : "font-bold text-[#62675d]"
        }`}
      >
        {name}
      </p>
    </div>
  );
}

function TeamLine({
  name,
  score,
  winner,
  draw,
}: {
  name: string;
  score: number | null;
  winner: boolean;
  draw: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl border px-3 py-2 ${
        winner
          ? "border-emerald-700/25 bg-white"
          : draw
            ? "border-[#d7c77a]/45 bg-white"
            : "border-transparent"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`h-8 w-1.5 shrink-0 rounded-full ${
            winner ? "bg-emerald-700" : draw ? "bg-[#d7c77a]" : "bg-[#ded9cc]"
          }`}
        />

        <TeamShield name={name} size="sm" />

        <span className="min-w-0 truncate text-sm font-black text-[#151711]">
          {name}
        </span>
      </div>

      <span className="shrink-0 text-xl font-black tracking-[-0.05em]">
        {score ?? "-"}
      </span>
    </div>
  );
}

function TableSection() {
  return (
    <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-8">
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
          Clasificación
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
          Tabla general
        </h2>

        <div className="mt-3 flex items-center gap-2 rounded-full bg-[#f6f4ee] px-3 py-2 text-xs font-bold text-[#74786a] md:inline-flex">
          <span className="h-3 w-3 rounded-full bg-emerald-700" />
          Verde: clasifica a fase final
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {table.map((row) => (
          <div
            key={row.team}
            className={`overflow-hidden rounded-[24px] border bg-[#fbfaf6] ${
              row.qualifies ? "border-emerald-700/30" : "border-[#eee9dd]"
            }`}
          >
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    row.qualifies
                      ? "bg-emerald-700 text-white"
                      : "bg-[#eee9dd] text-[#74786a]"
                  }`}
                >
                  {row.pos}
                </span>

                <TeamShield name={row.team} size="sm" />

                <div className="min-w-0">
                  <p className="truncate text-base font-black text-[#151711]">
                    {row.team}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-[#74786a]">
                    {row.qualifies ? "Clasifica a fase final" : "Fuera de clasificación"}
                  </p>
                </div>
              </div>

              <div className="shrink-0 rounded-2xl bg-white px-4 py-2 text-center">
                <p className="text-2xl font-black leading-none">{row.pts}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#74786a]">
                  pts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 border-t border-[#eee9dd] bg-white/55 text-center">
              <TableMiniStat label="J" value={row.j} />
              <TableMiniStat label="G" value={row.g} />
              <TableMiniStat label="E" value={row.e} />
              <TableMiniStat label="P" value={row.p} />
              <TableMiniStat label="DIF" value={row.dif} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[24px] border border-[#e6e0d3] bg-[#fbfaf6] md:block">
        <div className="grid grid-cols-[72px_1fr_80px_64px_64px_64px_64px_80px] border-b border-[#e6e0d3] px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#74786a]">
          <div>#</div>
          <div>Equipo</div>
          <div className="text-center">PTS</div>
          <div className="text-center">J</div>
          <div className="text-center">G</div>
          <div className="text-center">E</div>
          <div className="text-center">P</div>
          <div className="text-center">DIF</div>
        </div>

        {table.map((row) => (
          <div
            key={row.team}
            className="grid grid-cols-[72px_1fr_80px_64px_64px_64px_64px_80px] items-center border-b border-[#eee9dd] px-5 py-4 last:border-b-0"
          >
            <div className="text-sm font-black text-[#74786a]">{row.pos}</div>
            <div className="flex min-w-0 items-center gap-4">
              <span
                className={`h-10 w-1.5 shrink-0 rounded-full ${
                  row.qualifies ? "bg-emerald-700" : "bg-[#ded9cc]"
                }`}
              />
              <TeamShield name={row.team} size="sm" />
              <p className="truncate text-sm font-black">{row.team}</p>
            </div>
            <div className="text-center text-lg font-black">{row.pts}</div>
            <div className="text-center text-sm font-bold text-[#74786a]">{row.j}</div>
            <div className="text-center text-sm font-bold text-[#74786a]">{row.g}</div>
            <div className="text-center text-sm font-bold text-[#74786a]">{row.e}</div>
            <div className="text-center text-sm font-bold text-[#74786a]">{row.p}</div>
            <div className="text-center text-sm font-black">{row.dif}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TableMiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-2 py-3">
      <p className="text-sm font-black">{value}</p>
      <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#74786a]">
        {label}
      </p>
    </div>
  );
}

function BracketSection({
  onOpenMatch,
}: {
  onOpenMatch: (match: BracketMatchType) => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#151711] p-5 text-white md:p-8">
      <HorizontalFieldBackground />

      <div className="relative z-10 mb-7">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
          Fase final
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
          Camino a la final
        </h2>
        <p className="mt-2 text-sm font-medium text-white/45">
          Tocá cualquier cruce para ver el detalle del partido.
        </p>
      </div>

      <div className="relative z-10 overflow-x-auto pb-2">
        <div className="grid min-w-[820px] grid-cols-3 gap-5">
          <BracketColumn title="Cuartos" matches={bracket.cuartos} onOpenMatch={onOpenMatch} />
          <BracketColumn title="Semis" matches={bracket.semis} compact onOpenMatch={onOpenMatch} />
          <BracketColumn title="Final" matches={bracket.final} final onOpenMatch={onOpenMatch} />
        </div>
      </div>
    </section>
  );
}

function BracketColumn({
  title,
  matches,
  compact = false,
  final = false,
  onOpenMatch,
}: {
  title: string;
  matches: BracketMatchType[];
  compact?: boolean;
  final?: boolean;
  onOpenMatch: (match: BracketMatchType) => void;
}) {
  return (
    <div>
      <h3
        className={`mb-4 text-center text-[11px] font-black uppercase tracking-[0.2em] ${
          final ? "text-[#d7c77a]" : "text-white/45"
        }`}
      >
        {title}
      </h3>

      <div className={`flex flex-col gap-4 ${compact ? "pt-12 gap-[70px]" : ""} ${final ? "pt-36" : ""}`}>
        {matches.map((match) => (
          <BracketMatch key={match.id} match={match} final={final} onOpen={() => onOpenMatch(match)} />
        ))}
      </div>
    </div>
  );
}

function BracketMatch({
  match,
  final = false,
  onOpen,
}: {
  match: BracketMatchType;
  final?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className={`w-full overflow-hidden rounded-2xl border text-left transition hover:scale-[1.01] ${
        final
          ? "border-[#d7c77a]/40 bg-[#d7c77a]/10"
          : "border-white/10 bg-white/[0.06]"
      }`}
    >
      <BracketTeam
        name={match.teamA}
        score={match.scoreA}
        active={match.scoreA !== null && match.scoreB !== null && match.scoreA > match.scoreB}
      />
      <BracketTeam
        name={match.teamB}
        score={match.scoreB}
        active={match.scoreA !== null && match.scoreB !== null && match.scoreB > match.scoreA}
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
        <span className={`truncate pr-3 text-sm ${active ? "font-black text-white" : "font-bold text-white/50"}`}>
          {name}
        </span>
      </div>
      <span className={`text-lg font-black ${active ? "text-[#d7c77a]" : "text-white/35"}`}>
        {score ?? "-"}
      </span>
    </div>
  );
}

function MatchModal({ match, onClose }: { match: Match; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#151711]/70 px-3 pb-3 backdrop-blur-sm md:items-center md:justify-center md:p-4">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-[30px] bg-[#f6f4ee] shadow-2xl md:max-w-[500px]">
        <div className="relative bg-white p-4">
          <button
            onClick={onClose}
            className="absolute right-7 top-7 z-20 rounded-full bg-[#151711]/80 p-2 text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <HockeyField courtName={match.court} />

          <div className="relative z-10 mx-2 -mt-8 rounded-[26px] border border-[#eee9dd] bg-white p-5 shadow-xl">
            <div className="mb-5 flex justify-center">
              <span className="rounded-full bg-[#151711] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                {match.category}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <ModalTeam name={match.teamA} />
              <ScoreBlock match={match} />
              <ModalTeam name={match.teamB} />
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
            Eventos
          </p>

          {match.events.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#ded9cc] bg-white/70 p-8 text-center">
              <Clock className="mx-auto mb-3 h-7 w-7 text-[#b7b0a0]" />
              <p className="text-sm font-bold text-[#74786a]">
                Sin eventos registrados.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {match.events.map((event) => (
                <div key={event.id} className="flex items-center gap-4 rounded-2xl bg-white p-4">
                  <span className="w-9 text-right text-sm font-black text-[#74786a]">
                    {event.minute}'
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f4ee]">
                    {event.type === "goal" && <Target className="h-5 w-5" />}
                    {event.type === "green_card" && <Square className="h-4 w-4 fill-emerald-600 text-emerald-600" />}
                    {event.type === "yellow_card" && <Square className="h-4 w-4 fill-[#d7c77a] text-[#d7c77a]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{event.player}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
                      {event.type === "goal" ? "Gol" : event.type === "green_card" ? "Tarjeta verde" : "Tarjeta amarilla"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ModalTeam({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <TeamShield name={name} size="md" />
      <p className="w-full max-w-[100px] truncate text-xs font-black">{name}</p>
    </div>
  );
}

function HockeyField({ courtName }: { courtName: string }) {
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-[24px] bg-[#29754f]">
      <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-white/55" />
      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/55" />
      <div className="absolute left-1/2 top-0 h-16 w-36 -translate-x-1/2 rounded-b-full border-2 border-t-0 border-white/55" />
      <div className="absolute bottom-0 left-1/2 h-16 w-36 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-white/55" />
      <div className="absolute inset-4 rounded-[18px] border border-white/30" />

      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl bg-[#151711]/80 px-4 py-2">
        <MapPin className="h-4 w-4 text-[#d7c77a]" />
        <span className="text-xs font-black uppercase tracking-[0.18em] text-white">
          {courtName}
        </span>
      </div>
    </div>
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

function isDraw(match: Match) {
  return match.scoreA !== null && match.scoreB !== null && match.scoreA === match.scoreB;
}

function isWinner(match: Match, side: "A" | "B") {
  if (match.scoreA === null || match.scoreB === null) return false;
  return side === "A" ? match.scoreA > match.scoreB : match.scoreB > match.scoreA;
}

function statusLabel(status: MatchStatus) {
  if (status === "en_curso") return "En juego";
  if (status === "finalizado") return "Final";
  return "Pendiente";
}