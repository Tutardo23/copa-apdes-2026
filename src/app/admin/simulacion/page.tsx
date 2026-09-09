"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  useSimulation,
  type SimulatedCard,
  type SimulatedGoal,
  type SimulatedResult,
} from "@/src/components/providers/SimulationProvider";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import {
  buildGroupStandings,
  parsePenaltyScore,
} from "@/src/lib/tournament-engine";
import type { MatchItem } from "@/src/lib/tournament-types";

type CompetitionFilter = "Federado" | "Colegial";
type CategoryFilter =
  | "Categoría 1"
  | "Categoría 2"
  | "Categoría 3";

type ScorerRow = {
  name: string;
  team: string;
  goals: number;
};

const COMPETITIONS: CompetitionFilter[] = ["Federado", "Colegial"];
const CATEGORIES: CategoryFilter[] = [
  "Categoría 1",
  "Categoría 2",
  "Categoría 3",
];

export default function SimulationAdminPage() {
  const {
    matches: realMatches,
    adminReady,
    adminError,
    authenticateAdmin,
  } = useTournament();
  const {
    simulatedResults,
    setSimulatedResult,
    removeSimulatedResult,
    clearSimulation,
    getEffectiveMatches,
    simulationEnabled,
    setSimulationEnabled,
    refreshSimulation,
    syncing,
    syncError,
  } = useSimulation();

  const [password, setPassword] = useState("");
  const [competition, setCompetition] =
    useState<CompetitionFilter>("Federado");
  const [category, setCategory] =
    useState<CategoryFilter>("Categoría 1");

  useEffect(() => {
    if (!adminReady) return;
    setSimulationEnabled(true);
    void refreshSimulation();
  }, [adminReady, refreshSimulation, setSimulationEnabled]);

  const matches = useMemo(
    () => getEffectiveMatches(realMatches),
    [getEffectiveMatches, realMatches],
  );

  const scopedMatches = useMemo(
    () =>
      matches
        .filter((match) => matchBelongsTo(match, competition, category))
        .sort(sortMatches),
    [category, competition, matches],
  );

  const groupMatches = scopedMatches.filter(
    (match) => match.stage === "grupo",
  );
  const bracketMatches = scopedMatches.filter(
    (match) => match.stage !== "grupo",
  );
  const table = buildGroupStandings(groupMatches);
  const scorers = buildScorers(scopedMatches);

  const totalGoals = scopedMatches.reduce((sum, match) => {
    if (
      match.status !== "finalizado" ||
      match.scoreA === null ||
      match.scoreB === null
    ) {
      return sum;
    }
    return sum + match.scoreA + match.scoreB;
  }, 0);

  const bestDefense = [...table]
    .filter((row) => row.j > 0)
    .sort(
      (a, b) =>
        a.gc - b.gc || b.pts - a.pts || a.team.localeCompare(b.team),
    )[0];

  const allGroupPlayed =
    groupMatches.length > 0 &&
    groupMatches.every(
      (match) =>
        match.status === "finalizado" &&
        match.scoreA !== null &&
        match.scoreB !== null,
    );

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#62675d]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al admin
            </Link>

            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
              Panel privado
            </p>
            <h1 className="text-[2.6rem] font-black leading-[0.92] tracking-[-0.07em] md:text-7xl">
              Simulación compartida
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#62675d]">
              Esta prueba se guarda en una tabla separada de Neon. Las distintas
              computadoras ven la misma simulación y los resultados reales no se
              modifican.
            </p>
          </div>

          {simulationEnabled && adminReady && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-900">
              {syncing ? "Sincronizando..." : "Compartida · actualiza cada 2,5 s"}
            </div>
          )}
        </header>

        {!adminReady && (
          <form
            className="mb-5 flex flex-col gap-3 rounded-[28px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await authenticateAdmin(password);
              if (ok) {
                setPassword("");
                setSimulationEnabled(true);
                window.setTimeout(() => void refreshSimulation(), 0);
              }
            }}
          >
            <div className="flex flex-1 items-center gap-3">
              <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black">Acceso de administrador</p>
                <p className="text-xs font-bold text-[#74786a]">
                  La sesión se conserva aunque refresques la página.
                </p>
              </div>
            </div>

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Clave admin"
              className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none focus:border-[#151711]"
            />
            <button className="rounded-2xl bg-[#151711] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              Entrar
            </button>
          </form>
        )}

        {(adminError || syncError) && (
          <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
            {adminError ?? syncError}
          </p>
        )}

        {adminReady && (
          <section className="space-y-6">
            <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm md:p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="grid gap-4 md:grid-cols-2">
                  <FilterBlock title="Competencia">
                    {COMPETITIONS.map((item) => (
                      <PillButton
                        key={item}
                        active={competition === item}
                        onClick={() => setCompetition(item)}
                      >
                        {item}
                      </PillButton>
                    ))}
                  </FilterBlock>

                  <FilterBlock title="Categoría">
                    {CATEGORIES.map((item) => (
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

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "¿Borrar toda la simulación compartida? Esto NO toca resultados reales.",
                      )
                    ) {
                      void clearSimulation();
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#62675d]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpiar simulación
                </button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
              <div className="space-y-4">
                <SectionTitle
                  label="Carga ficticia"
                  title={`Fase de grupos · ${category} ${competition}`}
                  help="Resultado, goleadoras por nombre y cantidad, y tarjetas. Todo se comparte entre las computadoras de prueba."
                />

                {groupMatches.length === 0 ? (
                  <EmptyMessage text="No hay partidos de grupo para esta categoría." />
                ) : (
                  groupMatches.map((match) => (
                    <SimulationRow
                      key={match.id}
                      match={match}
                      simulated={simulatedResults[match.id]}
                      onSave={setSimulatedResult}
                      onRemove={removeSimulatedResult}
                    />
                  ))
                )}
              </div>

              <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                <section className="rounded-[30px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
                    Tabla simulada
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Clasificación
                  </h2>

                  <div className="mt-4 space-y-2">
                    {table.length === 0 ? (
                      <EmptyMessage text="Sin datos para la tabla." />
                    ) : (
                      table.map((row, index) => (
                        <div
                          key={row.team}
                          className={`grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-2xl p-3 ${
                            index < 4 ? "bg-sky-50" : "bg-[#fbfaf6]"
                          }`}
                        >
                          <span className="text-sm font-black text-[#74786a]">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">
                              {row.team}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
                              {row.gf}:{row.gc} · Dif {formatDiff(row.difValue)}
                            </p>
                          </div>
                          <span className="text-lg font-black">{row.pts}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#f6f4ee] p-3">
                    <p className="flex items-center gap-2 text-xs font-black text-[#62675d]">
                      <CheckCircle2 className="h-4 w-4" />
                      {allGroupPlayed
                        ? "Grupo completo: cruces definidos."
                        : "Completá todos los partidos para definir los cruces."}
                    </p>
                  </div>
                </section>

                <section className="rounded-[30px] bg-[#151711] p-4 text-white shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                    Estadísticas simuladas
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniStat
                      icon={Target}
                      label="Goles"
                      value={totalGoals}
                    />
                    <MiniStat
                      icon={ShieldCheck}
                      label="Valla"
                      value={bestDefense?.team ?? "—"}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/10 p-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                      Goleadoras · todas
                    </p>
                    {scorers.length === 0 ? (
                      <p className="text-xs font-bold text-white/55">
                        Cargá nombres para ver el ranking.
                      </p>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {scorers.map((scorer, index) => (
                          <div
                            key={`${scorer.name}-${scorer.team}`}
                            className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black">
                                #{index + 1} · {scorer.name}
                              </p>
                              <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                                {scorer.team}
                              </p>
                            </div>
                            <span className="rounded-full bg-[#d7c77a] px-2 py-1 text-xs font-black text-[#151711]">
                              {scorer.goals}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </aside>
            </section>

            <section className="space-y-4">
              <SectionTitle
                label="Fase final"
                title={
                  allGroupPlayed
                    ? "Cruces definidos"
                    : "Esperando cierre de grupos"
                }
                help="Podés probar 5°/6°, semifinales, 3°/4° y final. En empate aparece la definición por penales."
              />
              <div className="grid gap-4 lg:grid-cols-3">
                {bracketMatches.map((match) => (
                  <SimulationRow
                    key={match.id}
                    match={match}
                    simulated={simulatedResults[match.id]}
                    onSave={setSimulatedResult}
                    onRemove={removeSimulatedResult}
                    compact
                  />
                ))}
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}

function SimulationRow({
  match,
  simulated,
  onSave,
  onRemove,
  compact = false,
}: {
  match: MatchItem;
  simulated?: SimulatedResult;
  onSave: (
    matchId: number,
    scoreA: number,
    scoreB: number,
    goalsA?: SimulatedGoal[],
    goalsB?: SimulatedGoal[],
    cardsA?: SimulatedCard[],
    cardsB?: SimulatedCard[],
    penalties?: string | null,
  ) => Promise<boolean>;
  onRemove: (matchId: number) => Promise<boolean>;
  compact?: boolean;
}) {
  const [scoreA, setScoreA] = useState(
    String(simulated?.scoreA ?? match.scoreA ?? ""),
  );
  const [scoreB, setScoreB] = useState(
    String(simulated?.scoreB ?? match.scoreB ?? ""),
  );
  const [goalsA, setGoalsA] = useState<SimulatedGoal[]>(
    simulated?.goalsA ?? [],
  );
  const [goalsB, setGoalsB] = useState<SimulatedGoal[]>(
    simulated?.goalsB ?? [],
  );
  const [cardsA, setCardsA] = useState<SimulatedCard[]>(
    simulated?.cardsA ?? [],
  );
  const [cardsB, setCardsB] = useState<SimulatedCard[]>(
    simulated?.cardsB ?? [],
  );
  const [saving, setSaving] = useState(false);

  const initialPenalties = parsePenaltyScore(
    simulated?.penalties ?? match.penalties,
  );
  const [penaltyA, setPenaltyA] = useState(
    initialPenalties ? String(initialPenalties.scoreA) : "",
  );
  const [penaltyB, setPenaltyB] = useState(
    initialPenalties ? String(initialPenalties.scoreB) : "",
  );

  useEffect(() => {
    setScoreA(String(simulated?.scoreA ?? match.scoreA ?? ""));
    setScoreB(String(simulated?.scoreB ?? match.scoreB ?? ""));
    setGoalsA(simulated?.goalsA ?? []);
    setGoalsB(simulated?.goalsB ?? []);
    setCardsA(simulated?.cardsA ?? []);
    setCardsB(simulated?.cardsB ?? []);

    const penalties = parsePenaltyScore(
      simulated?.penalties ?? match.penalties,
    );
    setPenaltyA(penalties ? String(penalties.scoreA) : "");
    setPenaltyB(penalties ? String(penalties.scoreB) : "");
  }, [match.id, match.scoreA, match.scoreB, match.penalties, simulated]);

  const numericA = Number(scoreA);
  const numericB = Number(scoreB);
  const validScores =
    Number.isInteger(numericA) &&
    Number.isInteger(numericB) &&
    numericA >= 0 &&
    numericB >= 0;
  const needsPenalties =
    match.stage !== "grupo" && validScores && numericA === numericB;
  const assignedA = goalsA.reduce((sum, goal) => sum + goal.count, 0);
  const assignedB = goalsB.reduce((sum, goal) => sum + goal.count, 0);

  const save = async () => {
    if (!validScores) {
      window.alert("Cargá un marcador válido.");
      return;
    }

    if (assignedA > numericA || assignedB > numericB) {
      window.alert(
        "La cantidad de goles asignados a jugadoras no puede superar el resultado del partido.",
      );
      return;
    }

    let penalties: string | null = null;

    if (needsPenalties) {
      const pA = Number(penaltyA);
      const pB = Number(penaltyB);

      if (
        !Number.isInteger(pA) ||
        !Number.isInteger(pB) ||
        pA < 0 ||
        pB < 0 ||
        pA === pB
      ) {
        window.alert("La definición por penales necesita un ganador.");
        return;
      }

      penalties = `${pA}-${pB}`;
    }

    setSaving(true);
    try {
      await onSave(
        match.id,
        numericA,
        numericB,
        goalsA,
        goalsB,
        cardsA,
        cardsB,
        penalties,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-[26px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#74786a]">
            {stageLabel(match)} · {displayTime(match.timeLabel)}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#9a9486]">
            {match.court}
          </p>
        </div>
        {simulated && (
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-sky-800">
            Compartido
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <MiniScoreInput label={match.teamA} value={scoreA} onChange={setScoreA} />
        <span className="pb-3 text-xl font-black text-[#d7c77a]">:</span>
        <MiniScoreInput label={match.teamB} value={scoreB} onChange={setScoreB} />
      </div>

      {!compact && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <GoalEditor
              team={shortTeam(match.teamA)}
              goals={goalsA}
              onChange={setGoalsA}
              maxGoals={validScores ? numericA : 0}
            />
            <GoalEditor
              team={shortTeam(match.teamB)}
              goals={goalsB}
              onChange={setGoalsB}
              maxGoals={validScores ? numericB : 0}
            />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <CardEditor
              team={shortTeam(match.teamA)}
              cards={cardsA}
              onChange={setCardsA}
            />
            <CardEditor
              team={shortTeam(match.teamB)}
              cards={cardsB}
              onChange={setCardsB}
            />
          </div>
        </div>
      )}

      {needsPenalties && (
        <div className="mt-3 rounded-2xl border border-[#d7c77a]/50 bg-[#fff8dc] p-3">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.15em] text-[#6f6125]">
            Penales
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <MiniScoreInput
              label={shortTeam(match.teamA)}
              value={penaltyA}
              onChange={setPenaltyA}
            />
            <span className="pb-3 text-lg font-black text-[#9c8737]">:</span>
            <MiniScoreInput
              label={shortTeam(match.teamB)}
              value={penaltyB}
              onChange={setPenaltyB}
            />
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-2xl bg-[#151711] px-3 py-3 text-[9px] font-black uppercase tracking-[0.13em] text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar prueba"}
        </button>
        <button
          type="button"
          disabled={!simulated || saving}
          onClick={() => void onRemove(match.id)}
          className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-3 text-[9px] font-black uppercase tracking-[0.13em] text-[#74786a] disabled:opacity-35"
        >
          Quitar prueba
        </button>
      </div>
    </article>
  );
}

function GoalEditor({
  team,
  goals,
  onChange,
  maxGoals,
}: {
  team: string;
  goals: SimulatedGoal[];
  onChange: (goals: SimulatedGoal[]) => void;
  maxGoals: number;
}) {
  const assigned = goals.reduce((sum, goal) => sum + goal.count, 0);

  return (
    <section className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#74786a]">
            Goleadoras
          </p>
          <p className="truncate text-xs font-black">{team}</p>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-[#74786a]">
          {assigned}/{maxGoals}
        </span>
      </div>

      <div className="space-y-2">
        {goals.map((goal, index) => (
          <div key={index} className="grid grid-cols-[1fr_68px_34px] gap-2">
            <input
              value={goal.player}
              onChange={(event) => {
                const next = [...goals];
                next[index] = { ...goal, player: event.target.value };
                onChange(next);
              }}
              placeholder="Nombre de jugadora"
              className="min-w-0 rounded-xl border border-[#ded9cc] bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#151711]"
            />
            <input
              type="number"
              min={1}
              max={20}
              value={goal.count}
              onChange={(event) => {
                const next = [...goals];
                next[index] = {
                  ...goal,
                  count: Math.max(1, Number(event.target.value) || 1),
                };
                onChange(next);
              }}
              aria-label="Cantidad de goles"
              className="rounded-xl border border-[#ded9cc] bg-white px-2 py-2 text-center text-xs font-black outline-none focus:border-[#151711]"
            />
            <button
              type="button"
              onClick={() => onChange(goals.filter((_, i) => i !== index))}
              className="rounded-xl border border-[#ded9cc] bg-white text-sm font-black text-red-600"
              aria-label="Quitar goleadora"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...goals, { player: "", count: 1 }])}
        className="mt-2 w-full rounded-xl border border-dashed border-[#cfc8b8] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#62675d]"
      >
        + Agregar goleadora
      </button>
    </section>
  );
}

function CardEditor({
  team,
  cards,
  onChange,
}: {
  team: string;
  cards: SimulatedCard[];
  onChange: (cards: SimulatedCard[]) => void;
}) {
  return (
    <section className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] p-3">
      <div className="mb-2">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#74786a]">
          Tarjetas
        </p>
        <p className="truncate text-xs font-black">{team}</p>
      </div>

      <div className="space-y-2">
        {cards.map((card, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_92px_58px_34px] gap-2"
          >
            <input
              value={card.player}
              onChange={(event) => {
                const next = [...cards];
                next[index] = { ...card, player: event.target.value };
                onChange(next);
              }}
              placeholder="Jugadora"
              className="min-w-0 rounded-xl border border-[#ded9cc] bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#151711]"
            />
            <select
              value={card.type}
              onChange={(event) => {
                const next = [...cards];
                next[index] = {
                  ...card,
                  type: event.target.value as SimulatedCard["type"],
                };
                onChange(next);
              }}
              className="rounded-xl border border-[#ded9cc] bg-white px-2 py-2 text-[10px] font-black outline-none"
            >
              <option value="green_card">Verde</option>
              <option value="yellow_card">Amarilla</option>
              <option value="red_card">Roja</option>
            </select>
            <input
              type="number"
              min={1}
              max={10}
              value={card.count}
              onChange={(event) => {
                const next = [...cards];
                next[index] = {
                  ...card,
                  count: Math.max(1, Number(event.target.value) || 1),
                };
                onChange(next);
              }}
              aria-label="Cantidad de tarjetas"
              className="rounded-xl border border-[#ded9cc] bg-white px-2 py-2 text-center text-xs font-black outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(cards.filter((_, i) => i !== index))}
              className="rounded-xl border border-[#ded9cc] bg-white text-sm font-black text-red-600"
              aria-label="Quitar tarjeta"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange([
            ...cards,
            { player: "", type: "green_card", count: 1 },
          ])
        }
        className="mt-2 w-full rounded-xl border border-dashed border-[#cfc8b8] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#62675d]"
      >
        + Agregar tarjeta
      </button>
    </section>
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
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-[#151711] bg-[#151711] text-white shadow-sm"
          : "border-[#ded9cc] bg-white text-[#62675d]"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({
  label,
  title,
  help,
}: {
  label: string;
  title: string;
  help: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
        {label}
      </p>
      <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
        {title}
      </h2>
      <p className="mt-1 text-sm font-bold text-[#62675d]">{help}</p>
    </div>
  );
}

function MiniScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block truncate text-[8px] font-black uppercase tracking-[0.1em] text-[#74786a]">
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={99}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#ded9cc] bg-[#fbfaf6] px-2 py-2.5 text-center text-xl font-black outline-none focus:border-[#151711]"
      />
    </label>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <Icon className="h-4 w-4 text-[#d7c77a]" />
      <p className="mt-3 text-[8px] font-black uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-5 text-center text-sm font-bold text-[#74786a]">
      {text}
    </p>
  );
}

function buildScorers(matches: MatchItem[]) {
  const map = new Map<string, ScorerRow>();

  for (const match of matches) {
    for (const event of match.events) {
      if (event.type !== "goal" || !event.player.trim()) continue;

      const team = event.team === "teamA" ? match.teamA : match.teamB;
      const key = `${event.player.trim()}|${team}`;
      const previous = map.get(key);

      map.set(key, {
        name: event.player.trim(),
        team,
        goals: (previous?.goals ?? 0) + 1,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) => b.goals - a.goals || a.name.localeCompare(b.name),
  );
}

function matchBelongsTo(
  match: MatchItem,
  competition: CompetitionFilter,
  category: CategoryFilter,
) {
  const normalized = normalize(match.category);
  return (
    normalized.includes(normalize(competition)) &&
    normalized.includes(normalize(category))
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortTeam(value: string) {
  return value.replace(/\s*\([^)]+\)\s*$/g, "").trim();
}

function stageLabel(match: MatchItem) {
  if (match.stage === "grupo") return "Grupo";
  if (match.stage === "semifinal") return "Semifinal";

  const time = displayTime(match.timeLabel);
  if (time.startsWith("11:45")) return "5° / 6°";
  if (time.startsWith("14:15")) return "3° / 4°";
  if (time.startsWith("14:45")) return "1° / 2°";
  return "Definición";
}

function displayTime(value: string) {
  return value
    .trim()
    .replace(/^(\d{1,2}),(\d{2})/, "$1:$2")
    .replace(/\s*hs?\.?$/i, " hs");
}

function timeValue(value: string) {
  const match = displayTime(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function courtNumber(court: string) {
  const match = court.match(/\d+/);
  return match ? Number(match[0]) : 99;
}

function sortMatches(a: MatchItem, b: MatchItem) {
  return (
    (a.day === "dia1" ? 1 : 2) - (b.day === "dia1" ? 1 : 2) ||
    timeValue(a.timeLabel) - timeValue(b.timeLabel) ||
    courtNumber(a.court) - courtNumber(b.court) ||
    a.id - b.id
  );
}

function formatDiff(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
