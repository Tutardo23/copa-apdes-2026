"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Trophy, LayoutGrid, ShieldAlert, X, CalendarDays, Target, Square } from "lucide-react";

// ─────────────────────────────────────────────
// 1. DATOS DE PRUEBA (MOCKS)
// ─────────────────────────────────────────────

const mockMatches = [
  { 
    id: 1, time: "8:30", category: "C1C", court: "Cancha 1", teamA: "Mirasoles Col.", teamB: "Crisol Col.", scoreA: 1, scoreB: 0, status: "finalizado",
    events: [
      { id: 1, minute: 14, type: "goal", player: "Martina López", team: "teamA" },
      { id: 2, minute: 32, type: "green_card", player: "Sofía Pérez", team: "teamB" }
    ]
  },
  { 
    id: 2, time: "9:00", category: "C3C", court: "Cancha 2", teamA: "Mirasoles Fed.", teamB: "Crisol Fed.", scoreA: 3, scoreB: 2, status: "finalizado",
    events: [
      { id: 3, minute: 8, type: "goal", player: "Laura Viale", team: "teamA" },
      { id: 4, minute: 22, type: "goal", player: "Camila Ruiz", team: "teamB" },
      { id: 5, minute: 40, type: "yellow_card", player: "Julieta Sosa", team: "teamA" },
    ]
  },
  { 
    id: 3, time: "10:00", category: "C1C", court: "Cancha 1", teamA: "Torreón Col.", teamB: "Los Cerros Col.", scoreA: 1, scoreB: 1, status: "en_curso",
    events: [
      { id: 6, minute: 5, type: "goal", player: "Ana Gómez", team: "teamA" },
      { id: 7, minute: 18, type: "goal", player: "Lucía Díaz", team: "teamB" }
    ]
  },
  { id: 4, time: "11:00", category: "C2C", court: "Cancha 3", teamA: "Mirasoles Col.", teamB: "Buen Ayre Col.", scoreA: null, scoreB: null, status: "por_jugar", events: [] },
  { id: 5, time: "12:30", category: "C3C", court: "Cancha 1", teamA: "El Faro", teamB: "Torreón Fed.", scoreA: null, scoreB: null, status: "por_jugar", events: [] }
];

const mockTable = [
  { pos: 1, team: "Mirasoles Col.", pts: 24, j: 8, g: 8, e: 0, p: 0, dif: "+19" },
  { pos: 2, team: "Torreón Col.", pts: 21, j: 8, g: 7, e: 0, p: 1, dif: "+14" },
  { pos: 3, team: "Los Cerros Col.", pts: 18, j: 8, g: 6, e: 0, p: 2, dif: "+12" },
  { pos: 4, team: "El Faro", pts: 17, j: 8, g: 5, e: 2, p: 1, dif: "+10" },
  { pos: 5, team: "Crisol Fed.", pts: 16, j: 8, g: 5, e: 1, p: 2, dif: "+8" },
  { pos: 6, team: "Buen Ayre Col.", pts: 15, j: 8, g: 4, e: 3, p: 1, dif: "+5" },
  { pos: 7, team: "Mirasoles Fed.", pts: 10, j: 8, g: 3, e: 1, p: 4, dif: "-2" },
  { pos: 8, team: "Torreón Fed.", pts: 8, j: 8, g: 2, e: 2, p: 4, dif: "-5" },
];

const mockBracket = {
  cuartos: [
    { id: 101, teamA: "Mirasoles Col.", scoreA: 3, teamB: "Torreón Fed.", scoreB: 0 },
    { id: 102, teamA: "El Faro", scoreA: 1, teamB: "Crisol Fed.", scoreB: 2 },
    { id: 103, teamA: "Torreón Col.", scoreA: 2, teamB: "Mirasoles Fed.", scoreB: 1 },
    { id: 104, teamA: "Los Cerros Col.", scoreA: 0, teamB: "Buen Ayre Col.", scoreB: 0, penalties: "4-5" },
  ],
  semis: [
    { id: 201, teamA: "Mirasoles Col.", scoreA: 2, teamB: "Crisol Fed.", scoreB: 1 },
    { id: 202, teamA: "Torreón Col.", scoreA: null, teamB: "Buen Ayre Col.", scoreB: null },
  ],
  final: [
    { id: 301, teamA: "Mirasoles Col.", scoreA: null, teamB: "TBD", scoreB: null },
  ]
};

