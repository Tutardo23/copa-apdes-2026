"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  ShieldCheck,
  Square,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { useSchoolPreference } from "@/src/components/providers/SchoolPreferenceProvider";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import { useSimulation } from "@/src/components/providers/SimulationProvider";
import type { MatchItem } from "@/src/lib/tournament-types";

type CompetitionFilter = "todos" | "Federado" | "Colegial";
type CategoryFilter = "todos" | "Categoría 1" | "Categoría 2" | "Categoría 3";

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

const schoolEscudos: Record<string, string> = {
  Mirasoles: "/escudos/mirasoles.png",
  Torreón: "/escudos/torreon.png",
  Crisol: "/escudos/crisol.png",
  "Buen Ayre": "/escudos/buen-ayre.png",
  "Los Cerros": "/escudos/los-cerros.png",
  Portezuelo: "/escudos/portezuelo.png",
  "Los Candiles": "/escudos/los-candiles.png",
};

const schoolThemes: Record<
  string,
  { accent: string; soft: string; text: string }
> = {
  Mirasoles: {
    accent: "bg-emerald-700",
    soft: "bg-emerald-50",
    text: "text-emerald-800",
  },
  Torreón: { accent: "bg-sky-700", soft: "bg-sky-50", text: "text-sky-800" },
  Crisol: { accent: "bg-rose-700", soft: "bg-rose-50", text: "text-rose-800" },
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
  Portezuelo: {
    accent: "bg-cyan-700",
    soft: "bg-cyan-50",
    text: "text-cyan-800",
  },
  "Los Candiles": {
    accent: "bg-orange-700",
    soft: "bg-orange-50",
    text: "text-orange-800",
  },
};

const competitionOptions: CompetitionFilter[] = [
  "todos",
  "Federado",
  "Colegial",
];
const categoryOptions: CategoryFilter[] = [
  "todos",
  "Categoría 1",
  "Categoría 2",
  "Categoría 3",
];

