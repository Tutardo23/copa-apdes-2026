"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarDays, ClipboardList, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function SideNav() {
  const pathname = usePathname();

  const links = [
    { name: "Inicio", href: "/", icon: CalendarDays },
    { name: "Mi Colegio", href: "/mi-colegio", icon: Shield },
    { name: "Estadísticas", href: "/estadisticas", icon: Activity },
    { name: "Planilla en Vivo", href: "/admin", icon: ClipboardList },
  ];

  return (
    <aside className="z-50 hidden h-full w-64 flex-col border-r border-[#ded9cc] bg-[#fbfaf6]/85 p-6 shadow-[8px_0_40px_rgba(21,23,17,0.04)] backdrop-blur-2xl md:flex">
      <div className="mb-10 pl-2">
        <h2 className="text-3xl font-black leading-none tracking-[-0.07em] text-[#151711]">
          Copa{" "}
          <span className="relative inline-block">
            <span className="relative z-10">APDES</span>
            <span className="absolute -bottom-0.5 left-0 h-2 w-full rounded-full bg-[#d7c77a]/75" />
          </span>
        </h2>

        <p className="mt-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">
          Temporada 2026
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`relative overflow-hidden rounded-2xl px-4 py-3.5 transition ${
                isActive
                  ? "text-white"
                  : "text-[#74786a] hover:bg-white/70 hover:text-[#151711]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidenav-active"
                  className="absolute inset-0 rounded-2xl bg-[#151711]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-4">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    isActive ? "bg-white/10" : "bg-[#f0ede3]"
                  }`}
                >
                  <Icon
                    strokeWidth={isActive ? 2.6 : 2}
                    className={`h-5 w-5 ${
                      isActive ? "text-[#d7c77a]" : "text-[#74786a]"
                    }`}
                  />
                </span>

                <span
                  className={`text-sm tracking-wide ${
                    isActive ? "font-black" : "font-bold"
                  }`}
                >
                  {link.name}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[26px] border border-[#ded9cc] bg-white/65 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#74786a]">
          Estado
        </p>
        <p className="mt-2 text-sm font-black text-[#151711]">
          Jornada activa
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee9dd]">
          <div className="h-full w-2/3 rounded-full bg-[#d7c77a]" />
        </div>
      </div>
    </aside>
  );
}