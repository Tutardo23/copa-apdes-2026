"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Shield, Activity, ClipboardList } from "lucide-react";
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
    <aside className="hidden md:flex flex-col w-64 h-full bg-white/80 backdrop-blur-2xl border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] p-6 z-50">
      <div className="mb-10 pl-2">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">APDES</h2>
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Copa 2026</p>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive ? "text-emerald-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidenav-active"
                  className="absolute inset-0 bg-emerald-50/80 rounded-2xl border border-emerald-100/50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              <div className="relative z-10 flex items-center gap-4">
                <Icon strokeWidth={isActive ? 2.5 : 2} className={`w-5 h-5 ${isActive ? "text-emerald-600" : ""}`} />
                <span className={`text-sm tracking-wide ${isActive ? "font-black" : "font-semibold"}`}>
                  {link.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}