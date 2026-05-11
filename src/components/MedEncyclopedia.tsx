import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Book, X, RefreshCw, Info, AlertCircle, Pill } from "lucide-react";

export default function MedEncyclopedia() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const searchMed = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const { searchMedInfo } = await import("../lib/ai");
      const data = await searchMedInfo(query);
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
        className="w-full card p-4 flex items-center justify-between group hover:border-primary/50 transition-all bg-primary/5 border-primary/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-accent/10 flex items-center justify-center text-primary">
            <Book size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm tracking-tight text-primary">Med Encyclopedia</h3>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">AI Drug Information</p>
          </div>
        </div>
        <Search size={16} className="text-primary/40 group-hover:text-primary transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
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
              className="relative w-full max-w-lg bg-surface-main border border-border-main shadow-2xl p-8 rounded-[2.5rem] max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Pill className="text-primary" size={28} />
                  PharmaAI Search
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <input 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchMed()}
                    placeholder="Search medication name (e.g. Metformin)"
                    className="w-full bg-bg-main border border-border-main rounded-2xl px-6 py-4 text-text-primary outline-none focus:border-primary/50 transition-all"
                  />
                  <button 
                    onClick={searchMed}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-text-primary rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw size={20} className="animate-spin" /> : <Search size={20} />}
                  </button>
                </div>

                {result && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 border-t border-white/5 pt-6"
                  >
                    <div>
                      <h3 className="text-3xl font-black text-primary mb-2">{result.name}</h3>
                      <p className="text-sm font-medium leading-relaxed opacity-80">{result.generalDescription}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-bg-main border border-border-main rounded-2xl p-4 transition-all hover:border-primary/30">
                        <label className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 block">Common Uses</label>
                        <p className="text-xs font-medium leading-relaxed">{result.commonUses}</p>
                      </div>
                      <div className="bg-bg-main border border-border-main rounded-2xl p-4 transition-all hover:border-danger/30">
                        <label className="text-[9px] font-black uppercase tracking-widest text-danger mb-2 block">Side Effects</label>
                        <p className="text-xs font-medium leading-relaxed">{result.sideEffects}</p>
                      </div>
                    </div>

                    <div className="bg-bg-main border border-border-main rounded-2xl p-4 transition-all hover:border-warning/30 flex gap-4">
                      <AlertCircle className="text-warning shrink-0" size={18} />
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-warning mb-1 block">Precautions</label>
                        <p className="text-xs font-medium leading-relaxed">{result.precautions}</p>
                      </div>
                    </div>

                    <div className="bg-primary text-text-primary shadow-xl shadow-primary/10 p-6 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Did you know?</span>
                      </div>
                      <p className="text-sm font-medium italic">"{result.interestingFact}"</p>
                    </div>
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
