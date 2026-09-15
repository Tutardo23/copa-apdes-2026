"use client";

import { usePathname } from "next/navigation";
import { useTournament } from "@/src/components/providers/TournamentProvider";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleHelp,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  Square,
  Target,
  TimerReset,
  Trash2,
  Undo2,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type GuideItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: "normal" | "warning" | "danger";
};

type GuideConfig = {
  eyebrow: string;
  title: string;
  intro: string;
  warning?: string;
  items: GuideItem[];
};

export default function AdminButtonGuide() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { refresh, isLive, connectionError } = useTournament();
  const realMatch = pathname.startsWith("/admin/partido/");
  const realAgenda = pathname === "/admin" || pathname === "/admin/";

  const guide = useMemo(() => getGuide(pathname), [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!guide) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-24 right-4 z-[70] inline-flex items-center gap-2 rounded-full border border-[#ded9cc] bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#151711] shadow-[0_12px_35px_rgba(21,23,17,0.18)] md:bottom-6 md:right-6"
      >
        <CircleHelp className="h-4 w-4" />
        {realMatch
          ? "Cómo cargar / Si algo falla"
          : realAgenda
            ? "Ayuda para el día de la Copa"
            : "¿Qué hace cada botón?"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end bg-[#151711]/60 p-3 backdrop-blur-sm md:items-center md:justify-center md:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-button-guide-title"
            className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[30px] bg-[#f6f4ee] p-4 shadow-2xl md:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74786a]">
                  {guide.eyebrow}
                </p>
                <h2
                  id="admin-button-guide-title"
                  className="mt-1 text-3xl font-black tracking-[-0.06em] text-[#151711]"
                >
                  {guide.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-[#62675d]">
                  {guide.intro}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar guía"
                className="shrink-0 rounded-full bg-white p-2.5 text-[#74786a] shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {guide.warning && (
              <div className="mt-4 rounded-2xl border border-[#d7c77a]/50 bg-[#fff8dc] px-4 py-3 text-xs font-black leading-5 text-[#6f6125]">
                {guide.warning}
              </div>
            )}

            {(realMatch || realAgenda) && (
              <div className="mt-4 rounded-2xl border border-[#ded9cc] bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full p-2 ${isLive && !connectionError ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {isLive && !connectionError ? (
                        <Wifi className="h-4 w-4" />
                      ) : (
                        <WifiOff className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.08em]">
                        Estado de la carga
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#74786a]">
                        {connectionError
                          ? `Atención: ${connectionError}`
                          : isLive
                            ? "Conectado a los datos del torneo."
                            : "Reconectando con los datos del torneo..."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={refreshing}
                    onClick={async () => {
                      setRefreshing(true);
                      try {
                        await refresh();
                      } finally {
                        setRefreshing(false);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#151711] px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.1em] text-white disabled:opacity-40"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Leyendo..." : "Releer datos guardados"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {guide.items.map((item) => (
                <GuideCard key={item.title} item={item} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-2xl bg-[#151711] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
            >
              Entendido
            </button>
          </section>
        </div>
      )}
    </>
  );
}

function GuideCard({ item }: { item: GuideItem }) {
  const Icon = item.icon;
  const tone =
    item.tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : item.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-[#e8e2d5] bg-white text-[#151711]";

  return (
    <article className={`rounded-[22px] border p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-[#151711] p-2 text-[#d7c77a]">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.08em]">
            {item.title}
          </h3>
          <p className="mt-1.5 text-xs font-bold leading-5 opacity-80">
            {item.description}
          </p>
        </div>
      </div>
    </article>
  );
}

function getGuide(pathname: string): GuideConfig | null {
  if (pathname.startsWith("/admin/simulacion/partido/")) {
    return {
      eyebrow: "Simulación · partido",
      title: "Guía rápida de la carga simulada",
      intro:
        "Esta pantalla imita la operación del partido para que puedan practicar sin tocar los resultados reales.",
      warning:
        "Todo lo que hagan acá es de prueba. Los eventos confirmados sí quedan guardados en la simulación compartida para que las otras computadoras los vean.",
      items: [
        {
          title: "Aplicar tiempo",
          description:
            "Define cuántos minutos dura el período de este partido. Solo se puede cambiar con el reloj detenido.",
          icon: Clock3,
        },
        {
          title: "Q1 · Q2 · Q3 · Q4",
          description:
            "Selecciona el período que están jugando. Al cambiar de período, el reloj vuelve al tiempo completo configurado.",
          icon: TimerReset,
        },
        {
          title: "Iniciar / Pausar",
          description:
            "Inicia o pausa la cuenta regresiva. Al pausar, conserva exactamente el tiempo restante.",
          icon: Play,
        },
        {
          title: "Reiniciar reloj",
          description:
            "Devuelve el cronómetro al tiempo completo. No borra goles, tarjetas ni marcador.",
          icon: RotateCcw,
        },
        {
          title: "Guardar marcador",
          description:
            "Guarda el resultado que escribieron, pero mantiene el partido disponible para seguir cargando.",
          icon: CheckCircle2,
        },
        {
          title: "Guardar y finalizar",
          description:
            "Guarda el marcador y da por terminado ese partido simulado. Si corresponde, pide penales.",
          icon: CheckCircle2,
          tone: "warning",
        },
        {
          title: "Gol",
          description:
            "Carga la goleadora. También permite indicar varios goles de la misma jugadora de una sola vez.",
          icon: Target,
        },
        {
          title: "Verde / Amarilla / Roja",
          description:
            "Registra una tarjeta para la jugadora indicada y la incorpora a las estadísticas de Fair Play.",
          icon: Square,
        },
        {
          title: "Deshacer evento",
          description:
            "Elimina el último gol o tarjeta cargado en ese partido. Si era un gol, también corrige el marcador.",
          icon: Undo2,
          tone: "warning",
        },
        {
          title: "Finalizar",
          description:
            "Detiene el reloj y marca el partido simulado como finalizado.",
          icon: CheckCircle2,
          tone: "warning",
        },
        {
          title: "Limpiar esta prueba",
          description:
            "Borra la simulación de este partido y lo devuelve a cero. Nunca toca el partido real.",
          icon: Trash2,
          tone: "danger",
        },
      ],
    };
  }

  if (pathname === "/admin/simulacion" || pathname === "/admin/simulacion/") {
    return {
      eyebrow: "Simulación · tandas",
      title: "Guía rápida de la tanda",
      intro:
        "Estos controles sirven para practicar el manejo simultáneo de todos los partidos que empiezan a la misma hora.",
      warning:
        "La simulación es independiente de los resultados reales. Pueden probar sin modificar el torneo.",
      items: [
        {
          title: "Duración del período",
          description:
            "Eligen cuántos minutos dura el período para todos los partidos de esa tanda. Pueden usar un valor rápido o escribir otro.",
          icon: Clock3,
        },
        {
          title: "Aplicar",
          description:
            "Aplica el tiempo elegido a todos los partidos de esa tanda y reinicia sus relojes. No borra resultados ni eventos.",
          icon: CheckCircle2,
        },
        {
          title: "Iniciar tanda",
          description:
            "Arranca o reanuda a la vez la cuenta regresiva de todos los partidos de ese horario.",
          icon: Play,
        },
        {
          title: "Pausar tanda",
          description:
            "Pausa todos los cronómetros de la tanda conservando el tiempo que quedaba en cada partido.",
          icon: Pause,
        },
        {
          title: "Reiniciar reloj",
          description:
            "Vuelve los cronómetros de la tanda al tiempo completo. No borra goles, tarjetas ni marcadores.",
          icon: RotateCcw,
        },
        {
          title: "Finalizar tanda",
          description:
            "Detiene los relojes y marca como finalizados los partidos de la tanda que ya estaban en prueba.",
          icon: CheckCircle2,
          tone: "warning",
        },
        {
          title: "Cargar resultado",
          description:
            "Abre un partido particular para practicar marcador, reloj, períodos, goleadoras y tarjetas.",
          icon: Target,
        },
        {
          title: "Limpiar simulación",
          description:
            "Borra todas las pruebas compartidas de todas las tandas. No modifica resultados reales.",
          icon: Trash2,
          tone: "danger",
        },
      ],
    };
  }

  if (pathname === "/admin" || pathname === "/admin/") {
    return {
      eyebrow: "Carga real · modo Copa",
      title: "Cómo operar la mesa sin perderse",
      intro:
        "Esta guía está pensada para el día de la Copa: qué hacer antes de empezar una tanda, qué tocar durante los partidos y cómo recuperarse si algo parece trabarse.",
      warning:
        "Lo guardado queda en Neon. Si una pantalla se recarga o vuelve a pedir la clave, no usen ‘Limpiar partido’ para arreglarlo: vuelvan a entrar y relean los datos guardados.",
      items: [
        { title: "1 · Antes de la tanda", description: "Confirmen la duración, revisen que las seis canchas sean las correctas y recién después toquen Iniciar tanda.", icon: Clock3 },
        { title: "2 · Iniciar / Pausar", description: "Iniciar tanda pone en marcha los relojes. Pausar conserva el tiempo. Si necesitan cambiar duración, primero pausen.", icon: Play },
        { title: "3 · Cargar resultado", description: "Entren al partido que corresponde. Los goles y tarjetas se guardan al confirmar cada evento. El marcador final se guarda con su botón.", icon: Target },
        { title: "Si parece trabado", description: "No hagan muchos clics seguidos. Esperen unos segundos y usen ‘Releer datos guardados’. La mesa consulta el servidor periódicamente.", icon: RefreshCw, tone: "warning" },
        { title: "Si pide la clave", description: "Vuelvan a ingresar. Pedir la clave no borra goles, tarjetas ni resultados que ya hayan sido guardados.", icon: Wifi, tone: "warning" },
        { title: "Nunca para arreglar conexión", description: "No usen ‘Limpiar partido’ ni ‘Finalizar tanda’ como solución a un error de pantalla. Esos botones cambian datos reales.", icon: Trash2, tone: "danger" },
      ],
    };
  }

  if (pathname.startsWith("/admin/partido/")) {
    return {
      eyebrow: "Carga real · partido",
      title: "Cómo cargar y qué hacer si algo falla",
      intro:
        "Úsenlo como protocolo rápido. La prioridad es guardar una cosa por vez, verificar lo que quedó registrado y evitar duplicar cargas si hay una reconexión.",
      warning:
        "Los eventos confirmados quedan guardados en Neon. El marcador que todavía están escribiendo se protege además como borrador en esta computadora hasta que se guarda correctamente.",
      items: [
        { title: "1 · Mirá partido y cancha", description: "Antes de cargar, revisá horario, cancha, categoría y los dos colegios. Así evitás registrar un evento en el partido equivocado.", icon: Target },
        { title: "2 · Gol o tarjeta", description: "Elegí equipo, tipo de evento, escribí la jugadora y confirmá. Después de confirmar, el evento queda guardado y puede verse desde otra computadora.", icon: Square },
        { title: "3 · Marcador", description: "Mientras escribís el marcador queda un borrador protegido en esta PC. Cuando corresponda, tocá Guardar resultado final para enviarlo al servidor.", icon: CheckCircle2 },
        { title: "4 · Si pide la clave", description: "Volvé a ingresar. No vuelvas a cargar de memoria antes de revisar: lo ya confirmado debe seguir guardado. El borrador del marcador se recupera en esta misma computadora.", icon: Wifi, tone: "warning" },
        { title: "5 · Si se recarga o se cierra", description: "Abrí de nuevo el mismo partido. Primero revisá los eventos que aparecen. Si había un marcador sin confirmar, esta PC intenta recuperarlo como borrador.", icon: RefreshCw, tone: "warning" },
        { title: "6 · Si un botón no responde", description: "No lo aprietes varias veces. Esperá unos segundos y tocá ‘Releer datos guardados’. Si reaparece el dato, ya estaba guardado y no hay que duplicarlo.", icon: RefreshCw, tone: "warning" },
        { title: "7 · Varias computadoras", description: "Si otra PC está cargando el mismo partido, miren primero qué quedó guardado antes de repetir un gol o tarjeta. Eviten dos personas editando el mismo partido al mismo tiempo.", icon: Wifi, tone: "warning" },
        { title: "Deshacer", description: "Usalo solo si el último evento realmente fue incorrecto. Si era gol, también corrige el marcador asociado.", icon: Undo2, tone: "warning" },
        { title: "Finalizar", description: "Finaliza el partido con lo que está guardado. Háganlo cuando realmente terminó y después de revisar el marcador.", icon: CheckCircle2, tone: "warning" },
        { title: "NO usar Limpiar para recuperar", description: "Limpiar partido borra eventos, goles, penales y devuelve el partido a pendiente. No sirve para reconectar ni para refrescar.", icon: Trash2, tone: "danger" },
      ],
    };
  }

  return null;
}
