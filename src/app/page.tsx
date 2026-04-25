"use client";

import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
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

type MatchEvent = {
  id: number;
  minute: number;
  type: EventType;
  player: string;
  team: "teamA" | "teamB";
};

type Match = {
  id: number;
  time: string;
  category: string;
  court: string;
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  events: MatchEvent[];
  featured?: boolean;
};

const mockMatches: Match[] = [
  {
    id: 1,
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
      { id: 5, minute: 40, type: "yellow_card", player: "Julieta Sosa", team: "teamA" },
    ],
  },
  {
    id: 3,
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
      { id: 6, minute: 5, type: "goal", player: "Ana Gómez", team: "teamA" },
      { id: 7, minute: 18, type: "goal", player: "Lucía Díaz", team: "teamB" },
    ],
  },
  {
    id: 4,
    time: "11:00",
    category: "C2C",
    court: "Cancha 3",
    teamA: "Mirasoles Col.",
    teamB: "Buen Ayre Col.",
    scoreA: null,
    scoreB: null,
    status: "por_jugar",
    events: [],
  },
  {
    id: 5,
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
];

const mockTable = [
  { pos: 1, team: "Mirasoles Col.", pts: 24, j: 8, g: 8, e: 0, p: 0, dif: "+19", qualifies: true },
  { pos: 2, team: "Torreón Col.", pts: 21, j: 8, g: 7, e: 0, p: 1, dif: "+14", qualifies: true },
  { pos: 3, team: "Los Cerros Col.", pts: 18, j: 8, g: 6, e: 0, p: 2, dif: "+12", qualifies: true },
  { pos: 4, team: "El Faro", pts: 17, j: 8, g: 5, e: 2, p: 1, dif: "+10", qualifies: true },
  { pos: 5, team: "Crisol Fed.", pts: 16, j: 8, g: 5, e: 1, p: 2, dif: "+8", qualifies: false },
  { pos: 6, team: "Buen Ayre Col.", pts: 15, j: 8, g: 4, e: 3, p: 1, dif: "+5", qualifies: false },
];

const mockBracket = {
  cuartos: [
    { id: 101, teamA: "Mirasoles Col.", scoreA: 3, teamB: "Torreón Fed.", scoreB: 0 },
    { id: 102, teamA: "El Faro", scoreA: 1, teamB: "Crisol Fed.", scoreB: 2 },
    { id: 103, teamA: "Torreón Col.", scoreA: 2, teamB: "Mirasoles Fed.", scoreB: 1 },
    { id: 104, teamA: "Los Cerros Col.", scoreA: 0, teamB: "Buen Ayre Col.", scoreB: 0, penalties: "4-5" },
  ],
  semis: [
    { id: 201, teamA: "Mirasoles Col.", scoreA: 2, teamB: "Crisol Fed.", scoreB: 1 },
    { id: 202, teamA: "Torreón Col.", scoreA: null, teamB: "Buen Ayre Col.", scoreB: null },
  ],
  final: [
    { id: 301, teamA: "Ganador SF1", scoreA: null, teamB: "Ganador SF2", scoreB: null },
  ],
};

const days = [
  { id: "jueves", label: "Jueves", date: "23 Abr" },
  { id: "viernes", label: "Viernes", date: "24 Abr" },
  { id: "sabado", label: "Sábado", date: "25 Abr" },
];

