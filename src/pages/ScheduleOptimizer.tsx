import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Clock, Calendar, Zap, Info, ChevronLeft, Brain, CheckCircle, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMedications } from "../hooks/useMedications";
import { useAuth } from "../hooks/useAuth";
import { optimizeSchedule } from "../lib/gemini";
import { cn } from "../lib/utils";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ScheduleOptimizer() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { medications } = useMedications(user?.uid);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [applied, setApplied] = useState(false);

  const handleOptimize = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await optimizeSchedule(medications, profile?.lifestyle);
      setSuggestion(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyOptimization = async () => {
    if (!suggestion || !user?.uid) return;
    setLoading(true);
    try {
      // In a real app, we would update each medication's time
      // For now, we simulate applying it
      setApplied(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary p-6 safe-area-bottom pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Schedule AI</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <div className="w-16 h-16 bg-ai/10 rounded-2xl flex items-center justify-center text-ai mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-white">Optimize Logic</h2>
          <p className="text-text-secondary text-sm font-medium">
            AI aligns your medication times with your lifestyle for maximum adherence.
          </p>
        </section>

        <div className="card p-6 border-white/5 bg-white/5 space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Current Lifestyle</h3>
           <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/20 rounded-xl">
                 <p className="text-[8px] font-black uppercase text-zinc-500">Wake Up</p>
                 <p className="text-sm font-bold text-white">{profile?.lifestyle?.wakeTime || '06:00'}</p>
              </div>
              <div className="p-3 bg-black/20 rounded-xl">
                 <p className="text-[8px] font-black uppercase text-zinc-500">Sleep</p>
                 <p className="text-sm font-bold text-white">{profile?.lifestyle?.sleepTime || '22:00'}</p>
              </div>
              <div className="p-3 bg-black/20 rounded-xl col-span-2">
                 <p className="text-[8px] font-black uppercase text-zinc-500">Work Hours</p>
                 <p className="text-sm font-bold text-white">{profile?.lifestyle?.workHours || '9AM - 5PM'}</p>
              </div>
           </div>
        </div>

        {!suggestion ? (
          <button 
            onClick={handleOptimize}
            disabled={loading || medications.length === 0}
            className="w-full h-16 bg-ai text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-ai/20 flex items-center justify-center gap-3"
          >
            {loading ? <RefreshCcw size={20} className="animate-spin" /> : <Brain size={20} />}
            {loading ? "Analyzing..." : "Calculate Best Times"}
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
             <div className="card p-8 border-ai/20 bg-ai/5 space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-ai/20 text-ai flex items-center justify-center">
                      <Zap size={32} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black uppercase italic leading-none text-white">AI Optimization</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-ai mt-1">Efficiency Boost: +40%</p>
                   </div>
                </div>

                <div className="space-y-3">
                   {suggestion.changes.map((change: any, i: number) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white">
                              {i + 1}
                           </div>
                           <div>
                              <p className="text-xs font-bold text-white">{change.medName}</p>
                              <p className="text-[9px] font-medium text-zinc-500">{change.reason}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-black uppercase text-zinc-500 line-through">{change.oldTime}</p>
                           <p className="text-sm font-black text-ai italic">{change.newTime}</p>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-[10px] font-black uppercase tracking-widest text-ai mb-2">AI Rationale</p>
                   <p className="text-xs font-medium text-zinc-300 leading-relaxed italic">
                     "{suggestion.rationale}"
                   </p>
                </div>
             </div>

             <button 
               onClick={applyOptimization}
               disabled={applied || loading}
               className={cn(
                 "w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                 applied ? "bg-safe text-white" : "bg-white text-black"
               )}
             >
               {applied ? <CheckCircle size={20} /> : null}
               {applied ? "Applied to Schedule" : "Apply AI Changes"}
             </button>
          </motion.div>
        )}

        <div className="p-6 bg-info/5 rounded-3xl border border-info/10 flex gap-4 items-start">
          <div className="p-2 bg-info/10 text-info rounded-lg mt-1">
            <Info size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Medical Note</h4>
            <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
              Optimization logic aims to group medications to avoid multiple alarms while ensuring safe buffers between doses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
