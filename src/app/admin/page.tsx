"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import type { DayKey, MatchItem } from "@/src/lib/tournament-types";

type CompetitionFilter = "todos" | "Federado" | "Colegial";
type StatusFilter = "todos" | "por_jugar" | "en_curso" | "finalizado";

type ChampionRow = {
  school: string;
  pts: number;
  firstPlaces: number;
  tablesPlayed: number;
  j: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dif: number;
};

type CategoryStandingRow = {
  school: string;
  pts: number;
  j: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dif: number;
};

type AdminCategoryTable = {
  key: string;
  title: string;
  competition: string;
  category: string;
  hasResults: boolean;
  rows: CategoryStandingRow[];
};

export default function AdminAgendaPage() {
  const router = useRouter();
  const {
    matches,
    isLive,
    connectionError,
    adminReady,
    adminError,
    authenticateAdmin,
    toggleClock,
    resetClock,
    finishMatch,
  } = useTournament();

  const [password, setPassword] = useState("");
  const [selectedDay, setSelectedDay] = useState<DayKey>("dia1");
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionFilter>("todos");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedCourt, setSelectedCourt] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("todos");
  const [busyGroup, setBusyGroup] = useState<string | null>(null);

  const filterOptions = useMemo(() => {
    const matchesForDay = matches.filter((match) => match.day === selectedDay);
    const categories = Array.from(new Set(matchesForDay.map((match) => getCleanCategory(match.category)))).sort(
      compareCleanCategories
    );
    const courts = Array.from(new Set(matchesForDay.map((match) => match.court))).sort(compareCourts);

    return { categories, courts };
  }, [matches, selectedDay]);

  const visibleMatches = useMemo(() => {
    return matches
      .filter((match) => match.day === selectedDay)
      .filter((match) => selectedCompetition === "todos" || getCompetitionFromCategory(match.category) === selectedCompetition)
      .filter((match) => selectedCategory === "todos" || getCleanCategory(match.category) === selectedCategory)
      .filter((match) => selectedCourt === "todos" || match.court === selectedCourt)
      .filter((match) => selectedStatus === "todos" || match.status === selectedStatus)
      .sort(compareMatchesForAdmin);
  }, [matches, selectedCategory, selectedCompetition, selectedCourt, selectedDay, selectedStatus]);

  const scheduleGroups = useMemo(() => groupMatchesByTime(visibleMatches), [visibleMatches]);
  const championRows = useMemo(() => buildChampionTable(matches), [matches]);
  const categoryTables = useMemo(() => buildCategoryTables(matches), [matches]);

  const runGroupAction = async (
    groupKey: string,
    groupMatches: MatchItem[],
    action: "start" | "pause" | "reset" | "finish"
  ) => {
    setBusyGroup(`${groupKey}-${action}`);

    try {
      if (action === "start") {
        const pending = groupMatches.filter((match) => match.status !== "finalizado" && !match.isRunning);
        for (const match of pending) await toggleClock(match.id);
      }

      if (action === "pause") {
        const running = groupMatches.filter((match) => match.status !== "finalizado" && match.isRunning);
        for (const match of running) await toggleClock(match.id);
      }

      if (action === "reset") {
        const editable = groupMatches.filter((match) => match.status !== "finalizado");
        for (const match of editable) await resetClock(match.id);
      }

      if (action === "finish") {
        const editable = groupMatches.filter((match) => match.status !== "finalizado");
        for (const match of editable) await finishMatch(match.id);
      }
    } finally {
      setBusyGroup(null);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-[1320px] px-3 pb-28 pt-4 md:px-6 md:pb-10">
        <header className="mb-4">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Mesa de control</p>
              <h1 className="max-w-4xl text-[2rem] font-black leading-[0.94] tracking-[-0.065em] md:text-5xl">
                Carga por <span className="relative inline-block"><span className="relative z-10">tandas</span><span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#d7c77a]/75 md:h-4" /></span>
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#62675d]">
                Para el torneo real, trabajá por horario: cada tanda muestra las 6 canchas juntas. Desde acá podés iniciar/pausar el reloj general de esa tanda o entrar a cargar el resultado de cada partido.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ded9cc] bg-white/75 px-4 py-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isLive ? "bg-emerald-600" : "bg-[#d7c77a]"}`} />
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#74786a]">
                {isLive ? "Conectado" : "Conectando"}
              </span>
            </div>
          </div>
        </header>

        {!adminReady && (
          <form
            className="mb-5 flex flex-col gap-3 rounded-[28px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center"
            onSubmit={async (event) => {
              event.preventDefault();
              await authenticateAdmin(password);
            }}
          >
            <div className="flex flex-1 items-center gap-3">
              <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]"><KeyRound className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-black">Acceso privado de administrador</p>
                <p className="text-xs font-bold text-[#74786a]">Entrá con la clave admin configurada en Vercel.</p>
              </div>
            </div>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Clave admin"
              className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-2 text-sm font-bold outline-none focus:border-[#151711]"
            />
            <button className="rounded-2xl bg-[#151711] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Entrar</button>
          </form>
        )}

        {(connectionError || adminError) && (
          <p className="mb-5 rounded-2xl border border-[#d7c77a]/50 bg-[#f5edc9] p-3 text-sm font-bold text-[#6f6125]">
            {adminError ?? `No se pudo conectar con Neon: ${connectionError}`}
          </p>
        )}

        {adminReady && (
          <section className="space-y-4">
            <section className="rounded-[26px] border border-[#ded9cc] bg-white/80 p-3 shadow-sm md:p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Buscar tanda</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Agenda por horario y cancha</h2>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 xl:min-w-[900px]">
                  <SegmentedDay value={selectedDay} onChange={setSelectedDay} />
                  <SelectLike value={selectedCompetition} onChange={(value) => setSelectedCompetition(value as CompetitionFilter)} options={["todos", "Federado", "Colegial"]} label="Competencia" />
                  <SelectLike value={selectedCategory} onChange={setSelectedCategory} options={["todos", ...filterOptions.categories]} label="Categoría" />
                  <SelectLike value={selectedCourt} onChange={setSelectedCourt} options={["todos", ...filterOptions.courts]} label="Cancha" />
                  <SelectLike value={selectedStatus} onChange={(value) => setSelectedStatus(value as StatusFilter)} options={["todos", "por_jugar", "en_curso", "finalizado"]} label="Estado" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCompetition("todos");
                    setSelectedCategory("todos");
                    setSelectedCourt("todos");
                    setSelectedStatus("todos");
                  }}
                  className="rounded-full bg-[#f0ede3] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#74786a]"
                >
                  Limpiar filtros
                </button>

                <button
                  onClick={() => router.push("/admin/simulacion")}
                  className="rounded-full bg-sky-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5"
                >
                  Simular resultados
                </button>

                <p className="ml-auto text-xs font-black uppercase tracking-[0.14em] text-[#74786a]">{visibleMatches.length} partidos visibles</p>
              </div>
            </section>

            <AdminChampionTable rows={championRows} />

            <AdminCategoryTables tables={categoryTables} />

            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-3 shadow-sm md:p-5">
              <div className="space-y-4">
                {scheduleGroups.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#ded9cc] p-8 text-center text-sm font-bold text-[#74786a]">No hay partidos con esos filtros.</p>
                ) : (
                  scheduleGroups.map((group) => {
                    const runningCount = group.matches.filter((match) => match.isRunning).length;
                    const finishedCount = group.matches.filter((match) => match.status === "finalizado").length;
                    const groupKey = `${selectedDay}-${group.timeLabel}`;

                    return (
                      <section key={group.timeLabel} className="rounded-[28px] border border-[#e9e3d4] bg-[#fbfaf6] p-3 md:p-4">
                        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#74786a]">Tanda horaria</p>
                            <h3 className="text-5xl font-black tracking-[-0.08em]">{group.timeLabel}</h3>
                            <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#74786a]">
                              {group.matches.length} partidos · {runningCount} en juego · {finishedCount} finalizados
                            </p>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <BatchButton
                              icon={Play}
                              label="Iniciar tanda"
                              disabled={busyGroup !== null || group.matches.every((match) => match.isRunning || match.status === "finalizado")}
                              onClick={() => void runGroupAction(groupKey, group.matches, "start")}
                            />
                            <BatchButton
                              icon={Pause}
                              label="Pausar tanda"
                              disabled={busyGroup !== null || group.matches.every((match) => !match.isRunning)}
                              onClick={() => void runGroupAction(groupKey, group.matches, "pause")}
                            />
                            <BatchButton
                              icon={RotateCcw}
                              label="Reloj a 0"
                              disabled={busyGroup !== null || group.matches.every((match) => match.status === "finalizado")}
                              onClick={() => {
                                if (window.confirm("Esto pone en 00:00 el reloj de todos los partidos pendientes/en juego de esta tanda. ¿Seguro?")) {
                                  void runGroupAction(groupKey, group.matches, "reset");
                                }
                              }}
                            />
                            <BatchButton
                              icon={CheckCircle2}
                              label="Finalizar tanda"
                              disabled={busyGroup !== null || group.matches.every((match) => match.status === "finalizado")}
                              onClick={() => {
                                if (window.confirm("Esto finaliza todos los partidos no finalizados de esta tanda. ¿Seguro?")) {
                                  void runGroupAction(groupKey, group.matches, "finish");
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {group.matches.map((match) => (
                            <MatchAgendaCard key={match.id} match={match} onOpen={() => router.push(`/admin/partido/${match.id}`)} />
                          ))}
                        </div>
                      </section>
                    );
                  })
                )}
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}

function AdminChampionTable({ rows }: { rows: ChampionRow[] }) {
  const totalGoals = rows.reduce((sum, row) => sum + row.gf, 0);
  const totalFinished = rows.reduce((sum, row) => sum + row.j, 0) / 2;
  const activeTables = rows.reduce((max, row) => Math.max(max, row.tablesPlayed), 0);
  const hasRealResults = totalFinished > 0;
  const leader = hasRealResults ? rows[0] : null;

  return (
    <section className="rounded-[20px] border border-[#ded9cc] bg-white/90 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#e8e2d5] px-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            Campeón general
          </p>
          <h2 className="text-base font-black tracking-[-0.025em] text-[#151711] md:text-lg">
            Tabla global acumulada
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <CompactPill label="Líder" value={leader?.school ?? "Sin datos"} />
          <CompactPill label="Finalizados" value={Math.round(totalFinished)} />
          <CompactPill label="Goles" value={totalGoals} />
          <CompactPill label="Tablas" value={activeTables} />
        </div>
      </div>

      <p className="px-3 pt-2 text-[11px] font-semibold leading-5 text-[#74786a]">
        Suma los puntos de todas las categorías. <b>1°</b> indica cuántas tablas lidera cada colegio. Solo cuenta tablas con resultados finalizados.
      </p>

      {rows.length === 0 ? (
        <p className="m-3 rounded-xl border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-4 text-center text-xs font-bold text-[#74786a]">
          La tabla general se arma cuando se finalizan partidos de grupo.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto px-3 pb-3">
          <table className="w-full min-w-[760px] border-collapse overflow-hidden rounded-xl bg-[#fbfaf6] text-left text-[11px]">
            <thead className="bg-[#f0ede3] text-[8px] font-black uppercase tracking-[0.12em] text-[#74786a]">
              <tr>
                <th className="w-9 px-2 py-2 text-center">#</th>
                <th className="min-w-[160px] px-2 py-2">Colegio</th>
                <th className="px-2 py-2 text-center">PTS</th>
                <th className="px-2 py-2 text-center">1°</th>
                <th className="px-2 py-2 text-center">J</th>
                <th className="px-2 py-2 text-center">G</th>
                <th className="px-2 py-2 text-center">E</th>
                <th className="px-2 py-2 text-center">P</th>
                <th className="px-2 py-2 text-center">GF</th>
                <th className="px-2 py-2 text-center">GC</th>
                <th className="px-2 py-2 text-center">DIF</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={row.school} className="border-b border-[#eee9dd] last:border-b-0">
                  <td className="px-2 py-1.5 text-center text-[10px] font-black text-[#74786a]">
                    {index + 1}
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="whitespace-nowrap text-[11px] font-black uppercase text-[#151711]">
                      {row.school}
                    </span>
                  </td>
                  <CompactValue value={row.pts} strong />
                  <CompactValue value={row.firstPlaces} strong={row.firstPlaces > 0} />
                  <CompactValue value={row.j} />
                  <CompactValue value={row.g} />
                  <CompactValue value={row.e} />
                  <CompactValue value={row.p} />
                  <CompactValue value={row.gf} />
                  <CompactValue value={row.gc} />
                  <CompactValue value={formatDiff(row.dif)} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AdminCategoryTables({ tables }: { tables: AdminCategoryTable[] }) {
  const [selectedKey, setSelectedKey] = useState("");
  const selectedTable = tables.find((table) => table.key === selectedKey) ?? tables[0];

  return (
    <section className="rounded-[20px] border border-[#ded9cc] bg-white/90 shadow-sm">
      <div className="border-b border-[#e8e2d5] px-3 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#74786a]">
              Tablas por categoría
            </p>
            <h2 className="text-base font-black tracking-[-0.025em] text-[#151711] md:text-lg">
              Elegí una tabla para ver
            </h2>
          </div>

          <span className="w-fit rounded-full bg-[#151711] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
            {tables.length} tablas
          </span>
        </div>

        {tables.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {tables.map((table) => {
              const active = selectedTable?.key === table.key;

              return (
                <button
                  key={table.key}
                  type="button"
                  onClick={() => setSelectedKey(table.key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] transition ${
                    active
                      ? "bg-[#151711] text-white"
                      : "border border-[#ded9cc] bg-[#fbfaf6] text-[#74786a] hover:text-[#151711]"
                  }`}
                >
                  {shortCompetition(table.competition)} · {table.category.replace("Categoría ", "Cat. ")}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {tables.length === 0 || !selectedTable ? (
        <p className="m-3 rounded-xl border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-4 text-center text-xs font-bold text-[#74786a]">
          Las tablas aparecen cuando hay partidos cargados.
        </p>
      ) : (
        <div className="px-3 pb-3 pt-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#74786a]">
                {selectedTable.competition}
              </p>
              <h3 className="text-sm font-black uppercase text-[#151711]">
                {selectedTable.category}
              </h3>
            </div>

            <span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${
              selectedTable.hasResults ? "bg-emerald-50 text-emerald-700" : "bg-[#f0ede3] text-[#74786a]"
            }`}>
              {selectedTable.hasResults ? "Con resultados" : "Sin resultados"}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#e6e0d3] bg-[#fbfaf6]">
            <table className="w-full min-w-[680px] border-collapse text-left text-[11px]">
              <thead className="bg-[#f0ede3] text-[8px] font-black uppercase tracking-[0.12em] text-[#74786a]">
                <tr>
                  <th className="w-9 px-2 py-2 text-center">#</th>
                  <th className="min-w-[160px] px-2 py-2">Colegio</th>
                  <th className="px-2 py-2 text-center">PTS</th>
                  <th className="px-2 py-2 text-center">J</th>
                  <th className="px-2 py-2 text-center">G</th>
                  <th className="px-2 py-2 text-center">E</th>
                  <th className="px-2 py-2 text-center">P</th>
                  <th className="px-2 py-2 text-center">GF</th>
                  <th className="px-2 py-2 text-center">GC</th>
                  <th className="px-2 py-2 text-center">DIF</th>
                </tr>
              </thead>

              <tbody>
                {selectedTable.rows.map((row, index) => (
                  <tr key={`${selectedTable.key}-${row.school}`} className="border-b border-[#eee9dd] last:border-b-0">
                    <td className="px-2 py-1.5 text-center text-[10px] font-black text-[#74786a]">
                      {index + 1}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="whitespace-nowrap text-[11px] font-black uppercase text-[#151711]">
                        {row.school}
                      </span>
                    </td>
                    <CompactValue value={row.pts} strong />
                    <CompactValue value={row.j} />
                    <CompactValue value={row.g} />
                    <CompactValue value={row.e} />
                    <CompactValue value={row.p} />
                    <CompactValue value={row.gf} />
                    <CompactValue value={row.gc} />
                    <CompactValue value={formatDiff(row.dif)} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function CompactPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-[#ded9cc] bg-[#fbfaf6] px-2.5 py-1">
      <span className="mr-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#74786a]">
        {label}:
      </span>
      <span className="text-[11px] font-black text-[#151711]">{value}</span>
    </div>
  );
}

function CompactValue({ value, strong = false }: { value: string | number; strong?: boolean }) {
  return (
    <td className={`px-2 py-1.5 text-center text-[11px] ${strong ? "font-black text-[#151711]" : "font-bold text-[#74786a]"}`}>
      {value}
    </td>
  );
}

function shortCompetition(value: string) {
  return value === "Federado" ? "Fed." : value === "Colegial" ? "Col." : value;
}

function SegmentedDay({ value, onChange }: { value: DayKey; onChange: (value: DayKey) => void }) {
  return (
    <div className="rounded-2xl bg-[#f0ede3] p-1">
      {(["dia1", "dia2"] as DayKey[]).map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => onChange(day)}
          className={`w-1/2 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${value === day ? "bg-[#151711] text-white" : "text-[#74786a]"}`}
        >
          {dayLabel(day)}
        </button>
      ))}
    </div>
  );
}

function SelectLike({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="relative block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-3 pr-9 text-xs font-black uppercase tracking-[0.08em] outline-none focus:border-[#151711]"
      >
        {options.map((option) => (
          <option key={option} value={option}>{optionLabel(option)}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-[#74786a]" />
    </label>
  );
}

function BatchButton({ icon: Icon, label, onClick, disabled }: { icon: typeof Play; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151711] px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MatchAgendaCard({ match, onOpen }: { match: MatchItem; onOpen: () => void }) {
  const isRunning = match.status === "en_curso";
  const isFinished = match.status === "finalizado";

  return (
    <article
      className={`rounded-3xl border p-4 transition ${
        isRunning
          ? "border-emerald-200 bg-emerald-50"
          : isFinished
            ? "border-[#e9e3d4] bg-white/65 opacity-75"
            : "border-[#e9e3d4] bg-white"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            {shortCourt(match.court)} · {getCompetitionFromCategory(match.category)}
          </p>
          <p className="mt-1 text-sm font-black uppercase tracking-[0.08em]">{getCleanCategory(match.category)}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${isRunning ? "bg-emerald-600 text-white" : "bg-[#f0ede3] text-[#74786a]"}`}>
          {statusLabel(match.status)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <SmallTeam name={match.teamA} />
        <p className="text-sm font-black text-[#74786a]">{scoreText(match)}</p>
        <SmallTeam name={match.teamB} align="right" />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#151711] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
      >
        <ClipboardList className="h-4 w-4" />
        Cargar resultado
      </button>
    </article>
  );
}

function isFinishedWithScore(match: MatchItem): match is MatchItem & { scoreA: number; scoreB: number } {
  return match.status === "finalizado" && match.scoreA !== null && match.scoreB !== null;
}

function buildChampionTable(matches: MatchItem[]): ChampionRow[] {
  const rows = new Map<string, ChampionRow>();
  const groupMatches = matches.filter((match) => match.stage === "grupo");

  for (const match of groupMatches) {
    ensureChampionRow(rows, schoolNameForAdmin(match.teamA));
    ensureChampionRow(rows, schoolNameForAdmin(match.teamB));

    if (!isFinishedWithScore(match)) continue;

    const teamA = ensureChampionRow(rows, schoolNameForAdmin(match.teamA));
    const teamB = ensureChampionRow(rows, schoolNameForAdmin(match.teamB));

    teamA.j += 1;
    teamB.j += 1;
    teamA.gf += match.scoreA;
    teamA.gc += match.scoreB;
    teamB.gf += match.scoreB;
    teamB.gc += match.scoreA;

    if (match.scoreA > match.scoreB) {
      teamA.g += 1;
      teamB.p += 1;
      teamA.pts += 3;
    } else if (match.scoreB > match.scoreA) {
      teamB.g += 1;
      teamA.p += 1;
      teamB.pts += 3;
    } else {
      teamA.e += 1;
      teamB.e += 1;
      teamA.pts += 1;
      teamB.pts += 1;
    }

    teamA.dif = teamA.gf - teamA.gc;
    teamB.dif = teamB.gf - teamB.gc;
  }

  const categoryTables = buildCategoryTables(matches);

  for (const table of categoryTables) {
    if (!table.hasResults) continue;

    for (const row of table.rows) {
      const championRow = ensureChampionRow(rows, row.school);
      championRow.tablesPlayed += 1;
    }

    const first = table.rows[0];
    if (first) {
      ensureChampionRow(rows, first.school).firstPlaces += 1;
    }
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.firstPlaces - a.firstPlaces ||
      b.dif - a.dif ||
      b.gf - a.gf ||
      a.school.localeCompare(b.school)
  );
}

function buildCategoryTables(matches: MatchItem[]): AdminCategoryTable[] {
  const tablesByCategory = new Map<string, MatchItem[]>();
  const groupMatches = matches.filter((match) => match.stage === "grupo");

  for (const match of groupMatches) {
    const competition = getCompetitionFromCategory(match.category);
    const category = getCleanCategory(match.category);
    const key = `${competition} · ${category}`;
    tablesByCategory.set(key, [...(tablesByCategory.get(key) ?? []), match]);
  }

  return [...tablesByCategory.entries()]
    .map(([key, tableMatches]) => {
      const competition = getCompetitionFromCategory(tableMatches[0]?.category ?? "");
      const category = getCleanCategory(tableMatches[0]?.category ?? key);

      return {
        key,
        title: key,
        competition,
        category,
        hasResults: tableMatches.some(isFinishedWithScore),
        rows: buildCategoryStanding(tableMatches),
      };
    })
    .sort(
      (a, b) =>
        a.competition.localeCompare(b.competition) ||
        compareCleanCategories(a.category, b.category)
    );
}

function buildCategoryStanding(matches: MatchItem[]): CategoryStandingRow[] {
  const rows = new Map<string, CategoryStandingRow>();

  for (const match of matches) {
    const teamA = ensureCategoryRow(rows, schoolNameForAdmin(match.teamA));
    const teamB = ensureCategoryRow(rows, schoolNameForAdmin(match.teamB));

    if (!isFinishedWithScore(match)) continue;

    teamA.j += 1;
    teamB.j += 1;
    teamA.gf += match.scoreA;
    teamA.gc += match.scoreB;
    teamB.gf += match.scoreB;
    teamB.gc += match.scoreA;

    if (match.scoreA > match.scoreB) {
      teamA.g += 1;
      teamB.p += 1;
      teamA.pts += 3;
    } else if (match.scoreB > match.scoreA) {
      teamB.g += 1;
      teamA.p += 1;
      teamB.pts += 3;
    } else {
      teamA.e += 1;
      teamB.e += 1;
      teamA.pts += 1;
      teamB.pts += 1;
    }

    teamA.dif = teamA.gf - teamA.gc;
    teamB.dif = teamB.gf - teamB.gc;
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.dif - a.dif ||
      b.gf - a.gf ||
      a.school.localeCompare(b.school)
  );
}

function ensureChampionRow(map: Map<string, ChampionRow>, school: string) {
  if (!map.has(school)) {
    map.set(school, {
      school,
      pts: 0,
      firstPlaces: 0,
      tablesPlayed: 0,
      j: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      dif: 0,
    });
  }

  return map.get(school)!;
}

function ensureCategoryRow(map: Map<string, CategoryStandingRow>, school: string) {
  if (!map.has(school)) {
    map.set(school, {
      school,
      pts: 0,
      j: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      dif: 0,
    });
  }

  return map.get(school)!;
}

function schoolNameForAdmin(team: string) {
  const normalized = team.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (normalized === "lcd" || normalized.includes("candiles")) return "Los Candiles";
  if (normalized.includes("torreon")) return "Torreón";
  if (normalized.includes("portezuelo")) return "Portezuelo";
  if (normalized.includes("crisol")) return "Crisol";
  if (normalized.includes("buen ayre")) return "Buen Ayre";
  if (normalized.includes("mirasoles")) return "Mirasoles";
  if (normalized.includes("cerros")) return "Los Cerros";
  return team;
}

function formatDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}


function groupMatchesByTime(matches: MatchItem[]) {
  const map = new Map<string, MatchItem[]>();

  for (const match of matches) {
    const time = normalizeTimeLabel(match.timeLabel);
    const current = map.get(time) ?? [];
    current.push(match);
    map.set(time, current);
  }

  return Array.from(map.entries())
    .map(([timeLabel, grouped]) => ({ timeLabel, matches: grouped.sort(compareMatchesForAdmin) }))
    .sort((a, b) => timeToMinutes(a.timeLabel) - timeToMinutes(b.timeLabel));
}

function compareMatchesForAdmin(a: MatchItem, b: MatchItem) {
  return (
    timeToMinutes(a.timeLabel) - timeToMinutes(b.timeLabel) ||
    compareCourts(a.court, b.court) ||
    getCompetitionFromCategory(a.category).localeCompare(getCompetitionFromCategory(b.category)) ||
    compareCleanCategories(getCleanCategory(a.category), getCleanCategory(b.category)) ||
    a.id - b.id
  );
}

function compareCourts(a: string, b: string) {
  return courtNumber(a) - courtNumber(b) || a.localeCompare(b);
}

function compareCleanCategories(a: string, b: string) {
  return categoryNumber(a) - categoryNumber(b) || a.localeCompare(b);
}

function categoryNumber(value: string) {
  const match = value.match(/categor[ií]a\s*(\d+)/i);
  return match ? Number(match[1]) : 99;
}

function courtNumber(value: string) {
  const match = value.match(/cancha\s*(\d+)/i);
  return match ? Number(match[1]) : 99;
}

function timeToMinutes(value: string) {
  const match = normalizeTimeLabel(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function dayLabel(day: string) {
  return day === "dia1" ? "Día 1" : "Día 2";
}

function statusLabel(status: string) {
  if (status === "en_curso") return "En juego";
  if (status === "finalizado") return "Finalizado";
  return "Pendiente";
}

function optionLabel(option: string) {
  if (option === "todos") return "Todos";
  if (option === "por_jugar") return "Pendiente";
  if (option === "en_curso") return "En juego";
  if (option === "finalizado") return "Finalizado";
  return option;
}

function normalizeTimeLabel(value?: string) {
  return (value ?? "")
    .trim()
    .replace(/^(\d{1,2}),(\d{2})(.*)$/g, "$1:$2$3")
    .replace(/\s*hs?\.?$/i, " hs");
}

function shortCourt(value: string) {
  return value.replace(/\s*\((.*?)\)/g, "").trim();
}

function getCleanCategory(category: string) {
  return category.replace(/\s*(federado|colegial)\s*$/i, "").trim();
}

function getCompetitionFromCategory(category: string) {
  const normalized = category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("federado")) return "Federado";
  if (normalized.includes("colegial")) return "Colegial";
  return "General";
}

function getSchoolShield(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("portezuelo")) return "/escudos/portezuelo.png";
  if (normalized.includes("torreon")) return "/escudos/torreon.png";
  if (normalized.includes("lcd") || normalized.includes("candiles")) return "/escudos/los-candiles.png";
  if (normalized.includes("crisol")) return "/escudos/crisol.png";
  if (normalized.includes("buen ayre")) return "/escudos/buen-ayre.png";
  if (normalized.includes("mirasoles")) return "/escudos/mirasoles.png";
  if (normalized.includes("cerros")) return "/escudos/los-cerros.png";
  return null;
}

function getInitials(name: string) {
  return name
    .replace(/[^a-zA-ZÁÉÍÓÚÜÑáéíóúüñ ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function scoreText(match: MatchItem) {
  if (match.scoreA === null || match.scoreB === null) return "---";
  return `${match.scoreA}-${match.scoreB}`;
}

function SmallTeam({ name, align = "left" }: { name: string; align?: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end text-right" : ""}`}>
      {align === "left" && <TeamShield name={name} />}
      <span className="truncate text-sm font-black">{name}</span>
      {align === "right" && <TeamShield name={name} />}
    </div>
  );
}

function TeamShield({ name }: { name: string }) {
  const src = getSchoolShield(name);

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#ded9cc] bg-white">
      {src ? (
        <Image src={src} alt={`Escudo de ${name}`} width={64} height={64} className="h-full w-full object-contain p-1" />
      ) : (
        <span className="text-[9px] font-black text-[#151711]"><ShieldCheck className="mx-auto h-3 w-3" />{getInitials(name)}</span>
      )}
    </div>
  );
}