export default function Home() {
  const pageRef = useRef<HTMLElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("fixture");
  const [activeDay, setActiveDay] = useState("viernes");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const featuredMatch = useMemo(() => {
    return mockMatches.find((match) => match.status === "en_curso") || mockMatches[0];
  }, []);

  const featuredMatches = mockMatches.filter((match) => match.featured);

  const getInitials = (name: string) =>
    name
      .replace(".", "")
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".gsap-title", {
        y: 28,
        opacity: 0,
        duration: 0.75,
        ease: "power3.out",
        clearProps: "all",
      });

      gsap.from(".gsap-soft", {
        y: 18,
        opacity: 0,
        duration: 0.65,
        stagger: 0.06,
        delay: 0.12,
        ease: "power3.out",
        clearProps: "all",
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={pageRef} className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      <AnimatePresence>
        {selectedMatch && (
          <MatchModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            getInitials={getInitials}
          />
        )}
      </AnimatePresence>

      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-8">
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="gsap-title max-w-2xl text-[2.65rem] font-black leading-[0.92] tracking-[-0.075em] text-[#151711] md:text-7xl">
                Copa{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">APDES</span>
                  <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#d7c77a]/75 md:h-4" />
                </span>{" "}
                2026
              </h1>

              <p className="gsap-soft mt-4 max-w-xl text-base font-medium leading-7 text-[#62675d]">
                Fixture, resultados y posiciones para seguir la jornada sin perderse entre datos.
              </p>
            </div>

            <div className="gsap-soft flex rounded-full border border-[#ded9cc] bg-white/70 p-1 shadow-sm">
              <TabButton active={activeTab === "fixture"} onClick={() => setActiveTab("fixture")} icon={CalendarDays} label="Fixture" />
              <TabButton active={activeTab === "tabla"} onClick={() => setActiveTab("tabla")} icon={Trophy} label="Tabla" />
              <TabButton active={activeTab === "llaves"} onClick={() => setActiveTab("llaves")} icon={LayoutGrid} label="Llaves" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "fixture" && (
            <motion.section
              key="fixture"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              <FeaturedMatch
                match={featuredMatch}
                onClick={() => setSelectedMatch(featuredMatch)}
                getInitials={getInitials}
              />

              <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <div>
                  <div className="mb-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                      Jornada
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                      Partidos del día
                    </h2>
                  </div>

                  <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {days.map((day) => (
                      <button
                        key={day.id}
                        onClick={() => setActiveDay(day.id)}
                        className={`min-w-[122px] rounded-2xl border px-4 py-3 text-left transition ${
                          activeDay === day.id
                            ? "border-[#151711] bg-[#151711] text-white"
                            : "border-[#ded9cc] bg-white/60 text-[#62675d]"
                        }`}
                      >
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">
                          {day.label}
                        </p>
                        <p className="mt-1 text-base font-black">{day.date}</p>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {mockMatches.map((match) => (
                      <MatchRow
                        key={match.id}
                        match={match}
                        onClick={() => setSelectedMatch(match)}
                        getInitials={getInitials}
                      />
                    ))}
                  </div>
                </div>

                <aside>
                  <section className="rounded-[30px] border border-[#ded9cc] bg-white/70 p-5 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                      Partidos destacados
                    </p>

                    <h3 className="mt-1 text-2xl font-black tracking-[-0.045em]">
                      Para seguir de cerca
                    </h3>

                    <div className="mt-5 space-y-3">
                      {featuredMatches.map((match) => {
                        const isDraw =
                          match.scoreA !== null &&
                          match.scoreB !== null &&
                          match.scoreA === match.scoreB;

                        return (
                          <button
                            key={match.id}
                            onClick={() => setSelectedMatch(match)}
                            className="w-full rounded-2xl bg-[#f6f4ee] p-4 text-left transition hover:bg-[#efeadf]"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <span className="text-sm font-black">{match.time}</span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${
                                  match.status === "en_curso"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-white text-[#74786a]"
                                }`}
                              >
                                {match.status === "en_curso"
                                  ? "En juego"
                                  : match.status === "finalizado"
                                    ? "Final"
                                    : "Pendiente"}
                              </span>
                            </div>

                            <FeaturedMiniTeam
                              name={match.teamA}
                              score={match.scoreA}
                              active={
                                match.scoreA !== null &&
                                match.scoreB !== null &&
                                match.scoreA > match.scoreB
                              }
                              draw={isDraw}
                            />

                            <FeaturedMiniTeam
                              name={match.teamB}
                              score={match.scoreB}
                              active={
                                match.scoreA !== null &&
                                match.scoreB !== null &&
                                match.scoreB > match.scoreA
                              }
                              draw={isDraw}
                            />

                            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
                              {match.category} · {match.court}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </aside>
              </section>
            </motion.section>
          )}

          {activeTab === "tabla" && (
            <motion.section
              key="tabla"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="rounded-[34px] border border-[#ded9cc] bg-white/80 p-5 shadow-sm md:p-8"
            >
              <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Clasificación
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-[-0.06em] text-[#151711] md:text-4xl">
                    Tabla general
                  </h2>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-[#f6f4ee] px-4 py-2 text-xs font-bold text-[#74786a]">
                  <span className="h-3 w-3 rounded-full bg-emerald-600" />
                  Clasifica a fase final
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-[#e6e0d3] bg-[#fbfaf6] md:rounded-[28px]">
                <div className="grid grid-cols-[38px_1fr_46px_38px_38px_46px] border-b border-[#e6e0d3] px-3 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-[#74786a] md:grid-cols-[72px_1fr_80px_64px_64px_64px_64px_80px] md:px-5 md:py-4 md:text-[11px]">
                  <div>#</div>
                  <div>Equipo</div>
                  <div className="text-center">PTS</div>
                  <div className="text-center">J</div>
                  <div className="text-center">G</div>
                  <div className="text-center">DIF</div>

                  <div className="hidden text-center md:block">E</div>
                  <div className="hidden text-center md:block">P</div>
                </div>

                {mockTable.map((row) => (
                  <div
                    key={row.team}
                    className="grid grid-cols-[38px_1fr_46px_38px_38px_46px] items-center border-b border-[#eee9dd] px-3 py-3 last:border-b-0 hover:bg-white md:grid-cols-[72px_1fr_80px_64px_64px_64px_64px_80px] md:px-5 md:py-4"
                  >
                    <div className="text-xs font-black text-[#74786a] md:text-sm">
                      {row.pos}
                    </div>

                    <div className="flex min-w-0 items-center gap-2 md:gap-4">
                      <span
                        className={`h-9 w-1.5 shrink-0 rounded-full md:h-10 ${
                          row.qualifies ? "bg-emerald-600" : "bg-[#ded9cc]"
                        }`}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-[#151711] md:text-sm">
                          {row.team}
                        </p>
                        <p className="hidden text-[11px] font-bold text-[#74786a] md:block">
                          {row.qualifies ? "Zona de clasificación" : "Fuera de clasificación"}
                        </p>
                      </div>
                    </div>

                    <div className="text-center text-sm font-black text-[#151711] md:text-lg">
                      {row.pts}
                    </div>

                    <div className="text-center text-xs font-bold text-[#74786a] md:text-sm">
                      {row.j}
                    </div>

                    <div className="text-center text-xs font-bold text-[#74786a] md:text-sm">
                      {row.g}
                    </div>

                    <div className="text-center text-xs font-black text-[#151711] md:text-sm">
                      {row.dif}
                    </div>

                    <div className="hidden text-center text-sm font-bold text-[#74786a] md:block">
                      {row.e}
                    </div>

                    <div className="hidden text-center text-sm font-bold text-[#74786a] md:block">
                      {row.p}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {activeTab === "llaves" && (
            <motion.section
              key="llaves"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="rounded-[34px] bg-[#151711] p-5 text-white shadow-sm md:p-8"
            >
              <div className="mb-8">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
                  Fase final
                </p>

                <h2 className="mt-1 text-3xl font-black tracking-[-0.06em] md:text-4xl">
                  Camino a la final
                </h2>
              </div>

              <div className="overflow-x-auto pb-3">
                <div className="grid min-w-[880px] grid-cols-[1fr_1fr_1fr] gap-6">
                  <BracketColumn title="Cuartos de final" matches={mockBracket.cuartos} />
                  <BracketColumn title="Semifinales" matches={mockBracket.semis} compact />
                  <BracketColumn title="Final" matches={mockBracket.final} final />
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function FeaturedMiniTeam({
  name,
  score,
  active,
  draw,
}: {
  name: string;
  score: number | null;
  active: boolean;
  draw: boolean;
}) {
  return (
    <div
      className={`mt-2 flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 ${
        active
          ? "border-emerald-700/25"
          : draw
            ? "border-[#d7c77a]/50"
            : "border-transparent"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-6 w-1 rounded-full ${
            active ? "bg-emerald-700" : draw ? "bg-[#d7c77a]" : "bg-[#ded9cc]"
          }`}
        />

        <p
          className={`truncate text-sm ${
            active || draw ? "font-black text-[#151711]" : "font-bold text-[#62675d]"
          }`}
        >
          {name}
        </p>
      </div>

      <span
        className={`text-sm font-black ${
          active ? "text-emerald-800" : draw ? "text-[#8a7629]" : "text-[#151711]"
        }`}
      >
        {score ?? "-"}
      </span>
    </div>
  );
}

function FeaturedMatch({
  match,
  onClick,
  getInitials,
}: {
  match: Match;
  onClick: () => void;
  getInitials: (name: string) => string;
}) {
  const isLive = match.status === "en_curso";
  const isDraw =
    match.scoreA !== null && match.scoreB !== null && match.scoreA === match.scoreB;

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-[38px] bg-[#151711] p-5 text-left text-white shadow-[0_24px_70px_rgba(21,23,17,0.22)] md:p-8"
    >
      <div className="absolute right-[-90px] top-[-90px] h-64 w-64 rounded-full bg-[#d7c77a]/20 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-80px] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${
              isLive ? "bg-emerald-50 text-emerald-800" : "bg-white/10 text-white/65"
            }`}
          >
            {isLive ? "En juego" : match.status === "finalizado" ? "Finalizado" : "Próximo"}
          </span>

          {isDraw && (
            <span className="rounded-full bg-[#d7c77a]/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#e8db98]">
              Empate
            </span>
          )}

          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
            {match.category}
          </span>
        </div>

        <span className="flex items-center gap-1.5 text-xs font-bold text-white/50">
          <MapPin className="h-4 w-4" />
          {match.court}
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamHero
          name={match.teamA}
          initials={getInitials(match.teamA)}
          active={
            match.scoreA !== null &&
            match.scoreB !== null &&
            match.scoreA > match.scoreB
          }
          draw={isDraw}
        />

        <div className="text-center">
          {match.status === "por_jugar" ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Inicio
              </p>
              <p className="mt-1 text-5xl font-black tracking-[-0.07em]">
                {match.time}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-5xl font-black tracking-[-0.08em] md:text-6xl">
                {match.scoreA}
              </span>
              <span className="text-2xl font-black text-[#d7c77a]">:</span>
              <span className="text-5xl font-black tracking-[-0.08em] md:text-6xl">
                {match.scoreB}
              </span>
            </div>
          )}

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
            Abrir partido
          </p>
        </div>

        <TeamHero
          name={match.teamB}
          initials={getInitials(match.teamB)}
          active={
            match.scoreA !== null &&
            match.scoreB !== null &&
            match.scoreB > match.scoreA
          }
          draw={isDraw}
        />
      </div>
    </button>
  );
}

function MatchRow({
  match,
  onClick,
  getInitials,
}: {
  match: Match;
  onClick: () => void;
  getInitials: (name: string) => string;
}) {
  const isDraw =
    match.scoreA !== null && match.scoreB !== null && match.scoreA === match.scoreB;

  return (
    <button
      onClick={onClick}
      className="grid w-full grid-cols-[64px_1fr] items-center gap-4 rounded-[26px] border border-[#ded9cc] bg-white/70 p-4 text-left shadow-sm transition hover:border-[#151711]/25 hover:bg-white sm:grid-cols-[88px_1fr_auto]"
    >
      <div>
        <p className="text-lg font-black tracking-[-0.04em]">{match.time}</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
          {match.category}
        </p>
      </div>

      <div className="min-w-0 space-y-2">
        <MatchTeamLine
          initials={getInitials(match.teamA)}
          name={match.teamA}
          score={match.scoreA}
          winner={match.scoreA !== null && match.scoreB !== null && match.scoreA > match.scoreB}
          draw={isDraw}
        />

        <MatchTeamLine
          initials={getInitials(match.teamB)}
          name={match.teamB}
          score={match.scoreB}
          winner={match.scoreA !== null && match.scoreB !== null && match.scoreB > match.scoreA}
          draw={isDraw}
        />
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-xs font-black text-[#151711]">{match.court}</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
          {match.status === "en_curso"
            ? "En juego"
            : match.status === "finalizado"
              ? "Final"
              : "Pendiente"}
        </p>
      </div>
    </button>
  );
}

function MatchTeamLine({
  initials,
  name,
  score,
  winner,
  draw,
}: {
  initials: string;
  name: string;
  score: number | null;
  winner: boolean;
  draw: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 ${
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

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
            winner
              ? "bg-emerald-50 text-emerald-800"
              : draw
                ? "bg-[#f5edc9] text-[#6f6125]"
                : "bg-[#f0ede3] text-[#74786a]"
          }`}
        >
          {initials}
        </span>

        <span
          className={`truncate text-sm ${
            winner || draw ? "font-black text-[#151711]" : "font-bold text-[#62675d]"
          }`}
        >
          {name}
        </span>
      </div>

      <span
        className={`text-xl font-black tracking-[-0.05em] ${
          winner ? "text-emerald-800" : draw ? "text-[#8a7629]" : "text-[#151711]"
        }`}
      >
        {score ?? "-"}
      </span>
    </div>
  );
}

function TeamHero({
  name,
  initials,
  active,
  draw,
}: {
  name: string;
  initials: string;
  active: boolean;
  draw: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full border text-base font-black shadow-inner md:h-16 md:w-16 md:text-lg ${
          active
            ? "border-emerald-400/60 bg-white text-emerald-800"
            : draw
              ? "border-[#d7c77a]/70 bg-white text-[#7a6822]"
              : "border-white/15 bg-white/10 text-white"
        }`}
      >
        {initials}
      </div>

      <div className="flex flex-col items-center gap-1">
        {(active || draw) && (
          <span
            className={`h-1 w-8 rounded-full ${
              active ? "bg-emerald-500" : "bg-[#d7c77a]"
            }`}
          />
        )}

        <p className="max-w-[92px] text-xs font-black leading-tight text-white md:max-w-[110px] md:text-sm">
          {name}
        </p>
      </div>
    </div>
  );
}

function HockeyField({ courtName }: { courtName: string }) {
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-[26px] bg-[#29754f] shadow-inner">
      <div className="absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(0deg,transparent,transparent_22px,rgba(0,0,0,0.16)_22px,rgba(0,0,0,0.16)_44px)]" />
      <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-white/55" />
      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/55" />
      <div className="absolute left-1/2 top-0 h-16 w-36 -translate-x-1/2 rounded-b-full border-2 border-t-0 border-white/55" />
      <div className="absolute bottom-0 left-1/2 h-16 w-36 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-white/55" />
      <div className="absolute inset-4 rounded-[20px] border border-white/30" />

      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl bg-[#151711]/80 px-4 py-2 shadow-xl backdrop-blur">
        <MapPin className="h-4 w-4 text-[#d7c77a]" />
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
          {courtName}
        </span>
      </div>
    </div>
  );
}

function MatchModal({
  match,
  onClose,
  getInitials,
}: {
  match: Match;
  onClose: () => void;
  getInitials: (name: string) => string;
}) {
  return (
    <>
      <motion.div
        className="fixed inset-0 z-[80] bg-[#151711]/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.section
        className="fixed bottom-0 left-0 right-0 z-[90] max-h-[92vh] overflow-hidden rounded-t-[34px] bg-[#f6f4ee] shadow-2xl md:bottom-auto md:left-1/2 md:top-1/2 md:w-[500px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[34px]"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
      >
        <div className="relative bg-white p-4">
          <button
            onClick={onClose}
            className="absolute right-7 top-7 z-20 rounded-full bg-[#151711]/80 p-2 text-white backdrop-blur transition hover:bg-[#151711]"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <HockeyField courtName={match.court} />

          <div className="relative z-10 mx-2 -mt-8 rounded-[28px] border border-[#eee9dd] bg-white p-5 shadow-xl">
            <div className="mb-5 flex justify-center">
              <span className="rounded-full bg-[#151711] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                {match.category}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <ModalTeam name={match.teamA} initials={getInitials(match.teamA)} />

              <div className="text-center">
                {match.status === "por_jugar" ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74786a]">
                      Inicio
                    </p>
                    <p className="mt-1 text-4xl font-black tracking-[-0.07em] text-[#151711]">
                      {match.time}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-5xl font-black tracking-[-0.08em] text-[#151711]">
                      {match.scoreA}
                    </span>
                    <span className="text-2xl font-black text-[#ded9cc]">:</span>
                    <span className="text-5xl font-black tracking-[-0.08em] text-[#151711]">
                      {match.scoreB}
                    </span>
                  </div>
                )}
              </div>

              <ModalTeam name={match.teamB} initials={getInitials(match.teamB)} />
            </div>
          </div>
        </div>

        <div className="max-h-[390px] overflow-y-auto p-5">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
            Eventos del partido
          </p>

          {match.events.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#ded9cc] bg-white/70 p-8 text-center">
              <Clock className="mx-auto mb-3 h-7 w-7 text-[#b7b0a0]" />
              <p className="text-sm font-bold text-[#74786a]">
                Los eventos aparecerán cuando el partido comience.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...match.events]
                .sort((a, b) => b.minute - a.minute)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <span className="w-9 text-right text-sm font-black text-[#74786a]">
                      {event.minute}'
                    </span>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f4ee]">
                      {event.type === "goal" && <Target className="h-5 w-5 text-[#151711]" />}
                      {event.type === "green_card" && (
                        <Square className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                      )}
                      {event.type === "yellow_card" && (
                        <Square className="h-4 w-4 fill-[#d7c77a] text-[#d7c77a]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#151711]">
                        {event.player}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
                        {event.type === "goal"
                          ? "Gol"
                          : event.type === "green_card"
                            ? "Tarjeta verde"
                            : "Tarjeta amarilla"}{" "}
                        · {event.team === "teamA" ? match.teamA : match.teamB}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </motion.section>
    </>
  );
}

function ModalTeam({ name, initials }: { name: string; initials: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0ede3] text-sm font-black text-[#151711]">
        {initials}
      </div>

      <p className="max-w-[105px] text-xs font-black leading-tight text-[#151711]">
        {name}
      </p>
    </div>
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
  icon: ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-black transition sm:px-4 sm:text-sm md:flex-none ${
        active ? "text-white" : "text-[#74786a] hover:text-[#151711]"
      }`}
    >
      {active && (
        <motion.span
          layoutId="active-tab"
          className="absolute inset-0 rounded-full bg-[#151711]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}

      <Icon className="relative z-10 h-4 w-4" />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function BracketColumn({
  title,
  matches,
  compact = false,
  final = false,
}: {
  title: string;
  matches: any[];
  compact?: boolean;
  final?: boolean;
}) {
  return (
    <div className="relative">
      <h3
        className={`mb-5 text-center text-[11px] font-black uppercase tracking-[0.22em] ${
          final ? "text-[#d7c77a]" : "text-white/45"
        }`}
      >
        {title}
      </h3>

      <div
        className={`flex flex-col gap-5 ${
          compact ? "pt-[52px] gap-[72px]" : ""
        } ${final ? "pt-[160px]" : ""}`}
      >
        {matches.map((match) => (
          <BracketMatch key={match.id} match={match} final={final} />
        ))}
      </div>
    </div>
  );
}

function BracketMatch({
  match,
  final = false,
}: {
  match: any;
  final?: boolean;
}) {
  const winnerA =
    match.scoreA !== null &&
    match.scoreB !== null &&
    match.scoreA > match.scoreB;

  const winnerB =
    match.scoreA !== null &&
    match.scoreB !== null &&
    match.scoreB > match.scoreA;

  return (
    <article
      className={`overflow-hidden rounded-[22px] border ${
        final
          ? "border-[#d7c77a]/40 bg-[#d7c77a]/10"
          : "border-white/10 bg-white/[0.06]"
      }`}
    >
      <BracketTeam
        name={match.teamA}
        score={match.scoreA}
        active={winnerA || final}
      />

      <BracketTeam
        name={match.teamB}
        score={match.scoreB}
        active={winnerB || final}
      />

      {match.penalties && (
        <p className="border-t border-white/10 px-4 py-2 text-right text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
          Penales: {match.penalties}
        </p>
      )}
    </article>
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
    <div
      className={`flex items-center justify-between border-b border-white/10 px-4 py-3 last:border-b-0 ${
        active ? "bg-white/[0.04]" : ""
      }`}
    >
      <span
        className={`truncate pr-3 text-sm ${
          active ? "font-black text-white" : "font-bold text-white/50"
        }`}
      >
        {name}
      </span>

      <span
        className={`text-lg font-black ${
          active ? "text-[#d7c77a]" : "text-white/35"
        }`}
      >
        {score ?? "-"}
      </span>
    </div>
  );
}