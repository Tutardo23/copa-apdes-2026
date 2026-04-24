"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Shield, Activity, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNav() {
  const pathname = usePathname();

  const links = [
    { name: "Inicio", href: "/", icon: CalendarDays },
    { name: "Mi Colegio", href: "/mi-colegio", icon: Shield },
    { name: "Estadísticas", href: "/estadisticas", icon: Activity },
    // El admin lo dejamos acá por ahora, luego lo podés ocultar si no es admin
    { name: "Planilla", href: "/admin", icon: ClipboardList }, 
  ];

  return (
    <div className="fixed bottom-6 w-full md:hidden z-50 flex justify-center pointer-events-none px-4">
      <nav className="flex items-center justify-between gap-1 bg-white/90 backdrop-blur-xl p-2 rounded-[2rem] shadow-2xl shadow-slate-300/50 border border-white pointer-events-auto w-full max-w-[360px]">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`relative flex flex-col items-center justify-center h-14 w-[72px] rounded-2xl transition-all duration-300 ${
                isActive ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-active"
                  className="absolute inset-0 bg-emerald-50/80 rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon strokeWidth={isActive ? 2.5 : 2} className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : "scale-100"}`} />
                <span className={`text-[9px] font-bold tracking-wide transition-all duration-300 ${
                  isActive ? "opacity-100 h-auto translate-y-0" : "opacity-0 h-0 -translate-y-2 overflow-hidden"
                }`}>
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