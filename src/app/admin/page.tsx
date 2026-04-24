"use client";
import { useState, useEffect } from "react";
import { Clock, Target, Square, Play, Pause, AlertCircle, CheckCircle2, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function AdminPlanillaPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [period, setPeriod] = useState<1 | 2 | 3 | 4>(1);

  const [matchState, setMatchState] = useState({
    teamA: { name: "Mirasoles Col.", score: 1 },
    teamB: { name: "Torreón Col.", score: 0 },
    events: [] as any[]
  });

  // Modal State para carga rápida
  const [actionModal, setActionModal] = useState<{isOpen: boolean, team: "teamA"|"teamB" | null, type: "goal"|"green"|"yellow" | null}>({ isOpen: false, team: null, type: null });

  // Mock Jugadoras
  const mockPlayers = ["Martina López", "Ana Gómez", "Lucía Díaz", "Sofía Pérez", "Julieta Sosa"];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    let interval: any;
    if (isRunning) interval = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const openAction = (team: "teamA"|"teamB", type: "goal"|"green"|"yellow") => {
    setIsRunning(false); // Pausa el tiempo mientras carga el evento
    setActionModal({ isOpen: true, team, type });
  };

  const confirmAction = (playerName: string) => {
    const { team, type } = actionModal;
    if (!team || !type) return;

    const currentMinute = Math.floor(time / 60) + 1;
    
    if (type === "goal") {
      setMatchState(prev => ({
        ...prev,
        [team]: { ...prev[team], score: prev[team].score + 1 },
        events: [{ id: Date.now(), minute: currentMinute, period: `Q${period}`, team, type, player: playerName }, ...prev.events]
      }));
    } else {
      setMatchState(prev => ({
        ...prev,
        events: [{ id: Date.now(), minute: currentMinute, period: `Q${period}`, team, type, player: playerName }, ...prev.events]
      }));
    }
    
    setActionModal({ isOpen: false, team: null, type: null });
    setIsRunning(true); // Reanuda automático
  };

  return (
    <div className="min-h-full flex flex-col w-full bg-slate-950 font-sans relative">
      
      {/* MODAL SELECCIÓN DE JUGADORA */}
      <AnimatePresence>
        {actionModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 rounded-[32px] p-6 w-full max-w-sm shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-white flex items-center gap-2">
                   {actionModal.type === 'goal' ? <Target className="text-emerald-500"/> : <Square className={actionModal.type === 'green' ? "text-green-500 fill-green-500" : "text-yellow-500 fill-yellow-500"}/>}
                   Seleccionar Jugadora
                 </h3>
                 <button onClick={() => setActionModal({isOpen: false, team: null, type: null})} className="p-2 bg-slate-800 rounded-full text-slate-400"><X size={16}/></button>
               </div>
               
               <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {mockPlayers.map(p => (
                   <button key={p} onClick={() => confirmAction(p)} className="w-full text-left bg-slate-800 hover:bg-slate-700 hover:border-emerald-500 border border-transparent p-4 rounded-xl text-white font-bold transition-all">
                     {p}
                   </button>
                 ))}
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-slate-900 sticky top-0 z-40 border-b border-slate-800 pt-10 pb-4 px-6 flex justify-between items-center shadow-md">
         <div>
           <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">Planilla Control</h1>
           <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Cancha 1 • C1C</p>
         </div>
      </header>

      <div className="p-4 flex flex-col gap-5 flex-1 w-full max-w-3xl mx-auto">
        
        {/* CONTROL DE TIEMPO PREMIUM */}
        <div className="bg-slate-900 rounded-[32px] p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Selector de Cuartos */}
          <div className="flex justify-center gap-2 mb-6 relative z-10">
            {[1,2,3,4].map(q => (
              <button key={q} onClick={() => setPeriod(q as any)} className={`w-12 h-10 rounded-xl text-sm font-black transition-all border ${period === q ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
                Q{q}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center relative z-10">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cronómetro</div>
            <div className="text-[5rem] md:text-[6rem] font-black text-white tracking-tighter mb-6 font-mono leading-none drop-shadow-lg">
              {formatTime(time)}
            </div>

            <div className="flex gap-4 w-full max-w-sm">
              <button onClick={() => setTime(0)} className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors active:scale-95"><RotateCcw size={24} /></button>
              <button onClick={() => setIsRunning(!isRunning)} className={`flex-1 rounded-2xl flex items-center justify-center gap-2 text-xl font-black transition-all shadow-xl active:scale-95 ${isRunning ? "bg-rose-500/10 text-rose-500 border border-rose-500/30" : "bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-500"}`}>
                {isRunning ? <><Pause className="w-7 h-7" /> PAUSA</> : <><Play className="w-7 h-7 fill-current" /> INICIAR</>}
              </button>
            </div>
          </div>
        </div>

        {/* MARCADOR Y BOTONERA */}
        <div className="grid grid-cols-2 gap-4">
          {/* EQUIPO A */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-[28px] p-5 border border-slate-700 flex flex-col items-center shadow-lg">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full mb-3">Local</span>
            <h2 className="text-base font-bold text-white mb-2 text-center leading-tight h-10">{matchState.teamA.name}</h2>
            <span className="text-[5rem] font-black text-emerald-400 mb-6 leading-none drop-shadow-[0_0_20px_rgba(52,211,153,0.2)]">{matchState.teamA.score}</span>
            
            <div className="w-full flex flex-col gap-2">
              <button onClick={() => openAction("teamA", "goal")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm flex justify-center items-center gap-2 active:scale-95 transition-all shadow-md"><Target className="w-5 h-5"/> SUMAR GOL</button>
              <div className="flex gap-2">
                <button onClick={() => openAction("teamA", "green")} className="flex-1 bg-slate-950 border border-slate-800 hover:border-green-500/50 py-3 rounded-xl flex justify-center items-center active:scale-95 transition-all"><Square className="w-5 h-5 text-green-500 fill-green-500"/></button>
                <button onClick={() => openAction("teamA", "yellow")} className="flex-1 bg-slate-950 border border-slate-800 hover:border-yellow-500/50 py-3 rounded-xl flex justify-center items-center active:scale-95 transition-all"><Square className="w-5 h-5 text-yellow-500 fill-yellow-500"/></button>
              </div>
            </div>
          </div>

          {/* EQUIPO B */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-[28px] p-5 border border-slate-700 flex flex-col items-center shadow-lg">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full mb-3">Visita</span>
            <h2 className="text-base font-bold text-white mb-2 text-center leading-tight h-10">{matchState.teamB.name}</h2>
            <span className="text-[5rem] font-black text-white mb-6 leading-none">{matchState.teamB.score}</span>
            
            <div className="w-full flex flex-col gap-2">
              <button onClick={() => openAction("teamB", "goal")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm flex justify-center items-center gap-2 active:scale-95 transition-all shadow-md"><Target className="w-5 h-5"/> SUMAR GOL</button>
              <div className="flex gap-2">
                <button onClick={() => openAction("teamB", "green")} className="flex-1 bg-slate-950 border border-slate-800 hover:border-green-500/50 py-3 rounded-xl flex justify-center items-center active:scale-95 transition-all"><Square className="w-5 h-5 text-green-500 fill-green-500"/></button>
                <button onClick={() => openAction("teamB", "yellow")} className="flex-1 bg-slate-950 border border-slate-800 hover:border-yellow-500/50 py-3 rounded-xl flex justify-center items-center active:scale-95 transition-all"><Square className="w-5 h-5 text-yellow-500 fill-yellow-500"/></button>
              </div>
            </div>
          </div>
        </div>

        {/* LOG RECIENTE (Feedback visual para el árbitro) */}
        <div className="bg-slate-900 rounded-[24px] border border-slate-800 p-5 mt-2 flex-1">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Últimos Eventos Cargados</h3>
          <div className="flex flex-col gap-2">
            {matchState.events.slice(0, 3).map((evt) => (
              <div key={evt.id} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                <div className="flex flex-col items-center justify-center w-8 border-r border-slate-800 pr-3">
                   <span className="text-[9px] font-bold text-slate-500">{evt.period}</span>
                   <span className="text-xs font-black text-emerald-500">{evt.minute}'</span>
                </div>
                {evt.type === 'goal' && <Target className="w-4 h-4 text-emerald-500" />}
                {evt.type === 'green' && <Square className="w-4 h-4 text-green-500 fill-green-500" />}
                {evt.type === 'yellow' && <Square className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold text-white truncate">{evt.player}</span>
                  <span className="text-[10px] font-semibold text-slate-500 truncate">{evt.team === 'teamA' ? matchState.teamA.name : matchState.teamB.name}</span>
                </div>
              </div>
            ))}
            {matchState.events.length === 0 && <span className="text-xs font-bold text-slate-600 text-center py-4">Esperando acciones del partido...</span>}
          </div>
        </div>

      </div>
    </div>
  );
}