const days = [
  { id: "jueves", label: "Jue", date: "23 Abr" },
  { id: "viernes", label: "Vie", date: "24 Abr" },
  { id: "sabado", label: "Sáb", date: "25 Abr" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"fixture" | "tabla" | "llaves">("fixture");
  const [activeDay, setActiveDay] = useState("viernes");
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  const featuredMatch = mockMatches.find(m => m.status === "en_curso") || mockMatches.find(m => m.status === "por_jugar") || mockMatches[0];

  return (
    <div className="min-h-full flex flex-col w-full bg-[#f8fafc] relative">
      
      {/* ───────────────────────────────────────────── */}
      {/* MODAL DETALLES DEL PARTIDO (PÚBLICO)          */}
      {/* ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedMatch && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedMatch(null)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            />
            
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 md:top-1/2 md:bottom-auto md:left-1/2 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-[450px] md:rounded-[32px] w-full bg-white rounded-t-[32px] shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90vh] md:max-h-[650px]"
            >
              <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
                 <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              {/* Header Modal */}
              <div className="p-6 pb-5 border-b border-slate-100 flex flex-col relative bg-white">
                 <button onClick={() => setSelectedMatch(null)} className="absolute top-5 right-5 p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <X size={18} strokeWidth={2.5} />
                 </button>

                 <div className="flex items-center gap-2 mb-6">
                   <span className="bg-slate-900 text-white px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest">{selectedMatch.category}</span>
                   {selectedMatch.status === 'en_curso' && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">EN JUEGO</span>}
                   {selectedMatch.status === 'finalizado' && <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">FINAL</span>}
                 </div>

                 {/* Marcador */}
                 <div className="flex items-center justify-between gap-4 px-2">
                   <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center text-lg font-black border border-slate-200 shadow-sm">{getInitials(selectedMatch.teamA)}</div>
                      <span className="text-xs font-bold text-slate-800 text-center leading-tight">{selectedMatch.teamA}</span>
                   </div>
                   
                   <div className="flex items-center gap-3 shrink-0 pb-4">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">{selectedMatch.scoreA ?? '-'}</span>
                      <span className="text-2xl font-black text-slate-200">-</span>
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">{selectedMatch.scoreB ?? '-'}</span>
                   </div>

                   <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center text-lg font-black border border-slate-200 shadow-sm">{getInitials(selectedMatch.teamB)}</div>
                      <span className="text-xs font-bold text-slate-800 text-center leading-tight">{selectedMatch.teamB}</span>
                   </div>
                 </div>
              </div>

              {/* Minuto a Minuto Límpio y Profesional */}
              <div className="overflow-y-auto flex-1 bg-slate-50/50 p-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Eventos del Partido</h4>
                 
                 {selectedMatch.events?.length === 0 ? (
                   <div className="text-center py-10 flex flex-col items-center justify-center gap-2">
                     <Clock size={24} className="text-slate-300" />
                     <span className="text-sm font-bold text-slate-400">Sin eventos registrados</span>
                   </div>
                 ) : (
                   <div className="flex flex-col">
                     {selectedMatch.events?.sort((a: any, b: any) => b.minute - a.minute).map((evt: any) => (
                       <div key={evt.id} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                         <span className="w-8 text-right text-xs font-black text-slate-400">{evt.minute}'</span>
                         
                         <div className="flex items-center justify-center w-6 h-6 shrink-0">
                           {evt.type === 'goal' && <Target size={18} strokeWidth={3} className="text-emerald-600" />}
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────── */}
      {/* HEADER & TABS DE NAVEGACIÓN PREMIUM          */}
      {/* ───────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-200/60 pt-8 pb-4 px-4 md:px-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Copa APDES <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-md uppercase tracking-widest font-bold translate-y-[-2px]">Live</span>
             </h1>
             <p className="text-sm font-semibold text-slate-500 mt-1">Temporada Regular 2026</p>
          </div>

          <div className="flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50 self-start md:self-auto w-full md:w-auto">
            {[
              { id: "fixture", label: "Fixture", icon: CalendarDays },
              { id: "tabla", label: "Posiciones", icon: Trophy },
              { id: "llaves", label: "Fase Final", icon: LayoutGrid }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isActive ? "text-emerald-900" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {isActive && (
                    <motion.div layoutId="header-tab" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────── */}
      {/* ÁREA DE CONTENIDO DINÁMICA                   */}
      {/* ───────────────────────────────────────────── */}
      <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          
          {/* ========================================================= */}
          {/* VISTA: FIXTURE */}
          {/* ========================================================= */}
          {activeTab === "fixture" && (
            <motion.div key="fixture" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-6">
              
              <div 
                onClick={() => setSelectedMatch(featuredMatch)}
                className="cursor-pointer bg-gradient-to-br from-emerald-900 via-[#0A2E1C] to-emerald-950 rounded-[28px] p-6 shadow-2xl relative overflow-hidden border border-emerald-800/50 hover:scale-[1.02] transition-transform"
              >
                 <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/30 blur-[60px] rounded-full pointer-events-none" />
                 <div className="relative z-10">
                   <div className="flex justify-between items-center mb-6">
                     <span className="bg-white/10 border border-white/20 text-white backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black tracking-widest flex items-center gap-1.5">
                       {featuredMatch.status === "en_curso" ? <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/> EN VIVO</> : "DESTACADO"}
                     </span>
                     <span className="text-emerald-200 text-xs font-bold uppercase tracking-widest">{featuredMatch.category} • {featuredMatch.court}</span>
                   </div>
                   <div className="flex items-center justify-between gap-4">
                     <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xl font-black text-white shadow-inner backdrop-blur-sm">{getInitials(featuredMatch.teamA)}</div>
                        <span className="text-white font-bold text-sm text-center line-clamp-1">{featuredMatch.teamA}</span>
                     </div>
                     <div className="flex flex-col items-center justify-center shrink-0 w-24">
                        {featuredMatch.status === "por_jugar" ? (
                           <span className="text-3xl font-black text-white tracking-tighter">{featuredMatch.time}</span>
                        ) : (
                           <div className="flex items-center gap-3">
                             <span className="text-4xl font-black text-white">{featuredMatch.scoreA}</span>
                             <span className="text-emerald-400/50 font-black">-</span>
                             <span className="text-4xl font-black text-white">{featuredMatch.scoreB}</span>
                           </div>
                        )}
                     </div>
                     <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xl font-black text-white shadow-inner backdrop-blur-sm">{getInitials(featuredMatch.teamB)}</div>
                        <span className="text-white font-bold text-sm text-center line-clamp-1">{featuredMatch.teamB}</span>
                     </div>
                   </div>
                 </div>
              </div>

              {/* Selector Días */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                {days.map((day) => (
                  <button key={day.id} onClick={() => setActiveDay(day.id)} className={`relative flex flex-col items-center justify-center shrink-0 w-20 h-16 rounded-2xl transition-all border ${activeDay === day.id ? "border-emerald-600 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
                    {activeDay === day.id && <motion.div layoutId="active-day" className="absolute inset-0 bg-emerald-600 rounded-2xl" />}
                    <span className="relative z-10 text-[10px] font-black uppercase tracking-widest opacity-80">{day.label}</span>
                    <span className="relative z-10 text-sm font-bold mt-0.5">{day.date.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              {/* Grid Partidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {mockMatches.filter(m => m.id !== featuredMatch.id).map((match) => (
                  <div key={match.id} onClick={() => setSelectedMatch(match)} className="cursor-pointer bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md hover:border-emerald-100 hover:-translate-y-1">
                    <div className="flex justify-between items-center mb-4 pl-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-black tracking-widest">{match.category}</span>
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-bold"><MapPin className="w-3.5 h-3.5" /> {match.court}</div>
                      </div>
                      {match.status === 'finalizado' && <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">FINAL</span>}
                      {match.status === 'por_jugar' && <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded-lg text-[10px] font-black"><Clock className="w-3 h-3" /> {match.time}</div>}
                    </div>

                    <div className="flex flex-col gap-3 pl-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[9px] font-black text-emerald-700">{getInitials(match.teamA)}</div>
                          <span className={`text-sm font-bold ${match.scoreA !== null && match.scoreA > (match.scoreB || 0) ? 'text-slate-900' : 'text-slate-600'}`}>{match.teamA}</span>
                        </div>
                        <span className={`text-xl font-black w-8 text-center ${match.scoreA !== null ? 'text-slate-900' : 'text-slate-300'}`}>{match.scoreA !== null ? match.scoreA : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[9px] font-black text-emerald-700">{getInitials(match.teamB)}</div>
                          <span className={`text-sm font-bold ${match.scoreB !== null && match.scoreB > (match.scoreA || 0) ? 'text-slate-900' : 'text-slate-600'}`}>{match.teamB}</span>
                        </div>
                        <span className={`text-xl font-black w-8 text-center ${match.scoreB !== null ? 'text-slate-900' : 'text-slate-300'}`}>{match.scoreB !== null ? match.scoreB : '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* VISTA: TABLA */}
          {/* ========================================================= */}
          {activeTab === "tabla" && (
            <motion.div key="tabla" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2 px-2">
                 <ShieldAlert className="w-5 h-5 text-emerald-600" />
                 <h2 className="text-lg font-black text-slate-900">Clasificación General</h2>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-[28px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full min-w-[500px] text-left border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200/60">
                      <tr>
                        <th className="py-4 pl-6 pr-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">#</th>
                        <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipo</th>
                        <th className="py-4 px-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">PTS</th>
                        <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center hidden sm:table-cell">J</th>
                        <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center hidden sm:table-cell">G</th>
                        <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center hidden sm:table-cell">E</th>
                        <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center hidden sm:table-cell">P</th>
                        <th className="py-4 pr-6 pl-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">+/-</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mockTable.map((row) => {
                        const isTop = row.pos <= 4; 
                        return (
                          <tr key={row.team} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-3 pl-6 pr-2 relative">
                              {isTop && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-r-full" />}
                              <span className={`text-xs font-bold ${isTop ? "text-emerald-600" : "text-slate-400"}`}>{row.pos}</span>
                            </td>
                            <td className="py-3 px-2">
                               <div className="flex items-center gap-3">
                                 <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 border border-slate-200">{getInitials(row.team)}</div>
                                 <span className="text-sm font-bold text-slate-800">{row.team}</span>
                               </div>
                            </td>
                            <td className="py-3 px-2 text-center text-sm font-black text-slate-900 bg-slate-50/50">{row.pts}</td>
                            <td className="py-3 px-2 text-center text-xs font-semibold text-slate-500 hidden sm:table-cell">{row.j}</td>
                            <td className="py-3 px-2 text-center text-xs font-semibold text-slate-500 hidden sm:table-cell">{row.g}</td>
                            <td className="py-3 px-2 text-center text-xs font-semibold text-slate-500 hidden sm:table-cell">{row.e}</td>
                            <td className="py-3 px-2 text-center text-xs font-semibold text-slate-500 hidden sm:table-cell">{row.p}</td>
                            <td className="py-3 pr-6 pl-2 text-center text-xs font-bold text-slate-600">{row.dif}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-200/60 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-500">Clasificación a Fase Final</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* VISTA: LLAVES */}
          {/* ========================================================= */}
          {activeTab === "llaves" && (
            <motion.div key="llaves" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2 px-2">
                 <Trophy className="w-5 h-5 text-amber-500" />
                 <h2 className="text-lg font-black text-slate-900">Camino a la Final</h2>
              </div>
              <div className="overflow-x-auto no-scrollbar bg-[#0A1F13] rounded-[32px] p-8 shadow-2xl relative border border-[#123620]">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}/>
                <div className="flex gap-8 min-w-max relative z-10">
                  <div className="flex flex-col justify-around gap-6 w-64">
                    <h3 className="text-center text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-2">Cuartos de Final</h3>
                    {mockBracket.cuartos.map(match => (
                      <div key={match.id} className="bg-[#13321F] border border-[#1E4D2F] rounded-2xl overflow-hidden shadow-lg flex flex-col">
                        <div className="flex justify-between items-center p-3 border-b border-[#1E4D2F]">
                          <span className="text-xs font-bold text-white truncate pr-2">{match.teamA}</span>
                          <span className={`text-sm font-black w-6 text-center rounded bg-[#0A1F13] ${match.scoreA! > match.scoreB! ? "text-[#A3E635]" : "text-emerald-700"}`}>{match.scoreA}</span>
                        </div>
                        <div className="flex justify-between items-center p-3">
                          <span className="text-xs font-bold text-white truncate pr-2">{match.teamB}</span>
                          <span className={`text-sm font-black w-6 text-center rounded bg-[#0A1F13] ${match.scoreB! > match.scoreA! ? "text-[#A3E635]" : "text-emerald-700"}`}>{match.scoreB}</span>
                        </div>
                        {match.penalties && (
                          <div className="bg-[#0A1F13] py-1 px-3 text-[9px] font-black text-emerald-500/80 text-right uppercase tracking-widest">
                            Pen: {match.penalties}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col justify-around gap-12 w-64">
                    <h3 className="text-center text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-2">Semifinales</h3>
                    {mockBracket.semis.map(match => (
                      <div key={match.id} className="bg-[#13321F] border border-[#1E4D2F] rounded-2xl overflow-hidden shadow-lg flex flex-col">
                        <div className="flex justify-between items-center p-3 border-b border-[#1E4D2F]">
                          <span className="text-xs font-bold text-white truncate pr-2">{match.teamA}</span>
                          <span className={`text-sm font-black w-6 text-center rounded bg-[#0A1F13] ${match.scoreA !== null ? (match.scoreA > (match.scoreB || 0) ? "text-[#A3E635]" : "text-emerald-700") : "text-emerald-900"}`}>{match.scoreA !== null ? match.scoreA : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3">
                          <span className="text-xs font-bold text-white truncate pr-2">{match.teamB}</span>
                          <span className={`text-sm font-black w-6 text-center rounded bg-[#0A1F13] ${match.scoreB !== null ? (match.scoreB > (match.scoreA || 0) ? "text-[#A3E635]" : "text-emerald-700") : "text-emerald-900"}`}>{match.scoreB !== null ? match.scoreB : '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col justify-center w-64">
                    <h3 className="text-center text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex justify-center items-center gap-1.5"><Trophy className="w-3.5 h-3.5" fill="currentColor"/> Gran Final</h3>
                    <div className="bg-gradient-to-br from-[#13321F] to-[#0A1F13] border border-amber-500/40 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-[#1E4D2F]">
                          <span className="text-sm font-bold text-white truncate pr-2">{mockBracket.final[0].teamA}</span>
                          <span className="text-base font-black w-8 text-center rounded bg-[#0A1F13] text-emerald-900">-</span>
                        </div>
                        <div className="flex justify-between items-center p-4">
                          <span className="text-sm font-bold text-emerald-500/60 truncate pr-2">{mockBracket.final[0].teamB}</span>
                          <span className="text-base font-black w-8 text-center rounded bg-[#0A1F13] text-emerald-900">-</span>
                        </div>
                    </div>
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