import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Activity, AlertCircle, RefreshCw, X, ChevronRight, Stethoscope } from "lucide-react";
import { cn } from "../lib/utils";

interface SymptomAnalyzerProps {
  medications: any[];
}

export default function SymptomAnalyzer({ medications }: SymptomAnalyzerProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const analyzeSymptom = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const { analyzeSymptomRelation } = await import("../lib/gemini");
      const data = await analyzeSymptomRelation(query, medications);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-bg-main border border-border-main flex items-center justify-between group hover:border-primary/50 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
            <Stethoscope size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm tracking-tight">Symptom Checker</h3>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">AI Side-Effect Analysis</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-surface-main border border-border-main shadow-2xl p-6 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Stethoscope className="text-danger" size={24} />
                  Symptom Analyzer
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && analyzeSymptom()}
                    placeholder="Describe your symptom (e.g., 'dizzy', 'nausea')"
                    className="w-full bg-bg-main border border-border-main rounded-xl px-4 py-3 text-text-primary outline-none focus:border-primary/50"
                  />
                  <button 
                    onClick={analyzeSymptom}
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-text-primary rounded-lg shadow-lg shadow-primary/20"
                  >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                  </button>
                </div>

                {result && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className={cn(
                      "p-4 rounded-xl border",
                      result.related ? "bg-danger/5 border-danger/20" : "bg-success/5 border-success/20"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        {result.related ? <AlertCircle size={16} className="text-danger" /> : <Activity size={16} className="text-success" />}
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          result.related ? "text-danger" : "text-success"
                        )}>
                          {result.related ? "Potential Medication Link" : "No Direct Link Found"}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{typeof result.explanation === 'string' ? result.explanation : "Analysis complete. See details below."}</p>
                    </div>

                    {result.relatedMedications?.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Associated Drugs</label>
                        {result.relatedMedications.map((med: string, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-bg-main border border-border-main">
                            <span className="text-xs font-bold">{med}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-danger px-1.5 py-0.5 bg-danger/10 rounded">Side Effect Risk</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
