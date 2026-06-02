"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Eye, Shield } from "lucide-react";
import { useSchoolPreference } from "@/src/components/providers/SchoolPreferenceProvider";
import { SCHOOLS } from "@/src/lib/schools";

export default function SchoolSelectorModal() {
  const pathname = usePathname();
  const { ready, hasPreference, setSelectedSchool, setAllSchools } = useSchoolPreference();

  const isAdminRoute = pathname?.startsWith("/admin");
  const shouldShow = ready && !hasPreference && !isAdminRoute;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end bg-[#151711]/75 px-3 pb-3 backdrop-blur-md md:items-center md:justify-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            initial={{ y: 28, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[34px] bg-[#f6f4ee] p-4 shadow-2xl md:p-6"
          >
            <div className="rounded-[28px] bg-[#151711] p-5 text-white md:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Shield className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-white/60">
                    Copa APDES 2026
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] md:text-5xl">
                    ¿De qué colegio sos?
                  </h2>
                  <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/60">
                    A partir de tu elección, la experiencia queda personalizada con tus partidos, tus resultados y tus estadísticas.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SCHOOLS.map((school) => (
                <button
                  key={school.id}
                  onClick={() => setSelectedSchool(school.name)}
                  className="group flex items-center gap-3 rounded-[24px] border border-[#ded9cc] bg-white/85 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#151711]/30 hover:bg-white hover:shadow-sm"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#ded9cc] bg-white">
                    <Image
                      src={school.crest}
                      alt={`Escudo de ${school.name}`}
                      width={72}
                      height={72}
                      className="h-full w-full object-contain p-1.5"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-[#151711]">{school.name}</span>
                    <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
                      Seleccionar
                    </span>
                  </span>

                  <CheckCircle2 className="h-5 w-5 text-[#151711]/25 opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={setAllSchools}
                className="inline-flex items-center gap-2 rounded-full border border-[#ded9cc] bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#74786a] transition hover:border-[#151711]/30 hover:text-[#151711]"
              >
                <Eye className="h-3.5 w-3.5" />
                Modo control: ver todos
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
