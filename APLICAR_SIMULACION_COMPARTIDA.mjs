#!/usr/bin/env node
/**
 * Copa APDES 2026
 * Parche: simulación compartida + carga operativa
 *
 * Ejecutar desde la raíz del repo:
 *   node .\APLICAR_SIMULACION_COMPARTIDA.mjs
 *
 * El script:
 * - crea API/tabla de simulación compartida
 * - mantiene el modo simulación separado de resultados reales
 * - agrega goleadoras con nombre + cantidad
 * - agrega tarjetas en simulación
 * - agrega tarjeta roja en carga real
 * - mantiene sesión admin con cookie HttpOnly por 12h
 * - mejora polling: admin 5s, público 10s, pausa pestaña oculta
 * - muestra todas las goleadoras en simulación
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function p(rel) {
  return path.join(root, rel);
}

function read(rel) {
  const file = p(rel);
  if (!fs.existsSync(file)) {
    throw new Error(`No existe ${rel}. Ejecutá este script desde la raíz del repo copa-apdes-2026.`);
  }
  return fs.readFileSync(file, "utf8");
}

function write(rel, content) {
  const file = p(rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.replace(/\r\n/g, "\n"), "utf8");
  console.log(`OK  ${rel}`);
}

function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count === 0) throw new Error(`No encontré el bloque esperado: ${label}`);
  if (count > 1) throw new Error(`Encontré ${count} coincidencias para ${label}; no modifico por seguridad.`);
  return source.replace(from, to);
}

function replaceRegexOnce(source, regex, replacement, label) {
  const matches = source.match(regex);
  if (!matches) throw new Error(`No encontré el bloque esperado: ${label}`);
  return source.replace(regex, replacement);
}

function optionalReplace(source, from, to, label) {
  if (!source.includes(from)) {
    console.log(`WARN ${label}: bloque no encontrado, continúo.`);
    return source;
  }
  return source.replace(from, to);
}

// ---------------------------------------------------------------------------
// 1) Tipos: tarjeta roja
// ---------------------------------------------------------------------------
{
  const rel = "src/lib/tournament-types.ts";
  let s = read(rel);
  s = replaceOnce(
    s,
    'export type EventType = "goal" | "green_card" | "yellow_card";',
    'export type EventType = "goal" | "green_card" | "yellow_card" | "red_card";',
    "EventType red_card",
  );
  write(rel, s);
}

// ---------------------------------------------------------------------------
// 2) Sesión admin persistente vía cookie HttpOnly
// ---------------------------------------------------------------------------
write("src/lib/admin-session.ts", `import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "copa_admin_session";
const SESSION_CONTEXT = "copa-apdes-admin-session-v1";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function configuredPassword() {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) throw new Error("Falta configurar ADMIN_PASSWORD.");
  return value;
}

function expectedToken() {
  return createHmac("sha256", configuredPassword())
    .update(SESSION_CONTEXT)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminPasswordInput(password: string | null) {
  if (!password) return false;
  return safeEqual(password, configuredPassword());
}

function cookieValue(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const prefix = \`\${ADMIN_SESSION_COOKIE}=\`;
  const found = cookies.find((item) => item.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}

export function hasValidAdminSession(request: Request) {
  const value = cookieValue(request);
  if (!value) return false;
  return safeEqual(value, expectedToken());
}

export function hasAdminAccess(request: Request) {
  return (
    hasValidAdminSession(request) ||
    verifyAdminPasswordInput(request.headers.get("x-admin-password"))
  );
}

export function adminSessionCookie() {
  const secure =
    process.env.NODE_ENV === "production" ? "; Secure" : "";

  return [
    \`\${ADMIN_SESSION_COOKIE}=\${encodeURIComponent(expectedToken())}\`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    \`Max-Age=\${MAX_AGE_SECONDS}\`,
    secure.replace(/^; /, ""),
  ]
    .filter(Boolean)
    .join("; ");
}
`);

// ---------------------------------------------------------------------------
// 3) API torneo: cookie admin + tarjeta roja
// ---------------------------------------------------------------------------
{
  const rel = "src/app/api/tournament/route.ts";
  let s = read(rel);

  s = s.replace(/\s*verifyAdminPassword,\n/, "\n");

  if (!s.includes('from "@/src/lib/admin-session"')) {
    s = s.replace(
      'import type { TournamentAction } from "@/src/lib/tournament-types";',
      `import type { TournamentAction } from "@/src/lib/tournament-types";
import {
  adminSessionCookie,
  hasAdminAccess,
  hasValidAdminSession,
  verifyAdminPasswordInput,
} from "@/src/lib/admin-session";`,
    );
  }

  s = replaceRegexOnce(
    s,
    /export async function POST\(request: Request\) \{\n  try \{\n[\s\S]*?    if \(action\.action === "authenticate"\) \{\n      return Response\.json\(\{ ok: true \}\);\n    \}\n/,
    `export async function POST(request: Request) {
  try {
    const action = (await request.json()) as TournamentAction;

    if (action.action === "authenticate") {
      const suppliedPassword = request.headers.get("x-admin-password");

      if (suppliedPassword && verifyAdminPasswordInput(suppliedPassword)) {
        return Response.json(
          { ok: true },
          { headers: { "set-cookie": adminSessionCookie() } },
        );
      }

      if (hasValidAdminSession(request)) {
        return Response.json({ ok: true });
      }

      return Response.json(
        { error: "Clave de administrador incorrecta." },
        { status: 401 },
      );
    }

    if (!hasAdminAccess(request)) {
      return Response.json(
        { error: "La sesión de administrador venció. Volvé a ingresar." },
        { status: 401 },
      );
    }
`,
    "POST authenticate/session",
  );

  s = replaceOnce(
    s,
    '    !["goal", "green_card", "yellow_card"].includes(payload.type)',
    '    !["goal", "green_card", "yellow_card", "red_card"].includes(payload.type)',
    "validación red_card",
  );

  write(rel, s);
}

// ---------------------------------------------------------------------------
// 4) TournamentProvider: restaurar sesión + polling inteligente
// ---------------------------------------------------------------------------
{
  const rel = "src/components/providers/TournamentProvider.tsx";
  let s = read(rel);

  if (!s.includes('import { usePathname } from "next/navigation";')) {
    s = s.replace(
      '"use client";\n',
      '"use client";\n\nimport { usePathname } from "next/navigation";\n',
    );
  }

  s = replaceOnce(
    s,
    '  const [rawMatches, setRawMatches] = useState<MatchItem[]>([]);',
    '  const pathname = usePathname();\n  const [rawMatches, setRawMatches] = useState<MatchItem[]>([]);',
    "pathname provider",
  );

  s = s.replace('  const [adminPassword, setAdminPassword] = useState("");\n', "");

  s = replaceRegexOnce(
    s,
    /  useEffect\(\(\) => \{\n    const initialLoad = setTimeout\(\(\) => void refresh\(\), 0\);\n    const poll = setInterval\(\(\) => void refresh\(\), 5000\);\n\n    return \(\) => \{\n      clearTimeout\(initialLoad\);\n      clearInterval\(poll\);\n    \};\n  \}, \[refresh\]\);/,
    `  useEffect(() => {
    const intervalMs = pathname.startsWith("/admin") ? 5000 : 10000;

    const tick = () => {
      if (!document.hidden) void refresh();
    };

    const initialLoad = setTimeout(tick, 0);
    const poll = setInterval(tick, intervalMs);

    const onVisibilityChange = () => {
      if (!document.hidden) void refresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimeout(initialLoad);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, refresh]);`,
    "polling inteligente",
  );

  s = replaceRegexOnce(
    s,
    /  const sendAdminAction = useCallback\([\s\S]*?\n  const authenticateAdmin = useCallback/,
    `  const sendAdminAction = useCallback(
    async (action: TournamentAction) => {
      if (!adminReady) {
        setAdminError(
          "Ingresá la clave de administrador para cargar cambios.",
        );
        return false;
      }

      setAdminError(null);

      try {
        const response = await fetch("/api/tournament", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(action),
        });

        const result = (await response.json()) as {
          matches?: MatchItem[];
          error?: string;
        };

        if (!response.ok || !result.matches) {
          if (response.status === 401) setAdminReady(false);
          setAdminError(
            result.error ?? "No se pudo guardar el cambio.",
          );
          return false;
        }

        useReturnedMatches(result.matches);
        return true;
      } catch {
        setAdminError(
          "No se pudo conectar con el servidor para guardar el cambio.",
        );
        return false;
      }
    },
    [adminReady, useReturnedMatches],
  );

  const authenticateAdmin = useCallback`,
    "sendAdminAction cookie",
  );

  s = replaceOnce(
    s,
    `      setAdminPassword(password);
      setAdminReady(true);`,
    `      setAdminReady(true);`,
    "authenticate sin guardar password",
  );

  const marker = `  }, []);

  const value = useMemo<TournamentContextType>(`;
  if (!s.includes("Restaurar sesión admin")) {
    s = replaceOnce(
      s,
      marker,
      `  }, []);

  // Restaurar sesión admin después de refresh/navegación.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const response = await fetch("/api/tournament", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "authenticate" }),
        });

        if (!cancelled && response.ok) {
          setAdminReady(true);
          setAdminError(null);
        }
      } catch {
        // Si no hay sesión previa simplemente se mostrará el login.
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<TournamentContextType>(`,
      "restore admin session",
    );
  }

  s = s.replace(/\n\s*adminPassword,\n/g, "\n");

  write(rel, s);
}

// ---------------------------------------------------------------------------
// 5) Simulación compartida: tipos + acceso DB + API
// ---------------------------------------------------------------------------
write("src/lib/simulation-types.ts", `export type SimulatedGoal = {
  player: string;
  count: number;
};

export type SimulatedCard = {
  player: string;
  type: "green_card" | "yellow_card" | "red_card";
  count: number;
};

export type SimulatedResult = {
  scoreA: number;
  scoreB: number;
  goalsA: SimulatedGoal[];
  goalsB: SimulatedGoal[];
  cardsA: SimulatedCard[];
  cardsB: SimulatedCard[];
  penalties: string | null;
  updatedAt?: string;
};
`);

write("src/lib/simulation-data.ts", `import "server-only";

import { neon } from "@neondatabase/serverless";
import type { SimulatedResult } from "@/src/lib/simulation-types";

function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta configurar DATABASE_URL.");
  return neon(connectionString);
}

async function ensureTable() {
  const sql = database();

  await sql\`
    CREATE TABLE IF NOT EXISTS copa_simulation_results (
      match_id integer PRIMARY KEY
        REFERENCES copa_matches(id) ON DELETE CASCADE,
      score_a integer NOT NULL CHECK (score_a BETWEEN 0 AND 99),
      score_b integer NOT NULL CHECK (score_b BETWEEN 0 AND 99),
      goals_a jsonb NOT NULL DEFAULT '[]'::jsonb,
      goals_b jsonb NOT NULL DEFAULT '[]'::jsonb,
      cards_a jsonb NOT NULL DEFAULT '[]'::jsonb,
      cards_b jsonb NOT NULL DEFAULT '[]'::jsonb,
      penalties text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  \`;
}

export async function getSharedSimulation(): Promise<Record<number, SimulatedResult>> {
  await ensureTable();
  const sql = database();

  const rows = await sql\`
    SELECT
      match_id,
      score_a,
      score_b,
      goals_a,
      goals_b,
      cards_a,
      cards_b,
      penalties,
      updated_at
    FROM copa_simulation_results
    ORDER BY match_id;
  \`;

  const result: Record<number, SimulatedResult> = {};

  for (const row of rows as any[]) {
    result[Number(row.match_id)] = {
      scoreA: Number(row.score_a),
      scoreB: Number(row.score_b),
      goalsA: Array.isArray(row.goals_a) ? row.goals_a : [],
      goalsB: Array.isArray(row.goals_b) ? row.goals_b : [],
      cardsA: Array.isArray(row.cards_a) ? row.cards_a : [],
      cardsB: Array.isArray(row.cards_b) ? row.cards_b : [],
      penalties: row.penalties ?? null,
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at ?? ""),
    };
  }

  return result;
}

export async function saveSharedSimulation(
  matchId: number,
  result: SimulatedResult,
) {
  await ensureTable();
  const sql = database();

  await sql\`
    INSERT INTO copa_simulation_results (
      match_id,
      score_a,
      score_b,
      goals_a,
      goals_b,
      cards_a,
      cards_b,
      penalties,
      updated_at
    )
    VALUES (
      \${matchId},
      \${result.scoreA},
      \${result.scoreB},
      \${JSON.stringify(result.goalsA)}::jsonb,
      \${JSON.stringify(result.goalsB)}::jsonb,
      \${JSON.stringify(result.cardsA)}::jsonb,
      \${JSON.stringify(result.cardsB)}::jsonb,
      \${result.penalties},
      NOW()
    )
    ON CONFLICT (match_id)
    DO UPDATE SET
      score_a = EXCLUDED.score_a,
      score_b = EXCLUDED.score_b,
      goals_a = EXCLUDED.goals_a,
      goals_b = EXCLUDED.goals_b,
      cards_a = EXCLUDED.cards_a,
      cards_b = EXCLUDED.cards_b,
      penalties = EXCLUDED.penalties,
      updated_at = NOW();
  \`;
}

export async function removeSharedSimulation(matchId: number) {
  await ensureTable();
  const sql = database();
  await sql\`
    DELETE FROM copa_simulation_results
    WHERE match_id = \${matchId};
  \`;
}

export async function clearSharedSimulation() {
  await ensureTable();
  const sql = database();
  await sql\`DELETE FROM copa_simulation_results;\`;
}
`);

write("src/app/api/simulation/route.ts", `import {
  clearSharedSimulation,
  getSharedSimulation,
  removeSharedSimulation,
  saveSharedSimulation,
} from "@/src/lib/simulation-data";
import { hasAdminAccess } from "@/src/lib/admin-session";
import type {
  SimulatedCard,
  SimulatedGoal,
  SimulatedResult,
} from "@/src/lib/simulation-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasAdminAccess(request)) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  return Response.json(
    { results: await getSharedSimulation() },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!hasAdminAccess(request)) {
    return Response.json(
      { error: "La sesión de administrador venció. Volvé a ingresar." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    if (body.action === "clear") {
      await clearSharedSimulation();
    } else if (body.action === "remove") {
      const matchId = Number(body.matchId);
      if (!Number.isInteger(matchId)) throw new Error("Partido inválido.");
      await removeSharedSimulation(matchId);
    } else if (body.action === "save") {
      const matchId = Number(body.matchId);
      if (!Number.isInteger(matchId)) throw new Error("Partido inválido.");

      const result = normalizeResult(body.result);
      await saveSharedSimulation(matchId, result);
    } else {
      throw new Error("Acción inválida.");
    }

    return Response.json({ results: await getSharedSimulation() });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la simulación.",
      },
      { status: 400 },
    );
  }
}

function normalizeResult(value: any): SimulatedResult {
  const scoreA = Math.max(0, Math.min(99, Math.trunc(Number(value?.scoreA) || 0)));
  const scoreB = Math.max(0, Math.min(99, Math.trunc(Number(value?.scoreB) || 0)));

  return {
    scoreA,
    scoreB,
    goalsA: normalizeGoals(value?.goalsA, scoreA),
    goalsB: normalizeGoals(value?.goalsB, scoreB),
    cardsA: normalizeCards(value?.cardsA),
    cardsB: normalizeCards(value?.cardsB),
    penalties:
      scoreA === scoreB && /^\\d{1,2}[-:]\\d{1,2}$/.test(String(value?.penalties ?? ""))
        ? String(value.penalties).replace(":", "-")
        : null,
  };
}

function normalizeGoals(value: unknown, max: number): SimulatedGoal[] {
  if (!Array.isArray(value)) return [];

  const result: SimulatedGoal[] = [];
  let total = 0;

  for (const item of value) {
    const player = String(item?.player ?? "").trim().slice(0, 80);
    const count = Math.max(1, Math.min(20, Math.trunc(Number(item?.count) || 1)));

    if (!player || total >= max) continue;
    const allowed = Math.min(count, max - total);
    result.push({ player, count: allowed });
    total += allowed;
  }

  return result;
}

function normalizeCards(value: unknown): SimulatedCard[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      player: String(item?.player ?? "").trim().slice(0, 80),
      type: String(item?.type ?? "") as SimulatedCard["type"],
      count: Math.max(1, Math.min(10, Math.trunc(Number(item?.count) || 1))),
    }))
    .filter(
      (item) =>
        item.player &&
        ["green_card", "yellow_card", "red_card"].includes(item.type),
    );
}
`);

// ---------------------------------------------------------------------------
// 6) Provider de simulación: Neon compartido entre equipos
// ---------------------------------------------------------------------------
write("src/components/providers/SimulationProvider.tsx", `"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyTournamentProgression,
  parsePenaltyScore,
} from "@/src/lib/tournament-engine";
import type {
  MatchEvent,
  MatchItem,
} from "@/src/lib/tournament-types";
import type {
  SimulatedCard,
  SimulatedGoal,
  SimulatedResult,
} from "@/src/lib/simulation-types";

export type { SimulatedCard, SimulatedGoal, SimulatedResult };

type SimulationContextType = {
  simulationEnabled: boolean;
  simulatedResults: Record<number, SimulatedResult>;
  syncing: boolean;
  syncError: string | null;
  setSimulationEnabled: (enabled: boolean) => void;
  setSimulatedResult: (
    matchId: number,
    scoreA: number,
    scoreB: number,
    goalsA?: SimulatedGoal[],
    goalsB?: SimulatedGoal[],
    cardsA?: SimulatedCard[],
    cardsB?: SimulatedCard[],
    penalties?: string | null,
  ) => Promise<boolean>;
  removeSimulatedResult: (matchId: number) => Promise<boolean>;
  clearSimulation: () => Promise<boolean>;
  refreshSimulation: () => Promise<boolean>;
  getEffectiveMatches: (matches: MatchItem[]) => MatchItem[];
};

const ENABLED_KEY = "copa-apdes-simulation-enabled";
const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [simulationEnabled, setSimulationEnabledState] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<Record<number, SimulatedResult>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSimulationEnabledState(
        window.localStorage.getItem(ENABLED_KEY) === "true",
      );
    } catch {
      setSimulationEnabledState(false);
    }
  }, []);

  const setSimulationEnabled = useCallback((enabled: boolean) => {
    setSimulationEnabledState(enabled);
    try {
      window.localStorage.setItem(ENABLED_KEY, String(enabled));
    } catch {}
  }, []);

  const refreshSimulation = useCallback(async () => {
    try {
      const response = await fetch("/api/simulation", { cache: "no-store" });

      if (response.status === 401) return false;

      const result = (await response.json()) as {
        results?: Record<number, SimulatedResult>;
        error?: string;
      };

      if (!response.ok || !result.results) {
        throw new Error(result.error ?? "No se pudo leer la simulación compartida.");
      }

      setSimulatedResults(normalizeResults(result.results));
      setSyncError(null);
      return true;
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "No se pudo sincronizar la simulación.",
      );
      return false;
    }
  }, []);

  useEffect(() => {
    const shouldSync =
      simulationEnabled || pathname.startsWith("/admin/simulacion");

    if (!shouldSync) return;

    const tick = () => {
      if (!document.hidden) void refreshSimulation();
    };

    const initial = setTimeout(tick, 0);
    const poll = setInterval(tick, 2500);

    const onVisibility = () => {
      if (!document.hidden) void refreshSimulation();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimeout(initial);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname, refreshSimulation, simulationEnabled]);

  const postAction = useCallback(
    async (payload: unknown) => {
      setSyncing(true);
      setSyncError(null);

      try {
        const response = await fetch("/api/simulation", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = (await response.json()) as {
          results?: Record<number, SimulatedResult>;
          error?: string;
        };

        if (!response.ok || !result.results) {
          throw new Error(result.error ?? "No se pudo guardar la simulación.");
        }

        setSimulatedResults(normalizeResults(result.results));
        setSimulationEnabled(true);
        return true;
      } catch (error) {
        setSyncError(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la simulación.",
        );
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [setSimulationEnabled],
  );

  const setSimulatedResult = useCallback(
    async (
      matchId: number,
      scoreA: number,
      scoreB: number,
      goalsA: SimulatedGoal[] = [],
      goalsB: SimulatedGoal[] = [],
      cardsA: SimulatedCard[] = [],
      cardsB: SimulatedCard[] = [],
      penalties: string | null = null,
    ) => {
      const cleanA = clampScore(scoreA);
      const cleanB = clampScore(scoreB);

      return postAction({
        action: "save",
        matchId,
        result: {
          scoreA: cleanA,
          scoreB: cleanB,
          goalsA: normalizeGoals(goalsA, cleanA),
          goalsB: normalizeGoals(goalsB, cleanB),
          cardsA: normalizeCards(cardsA),
          cardsB: normalizeCards(cardsB),
          penalties:
            cleanA === cleanB ? normalizePenalties(penalties) : null,
        },
      });
    },
    [postAction],
  );

  const removeSimulatedResult = useCallback(
    async (matchId: number) =>
      postAction({ action: "remove", matchId }),
    [postAction],
  );

  const clearSimulation = useCallback(async () => {
    const ok = await postAction({ action: "clear" });
    if (ok) setSimulationEnabled(false);
    return ok;
  }, [postAction, setSimulationEnabled]);

  const getEffectiveMatches = useCallback(
    (matches: MatchItem[]) => {
      if (!simulationEnabled) return matches;

      const simulatedMatches = matches.map((match) => {
        const simulated = simulatedResults[match.id];
        if (!simulated) return match;

        return {
          ...match,
          scoreA: simulated.scoreA,
          scoreB: simulated.scoreB,
          penalties: simulated.penalties ?? null,
          status: "finalizado" as const,
          isRunning: false,
          events: buildSimulatedEvents(match, simulated),
        };
      });

      return applyTournamentProgression(simulatedMatches);
    },
    [simulationEnabled, simulatedResults],
  );

  const value = useMemo<SimulationContextType>(
    () => ({
      simulationEnabled,
      simulatedResults,
      syncing,
      syncError,
      setSimulationEnabled,
      setSimulatedResult,
      removeSimulatedResult,
      clearSimulation,
      refreshSimulation,
      getEffectiveMatches,
    }),
    [
      clearSimulation,
      getEffectiveMatches,
      refreshSimulation,
      removeSimulatedResult,
      setSimulatedResult,
      setSimulationEnabled,
      simulatedResults,
      simulationEnabled,
      syncError,
      syncing,
    ],
  );

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation debe usarse dentro de SimulationProvider");
  }
  return context;
}

function buildSimulatedEvents(
  match: MatchItem,
  simulated: SimulatedResult,
): MatchEvent[] {
  const events: MatchEvent[] = [];
  let id = -(match.id * 10000 + 1);
  let secondOffset = 0;

  const pushGoals = (
    team: "teamA" | "teamB",
    goals: SimulatedGoal[],
  ) => {
    for (const goal of goals) {
      for (let i = 0; i < goal.count; i += 1) {
        events.push({
          id: id--,
          minute: Math.min(59, 5 + Math.floor(secondOffset / 2)),
          second: (secondOffset * 7) % 60,
          period: 1,
          team,
          type: "goal",
          player: goal.player,
        });
        secondOffset += 1;
      }
    }
  };

  const pushCards = (
    team: "teamA" | "teamB",
    cards: SimulatedCard[],
  ) => {
    for (const card of cards) {
      for (let i = 0; i < card.count; i += 1) {
        events.push({
          id: id--,
          minute: Math.min(59, 10 + Math.floor(secondOffset / 2)),
          second: (secondOffset * 11) % 60,
          period: 1,
          team,
          type: card.type,
          player: card.player,
        });
        secondOffset += 1;
      }
    }
  };

  pushGoals("teamA", simulated.goalsA);
  pushGoals("teamB", simulated.goalsB);
  pushCards("teamA", simulated.cardsA);
  pushCards("teamB", simulated.cardsB);

  return events.sort(
    (a, b) =>
      a.minute - b.minute ||
      a.second - b.second ||
      a.id - b.id,
  );
}

function clampScore(value: number) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(99, Math.trunc(value)))
    : 0;
}

function normalizeGoals(
  goals: SimulatedGoal[],
  max: number,
): SimulatedGoal[] {
  const result: SimulatedGoal[] = [];
  let total = 0;

  for (const goal of goals ?? []) {
    const player = String(goal.player ?? "").trim();
    const count = Math.max(1, Math.trunc(Number(goal.count) || 1));

    if (!player || total >= max) continue;
    const allowed = Math.min(count, max - total);
    result.push({ player, count: allowed });
    total += allowed;
  }

  return result;
}

function normalizeCards(cards: SimulatedCard[]): SimulatedCard[] {
  return (cards ?? [])
    .map((card) => ({
      player: String(card.player ?? "").trim(),
      type: card.type,
      count: Math.max(1, Math.min(10, Math.trunc(Number(card.count) || 1))),
    }))
    .filter(
      (card) =>
        card.player &&
        ["green_card", "yellow_card", "red_card"].includes(card.type),
    );
}

function normalizeResults(
  value: Record<number, SimulatedResult>,
): Record<number, SimulatedResult> {
  const next: Record<number, SimulatedResult> = {};

  for (const [rawId, result] of Object.entries(value ?? {})) {
    const matchId = Number(rawId);
    if (!Number.isInteger(matchId)) continue;

    const scoreA = clampScore(Number(result.scoreA));
    const scoreB = clampScore(Number(result.scoreB));

    next[matchId] = {
      scoreA,
      scoreB,
      goalsA: normalizeGoals(result.goalsA ?? [], scoreA),
      goalsB: normalizeGoals(result.goalsB ?? [], scoreB),
      cardsA: normalizeCards(result.cardsA ?? []),
      cardsB: normalizeCards(result.cardsB ?? []),
      penalties:
        scoreA === scoreB
          ? normalizePenalties(result.penalties)
          : null,
      updatedAt: result.updatedAt,
    };
  }

  return next;
}

function normalizePenalties(value?: string | null) {
  const parsed = parsePenaltyScore(value);
  if (!parsed || parsed.scoreA === parsed.scoreB) return null;
  return \`\${parsed.scoreA}-\${parsed.scoreB}\`;
}
`);

// ---------------------------------------------------------------------------
// 7) Página simulación: compartir + nombre/cantidad + tarjetas + todas goleadoras
// ---------------------------------------------------------------------------
{
  const rel = "src/app/admin/simulacion/page.tsx";
  let s = read(rel);

  s = replaceOnce(
    s,
    `  useSimulation,
  type SimulatedResult,`,
    `  useSimulation,
  type SimulatedCard,
  type SimulatedGoal,
  type SimulatedResult,`,
    "imports tipos simulación",
  );

  s = replaceOnce(
    s,
    `    getEffectiveMatches,
    simulationEnabled,
  } = useSimulation();`,
    `    getEffectiveMatches,
    simulationEnabled,
    setSimulationEnabled,
    refreshSimulation,
    syncing,
    syncError,
  } = useSimulation();`,
    "destructure sync",
  );

  const stateMarker = `  const [category, setCategory] =
    useState<CategoryFilter>("Categoría 1");
`;
  s = replaceOnce(
    s,
    stateMarker,
    `${stateMarker}
  useEffect(() => {
    if (!adminReady) return;
    setSimulationEnabled(true);
    void refreshSimulation();
  }, [adminReady, refreshSimulation, setSimulationEnabled]);
`,
    "enable shared simulation",
  );

  s = s.replace(
    `La única diferencia es que estos resultados
              quedan guardados en este dispositivo y no tocan Neon.`,
    `Los resultados de prueba se guardan en un espacio separado en Neon:
              las 2 o 3 computadoras ven la misma simulación sin tocar resultados reales.`,
  );

  s = s.replace(
    `Modo simulación activo`,
    `{syncing ? "Sincronizando..." : "Simulación compartida activa"}`,
  );

  s = replaceOnce(
    s,
    `        {adminError && (
          <p className="mb-5 rounded-2xl border border-[#d7c77a]/50 bg-[#f5edc9] p-3 text-sm font-bold text-[#6f6125]">
            {adminError}
          </p>
        )}`,
    `        {adminError && (
          <p className="mb-5 rounded-2xl border border-[#d7c77a]/50 bg-[#f5edc9] p-3 text-sm font-bold text-[#6f6125]">
            {adminError}
          </p>
        )}

        {syncError && adminReady && (
          <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
            {syncError}
          </p>
        )}`,
    "syncError UI",
  );

  s = s.replace(
    `help="Cargá resultados y, si querés, goleadoras. Cuando termina todo el grupo se completan automáticamente los cruces."`,
    `help="Cargá resultado, goleadoras y tarjetas. Todo queda compartido entre las computadoras de prueba."`,
  );

  s = s.replace(
    `                      <div className="space-y-2">
                        {scorers
                          .slice(0, 6)
                          .map((scorer, index) => (`,
    `                      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {scorers.map((scorer, index) => (`,
  );

  s = replaceRegexOnce(
    s,
    /function SimulationRow\([\s\S]*?\nfunction FilterBlock\(/,
    `function SimulationRow({
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
  const [goalsA, setGoalsA] = useState<SimulatedGoal[]>(simulated?.goalsA ?? []);
  const [goalsB, setGoalsB] = useState<SimulatedGoal[]>(simulated?.goalsB ?? []);
  const [cardsA, setCardsA] = useState<SimulatedCard[]>(simulated?.cardsA ?? []);
  const [cardsB, setCardsB] = useState<SimulatedCard[]>(simulated?.cardsB ?? []);
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
  }, [
    match.id,
    match.scoreA,
    match.scoreB,
    match.penalties,
    simulated,
  ]);

  const numericA = Number(scoreA);
  const numericB = Number(scoreB);
  const validScores =
    Number.isInteger(numericA) &&
    Number.isInteger(numericB) &&
    numericA >= 0 &&
    numericB >= 0;

  const needsPenalties =
    match.stage !== "grupo" &&
    validScores &&
    numericA === numericB;

  const goalsCountA = goalsA.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const goalsCountB = goalsB.reduce((sum, item) => sum + Number(item.count || 0), 0);

  const save = async () => {
    if (!validScores) {
      window.alert("Cargá un marcador válido.");
      return;
    }

    if (goalsCountA > numericA || goalsCountB > numericB) {
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

      penalties = \`\${pA}-\${pB}\`;
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
              maxGoals={Number.isInteger(numericA) ? Math.max(0, numericA) : 0}
            />
            <GoalEditor
              team={shortTeam(match.teamB)}
              goals={goalsB}
              onChange={setGoalsB}
              maxGoals={Number.isInteger(numericB) ? Math.max(0, numericB) : 0}
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
  onChange: (value: SimulatedGoal[]) => void;
  maxGoals: number;
}) {
  return (
    <section className="rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#74786a]">
            Goleadoras
          </p>
          <p className="truncate text-xs font-black">{team}</p>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-[#74786a]">
          máx. {maxGoals}
        </span>
      </div>

      <div className="space-y-2">
        {goals.map((goal, index) => (
          <div key={index} className="grid grid-cols-[1fr_70px_32px] gap-2">
            <input
              value={goal.player}
              onChange={(event) => {
                const next = [...goals];
                next[index] = { ...goal, player: event.target.value };
                onChange(next);
              }}
              placeholder="Nombre de jugadora"
              className="min-w-0 rounded-xl border border-[#ded9cc] bg-white px-3 py-2 text-xs font-bold outline-none"
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
              className="rounded-xl border border-[#ded9cc] bg-white px-2 py-2 text-center text-xs font-black outline-none"
              aria-label="Cantidad de goles"
            />
            <button
              type="button"
              onClick={() => onChange(goals.filter((_, i) => i !== index))}
              className="rounded-xl border border-[#ded9cc] bg-white text-xs font-black text-red-600"
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
  onChange: (value: SimulatedCard[]) => void;
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
          <div key={index} className="grid grid-cols-[1fr_92px_60px_32px] gap-2">
            <input
              value={card.player}
              onChange={(event) => {
                const next = [...cards];
                next[index] = { ...card, player: event.target.value };
                onChange(next);
              }}
              placeholder="Jugadora"
              className="min-w-0 rounded-xl border border-[#ded9cc] bg-white px-3 py-2 text-xs font-bold outline-none"
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
              className="rounded-xl border border-[#ded9cc] bg-white px-2 py-2 text-center text-xs font-black outline-none"
              aria-label="Cantidad de tarjetas"
            />
            <button
              type="button"
              onClick={() => onChange(cards.filter((_, i) => i !== index))}
              className="rounded-xl border border-[#ded9cc] bg-white text-xs font-black text-red-600"
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

function FilterBlock(`,
    "SimulationRow nuevo",
  );

  write(rel, s);
}

// ---------------------------------------------------------------------------
// 8) Carga REAL: nombre + cantidad de goles y tarjeta roja
// ---------------------------------------------------------------------------
{
  const rel = "src/app/admin/partido/[matchId]/page.tsx";
  let s = read(rel);

  s = replaceOnce(
    s,
    'type ActionType = "goal" | "green_card" | "yellow_card";',
    'type ActionType = "goal" | "green_card" | "yellow_card" | "red_card";',
    "ActionType real red",
  );

  s = replaceOnce(
    s,
    '  const [playerName, setPlayerName] = useState("");',
    '  const [playerName, setPlayerName] = useState("");\n  const [eventCount, setEventCount] = useState("1");',
    "eventCount state",
  );

  s = replaceOnce(
    s,
    `  const closeModal = () => {
    setPlayerName("");
    setModal({ open: false, team: null, type: null });
  };`,
    `  const closeModal = () => {
    setPlayerName("");
    setEventCount("1");
    setModal({ open: false, team: null, type: null });
  };`,
    "close reset count",
  );

  s = replaceRegexOnce(
    s,
    /  const confirmAction = async \(\) => \{[\s\S]*?    if \(saved\) closeModal\(\);\n  \};/,
    `  const confirmAction = async () => {
    if (
      !match ||
      !modal.team ||
      !modal.type ||
      !playerName.trim()
    ) {
      return;
    }

    const count =
      modal.type === "goal"
        ? Math.max(1, Math.min(20, Number(eventCount) || 1))
        : 1;

    let saved = true;

    for (let index = 0; index < count; index += 1) {
      saved = await addEvent(match.id, {
        team: modal.team,
        type: modal.type,
        player: playerName.trim(),
      });

      if (!saved) break;
    }

    if (saved) closeModal();
  };`,
    "confirmAction cantidad",
  );

  s = replaceOnce(
    s,
    `          playerName={playerName}
          setPlayerName={setPlayerName}`,
    `          playerName={playerName}
          setPlayerName={setPlayerName}
          eventCount={eventCount}
          setEventCount={setEventCount}`,
    "props EventModal count",
  );

  s = replaceOnce(
    s,
    `  playerName,
  setPlayerName,
  onClose,`,
    `  playerName,
  setPlayerName,
  eventCount,
  setEventCount,
  onClose,`,
    "EventModal args count",
  );

  s = replaceOnce(
    s,
    `  playerName: string;
  setPlayerName: (value: string) => void;
  onClose: () => void;`,
    `  playerName: string;
  setPlayerName: (value: string) => void;
  eventCount: string;
  setEventCount: (value: string) => void;
  onClose: () => void;`,
    "EventModal type count",
  );

  s = replaceOnce(
    s,
    `          <button
            onClick={onConfirm}
            disabled={!playerName.trim()}
            className="mt-3 w-full rounded-2xl bg-[#151711] px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-40"
          >`,
    `          {modal.type === "goal" && (
            <label className="mt-3 block text-[11px] font-black uppercase tracking-[0.18em] text-[#74786a]">
              Cantidad de goles
              <input
                type="number"
                min={1}
                max={20}
                value={eventCount}
                onChange={(event) => setEventCount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#eee9dd] bg-[#fbfaf6] px-4 py-3 text-center text-lg font-black outline-none focus:border-[#151711]"
              />
            </label>
          )}

          <button
            onClick={onConfirm}
            disabled={!playerName.trim()}
            className="mt-3 w-full rounded-2xl bg-[#151711] px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-40"
          >`,
    "input cantidad gol real",
  );

  s = replaceOnce(
    s,
    '      <div className="mt-3 grid grid-cols-3 gap-2">',
    '      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">',
    "grid 4 eventos",
  );

  s = replaceOnce(
    s,
    `        <EventButton
          disabled={disabled}
          label="Amarilla"
          icon={Square}
          onClick={() => onAction(team, "yellow_card")}
          yellow
        />`,
    `        <EventButton
          disabled={disabled}
          label="Amarilla"
          icon={Square}
          onClick={() => onAction(team, "yellow_card")}
          yellow
        />
        <EventButton
          disabled={disabled}
          label="Roja"
          icon={Square}
          onClick={() => onAction(team, "red_card")}
          red
        />`,
    "botón roja",
  );

  s = replaceOnce(
    s,
    `  green,
  yellow,
}: {`,
    `  green,
  yellow,
  red,
}: {`,
    "EventButton red arg",
  );

  s = replaceOnce(
    s,
    `  green?: boolean;
  yellow?: boolean;
}) {`,
    `  green?: boolean;
  yellow?: boolean;
  red?: boolean;
}) {`,
    "EventButton red type",
  );

  s = replaceOnce(
    s,
    `            : yellow
              ? "fill-amber-400 text-amber-400"
              : "text-[#151711]"`,
    `            : yellow
              ? "fill-amber-400 text-amber-400"
              : red
                ? "fill-red-600 text-red-600"
                : "text-[#151711]"`,
    "icon red",
  );

  s = replaceOnce(
    s,
    `                    : event.type === "green_card"
                      ? "Verde"
                      : "Amarilla"}`,
    `                    : event.type === "green_card"
                      ? "Verde"
                      : event.type === "yellow_card"
                        ? "Amarilla"
                        : "Roja"}`,
    "registro evento red",
  );

  s = replaceOnce(
    s,
    `  if (type === "yellow_card") return "Tarjeta amarilla";
  return "Evento";`,
    `  if (type === "yellow_card") return "Tarjeta amarilla";
  if (type === "red_card") return "Tarjeta roja";
  return "Evento";`,
    "actionLabel red",
  );

  write(rel, s);
}

// ---------------------------------------------------------------------------
// 9) Estadísticas: contar y mostrar tarjeta roja
// ---------------------------------------------------------------------------
{
  const rel = "src/app/estadisticas/page.tsx";
  let s = read(rel);

  s = replaceOnce(
    s,
    `  green: number;
  yellow: number;
};`,
    `  green: number;
  yellow: number;
  red: number;
};`,
    "CardStat red",
  );

  s = replaceOnce(
    s,
    `(event.type === "green_card" || event.type === "yellow_card") &&`,
    `(event.type === "green_card" ||
          event.type === "yellow_card" ||
          event.type === "red_card") &&`,
    "stats condition red",
  );

  s = replaceOnce(
    s,
    `          yellow:
            event.type === "yellow_card"
              ? (prevCard?.yellow ?? 0) + 1
              : (prevCard?.yellow ?? 0),`,
    `          yellow:
            event.type === "yellow_card"
              ? (prevCard?.yellow ?? 0) + 1
              : (prevCard?.yellow ?? 0),
          red:
            event.type === "red_card"
              ? (prevCard?.red ?? 0) + 1
              : (prevCard?.red ?? 0),`,
    "stats red count",
  );

  s = replaceOnce(
    s,
    `        b.green + b.yellow - (a.green + a.yellow) ||`,
    `        b.green + b.yellow + b.red - (a.green + a.yellow + a.red) ||`,
    "sort cards red",
  );

  s = replaceOnce(
    s,
    `          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
            <Square className="h-3 w-3 fill-amber-400 text-amber-400" />
            {player.yellow}
          </span>`,
    `          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
            <Square className="h-3 w-3 fill-amber-400 text-amber-400" />
            {player.yellow}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">
            <Square className="h-3 w-3 fill-red-600 text-red-600" />
            {player.red}
          </span>`,
    "UI red stat",
  );

  write(rel, s);
}

// ---------------------------------------------------------------------------
// 10) Público: mostrar roja correctamente en detalle de partido
// ---------------------------------------------------------------------------
{
  const rel = "src/app/page.tsx";
  let s = read(rel);
  s = optionalReplace(
    s,
    `                        : event.type === "green_card"
                          ? "Verde"
                          : "Amarilla"}`,
    `                        : event.type === "green_card"
                          ? "Verde"
                          : event.type === "yellow_card"
                            ? "Amarilla"
                            : "Roja"}`,
    "page event red",
  );
  write(rel, s);
}

{
  const rel = "src/app/mi-colegio/page.tsx";
  let s = read(rel);
  s = optionalReplace(
    s,
    `                        {event.type === "yellow_card" && (
                          <Square className="h-4 w-4 fill-[#d7c77a] text-[#d7c77a]" />
                        )}`,
    `                        {event.type === "yellow_card" && (
                          <Square className="h-4 w-4 fill-[#d7c77a] text-[#d7c77a]" />
                        )}
                        {event.type === "red_card" && (
                          <Square className="h-4 w-4 fill-red-600 text-red-600" />
                        )}`,
    "mi-colegio icon red",
  );

  s = optionalReplace(
    s,
    `                            : event.type === "green_card"
                              ? "Tarjeta verde"
                              : "Tarjeta amarilla"}`,
    `                            : event.type === "green_card"
                              ? "Tarjeta verde"
                              : event.type === "yellow_card"
                                ? "Tarjeta amarilla"
                                : "Tarjeta roja"}`,
    "mi-colegio label red",
  );
  write(rel, s);
}

// ---------------------------------------------------------------------------
// 11) setup.sql para instalaciones futuras
// ---------------------------------------------------------------------------
{
  const rel = "database/setup.sql";
  let s = read(rel);
  s = replaceOnce(
    s,
    "type text NOT NULL CHECK (type IN ('goal', 'green_card', 'yellow_card')),",
    "type text NOT NULL CHECK (type IN ('goal', 'green_card', 'yellow_card', 'red_card')),",
    "setup event red",
  );

  if (!s.includes("copa_simulation_results")) {
    s += `

-- Simulación compartida, separada de los resultados reales.
CREATE TABLE IF NOT EXISTS copa_simulation_results (
  match_id integer PRIMARY KEY
    REFERENCES copa_matches(id) ON DELETE CASCADE,
  score_a integer NOT NULL CHECK (score_a BETWEEN 0 AND 99),
  score_b integer NOT NULL CHECK (score_b BETWEEN 0 AND 99),
  goals_a jsonb NOT NULL DEFAULT '[]'::jsonb,
  goals_b jsonb NOT NULL DEFAULT '[]'::jsonb,
  cards_a jsonb NOT NULL DEFAULT '[]'::jsonb,
  cards_b jsonb NOT NULL DEFAULT '[]'::jsonb,
  penalties text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;
  }
  write(rel, s);
}

console.log(`
============================================================
PARCHE APLICADO
============================================================
Ahora:

1) Ejecutá en Neon el archivo:
   database/2026-09-09-simulacion-compartida.sql

2) Luego:
   npm run build

3) Si compila:
   git status
   git add .
   git commit -m "feat: simulacion compartida y carga operativa"
   git push origin feat/simulacion-compartida-carga-operativa

NO hagas merge a main todavía. Probalo primero en Preview.
============================================================
`);
