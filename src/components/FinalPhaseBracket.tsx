"use client";

import Image from "next/image";
import {
  ChevronRight,
  Clock,
  MapPin,
  Trophy,
} from "lucide-react";
import {
  getSchoolCrestFromTeam,
  getSchoolNameFromTeam,
} from "@/src/lib/schools";
import { getMatchWinner } from "@/src/lib/tournament-engine";
import type { MatchItem } from "@/src/lib/tournament-types";

type Props = {
  title: string;
  matches: MatchItem[];
  onOpenMatch: (match: MatchItem) => void;
};

export default function FinalPhaseBracket({
  title,
  matches,
  onOpenMatch,
}: Props) {
  const semifinales = matches
    .filter((match) => match.stage === "semifinal")
    .sort(compareMatches);

  const finales = matches
    .filter((match) => match.stage === "final")
    .sort(compareMatches);

  const quintoSexto =
    finales.find((match) => isTime(match, "11:45")) ??
    finales.find((match) => hasMarker(match, "5-6", "6-5"));

  const terceroCuarto =
    finales.find((match) => isTime(match, "14:15")) ??
    finales.find((match) => hasMarker(match, "3-4", "4-3"));

  const primeroSegundo =
    finales.find((match) => isTime(match, "14:45")) ??
    finales.find((match) => hasMarker(match, "1-2", "2-1"));

  const hasFinalPhase =
    Boolean(quintoSexto) ||
    semifinales.length > 0 ||
    Boolean(terceroCuarto) ||
    Boolean(primeroSegundo);

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-[#151711] p-4 text-white shadow-[0_20px_55px_rgba(21,23,17,0.18)] md:p-7">
      <FieldLines />

      <div className="relative z-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#d7c77a]">
              Fase final
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.055em] md:text-4xl">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/50">
              Definiciones de la categoría seleccionada.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">
            <Trophy className="h-4 w-4 text-[#d7c77a]" />
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
              Camino al podio
            </span>
          </div>
        </div>

        {!hasFinalPhase ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-7 text-center">
            <p className="text-sm font-bold text-white/50">
              La fase final aparecerá cuando estén cargados sus partidos.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StageColumn
              step="01"
              title="5° / 6° puesto"
              subtitle="Primera definición"
              matches={quintoSexto ? [quintoSexto] : []}
              empty="Sin partido cargado"
              onOpenMatch={onOpenMatch}
            />

            <StageColumn
              step="02"
              title="Semifinales"
              subtitle="1° vs 4° · 2° vs 3°"
              matches={semifinales}
              empty="Sin semifinales cargadas"
              onOpenMatch={onOpenMatch}
            />

            <StageColumn
              step="03"
              title="3° / 4° puesto"
              subtitle="Perdedores de semifinal"
              matches={terceroCuarto ? [terceroCuarto] : []}
              empty="Sin partido cargado"
              onOpenMatch={onOpenMatch}
            />

            <StageColumn
              step="04"
              title="1° / 2° puesto"
              subtitle="Final"
              matches={primeroSegundo ? [primeroSegundo] : []}
              empty="Sin final cargada"
              onOpenMatch={onOpenMatch}
              featured
            />
          </div>
        )}
      </div>
    </section>
  );
}

