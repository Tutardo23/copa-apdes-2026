"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ShieldCheck, Activity, Target, Square, X, CalendarDays } from "lucide-react";

// ─────────────────────────────────────────────
// COMPONENTES VISUALES Y 3D
// ─────────────────────────────────────────────

// Esferas 3D Flotantes para el Hero
const Floating3DBalls = ({ ballColor }: { ballColor: string }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Esfera 1 - Grande y principal */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-10 top-10 w-48 h-48 md:w-64 md:h-64 rounded-full opacity-90 shadow-2xl"
        style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${ballColor} 60%, rgba(0,0,0,0.6))` }}
      />
      {/* Esfera 2 - Mediana desenfocada en el fondo */}
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute right-32 md:right-56 -bottom-10 w-32 h-32 md:w-40 md:h-40 rounded-full opacity-60 blur-[3px]"
        style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), ${ballColor} 60%, rgba(0,0,0,0.8))` }}
      />
      {/* Esfera 3 - Pequeña y nítida */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute right-1/4 top-5 w-16 h-16 md:w-20 md:h-20 rounded-full opacity-100 shadow-xl"
        style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), ${ballColor} 50%, rgba(0,0,0,0.5))` }}
      />
    </div>
  );
};

// Cancha de Hockey 
const HockeyField = ({ courtName }: { courtName: string }) => (
  <div className="relative w-full h-48 bg-emerald-600 rounded-2xl border-4 border-white/20 overflow-hidden shadow-inner flex items-center justify-center">
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 40px)" }} />
    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/60 -translate-y-1/2" />
    <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 border-2 border-white/60 rounded-full" />
    <div className="absolute top-0 left-1/2 w-32 h-16 -translate-x-1/2 border-2 border-white/60 rounded-b-[100px] border-t-0" />
    <div className="absolute top-0 left-1/2 w-12 h-6 -translate-x-1/2 border-2 border-white/60 rounded-b-[50px] border-t-0 bg-white/10" />
    <div className="absolute bottom-0 left-1/2 w-32 h-16 -translate-x-1/2 border-2 border-white/60 rounded-t-[100px] border-b-0" />
    <div className="absolute bottom-0 left-1/2 w-12 h-6 -translate-x-1/2 border-2 border-white/60 rounded-t-[50px] border-b-0 bg-white/10" />
    <div className="relative z-10 bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl">
       <MapPin size={16} className="text-emerald-400" />
       <span className="text-white font-black uppercase tracking-widest text-xs">{courtName}</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// CONFIGURACIÓN DINÁMICA DE COLORES
// ─────────────────────────────────────────────
const schoolThemes: Record<string, any> = {
  "Mirasoles": {
    gradient: "from-emerald-900 to-[#0A2E1C]",
    textLight: "text-emerald-400",
    glow: "bg-emerald-500/20",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    ballColor: "rgba(16, 185, 129, 0.8)", // Verde Esmeralda
  },
  "Torreón": {
    gradient: "from-blue-900 to-[#0A192F]",
    textLight: "text-blue-400",
    glow: "bg-blue-500/20",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    ballColor: "rgba(59, 130, 246, 0.8)", // Azul
  },
  "Crisol": {
    gradient: "from-rose-900 to-[#2E0A16]",
    textLight: "text-rose-400",
    glow: "bg-rose-500/20",
    badge: "bg-rose-50 text-rose-700 border-rose-100",
    ballColor: "rgba(225, 29, 72, 0.8)", // Rojo Rose
  },
  "El Faro": {
    gradient: "from-amber-900 to-[#2E1A0A]",
    textLight: "text-amber-400",
    glow: "bg-amber-500/20",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    ballColor: "rgba(245, 158, 11, 0.8)", // Amarillo/Ambar
  },
  "Buen Ayre": {
    gradient: "from-indigo-900 to-[#120A2E]",
    textLight: "text-indigo-400",
    glow: "bg-indigo-500/20",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
    ballColor: "rgba(99, 102, 241, 0.8)", // Indigo
  },
  "Los Cerros": {
    gradient: "from-violet-900 to-[#1A0A2E]",
    textLight: "text-violet-400",
    glow: "bg-violet-500/20",
    badge: "bg-violet-50 text-violet-700 border-violet-100",
    ballColor: "rgba(139, 92, 246, 0.8)", // Violeta
  }
};

const colegios = ["Mirasoles", "Torreón", "Crisol", "El Faro", "Buen Ayre", "Los Cerros"];

// ─────────────────────────────────────────────
// DATOS MOCK
// ─────────────────────────────────────────────
const mockSchoolStats = {
  "Mirasoles": { pts: 24, pj: 8, pg: 8, pe: 0, pp: 0, gf: 23, gc: 4, racha: ["W", "W", "W", "W", "W"] },
  "Torreón": { pts: 21, pj: 8, pg: 7, pe: 0, pp: 1, gf: 18, gc: 5, racha: ["W", "W", "L", "W", "W"] },
  "Crisol": { pts: 18, pj: 8, pg: 6, pe: 0, pp: 2, gf: 15, gc: 8, racha: ["L", "W", "W", "L", "W"] },
};

const mockMatches = [
  { id: 1, time: "11:00", date: "Hoy", category: "C2C", court: "Cancha 3", teamA: "Mirasoles Col.", teamB: "Buen Ayre Col.", scoreA: null, scoreB: null, status: "por_jugar", events: [] },
  { id: 2, time: "14:00", date: "Mañana", category: "C1C", court: "Cancha 1", teamA: "Mirasoles Fed.", teamB: "Torreón Col.", scoreA: null, scoreB: null, status: "por_jugar", events: [] }
];

const mockResults = [
  { id: 3, date: "Ayer", category: "C1C", court: "Cancha 1", teamA: "Mirasoles Col.", teamB: "Crisol Col.", scoreA: 1, scoreB: 0, result: "win", status: "finalizado", events: [{ id: 1, minute: 14, type: "goal", player: "Martina López", team: "teamA" }] },
  { id: 4, date: "20 Abr", category: "C3C", court: "Cancha 2", teamA: "Torreón Fed.", teamB: "El Faro", scoreA: 3, scoreB: 1, result: "win", status: "finalizado", events: [{ id: 3, minute: 8, type: "goal", player: "Laura Viale", team: "teamA" }] },
];

export default function MiColegioPage() {
  const [selectedSchool, setSelectedSchool] = useState<string>("Mirasoles");
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  
  // Obtenemos los colores y datos del colegio seleccionado (si no hay datos exactos, usamos un fallback)
  const theme = schoolThemes[selectedSchool] || schoolThemes["Mirasoles"];
  const stats = (mockSchoolStats as any)[selectedSchool] || mockSchoolStats["Mirasoles"];

  return (
    <div className="min-h-full flex flex-col w-full bg-[#f8fafc] relative">
      
      {/* ───────────────────────────────────────────── */}
      {/* MODAL DEL PARTIDO (Inmersivo) */}
      {/* ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedMatch && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMatch(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 md:top-1/2 md:bottom-auto md:left-1/2 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-[450px] md:rounded-[32px] w-full bg-slate-50 rounded-t-[32px] shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90vh] md:max-h-[700px]">
              
              <div className="bg-white p-4 relative">
                 <button onClick={() => setSelectedMatch(null)} className="absolute top-4 right-4 z-20 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors">
                    <X size={16} strokeWidth={3} />
                 </button>

                 <HockeyField courtName={selectedMatch.court} />

                 <div className="bg-white rounded-2xl shadow-xl -mt-8 relative z-10 p-5 border border-slate-100 mx-2">
                    <div className="flex justify-center mb-4">
                       <span className="bg-slate-900 text-white px-3 py-1 rounded-md text-[10px] font-black tracking-widest">{selectedMatch.category}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col items-center gap-2 flex-1">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border ${selectedMatch.teamA.includes(selectedSchool) ? theme.badge : 'bg-slate-50 text-slate-700 border-slate-200'}`}>{getInitials(selectedMatch.teamA)}</div>
                         <span className="text-xs font-bold text-slate-800 text-center leading-tight">{selectedMatch.teamA}</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center shrink-0 w-24">
                        {selectedMatch.status === "por_jugar" ? (
                           <>
                             <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{selectedMatch.date}</span>
                             <span className="text-3xl font-black text-slate-900 tracking-tighter">{selectedMatch.time}</span>
                           </>
                        ) : (
                           <div className="flex items-center gap-3">
                             <span className="text-4xl font-black text-slate-900">{selectedMatch.scoreA}</span>
                             <span className="text-xl text-slate-300">-</span>
                             <span className="text-4xl font-black text-slate-900">{selectedMatch.scoreB}</span>
                           </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-2 flex-1">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border ${selectedMatch.teamB.includes(selectedSchool) ? theme.badge : 'bg-slate-50 text-slate-700 border-slate-200'}`}>{getInitials(selectedMatch.teamB)}</div>
                         <span className="text-xs font-bold text-slate-800 text-center leading-tight">{selectedMatch.teamB}</span>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                 {selectedMatch.status === "por_jugar" ? (
                   <div className="flex flex-col items-center justify-center py-8 opacity-60">
                     <CalendarDays size={48} strokeWidth={1} className="text-slate-400 mb-4" />
                     <h3 className="text-lg font-black text-slate-800">Próximamente</h3>
                     <p className="text-xs font-bold text-slate-500 mt-1">Los detalles aparecerán cuando inicie.</p>
                   </div>
                 ) : (
                   <>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Línea de Tiempo</h4>
                     {selectedMatch.events?.length === 0 ? (
                       <div className="text-center py-8 text-sm font-bold text-slate-400">Sin eventos registrados.</div>
                     ) : (
                       <div className="flex flex-col gap-3">
                         {selectedMatch.events?.sort((a: any, b: any) => b.minute - a.minute).map((evt: any) => (
                           <div key={evt.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                             <span className="w-8 text-right text-xs font-black text-slate-400">{evt.minute}'</span>
                             <div className="flex items-center justify-center w-6 h-6 shrink-0">
                               {evt.type === 'goal' && <Target size={20} strokeWidth={2.5} className={theme.textLight} />}
                               {evt.type === 'green_card' && <Square size={16} className="text-green-500 fill-green-500" />}
                               {evt.type === 'yellow_card' && <Square size={16} className="text-yellow-500 fill-yellow-500" />}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold text-slate-800 truncate">{evt.player}</p>
                               <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate mt-0.5">
                                 {evt.type === 'goal' ? 'GOL' : evt.type === 'green_card' ? 'TARJETA VERDE' : 'TARJETA AMARILLA'} 
                                 <span className="opacity-50 mx-1">•</span> 
                                 {evt.team === 'teamA' ? selectedMatch.teamA : selectedMatch.teamB}
                               </p>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* ───────────────────────────────────────────── */}
      {/* HEADER SIN BUSCADOR Y TABS ELEGANTES */}
      {/* ───────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-200/60 pt-10 pb-5 px-6 shadow-sm">
         <div className="max-w-7xl mx-auto flex flex-col gap-4">
           <div>
             <h1 className="text-3xl font-black tracking-tight text-slate-900">Mi Colegio</h1>
             <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">Copa 2026</p>
           </div>
           
           {/* Slider de Colegios */}
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {colegios.map(colegio => (
                <button
                  key={colegio}
                  onClick={() => setSelectedSchool(colegio)}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedSchool === colegio 
                    ? "bg-slate-900 text-white shadow-md scale-105" 
                    : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {colegio}
                </button>
              ))}
            </div>
         </div>
      </header>

      {/* ───────────────────────────────────────────── */}
      {/* ÁREA PRINCIPAL (2 COLUMNAS EN PC) */}
      {/* ───────────────────────────────────────────── */}
      <div className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {selectedSchool && (
            <motion.div key={selectedSchool} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* COLUMNA IZQUIERDA: PERFIL DEL COLEGIO (Sticky en PC) */}
              <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6 lg:sticky lg:top-40">
                <div className={`bg-gradient-to-b ${theme.gradient} rounded-[32px] p-6 shadow-xl relative overflow-hidden border border-white/5 flex flex-col items-center text-center transition-colors duration-500`}>
                   
                   {/* Fondo 3D Animado */}
                   <Floating3DBalls ballColor={theme.ballColor} />
                   
                   <div className="relative z-10 w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-black text-white shadow-inner backdrop-blur-md mb-4">
                     {getInitials(selectedSchool)}
                   </div>
                   
                   <div className="relative z-10 mb-8">
                     <h2 className="text-3xl font-black text-white tracking-tight">{selectedSchool}</h2>
                     <ShieldCheck className={`w-5 h-5 ${theme.textLight} mx-auto mt-2`} />
                   </div>

                   {/* Stats Grid Compacto */}
                   <div className="relative z-10 w-full grid grid-cols-2 gap-3">
                      <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <span className="block text-3xl font-black text-white leading-none mb-1">{stats.pts}</span>
                        <span className={`text-[9px] font-bold ${theme.textLight} uppercase tracking-widest`}>Puntos</span>
                      </div>
                      <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <span className="block text-3xl font-black text-white leading-none mb-1">{stats.gf}</span>
                        <span className={`text-[9px] font-bold ${theme.textLight} uppercase tracking-widest`}>Goles</span>
                      </div>
                      <div className="col-span-2 bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                         <span className={`text-[9px] font-bold ${theme.textLight} uppercase tracking-widest mb-2`}>Racha actual</span>
                         <div className="flex gap-2">
                           {stats.racha.map((r: string, i: number) => (
                             <span key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${r === 'W' ? 'bg-emerald-500 text-emerald-950' : r === 'L' ? 'bg-red-500 text-red-950' : 'bg-slate-400 text-slate-900'}`}>
                               {r}
                             </span>
                           ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: PARTIDOS */}
              <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col gap-8">
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* PRÓXIMOS */}
                   <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 px-1 border-b border-slate-200 pb-2">
                        <Clock className={`w-5 h-5 ${theme.textLight.replace('text-', 'text-').replace('-400', '-600')}`} />
                        <h3 className="text-lg font-black text-slate-900">Próximos</h3>
                      </div>
                      {mockMatches.map((match) => (
                        <div key={match.id} onClick={() => setSelectedMatch(match)} className="cursor-pointer bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-slate-100 pr-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase">{match.date}</span>
                             <span className="text-sm font-black text-slate-900 mt-0.5">{match.time}</span>
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                             <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black tracking-widest w-max">{match.category} • {match.court}</span>
                             <div className="flex flex-col">
                               <span className={`text-sm truncate font-bold ${match.teamA.includes(selectedSchool) ? theme.textLight.replace('-400', '-700') : 'text-slate-700'}`}>{match.teamA}</span>
                               <span className={`text-sm truncate font-bold ${match.teamB.includes(selectedSchool) ? theme.textLight.replace('-400', '-700') : 'text-slate-700'}`}>{match.teamB}</span>
                             </div>
                          </div>
                        </div>
                      ))}
                   </div>

                   {/* RESULTADOS */}
                   <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 px-1 border-b border-slate-200 pb-2">
                        <Activity className={`w-5 h-5 ${theme.textLight.replace('text-', 'text-').replace('-400', '-600')}`} />
                        <h3 className="text-lg font-black text-slate-900">Resultados</h3>
                      </div>
                      {mockResults.map((match) => (
                        <div key={match.id} onClick={() => setSelectedMatch(match)} className="cursor-pointer bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-slate-100 pr-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase">{match.date}</span>
                             <span className={`mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${match.result === 'win' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                               {match.result === 'win' ? 'Ganó' : 'Perdió'}
                             </span>
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                             <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black tracking-widest w-max">{match.category}</span>
                             <div className="flex justify-between items-center">
                               <span className={`text-sm truncate font-bold ${match.teamA.includes(selectedSchool) ? theme.textLight.replace('-400', '-700') : 'text-slate-500'}`}>{match.teamA}</span>
                               <span className="text-sm font-black text-slate-900 ml-2">{match.scoreA}</span>
                             </div>
                             <div className="flex justify-between items-center">
                               <span className={`text-sm truncate font-bold ${match.teamB.includes(selectedSchool) ? theme.textLight.replace('-400', '-700') : 'text-slate-500'}`}>{match.teamB}</span>
                               <span className="text-sm font-black text-slate-900 ml-2">{match.scoreB}</span>
                             </div>
                          </div>
                        </div>
                      ))}
                   </div>
                 </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}