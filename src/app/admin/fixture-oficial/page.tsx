"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  ExternalLink,
  KeyRound,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import { getTeamDisplayName } from "@/src/lib/schools";
import {
  OFFICIAL_FIXTURE_2026,
  OFFICIAL_FIXTURE_SUMMARY,
  OFFICIAL_MOVED_MATCHES,
  validateOfficialFixture,
} from "@/src/lib/official-fixture-2026";

export default function OfficialFixturePage() {
  const {
    matches,
    adminReady,
    adminError,
    connectionError,
    authenticateAdmin,
    createMatchesBulk,
  } = useTournament();

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);

  const validation = useMemo(() => validateOfficialFixture(), []);

  const applyFixture = async () => {
    if (!validation.ok || busy) return;

    const confirmed = window.confirm(
      `Vas a REEMPLAZAR el fixture actual (${matches.length} partidos) por el fixture oficial 2026 (${OFFICIAL_FIXTURE_SUMMARY.total} partidos).\n\nEsto elimina resultados y eventos asociados a los partidos actuales.\n\n¿Querés continuar?`,
    );

    if (!confirmed) return;

    setBusy(true);
    setApplied(false);

    try {
      const ok = await createMatchesBulk({
        mode: "replace",
        matches: OFFICIAL_FIXTURE_2026,
      });

      if (ok) setApplied(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ded9cc] bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#62675d]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a administración
            </Link>

            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">
              Copa APDES 2026
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-[-0.065em] md:text-6xl">
              Fixture oficial
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#62675d]">
              Carga validada a partir de la planilla oficial. Respeta las seis
              categorías, las canchas, los horarios, los cruces y los tres
              partidos de 2C reubicados.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#151711] px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white"
          >
            Ver página pública
            <ExternalLink className="h-4 w-4 text-[#d7c77a]" />
          </Link>
        </header>

        {!adminReady && (
          <form
            className="mb-5 flex flex-col gap-3 rounded-[28px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm sm:flex-row sm:items-center"
            onSubmit={async (event) => {
              event.preventDefault();
              await authenticateAdmin(password);
            }}
          >
            <div className="flex flex-1 items-center gap-3">
              <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black">Acceso de administrador</p>
                <p className="text-xs font-bold text-[#74786a]">
                  Usá la misma clave de la mesa de control.
                </p>
              </div>
            </div>

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Clave admin"
              className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-2 text-sm font-bold outline-none focus:border-[#151711]"
            />

            <button className="rounded-2xl bg-[#151711] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              Entrar
            </button>
          </form>
        )}

        {(connectionError || adminError) && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
            {adminError ?? connectionError}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={Database}
            label="Total"
            value={OFFICIAL_FIXTURE_SUMMARY.total}
            detail="partidos"
          />
          <SummaryCard
            icon={ShieldCheck}
            label="Grupos"
            value={OFFICIAL_FIXTURE_SUMMARY.group}
            detail="cruces validados"
          />
          <SummaryCard
            icon={Trophy}
            label="Definición"
            value={OFFICIAL_FIXTURE_SUMMARY.definition}
            detail="semis y puestos"
          />
          <SummaryCard
            icon={MapPinned}
            label="Reubicados"
            value={OFFICIAL_FIXTURE_SUMMARY.moved}
            detail="2C en Cancha 6"
          />
        </section>

        <section className="mt-5 rounded-[28px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74786a]">
                Control automático
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                {validation.ok ? "Fixture consistente" : "Hay errores para revisar"}
              </h2>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${
                validation.ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {validation.ok ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {validation.ok ? "Validado" : "Bloqueado"}
            </span>
          </div>

          {validation.ok ? (
            <p className="mt-3 text-sm font-semibold leading-6 text-[#62675d]">
              Se verificaron los 96 partidos de grupos, todos los cruces únicos
              de cada categoría y que ningún equipo tenga dos partidos de su
              misma categoría en el mismo horario.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm font-bold text-red-800">
              {validation.errors.map((error) => (
                <li key={error}>• {error}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5 rounded-[28px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm md:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74786a]">
            Los tres cuadrados negros
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
            2C juega excepcionalmente en Cancha 6
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {OFFICIAL_MOVED_MATCHES.map((match) => (
              <article
                key={`${match.timeLabel}-${match.teamA}-${match.teamB}`}
                className="rounded-2xl border border-[#e8e2d5] bg-[#fbfaf6] p-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a]">
                  {match.timeLabel} · {match.court}
                </p>
                <p className="mt-2 text-sm font-black">
                  {getTeamDisplayName(match.teamA)}
                </p>
                <p className="my-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#a29b89]">
                  vs
                </p>
                <p className="text-sm font-black">
                  {getTeamDisplayName(match.teamB)}
                </p>
              </article>
            ))}
          </div>
        </section>

        {adminReady && (
          <section className="mt-5 overflow-hidden rounded-[30px] bg-[#151711] p-5 text-white shadow-[0_20px_50px_rgba(21,23,17,0.16)] md:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d7c77a]">
              Aplicar en Neon
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.055em]">
              Reemplazar fixture actual
            </h2>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/60">
              En este momento hay <b className="text-white">{matches.length}</b>{" "}
              partidos cargados. El botón reemplaza todo por los{" "}
              <b className="text-white">{OFFICIAL_FIXTURE_SUMMARY.total}</b>{" "}
              partidos oficiales.
            </p>

            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-200/10 p-4 text-sm font-bold text-amber-100">
              Importante: el modo reemplazar borra los partidos actuales y sus
              eventos. Usalo ahora, antes de empezar a cargar resultados reales.
            </div>

            {applied && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-black text-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
                Fixture oficial cargado correctamente.
              </div>
            )}

            <button
              type="button"
              disabled={busy || !validation.ok}
              onClick={() => void applyFixture()}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d7c77a] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#151711] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:w-auto"
            >
              {busy ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {busy ? "Aplicando..." : "Aplicar fixture oficial"}
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Database;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-2xl bg-[#151711] p-2 text-[#d7c77a]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-3xl font-black tracking-[-0.06em]">{value}</span>
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
        {label}
      </p>
      <p className="mt-1 text-xs font-bold text-[#62675d]">{detail}</p>
    </article>
  );
}
