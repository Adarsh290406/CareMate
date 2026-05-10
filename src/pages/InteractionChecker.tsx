import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ShieldAlert, CheckCircle, AlertTriangle, ChevronLeft, Info, Sparkles, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMedications } from "../hooks/useMedications";
import { useAuth } from "../hooks/useAuth";
import { checkMedsInteraction } from "../lib/gemini";
import { cn } from "../lib/utils";

export default function InteractionChecker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { medications } = useMedications(user?.uid);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheck = async () => {
    if (!query || loading) return;
    setLoading(true);
    try {
      const currentMeds = medications.map(m => m.name);
      const res = await checkMedsInteraction(query, currentMeds);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary p-6 safe-area-bottom">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Interaction AI</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <Brain size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic">Safe-Check Engine</h2>
          <p className="text-text-secondary text-sm font-medium">
            Analyze if a new medication interacts with your current schedule.
          </p>
        </section>

        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center text-text-muted group-focus-within:text-primary transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Enter medication name (e.g. Aspirin)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-16 bg-surface border border-border rounded-2xl pl-14 pr-6 font-bold text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <button 
            onClick={handleCheck}
            disabled={!query || loading}
            className="absolute right-3 top-3 bottom-3 px-6 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
          >
            {loading ? "Checking..." : "Analyze"}
          </button>
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary px-1">Your Current Stack</h3>
           <div className="flex flex-wrap gap-2">
              {medications.map(m => (
                <span key={m.id} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-white">{m.name}</span>
              ))}
              {medications.length === 0 && <p className="text-[10px] italic text-text-muted">No medications active.</p>}
           </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-[2rem] p-8 border-2 space-y-6",
                result.safe ? "bg-safe/5 border-safe/20" : "bg-danger/5 border-danger/20"
              )}
            >
               <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center",
                    result.safe ? "bg-safe/20 text-safe" : "bg-danger/20 text-danger"
                  )}>
                     {result.safe ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                  </div>
                  <div>
                     <h4 className="text-lg font-black uppercase italic leading-none">{result.safe ? "Safe to Proceed" : "Potential Risk"}</h4>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">{result.safe ? "No critical interactions found" : "Interactions detected"}</p>
                  </div>
               </div>

               <p className="text-sm font-medium leading-relaxed text-zinc-300 italic">
                 "{result.advice}"
               </p>

               {!result.safe && result.warnings && (
                 <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-danger">Critical Warnings</p>
                    <div className="space-y-2">
                       {result.warnings.map((w: string, i: number) => (
                         <div key={i} className="flex gap-3 items-start text-xs text-zinc-400">
                            <ShieldAlert size={14} className="text-danger shrink-0 mt-0.5" />
                            <span>{w}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               <div className="pt-4 flex gap-3">
                  <button className="flex-1 py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Save Report</button>
                  <button onClick={() => navigate('/chat')} className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Sparkles size={12} /> Ask CareMate
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 bg-info/5 rounded-3xl border border-info/10 flex gap-4 items-start">
          <div className="p-2 bg-info/10 text-info rounded-lg mt-1">
            <Info size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Medical Disclaimer</h4>
            <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
              CareMate AI provides insights based on available drug databases. This is NOT a substitute for professional medical advice. Always consult your doctor before starting new medications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