export default function MiColegioPage() {
  const { matches: realMatches } = useTournament();
  const { selectedSchool: preferredSchool, viewingAllSchools, clearSelectedSchool } = useSchoolPreference();
  const { getEffectiveMatches, simulationEnabled } = useSimulation();

  const matches = useMemo(
    () => getEffectiveMatches(realMatches),
    [realMatches, getEffectiveMatches],
  );
  const [schoolChoice, setSchoolChoice] = useState("");
  const [selectedCompetition, setSelectedCompetition] =
    useState<CompetitionFilter>("todos");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("todos");
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);

  const colegios = useMemo(
    () =>
      Array.from(
        new Set(
          matches
            .filter((match) => match.stage === "grupo")
            .flatMap((match) => [
              getSchoolName(match.teamA),
              getSchoolName(match.teamB),
            ]),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [matches],
  );

  const preferredSchoolAvailable =
    preferredSchool && colegios.includes(preferredSchool)
      ? preferredSchool
      : "";
  const selectedSchool = preferredSchoolAvailable ||
    (viewingAllSchools && colegios.includes(schoolChoice) ? schoolChoice : colegios[0] || "");
  const showControlSchoolSelector = viewingAllSchools && !preferredSchoolAvailable;
  const theme = schoolThemes[selectedSchool] || schoolThemes.Portezuelo;

  const schoolMatches = useMemo(
    () =>
      matches
        .filter(
          (match) =>
            match.stage === "grupo" &&
            (getSchoolName(match.teamA) === selectedSchool ||
              getSchoolName(match.teamB) === selectedSchool),
        )
        .sort(sortMatches),
    [matches, selectedSchool],
  );

  const selectedMatches = useMemo(
    () =>
      schoolMatches.filter((match) => {
        const competition = getCompetition(match.category);
        const baseCategory = getBaseCategory(match.category);
        const byCompetition =
          selectedCompetition === "todos" ||
          competition === selectedCompetition;
        const byCategory =
          selectedCategory === "todos" || baseCategory === selectedCategory;
        return byCompetition && byCategory;
      }),
    [schoolMatches, selectedCompetition, selectedCategory],
  );

  const results = useMemo(
    () =>
      selectedMatches.filter(
        (match) =>
          match.status === "finalizado" &&
          match.scoreA !== null &&
          match.scoreB !== null,
      ),
    [selectedMatches],
  );

  const nextMatches = useMemo(
    () => selectedMatches.filter((match) => match.status !== "finalizado"),
    [selectedMatches],
  );

  const stats = useMemo(
    () => buildSchoolStats(results, selectedSchool),
    [results, selectedSchool],
  );
  const lastResult = results[0] ?? null;

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      {selectedMatch && (
        <MatchModal
          match={selectedMatch}
          selectedSchool={selectedSchool}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        {simulationEnabled && (
          <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-900">
            Modo simulación activo: estos datos pueden incluir resultados ficticios.
          </div>
        )}
        <header className="mb-8">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-[#74786a]">
            Seguimiento por institución
          </p>
          <h1 className="text-[2.65rem] font-black leading-[0.92] tracking-[-0.075em] text-[#151711] md:text-7xl">
            Mi{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Colegio</span>
              <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#151711]/15 md:h-4" />
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#62675d]">
            Partidos, resultados y estadísticas del colegio seleccionado al ingresar.
          </p>
        </header>

        <section className="mb-6 rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
          <div className="mb-5">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">
                  Colegio
                </p>
                <p className="mt-1 text-sm font-bold text-[#62675d]">
                  Seguimiento de partidos, resultados y estadísticas.
                </p>
              </div>

              {selectedSchool && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3">
                    <TeamShield name={selectedSchool} size="sm" />
                    <span className="text-sm font-black text-[#151711]">
                      {selectedSchool}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedSchool}
                    className="rounded-2xl border border-[#151711]/15 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#62675d] transition hover:-translate-y-0.5 hover:border-[#151711]/30 hover:text-[#151711]"
                  >
                    Cambiar colegio
                  </button>
                </div>
              )}
            </div>

            {showControlSchoolSelector && (
              <div className="rounded-2xl border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-3">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
                  Control interno: elegir colegio para probar
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {colegios.map((colegio) => (
                    <button
                      key={colegio}
                      onClick={() => setSchoolChoice(colegio)}
                      className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
                        selectedSchool === colegio
                          ? "border-[#151711] bg-[#151711] text-white"
                          : "border-[#ded9cc] bg-white text-[#62675d]"
                      }`}
                    >
                      <TeamShield name={colegio} size="sm" />
                      {colegio}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FilterBlock title="Competencia">
              {competitionOptions.map((option) => (
                <PillButton
                  key={option}
                  active={selectedCompetition === option}
                  onClick={() => setSelectedCompetition(option)}
                >
                  {option === "todos" ? "Todas" : option}
                </PillButton>
              ))}
            </FilterBlock>

            <FilterBlock title="Categoría">
              {categoryOptions.map((option) => (
                <PillButton
                  key={option}
                  active={selectedCategory === option}
                  onClick={() => setSelectedCategory(option)}
                >
                  {option === "todos" ? "Todas" : option}
                </PillButton>
              ))}
            </FilterBlock>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-[34px] bg-[#151711] p-6 text-white shadow-[0_18px_50px_rgba(21,23,17,0.18)]">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                    Colegio
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.08em]">
                    {selectedSchool || "Sin datos"}
                  </h2>
                </div>
                {selectedSchool && (
                  <TeamShield name={selectedSchool} size="lg" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Puntos" value={stats.pts} />
                <StatCard label="Jugados" value={stats.pj} />
                <StatCard label="Goles" value={stats.gf} />
                <StatCard
                  label="Diferencia"
                  value={`${stats.gf - stats.gc >= 0 ? "+" : ""}${stats.gf - stats.gc}`}
                />
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
                    Racha actual
                  </p>
                  <ShieldCheck className="h-5 w-5 text-white/55" />
                </div>
                <div className="flex gap-2">
                  {stats.racha.length === 0 ? (
                    <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white/55">
                      Sin resultados
                    </span>
                  ) : (
                    stats.racha.map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff2b8] text-sm font-black text-[#151711]"
                      >
                        {item}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </section>

            {lastResult && (
              <section className="rounded-[28px] border border-[#ded9cc] bg-white/85 p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                  Último resultado
                </p>
                <button
                  onClick={() => setSelectedMatch(lastResult)}
                  className="mt-3 w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] p-4 text-left transition hover:bg-white"
                >
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#74786a]">
                    {dayLabel(lastResult.day)} ·{" "}
                    {displayTime(lastResult.timeLabel)}
                  </p>
                  <ResultLine
                    match={lastResult}
                    selectedSchool={selectedSchool}
                  />
                </button>
              </section>
            )}
          </aside>

          <section className="space-y-6">
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Resultados
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Partidos jugados
                  </h2>
                </div>
                <Trophy className="h-5 w-5 text-[#74786a]" />
              </div>

              {results.length === 0 ? (
                <EmptyBox text="Todavía no hay resultados finalizados para esta selección." />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {results.map((match) => (
                    <SchoolMatchCard
                      key={match.id}
                      match={match}
                      selectedSchool={selectedSchool}
                      onClick={() => setSelectedMatch(match)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Agenda
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Próximos partidos
                  </h2>
                </div>
                <CalendarDays className="h-5 w-5 text-[#74786a]" />
              </div>

              {nextMatches.length === 0 ? (
                <EmptyBox text="No hay próximos partidos para esta selección." />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {nextMatches.map((match) => (
                    <SchoolMatchCard
                      key={match.id}
                      match={match}
                      selectedSchool={selectedSchool}
                      onClick={() => setSelectedMatch(match)}
                    />
                  ))}
                </div>
              )}
            </section>
          </section>
        </section>
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
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${active ? "border-[#151711] bg-[#151711] text-white" : "border-[#ded9cc] bg-white text-[#62675d]"}`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-3xl font-black tracking-[-0.06em]">{value}</p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <p className="rounded-[24px] border border-dashed border-[#ded9cc] bg-white/70 p-6 text-sm font-bold text-[#74786a]">
      {text}
    </p>
  );
}

function SchoolMatchCard({
  match,
  selectedSchool,
  onClick,
}: {
  match: MatchItem;
  selectedSchool: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[26px] border border-[#ded9cc] bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            {dayLabel(match.day)} · {displayTime(match.timeLabel)}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#151711]">
            {getBaseCategory(match.category)} {getCompetition(match.category)} ·{" "}
            {match.court}
          </p>
        </div>
        <StatusBadge status={match.status} />
      </div>
      <ResultLine match={match} selectedSchool={selectedSchool} />
    </button>
  );
}

function ResultLine({
  match,
  selectedSchool,
}: {
  match: MatchItem;
  selectedSchool: string;
}) {
  const selectedIsA = getSchoolName(match.teamA) === selectedSchool;
  const team = selectedIsA ? match.teamA : match.teamB;
  const rival = selectedIsA ? match.teamB : match.teamA;
  const scoreFor = selectedIsA ? match.scoreA : match.scoreB;
  const scoreAgainst = selectedIsA ? match.scoreB : match.scoreA;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <TeamShield name={team} size="sm" />
          <span className="truncate text-sm font-black">
            {displayTeam(team)}
          </span>
        </div>
        <span className="text-xl font-black">{scoreFor ?? "-"}</span>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f6f4ee] px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <TeamShield name={rival} size="sm" />
          <span className="truncate text-sm font-bold text-[#62675d]">
            {displayTeam(rival)}
          </span>
        </div>
        <span className="text-xl font-black text-[#62675d]">
          {scoreAgainst ?? "-"}
        </span>
      </div>
    </div>
  );
}

function MatchModal({
  match,
  selectedSchool,
  onClose,
}: {
  match: MatchItem;
  selectedSchool: string;
  onClose: () => void;
}) {
  const competition = getCompetition(match.category);
  const baseCategory = getBaseCategory(match.category);

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#151711]/70 px-3 pb-3 backdrop-blur-sm md:items-center md:justify-center md:p-4">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-[30px] bg-[#f6f4ee] shadow-2xl md:max-w-[620px]">
        <div className="relative p-4">
          <button
            onClick={onClose}
            className="absolute right-7 top-7 z-30 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <section className="relative overflow-hidden rounded-[28px] bg-[#151711] p-5 text-white">
            <HockeyFieldBackground />

            <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={match.status} dark />
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
                  {dayLabel(match.day)}
                </span>
              </div>

              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
                {displayTime(match.timeLabel)}
              </span>
            </div>

            <div className="relative z-10 mb-5 grid gap-2 sm:grid-cols-3">
              <MatchInfoPill label="Cancha" value={match.court} />
              <MatchInfoPill label="Competencia" value={competition} />
              <MatchInfoPill label="Categoría" value={baseCategory} />
            </div>

            <div className="relative z-10 rounded-[26px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
              <ResultLineDark match={match} selectedSchool={selectedSchool} />
            </div>
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailCard label="Día" value={dayLabel(match.day)} />
            <DetailCard label="Horario" value={displayTime(match.timeLabel)} />
            <DetailCard label="Cancha" value={match.court} />
            <DetailCard
              label="Detalle"
              value={`${baseCategory} ${competition}`}
            />
          </section>

          <section className="mt-4 rounded-[24px] border border-[#ded9cc] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">
                  Eventos
                </p>
                <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-[#151711]">
                  Detalle del partido
                </h3>
              </div>
              <Clock className="h-5 w-5 text-[#74786a]" />
            </div>

            {match.events.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-7 text-center">
                <Clock className="mx-auto mb-3 h-7 w-7 text-[#b7b0a0]" />
                <p className="text-sm font-bold text-[#74786a]">
                  Sin eventos registrados.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...match.events]
                  .sort((a, b) => b.minute - a.minute || b.second - a.second)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 rounded-2xl bg-[#fbfaf6] p-4"
                    >
                      <span className="w-11 text-right text-sm font-black text-[#74786a]">
                        {event.minute}&apos;
                        {String(event.second).padStart(2, "0")}
                      </span>

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
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
                          ·{" "}
                          {event.team === "teamA"
                            ? displayTeam(match.teamA)
                            : displayTeam(match.teamB)}{" "}
                          · Q{event.period}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function HockeyFieldBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-35">
      <div className="absolute inset-4 rounded-[26px] border border-white/25" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/25" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
      <div className="absolute -left-12 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-white/25" />
      <div className="absolute -right-12 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-white/25" />
    </div>
  );
}

function MatchInfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black uppercase tracking-[0.08em] text-white">
        {value}
      </p>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#ded9cc] bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-[#151711]">{value}</p>
    </div>
  );
}

function ResultLineDark({
  match,
  selectedSchool,
}: {
  match: MatchItem;
  selectedSchool: string;
}) {
  const selectedIsA = getSchoolName(match.teamA) === selectedSchool;
  const team = selectedIsA ? match.teamA : match.teamB;
  const rival = selectedIsA ? match.teamB : match.teamA;
  const scoreFor = selectedIsA ? match.scoreA : match.scoreB;
  const scoreAgainst = selectedIsA ? match.scoreB : match.scoreA;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="flex min-w-0 flex-col items-center gap-3 text-center">
        <TeamShield name={team} size="lg" />
        <p className="max-w-[120px] truncate text-sm font-black uppercase tracking-[0.08em]">
          {displayTeam(team)}
        </p>
      </div>
      <p className="text-5xl font-black tracking-[-0.08em]">
        {scoreFor ?? "-"}
        <span className="mx-2 text-[#d7c77a]">:</span>
        {scoreAgainst ?? "-"}
      </p>
      <div className="flex min-w-0 flex-col items-center gap-3 text-center">
        <TeamShield name={rival} size="lg" />
        <p className="max-w-[120px] truncate text-sm font-black uppercase tracking-[0.08em]">
          {displayTeam(rival)}
        </p>
      </div>
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

function TeamShield({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const school = getSchoolName(name);
  const shield = schoolEscudos[school];
  const sizeClass =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-14 w-14 md:h-16 md:w-16"
        : "h-12 w-12";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#ded9cc] bg-white ${sizeClass}`}
    >
      {shield ? (
        <Image
          src={shield}
          alt={`Escudo de ${school}`}
          width={80}
          height={80}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span className="text-xs font-black text-[#151711]">
          {getInitials(school)}
        </span>
      )}
    </div>
  );
}

function buildSchoolStats(matches: MatchItem[], school: string): SchoolStats {
  const stats: SchoolStats = {
    pts: 0,
    pj: 0,
    pg: 0,
    pe: 0,
    pp: 0,
    gf: 0,
    gc: 0,
    racha: [],
  };

  for (const match of matches) {
    if (match.scoreA === null || match.scoreB === null) continue;
    const isA = getSchoolName(match.teamA) === school;
    const scoreFor = isA ? match.scoreA : match.scoreB;
    const scoreAgainst = isA ? match.scoreB : match.scoreA;

    stats.pj += 1;
    stats.gf += scoreFor;
    stats.gc += scoreAgainst;

    if (scoreFor > scoreAgainst) {
      stats.pg += 1;
      stats.pts += 3;
      stats.racha.unshift("G");
    } else if (scoreFor < scoreAgainst) {
      stats.pp += 1;
      stats.racha.unshift("P");
    } else {
      stats.pe += 1;
      stats.pts += 1;
      stats.racha.unshift("E");
    }
  }

  stats.racha = stats.racha.slice(0, 5);
  return stats;
}

function getSchoolName(team: string) {
  const normalized = normalizeText(team);
  if (normalized === "lcd" || normalized.includes("candiles"))
    return "Los Candiles";
  if (normalized.includes("mirasoles")) return "Mirasoles";
  if (normalized.includes("torreon")) return "Torreón";
  if (normalized.includes("crisol")) return "Crisol";
  if (normalized.includes("buen ayre")) return "Buen Ayre";
  if (normalized.includes("cerros")) return "Los Cerros";
  if (normalized.includes("portezuelo")) return "Portezuelo";
  return team;
}

function getCompetition(category: string): "Federado" | "Colegial" | "Otro" {
  const normalized = normalizeText(category);
  if (normalized.includes("colegial")) return "Colegial";
  if (normalized.includes("federado") || normalized.includes("federal"))
    return "Federado";
  return "Otro";
}

function getBaseCategory(
  category: string,
): "Categoría 1" | "Categoría 2" | "Categoría 3" | "Otra" {
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

function displayTeam(team: string) {
  return team === "LCD" ? "LCD" : team;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
