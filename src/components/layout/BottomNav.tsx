"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarDays, ClipboardList, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNav() {
  const pathname = usePathname();

  const links = [
    { name: "Inicio", href: "/", icon: CalendarDays },
    { name: "Colegio", href: "/mi-colegio", icon: Shield },
    { name: "Datos", href: "/estadisticas", icon: Activity },
    { name: "Planilla", href: "/admin", icon: ClipboardList },
  ];

  return (
    <div className="pointer-events-none fixed bottom-5 z-50 flex w-full justify-center px-4 md:hidden">
      <nav className="pointer-events-auto flex w-full max-w-[370px] items-center justify-between rounded-[2rem] border border-[#ded9cc] bg-[#fbfaf6]/90 p-2 shadow-[0_18px_50px_rgba(21,23,17,0.18)] backdrop-blur-2xl">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`relative flex h-14 w-[76px] items-center justify-center rounded-2xl transition ${
                isActive
                  ? "text-[#151711]"
                  : "text-[#74786a] hover:text-[#151711]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-active"
                  className="absolute inset-0 rounded-2xl bg-[#151711]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon
                  strokeWidth={isActive ? 2.6 : 2}
                  className={`h-5 w-5 transition ${
                    isActive ? "text-white" : "text-current"
                  }`}
                />

                <span
                  className={`text-[9px] font-black uppercase tracking-[0.14em] transition ${
                    isActive ? "text-[#d7c77a]" : "text-current"
                  }`}
                >
                  {link.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}