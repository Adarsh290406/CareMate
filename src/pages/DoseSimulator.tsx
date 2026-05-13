import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, AlertTriangle, Activity, TrendingDown, Info, ChevronLeft, Sparkles, Zap, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMedications } from "../hooks/useMedications";
import { useAuth } from "../hooks/useAuth";
import { simulateMissedDose } from "../lib/gemini";
import { cn } from "../lib/utils";

export default function DoseSimulator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { medications } = useMedications(user?.uid);
  const [selectedMed, setSelectedMed] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);

  const handleSimulate = async () => {
    if (!selectedMed || loading) return;
    setLoading(true);
    try {
      const res = await simulateMissedDose(selectedMed);
      setSimulation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main p-6 safe-area-bottom">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-surface-main border border-border-main rounded-xl text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-text-primary">Impact Simulator</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <div className="w-16 h-16 bg-danger/10 rounded-2xl flex items-center justify-center text-danger mx-auto mb-4">
            <Brain size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-text-primary">What if I miss?</h2>
          <p className="text-text-secondary text-sm font-medium">
            AI-driven simulation of how missing a dose affects your health.
          </p>
        </section>

        <div className="space-y-4">
           <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Select Medication to Simulate</label>
           <div className="grid grid-cols-1 gap-2">
              {medications.map(m => (
                <button 
                  key={m.id}
                  onClick={() => setSelectedMed(m.name)}
                  className={cn(
                    "p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all",
                    selectedMed === m.name ? "bg-danger/10 border-danger text-text-primary" : "bg-surface-main border-border-main text-text-secondary"
                  )}
                >
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        selectedMed === m.name ? "bg-danger/20 text-danger" : "bg-bg-main border border-border-main"
                      )}>
                         <Zap size={18} />
                      </div>
                      <span className="font-bold">{m.name}</span>
                   </div>
                   {selectedMed === m.name && <Check size={18} className="text-danger" />}
                </button>
              ))}
           </div>
           
           <button 
             onClick={handleSimulate}
             disabled={!selectedMed || loading}
             className="w-full h-16 bg-danger text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-danger/20 disabled:opacity-50"
           >
             {loading ? "Simulating..." : "Run AI Simulation"}
           </button>
        </div>

        <AnimatePresence mode="wait">
          {simulation && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
               <div className="card p-8 border-danger/20 bg-danger/5 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-danger/20 text-danger flex items-center justify-center animate-pulse">
                        <ShieldAlert size={32} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase italic leading-none text-text-primary">Projected Impact</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-danger mt-1">Severity: {simulation.severity}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="p-4 bg-surface-main rounded-2xl border border-border-main">
                        <div className="flex items-center gap-2 text-warning mb-2">
                           <TrendingDown size={14} />
                           <p className="text-[10px] font-black uppercase tracking-widest">Health Risk</p>
                        </div>
                        <p className="text-sm font-medium text-text-secondary leading-relaxed">{simulation.impact}</p>
                     </div>

                     <div className="p-4 bg-surface-main rounded-2xl border border-border-main">
                        <div className="flex items-center gap-2 text-info mb-2">
                           <Info size={14} />
                           <p className="text-[10px] font-black uppercase tracking-widest">Recovery Action</p>
                        </div>
                        <p className="text-sm font-medium text-text-secondary leading-relaxed italic">"{simulation.recovery}"</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-surface-main border border-border-main rounded-2xl">
                     <div className="text-center flex-1">
                        <p className="text-[9px] font-black uppercase text-text-secondary opacity-60 mb-1">Efficacy Drop</p>
                        <p className="text-xl font-black text-danger">{simulation.efficacyDrop}%</p>
                     </div>
                     <div className="w-px h-8 bg-border-main" />
                     <div className="text-center flex-1">
                        <p className="text-[9px] font-black uppercase text-text-secondary opacity-60 mb-1">Safety Window</p>
                        <p className="text-xl font-black text-warning">{simulation.safetyWindow}h</p>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-info/5 rounded-3xl border border-info/10 flex gap-4 items-start">
                 <div className="p-2 bg-info/10 text-info rounded-lg mt-1">
                   <Sparkles size={16} />
                 </div>
                 <div className="space-y-1">
                   <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">CareMate Insight</h4>
                   <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
                     This simulation uses medical pharmacokinetic models to estimate drug half-life impact. It is for educational purposes only.
                   </p>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Check({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
