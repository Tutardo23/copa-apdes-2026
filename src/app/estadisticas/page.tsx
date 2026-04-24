"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Medal, Square, Shield, Trophy } from "lucide-react";

const topScorers = [
  { id: 1, name: "Martina López", team: "Mirasoles Col.", goals: 14, category: "C1C" },
  { id: 2, name: "Lucía Díaz", team: "Crisol Fed.", goals: 11, category: "C1C" },
  { id: 3, name: "Ana Gómez", team: "Torreón Col.", goals: 9, category: "C1C" },
  { id: 4, name: "Sofía Pérez", team: "El Faro", goals: 6, category: "C2C" },
  { id: 5, name: "Valentina Ruiz", team: "Los Cerros Col.", goals: 5, category: "C1C" },
];

const topCards = [
  { id: 1, name: "Sofía Pérez", team: "El Faro", green: 3, yellow: 1 },
  { id: 2, name: "Julieta Sosa", team: "Mirasoles Col.", green: 2, yellow: 0 },
];

export default function EstadisticasPage() {
  const [activeTab, setActiveTab] = useState<"goleadoras" | "tarjetas">("goleadoras");
  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-full flex flex-col w-full bg-[#f8fafc]">
      
      <header className="bg-white/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-200/60 pt-12 pb-6 px-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
           <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">Estadísticas</h1>
           <p className="text-sm font-semibold text-slate-500 mt-1">Líderes del torneo</p>
         </div>
         
         <div className="flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50 w-full md:w-auto">
           <button onClick={() => setActiveTab("goleadoras")} className={`flex-1 md:px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === "goleadoras" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Goleadoras</button>
           <button onClick={() => setActiveTab("tarjetas")} className={`flex-1 md:px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === "tarjetas" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Fair Play</button>
         </div>
      </header>

      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full flex-1">
        <AnimatePresence mode="wait">
          
          {activeTab === "goleadoras" && (
            <motion.div key="goleadoras" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col gap-8">
              
              {/* EL PODIO (TOP 3) */}
              <div className="flex items-end justify-center gap-2 md:gap-6 mt-8 mb-4 h-64">
                
                {/* 2do Puesto */}
                <div className="flex flex-col items-center w-28 md:w-36">
                  <div className="w-14 h-14 rounded-full bg-slate-100 border-4 border-slate-300 flex items-center justify-center text-sm font-black text-slate-500 shadow-lg z-10 relative">
                     {getInitials(topScorers[1].name)}
                     <div className="absolute -bottom-2 bg-slate-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">2°</div>
                  </div>
                  <div className="bg-gradient-to-t from-slate-200 to-slate-100 w-full h-24 rounded-t-2xl mt-[-20px] flex flex-col items-center justify-end pb-4 border-t border-x border-slate-300/50 shadow-inner">
                     <span className="text-2xl font-black text-slate-700">{topScorers[1].goals}</span>
                     <span className="text-[9px] font-black uppercase text-slate-500">Goles</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 mt-3 text-center leading-tight">{topScorers[1].name}</span>
                </div>

                {/* 1er Puesto (El más alto) */}
                <div className="flex flex-col items-center w-32 md:w-44 z-10">
                  <Trophy className="w-8 h-8 text-yellow-500 mb-2 drop-shadow-md" fill="currentColor" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-50 border-4 border-yellow-400 flex items-center justify-center text-xl font-black text-yellow-700 shadow-2xl relative">
                     {getInitials(topScorers[0].name)}
                     <div className="absolute -bottom-3 bg-yellow-500 text-yellow-950 text-[10px] px-3 py-0.5 rounded-full font-black shadow-sm">1° LÍDER</div>
                  </div>
                  <div className="bg-gradient-to-t from-yellow-200 via-yellow-100 to-yellow-50 w-full h-36 rounded-t-2xl mt-[-28px] flex flex-col items-center justify-end pb-6 border-t border-x border-yellow-300 shadow-[0_-10px_20px_rgba(234,179,8,0.15)]">
                     <span className="text-4xl font-black text-yellow-800">{topScorers[0].goals}</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600">Goles</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 mt-3 text-center leading-tight">{topScorers[0].name}</span>
                </div>

                {/* 3er Puesto */}
                <div className="flex flex-col items-center w-28 md:w-36">
                  <div className="w-14 h-14 rounded-full bg-orange-50 border-4 border-orange-300 flex items-center justify-center text-sm font-black text-orange-700 shadow-lg z-10 relative">
                     {getInitials(topScorers[2].name)}
                     <div className="absolute -bottom-2 bg-orange-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">3°</div>
                  </div>
                  <div className="bg-gradient-to-t from-orange-100 to-orange-50 w-full h-20 rounded-t-2xl mt-[-20px] flex flex-col items-center justify-end pb-3 border-t border-x border-orange-200 shadow-inner">
                     <span className="text-xl font-black text-orange-800">{topScorers[2].goals}</span>
                     <span className="text-[8px] font-black uppercase text-orange-600">Goles</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 mt-3 text-center leading-tight">{topScorers[2].name}</span>
                </div>

              </div>

              {/* El Resto del Ranking */}
              <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm mt-4">
                {topScorers.slice(3).map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-slate-400 w-6 text-center">{index + 4}°</span>
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">{getInitials(player.name)}</div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{player.name}</h3>
                        <p className="text-[10px] font-semibold text-slate-500">{player.team} • {player.category}</p>
                      </div>
                    </div>
                    <span className="text-lg font-black text-slate-700 w-12 text-center">{player.goals}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TARJETAS QUEDA IGUAL, REDISEÑADO MINIMALISTA */}
          {activeTab === "tarjetas" && (
            <motion.div key="tarjetas" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm mt-4">
                 {/* ... (el código de tarjetas que ya tenías queda perfecto acá) */}
                 <div className="p-8 text-center text-slate-500 font-bold">Ranking de Tarjetas Activo</div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}