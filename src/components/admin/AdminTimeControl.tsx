"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Clock3, Settings2, X } from "lucide-react";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import { useSimulation } from "@/src/components/providers/SimulationProvider";
import type { DayKey, MatchItem } from "@/src/lib/tournament-types";

export default function AdminTimeControl() {
  const pathname = usePathname();
  const isSimulation = pathname.startsWith("/admin/simulacion");
  const isRealAgenda = pathname === "/admin";
  const isRealMatch = pathname.startsWith("/admin/partido/");

  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<DayKey>("dia1");

  const { matches, adminReady, setBatchDuration } = useTournament();
  const {
    simulatedResults,
    setSimulationBatchDuration,
    syncing,
  } = useSimulation();

  const groups = useMemo(() => {
    const map = new Map<string, MatchItem[]>();

    for (const match of matches) {
      if (match.day !== day) continue;
      const key = normalizeTime(match.timeLabel);
      map.set(key, [...(map.get(key) ?? []), match]);
    }

    return [...map.entries()]
      .map(([timeLabel, items]) => ({
        timeLabel,
        matches: items,
      }))
      .sort(
        (a, b) =>
          timeValue(a.timeLabel) - timeValue(b.timeLabel),
      );
  }, [day, matches]);

  if (!adminReady) return null;

  // En simulación el selector ya está dibujado dentro de cada tanda.
  if (isSimulation) return null;

  // CARGA REAL: queda visible directamente en la agenda, no escondido en un botón.
  if (isRealAgenda) {
    return (
      <section className="mx-auto w-full max-w-[1320px] px-3 pt-4 md:px-6">
        <section className="rounded-[28px] border border-[#ded9cc] bg-white/90 p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74786a]">
                Carga real
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] md:text-3xl">
                Duración de las tandas reales
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-[#62675d]">
                Elegí cuánto dura cada período antes de iniciar la tanda. El tiempo se aplica a todos los partidos que empiezan a esa hora.
              </p>
            </div>

            <div className="flex rounded-full border border-[#ded9cc] bg-[#f6f4ee] p-1">
              {(["dia1", "dia2"] as DayKey[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDay(item)}
                  className={`rounded-full px-5 py-2 text-xs font-black ${
                    day === item
                      ? "bg-[#151711] text-white"
                      : "text-[#74786a]"
                  }`}
                >
                  {item === "dia1" ? "Día 1" : "Día 2"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black leading-5 text-amber-800">
            Esto modifica el cronómetro REAL. Cambiar el tiempo reinicia los relojes de esa tanda, pero NO borra marcador, goles ni tarjetas. Si una tanda está corriendo, primero hay que pausarla.
          </div>

          <div className="mt-4 space-y-3">
            {groups.map((group) => {
              const running = group.matches.some(
                (match) => match.isRunning,
              );
              const reference = group.matches[0];
              const currentSeconds =
                reference?.durationSeconds ?? 15 * 60;

              return (
                <TimeRow
                  key={`${day}-${group.timeLabel}`}
                  label={`${displayTime(group.timeLabel)} · ${group.matches.length} partidos`}
                  currentMinutes={Math.max(
                    1,
                    Math.round(currentSeconds / 60),
                  )}
                  disabled={running}
                  onApply={async (minutes) => {
                    const ids = group.matches.map(
                      (match) => match.id,
                    );
                    await setBatchDuration(
                      ids,
                      minutes * 60,
                    );
                  }}
                />
              );
            })}
          </div>
        </section>
      </section>
    );
  }

  // Dentro de un partido real mantenemos un acceso rápido a todas las tandas.
  if (isRealMatch) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-40 right-4 z-[70] inline-flex items-center gap-2 rounded-full bg-[#151711] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_35px_rgba(21,23,17,0.22)] md:bottom-20 md:right-6"
        >
          <Settings2 className="h-4 w-4 text-[#d7c77a]" />
          Configurar tiempos
        </button>

        {open && (
          <div className="fixed inset-0 z-[105] flex items-end bg-[#151711]/65 p-3 backdrop-blur-sm md:items-center md:justify-center md:p-6">
            <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[30px] bg-[#f6f4ee] p-4 shadow-2xl md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74786a]">
                    Carga real
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">
                    Elegir tiempo de los partidos
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-[#62675d]">
                    Elegí la duración de cada tanda. Se aplica a todos los partidos de ese horario.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  className="rounded-full bg-white p-2.5 text-[#74786a]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black leading-5 text-amber-800">
                Esto modifica el cronómetro REAL. Cambiar el tiempo reinicia los relojes de esa tanda, pero no borra goles, tarjetas ni marcadores.
              </div>

              <div className="mt-4 flex rounded-full border border-[#ded9cc] bg-white p-1">
                {(["dia1", "dia2"] as DayKey[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDay(item)}
                    className={`flex-1 rounded-full px-4 py-2 text-xs font-black ${
                      day === item
                        ? "bg-[#151711] text-white"
                        : "text-[#74786a]"
                    }`}
                  >
                    {item === "dia1" ? "Día 1" : "Día 2"}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {groups.map((group) => {
                  const running = group.matches.some(
                    (match) => match.isRunning,
                  );
                  const reference = group.matches[0];
                  const currentSeconds =
                    reference?.durationSeconds ?? 15 * 60;

                  return (
                    <TimeRow
                      key={`${day}-${group.timeLabel}`}
                      label={`${displayTime(group.timeLabel)} · ${group.matches.length} partidos`}
                      currentMinutes={Math.max(
                        1,
                        Math.round(currentSeconds / 60),
                      )}
                      disabled={running || syncing}
                      onApply={async (minutes) => {
                        const ids = group.matches.map(
                          (match) => match.id,
                        );
                        await setBatchDuration(
                          ids,
                          minutes * 60,
                        );
                      }}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </>
    );
  }

  return null;
}

function TimeRow({
  label,
  currentMinutes,
  disabled,
  onApply,
}: {
  label: string;
  currentMinutes: number;
  disabled: boolean;
  onApply: (minutes: number) => Promise<void>;
}) {
  const [value, setValue] = useState(String(currentMinutes));

  const apply = (minutes: number) => {
    const clean = Math.max(
      1,
      Math.min(60, Math.trunc(minutes || 15)),
    );
    setValue(String(clean));
    void onApply(clean);
  };

  return (
    <article className="rounded-[22px] border border-[#ded9cc] bg-white p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
            <Clock3 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-black">{label}</p>
            <p className="text-[10px] font-bold text-[#74786a]">
              Actual: {currentMinutes} min por período
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {[5, 10, 12, 15, 20, 25].map((minutes) => (
            <button
              key={minutes}
              type="button"
              disabled={disabled}
              onClick={() => apply(minutes)}
              className={`rounded-full border px-3 py-2 text-[10px] font-black disabled:opacity-35 ${
                Number(value) === minutes
                  ? "border-[#151711] bg-[#151711] text-white"
                  : "border-[#ded9cc] bg-[#fbfaf6] text-[#62675d]"
              }`}
            >
              {minutes} min
            </button>
          ))}

          <label>
            <span className="mb-1 block text-[8px] font-black uppercase tracking-[0.12em] text-[#74786a]">
              Otro
            </span>
            <input
              type="number"
              min={1}
              max={60}
              value={value}
              disabled={disabled}
              onChange={(event) =>
                setValue(event.target.value)
              }
              className="w-20 rounded-xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-2 text-center text-xs font-black outline-none disabled:opacity-40"
              aria-label={`Otro tiempo para ${label}`}
            />
          </label>

          <button
            type="button"
            disabled={disabled}
            onClick={() => apply(Number(value))}
            className="rounded-xl bg-[#151711] px-4 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white disabled:opacity-35"
          >
            Aplicar
          </button>
        </div>
      </div>

      {disabled && (
        <p className="mt-2 text-[10px] font-bold text-amber-700">
          Pausá la tanda antes de cambiar el tiempo.
        </p>
      )}
    </article>
  );
}

function normalizeTime(value: string) {
  return value
    .trim()
    .replace(/^(\d{1,2}),(\d{2})/, "$1:$2")
    .replace(/\s*hs?\.?$/i, "");
}

function displayTime(value: string) {
  return `${normalizeTime(value)} hs`;
}

function timeValue(value: string) {
  const match = normalizeTime(value).match(/(\d{1,2}):(\d{2})/);
  return match
    ? Number(match[1]) * 60 + Number(match[2])
    : 9999;
}