function StageColumn({
  step,
  title,
  subtitle,
  matches,
  empty,
  onOpenMatch,
  featured = false,
}: {
  step: string;
  title: string;
  subtitle: string;
  matches: MatchItem[];
  empty: string;
  onOpenMatch: (match: MatchItem) => void;
  featured?: boolean;
}) {
  return (
    <section
      className={`relative rounded-[26px] border p-3 ${
        featured
          ? "border-[#d7c77a]/35 bg-[#d7c77a]/[0.07]"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3 px-1 pt-1">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[9px] font-black ${
                featured
                  ? "bg-[#d7c77a] text-[#151711]"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {step}
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
              Etapa
            </span>
          </div>

          <h3
            className={`text-sm font-black uppercase tracking-[0.08em] ${
              featured ? "text-[#f4dfa0]" : "text-white"
            }`}
          >
            {title}
          </h3>
          <p className="mt-1 text-[10px] font-bold text-white/35">{subtitle}</p>
        </div>

        {step !== "04" && (
          <ChevronRight className="mt-1 hidden h-5 w-5 text-white/15 xl:block" />
        )}
      </div>

      <div className="space-y-3">
        {matches.length === 0 ? (
          <div className="flex min-h-[142px] items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-black/10 px-4 text-center">
            <p className="text-xs font-bold text-white/30">{empty}</p>
          </div>
        ) : (
          matches.map((match, index) => (
            <FinalMatchCard
              key={match.id}
              match={match}
              onOpen={() => onOpenMatch(match)}
              featured={featured}
              semifinalIndex={step === "02" ? index : undefined}
            />
          ))
        )}
      </div>
    </section>
  );
}

function FinalMatchCard({
  match,
  onOpen,
  featured,
  semifinalIndex,
}: {
  match: MatchItem;
  onOpen: () => void;
  featured?: boolean;
  semifinalIndex?: number;
}) {
  const label =
    semifinalIndex === 0
      ? "Semifinal 1"
      : semifinalIndex === 1
        ? "Semifinal 2"
        : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full overflow-hidden rounded-[20px] border text-left transition hover:-translate-y-0.5 ${
        featured
          ? "border-[#d7c77a]/35 bg-[#d7c77a]/10 hover:bg-[#d7c77a]/15"
          : "border-white/10 bg-[#20231d] hover:bg-[#262a23]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {label && (
            <span className="rounded-full bg-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/55">
              {label}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45">
            <Clock className="h-3 w-3" />
            {displayTime(match.timeLabel)}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
          <MapPin className="h-3 w-3" />
          {shortCourt(match.court)}
        </span>
      </div>

      <BracketTeam
        name={match.teamA}
        score={match.scoreA}
        winner={isWinner(match, "teamA")}
        featured={featured}
      />
      <BracketTeam
        name={match.teamB}
        score={match.scoreB}
        winner={isWinner(match, "teamB")}
        featured={featured}
      />

      {match.penalties && (
        <p className="border-t border-white/10 px-3 py-2 text-right text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
          Penales: {match.penalties}
        </p>
      )}
    </button>
  );
}

function BracketTeam({
  name,
  score,
  winner,
  featured,
}: {
  name: string;
  score: number | null;
  winner: boolean;
  featured?: boolean;
}) {
  const crest = getSchoolCrestFromTeam(name);
  const displayName = displayParticipant(name);
  const isPlaceholder = displayName !== getSchoolNameFromTeam(name);

  return (
    <div className="flex min-h-[58px] items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border ${
            winner
              ? "border-[#d7c77a]/50 bg-white"
              : "border-white/10 bg-white/[0.08]"
          }`}
        >
          {crest ? (
            <Image
              src={crest}
              alt=""
              width={48}
              height={48}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span className="text-[10px] font-black text-white/45">
              {placeholderInitial(displayName)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p
            className={`truncate text-xs ${
              winner
                ? "font-black text-white"
                : isPlaceholder
                  ? "font-bold text-white/50"
                  : "font-black text-white/70"
            }`}
          >
            {displayName}
          </p>
          {winner && (
            <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-[#d7c77a]">
              Ganador
            </p>
          )}
        </div>
      </div>

      <span
        className={`shrink-0 text-xl font-black ${
          winner || featured ? "text-[#d7c77a]" : "text-white/45"
        }`}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}

function displayParticipant(value: string) {
  const normalized = normalizeText(value);

  if (normalized.includes("5-6")) {
    if (normalized.includes("5°") || normalized.endsWith("5")) return "5° de la tabla";
    if (normalized.includes("6°") || normalized.endsWith("6")) return "6° de la tabla";
  }

  if (normalized.includes("1-4")) {
    if (normalized.includes("1°") || normalized.endsWith("1")) return "1° de la tabla";
    if (normalized.includes("4°") || normalized.endsWith("4")) return "4° de la tabla";
  }

  if (normalized.includes("2-3")) {
    if (normalized.includes("2°") || normalized.endsWith("2")) return "2° de la tabla";
    if (normalized.includes("3°") || normalized.endsWith("3")) return "3° de la tabla";
  }

  if (normalized.includes("3-4") && normalized.includes("sf a")) {
    return "Perdedor semifinal 1";
  }
  if (normalized.includes("3-4") && normalized.includes("sf b")) {
    return "Perdedor semifinal 2";
  }
  if (normalized.includes("1-2") && normalized.includes("sf a")) {
    return "Ganador semifinal 1";
  }
  if (normalized.includes("1-2") && normalized.includes("sf b")) {
    return "Ganador semifinal 2";
  }

  return getSchoolNameFromTeam(value);
}

function placeholderInitial(value: string) {
  const match = value.match(/[1-6]/);
  if (match) return `${match[0]}°`;
  if (value.toLowerCase().includes("semifinal")) return "SF";
  return "—";
}

function hasMarker(match: MatchItem, ...markers: string[]) {
  const text = normalizeText(`${match.teamA} ${match.teamB}`);
  return markers.some((marker) => text.includes(marker));
}

function isTime(match: MatchItem, time: string) {
  return displayTime(match.timeLabel).startsWith(time);
}

function compareMatches(a: MatchItem, b: MatchItem) {
  return timeToMinutes(a.timeLabel) - timeToMinutes(b.timeLabel) || a.id - b.id;
}

function displayTime(value: string) {
  return value
    .trim()
    .replace(/^(\d{1,2}),(\d{2})/, "$1:$2")
    .replace(/\s*hs?\.?$/i, " hs");
}

function timeToMinutes(value: string) {
  const match = displayTime(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function shortCourt(value: string) {
  return value.replace(/\s*\((.*?)\)/g, "").trim();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isWinner(match: MatchItem, team: "teamA" | "teamB") {
  const winner = getMatchWinner(match);
  if (!winner) return false;
  return team === "teamA"
    ? winner === match.teamA
    : winner === match.teamB;
}

function FieldLines() {
  return (
    <div className="pointer-events-none absolute inset-4 rounded-[26px] border border-white/[0.06] opacity-70">
      <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.05]" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]" />
      <div className="absolute -left-12 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-white/[0.05]" />
      <div className="absolute -right-12 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-white/[0.05]" />
    </div>
  );
}
