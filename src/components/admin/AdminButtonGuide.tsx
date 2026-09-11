"use client";

import { usePathname } from "next/navigation";
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
        ¿Qué hace cada botón?
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

  if (pathname.startsWith("/admin/partido/")) {
    return {
      eyebrow: "Carga real",
      title: "Guía rápida del partido real",
      intro:
        "Esta es la pantalla operativa del torneo. Acá sí están cargando información real del partido.",
      warning:
        "IMPORTANTE: los cambios guardados en esta pantalla impactan en los resultados reales y en las estadísticas públicas.",
      items: [
        {
          title: "Guardar resultado final",
          description:
            "Guarda el marcador definitivo y finaliza el partido. En una definición empatada también solicita los penales.",
          icon: CheckCircle2,
          tone: "warning",
        },
        {
          title: "Q1 · Q2 · Q3 · Q4",
          description:
            "Indica en qué período del partido están trabajando para que los eventos queden asociados correctamente.",
          icon: Clock3,
        },
        {
          title: "Iniciar / Pausar",
          description:
            "Inicia o pausa el cronómetro real del partido. El tiempo se mantiene sincronizado con la información guardada.",
          icon: Play,
        },
        {
          title: "Reloj a 0",
          description:
            "Reinicia el cronómetro del partido a 00:00. No borra marcador, goles ni tarjetas.",
          icon: RotateCcw,
          tone: "warning",
        },
        {
          title: "Deshacer",
          description:
            "Elimina el último evento cargado. Si era un gol, también corrige el marcador asociado.",
          icon: Undo2,
          tone: "warning",
        },
        {
          title: "Finalizar",
          description:
            "Detiene el reloj y marca el partido como finalizado con la información que ya está cargada.",
          icon: CheckCircle2,
          tone: "warning",
        },
        {
          title: "Gol",
          description:
            "Carga la goleadora y permite registrar varios goles de la misma jugadora indicando una cantidad.",
          icon: Target,
        },
        {
          title: "Verde / Amarilla / Roja",
          description:
            "Registra la tarjeta de una jugadora. Queda guardada como evento real y alimenta las estadísticas.",
          icon: Square,
        },
        {
          title: "Limpiar partido",
          description:
            "Borra eventos, goles, penales y devuelve el partido al estado pendiente. Usar solamente si realmente necesitan reiniciar ese partido.",
          icon: Trash2,
          tone: "danger",
        },
      ],
    };
  }

  return null;
}
