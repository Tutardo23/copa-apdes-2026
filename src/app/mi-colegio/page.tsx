"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  Clock,
  MapPin,
  ShieldCheck,
  Square,
  Target,
  X,
} from "lucide-react";

type MatchStatus = "finalizado" | "por_jugar";
type EventType = "goal" | "green_card" | "yellow_card";

type MatchEvent = {
  id: number;
  minute: number;
  type: EventType;
  player: string;
  team: "teamA" | "teamB";
};

type Match = {
  id: number;
  time?: string;
  date: string;
  category: string;
  court: string;
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  result?: "win" | "loss" | "draw";
  events: MatchEvent[];
};

const colegios = [
  "Mirasoles",
  "Torreón",
  "Crisol",
  "El Faro",
  "Buen Ayre",
  "Los Cerros",
];

const schoolEscudos: Record<string, string> = {
  Mirasoles: "/escudos/mirasoles.png",
  Torreón: "/escudos/torreon.png",
  Crisol: "/escudos/crisol.png",
  "Buen Ayre": "/escudos/buen-ayre.png",
  "Los Cerros": "/escudos/los-cerros.png",
};

type SchoolStats = {
  pts: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  racha: string[];
};

const teamToSchoolAlias: Record<string, string> = {
  "Mirasoles Col.": "Mirasoles",
  "Mirasoles Fed.": "Mirasoles",
  "Torreón Col.": "Torreón",
  "Torreón Fed.": "Torreón",
  "Crisol Col.": "Crisol",
  "Crisol Fed.": "Crisol",
  "Buen Ayre Col.": "Buen Ayre",
  "Los Cerros Col.": "Los Cerros",
  "Los Cerros Fed.": "Los Cerros",
  "El Faro": "El Faro",
};

const schoolThemes: Record<
  string,
  {
    accent: string;
    soft: string;
    text: string;
  }
> = {
  Mirasoles: {
    accent: "bg-emerald-700",
    soft: "bg-emerald-50",
    text: "text-emerald-800",
  },
  Torreón: {
    accent: "bg-sky-700",
    soft: "bg-sky-50",
    text: "text-sky-800",
  },
  Crisol: {
    accent: "bg-rose-700",
    soft: "bg-rose-50",
    text: "text-rose-800",
  },
  "El Faro": {
    accent: "bg-amber-600",
    soft: "bg-amber-50",
    text: "text-amber-800",
  },
  "Buen Ayre": {
    accent: "bg-indigo-700",
    soft: "bg-indigo-50",
    text: "text-indigo-800",
  },
  "Los Cerros": {
    accent: "bg-violet-700",
    soft: "bg-violet-50",
    text: "text-violet-800",
  },
};

const mockSchoolStats: Record<string, SchoolStats> = {
  Mirasoles: {
    pts: 24,
    pj: 8,
    pg: 8,
    pe: 0,
    pp: 0,
    gf: 23,
    gc: 4,
    racha: ["G", "G", "G", "G", "G"],
  },
  Torreón: {
    pts: 21,
    pj: 8,
    pg: 7,
    pe: 0,
    pp: 1,
    gf: 18,
    gc: 5,
    racha: ["G", "G", "P", "G", "G"],
  },
  Crisol: {
    pts: 18,
    pj: 8,
    pg: 6,
    pe: 0,
    pp: 2,
    gf: 15,
    gc: 8,
    racha: ["P", "G", "G", "P", "G"],
  },
};

const mockMatches: Match[] = [
  {
    id: 1,
    time: "11:00",
    date: "Hoy",
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
    id: 2,
    time: "14:00",
    date: "Mañana",
    category: "C1C",
    court: "Cancha 1",
    teamA: "Mirasoles Fed.",
    teamB: "Torreón Col.",
    scoreA: null,
    scoreB: null,
    status: "por_jugar",
    events: [],
  },
];

const mockResults: Match[] = [
  {
    id: 3,
    date: "Ayer",
    category: "C1C",
    court: "Cancha 1",
    teamA: "Mirasoles Col.",
    teamB: "Crisol Col.",
    scoreA: 1,
    scoreB: 0,
    result: "win",
    status: "finalizado",
    events: [
      {
        id: 1,
        minute: 14,
        type: "goal",
        player: "Martina López",
        team: "teamA",
      },
    ],
  },
  {
    id: 4,
    date: "20 Abr",
    category: "C3C",
    court: "Cancha 2",
    teamA: "Torreón Fed.",
    teamB: "El Faro",
    scoreA: 3,
    scoreB: 1,
    result: "win",
    status: "finalizado",
    events: [
      {
        id: 3,
        minute: 8,
        type: "goal",
        player: "Laura Viale",
        team: "teamA",
      },
    ],
  },
];

export default function MiColegioPage() {
  const [selectedSchool, setSelectedSchool] = useState("Mirasoles");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const theme = schoolThemes[selectedSchool] || schoolThemes.Mirasoles;
  const stats = mockSchoolStats[selectedSchool] || mockSchoolStats.Mirasoles;

  const getInitials = (name: string) =>
    name
      .replace(".", "")
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      <AnimatePresence>
        {selectedMatch && (
          <MatchModal
            match={selectedMatch}
            selectedSchool={selectedSchool}
            theme={theme}
            getInitials={getInitials}
            onClose={() => setSelectedMatch(null)}
          />
        )}
      </AnimatePresence>

      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-8">
          <div className="mb-6">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-[#74786a]">
              Seguimiento por institución
            </p>

            <h1 className="text-[2.65rem] font-black leading-[0.92] tracking-[-0.075em] text-[#151711] md:text-7xl">
              Mi{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Colegio</span>
                <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#d7c77a]/75 md:h-4" />
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#62675d]">
              Resultados, próximos partidos y rendimiento general de cada colegio
              durante la Copa APDES 2026.
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {colegios.map((colegio) => {
              const isActive = selectedSchool === colegio;

              return (
                <button
                  key={colegio}
                  onClick={() => setSelectedSchool(colegio)}
                  className={`shrink-0 rounded-2xl border px-3 py-2.5 text-sm font-black transition ${
                    isActive
                      ? "border-[#151711] bg-[#151711] text-white shadow-sm"
                      : "border-[#ded9cc] bg-white/70 text-[#62675d] hover:border-[#151711]/25 hover:text-[#151711]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <SchoolBadge name={colegio} initials={getInitials(colegio)} size="sm" />
                    <span>{colegio}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={selectedSchool}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25 }}
            className="grid gap-8 lg:grid-cols-[340px_1fr]"
          >
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <section className="overflow-hidden rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_24px_70px_rgba(21,23,17,0.22)] md:p-6">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-white/40">
                      Colegio
                    </p>

                    <h2 className="text-4xl font-black tracking-[-0.07em]">
                      {selectedSchool}
                    </h2>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
                    <SchoolBadge
                      name={selectedSchool}
                      initials={getInitials(selectedSchool)}
                      size="lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Puntos" value={stats.pts} />
                  <StatCard label="Goles" value={stats.gf} />
                  <StatCard label="Jugados" value={stats.pj} />
                  <StatCard label="Diferencia" value={`+${stats.gf - stats.gc}`} />
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                      Racha actual
                    </p>

                    <ShieldCheck className="h-5 w-5 text-[#d7c77a]" />
                  </div>

                  <div className="flex gap-2">
                    {stats.racha.map((item: string, index: number) => (
                      <span
                        key={`${item}-${index}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${
                          item === "G"
                            ? "bg-emerald-50 text-emerald-800"
                            : item === "P"
                              ? "bg-rose-50 text-rose-800"
                              : "bg-[#f5edc9] text-[#6f6125]"
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </aside>

            <section className="space-y-8">
              <div>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                      Agenda
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                      Próximos partidos
                    </h2>
                  </div>

                  <CalendarDays className="h-6 w-6 text-[#74786a]" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {mockMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      selectedSchool={selectedSchool}
                      theme={theme}
                      getInitials={getInitials}
                      onClick={() => setSelectedMatch(match)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                      Últimos resultados
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                      Historial reciente
                    </h2>
                  </div>

                  <Activity className="h-6 w-6 text-[#74786a]" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {mockResults.map((match) => (
                    <ResultCard
                      key={match.id}
                      match={match}
                      selectedSchool={selectedSchool}
                      theme={theme}
                      getInitials={getInitials}
                      onClick={() => setSelectedMatch(match)}
                    />
                  ))}
                </div>
              </div>
            </section>
          </motion.section>
        </AnimatePresence>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
      <p className="text-3xl font-black tracking-[-0.06em] text-white">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
    </div>
  );
}

function MatchCard({
  match,
  selectedSchool,
  theme,
  getInitials,
  onClick,
}: {
  match: Match;
  selectedSchool: string;
  theme: { accent: string; soft: string; text: string };
  getInitials: (name: string) => string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-[28px] border border-[#ded9cc] bg-white/75 p-4 text-left shadow-sm transition hover:border-[#151711]/25 hover:bg-white"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#151711]">{match.time}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            {match.date}
          </p>
        </div>

        <span className="rounded-full bg-[#f6f4ee] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
          {match.category} · {match.court}
        </span>
      </div>

      <div className="space-y-2">
        <TeamLine
          name={match.teamA}
          schoolName={getSchoolName(match.teamA)}
          initials={getInitials(match.teamA)}
          active={match.teamA.includes(selectedSchool)}
          theme={theme}
        />

        <TeamLine
          name={match.teamB}
          schoolName={getSchoolName(match.teamB)}
          initials={getInitials(match.teamB)}
          active={match.teamB.includes(selectedSchool)}
          theme={theme}
        />
      </div>
    </button>
  );
}

function ResultCard({
  match,
  selectedSchool,
  theme,
  getInitials,
  onClick,
}: {
  match: Match;
  selectedSchool: string;
  theme: { accent: string; soft: string; text: string };
  getInitials: (name: string) => string;
  onClick: () => void;
}) {
  const isDraw =
    match.scoreA !== null &&
    match.scoreB !== null &&
    match.scoreA === match.scoreB;

  const teamAWins =
    match.scoreA !== null &&
    match.scoreB !== null &&
    match.scoreA > match.scoreB;

  const teamBWins =
    match.scoreA !== null &&
    match.scoreB !== null &&
    match.scoreB > match.scoreA;

  return (
    <button
      onClick={onClick}
      className="group rounded-[28px] border border-[#ded9cc] bg-white/75 p-4 text-left shadow-sm transition hover:border-[#151711]/25 hover:bg-white"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#151711]">{match.date}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            {match.category} · {match.court}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
            isDraw
              ? "bg-[#f5edc9] text-[#6f6125]"
              : match.result === "win"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-rose-50 text-rose-800"
          }`}
        >
          {isDraw ? "Empate" : match.result === "win" ? "Ganó" : "Perdió"}
        </span>
      </div>

      <div className="space-y-2">
        <ResultTeamLine
          name={match.teamA}
          schoolName={getSchoolName(match.teamA)}
          initials={getInitials(match.teamA)}
          score={match.scoreA}
          active={match.teamA.includes(selectedSchool)}
          winner={teamAWins}
          draw={isDraw}
          theme={theme}
        />

        <ResultTeamLine
          name={match.teamB}
          schoolName={getSchoolName(match.teamB)}
          initials={getInitials(match.teamB)}
          score={match.scoreB}
          active={match.teamB.includes(selectedSchool)}
          winner={teamBWins}
          draw={isDraw}
          theme={theme}
        />
      </div>
    </button>
  );
}

function TeamLine({
  name,
  schoolName,
  initials,
  active,
  theme,
}: {
  name: string;
  schoolName: string;
  initials: string;
  active: boolean;
  theme: { accent: string; soft: string; text: string };
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${
        active ? "border-[#d7c77a]/50 bg-white" : "border-transparent"
      }`}
    >
      <span className={`h-8 w-1.5 rounded-full ${active ? theme.accent : "bg-[#ded9cc]"}`} />

      <SchoolBadge
        name={schoolName}
        initials={initials}
        size="sm"
        active={active}
        theme={theme}
      />

      <span
        className={`truncate text-sm ${
          active ? "font-black text-[#151711]" : "font-bold text-[#62675d]"
        }`}
      >
        {name}
      </span>
    </div>
  );
}

function ResultTeamLine({
  name,
  schoolName,
  initials,
  score,
  active,
  winner,
  draw,
  theme,
}: {
  name: string;
  schoolName: string;
  initials: string;
  score: number | null;
  active: boolean;
  winner: boolean;
  draw: boolean;
  theme: { accent: string; soft: string; text: string };
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 ${
        winner
          ? "border-emerald-700/25 bg-white"
          : draw
            ? "border-[#d7c77a]/45 bg-white"
            : active
              ? "border-[#d7c77a]/30 bg-white"
              : "border-transparent"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`h-8 w-1.5 shrink-0 rounded-full ${
            winner ? "bg-emerald-700" : draw ? "bg-[#d7c77a]" : active ? theme.accent : "bg-[#ded9cc]"
          }`}
        />

        <SchoolBadge
          name={schoolName}
          initials={initials}
          size="sm"
          active={active || winner || draw}
          theme={theme}
          emphasize={winner || draw}
        />

        <span
          className={`truncate text-sm ${
            winner || draw || active
              ? "font-black text-[#151711]"
              : "font-bold text-[#62675d]"
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
  selectedSchool,
  theme,
  getInitials,
  onClose,
}: {
  match: Match;
  selectedSchool: string;
  theme: { accent: string; soft: string; text: string };
  getInitials: (name: string) => string;
  onClose: () => void;
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
              <ModalTeam
                name={match.teamA}
                schoolName={getSchoolName(match.teamA)}
                initials={getInitials(match.teamA)}
                active={match.teamA.includes(selectedSchool)}
                theme={theme}
              />

              <div className="text-center">
                {match.status === "por_jugar" ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74786a]">
                      {match.date}
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

              <ModalTeam
                name={match.teamB}
                schoolName={getSchoolName(match.teamB)}
                initials={getInitials(match.teamB)}
                active={match.teamB.includes(selectedSchool)}
                theme={theme}
              />
            </div>
          </div>
        </div>

        <div className="max-h-[390px] overflow-y-auto p-5">
          {match.status === "por_jugar" ? (
            <div className="rounded-[24px] border border-dashed border-[#ded9cc] bg-white/70 p-8 text-center">
              <CalendarDays className="mx-auto mb-3 h-7 w-7 text-[#b7b0a0]" />
              <p className="text-sm font-black text-[#151711]">
                Partido programado
              </p>
              <p className="mt-1 text-xs font-bold text-[#74786a]">
                Los eventos aparecerán cuando el partido comience.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                Eventos del partido
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
                  {[...match.events]
                    .sort((a, b) => b.minute - a.minute)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm"
                      >
                        <span className="w-9 text-right text-sm font-black text-[#74786a]">
                          {event.minute}&apos;
                        </span>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f4ee]">
                          {event.type === "goal" && (
                            <Target className="h-5 w-5 text-[#151711]" />
                          )}
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
            </>
          )}
        </div>
      </motion.section>
    </>
  );
}

function ModalTeam({
  name,
  schoolName,
  initials,
  active,
  theme,
}: {
  name: string;
  schoolName: string;
  initials: string;
  active: boolean;
  theme: { accent: string; soft: string; text: string };
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <SchoolBadge name={schoolName} initials={initials} size="md" active={active} theme={theme} />

      <p className="max-w-[105px] text-xs font-black leading-tight text-[#151711]">
        {name}
      </p>
    </div>
  );
}

function getSchoolName(teamName: string): string {
  return teamToSchoolAlias[teamName] || teamName;
}

function SchoolBadge({
  name,
  initials,
  size = "sm",
  active = false,
  theme,
  emphasize = false,
}: {
  name: string;
  initials: string;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  theme?: { soft: string; text: string };
  emphasize?: boolean;
}) {
  const src = schoolEscudos[name];
  const dimensions =
    size === "lg"
      ? { container: "h-12 w-12 rounded-2xl" }
      : size === "md"
        ? { container: "h-12 w-12 rounded-full" }
        : { container: "h-8 w-8 rounded-full" };

  const fallbackTone = emphasize
    ? "bg-[#f5edc9] text-[#6f6125]"
    : active && theme
      ? `${theme.soft} ${theme.text}`
      : "bg-[#f0ede3] text-[#74786a]";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-black/5 ${dimensions.container} ${fallbackTone}`}
    >
      {src ? (
        <Image
          src={src}
          alt={`Escudo ${name}`}
          fill
          sizes="48px"
          className="object-contain p-1.5"
        />
      ) : (
        <span className="text-[10px] font-black">{initials}</span>
      )}
    </span>
  );
}
