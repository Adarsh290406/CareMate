import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Pill, ArrowRight, RefreshCcw, Sparkles, Info, ChevronLeft, Zap, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { convertDrugBrand } from "../lib/gemini";
import { cn } from "../lib/utils";

export default function DrugConverter() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleConvert = async () => {
    if (!query || loading) return;
    setLoading(true);
    try {
      const res = await convertDrugBrand(query);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main p-6 safe-area-bottom pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-surface-main border border-border-main rounded-xl text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-text-primary">Med Converter</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <Zap size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-text-primary">Brand to Generic</h2>
          <p className="text-text-secondary text-sm font-medium">
            Find generic alternatives and chemical compositions for any brand name medication.
          </p>
        </section>

        <div className="space-y-4">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-60" size={20} />
               <input 
                 value={query}
                 onChange={e => setQuery(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleConvert()}
                 placeholder="Enter brand name (e.g. Lipitor, Panadol)" 
                 className="w-full h-16 bg-surface-main border border-border-main rounded-2xl pl-12 pr-6 text-sm font-bold text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-primary transition-all"
               />
            </div>
           
            <button 
              onClick={handleConvert}
              disabled={!query || loading}
              className="w-full h-16 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
              {loading ? <RefreshCcw size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {loading ? "Analyzing..." : "Find Alternatives"}
            </button>
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
               <div className="card p-8 border-primary/20 bg-primary/5 space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                         <Pill size={32} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black uppercase italic leading-none text-text-primary">{result.brandName}</h3>
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Found Result</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="p-5 bg-surface-main border border-border-main rounded-[2rem] relative group">
                         <div className="absolute -top-2 left-4 px-2 bg-bg-main border border-border-main rounded text-[8px] font-black uppercase tracking-widest text-text-secondary opacity-60">Generic Name</div>
                         <p className="text-lg font-black text-text-primary">{result.genericName}</p>
                      </div>

                      <div className="p-5 bg-surface-main border border-border-main rounded-[2rem] relative">
                         <div className="absolute -top-2 left-4 px-2 bg-bg-main border border-border-main rounded text-[8px] font-black uppercase tracking-widest text-text-secondary opacity-60">Composition</div>
                         <p className="text-sm font-medium text-text-secondary leading-relaxed">{result.composition}</p>
                      </div>

                      <div className="p-5 bg-safe/5 rounded-[2rem] border border-safe/20 relative">
                         <div className="absolute -top-2 left-4 px-2 bg-bg-main border border-border-main rounded text-[8px] font-black uppercase tracking-widest text-safe">Usage</div>
                         <div className="flex items-start gap-2">
                            <ShieldCheck size={14} className="text-safe shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-text-secondary italic">"{result.usage}"</p>
                         </div>
                      </div>
                   </div>

                   <div className="p-4 bg-bg-main border border-border-main rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Popular Alternatives</p>
                      <div className="flex flex-wrap gap-2">
                         {result.alternatives && result.alternatives.length > 0 ? (
                           result.alternatives.map((alt: string, i: number) => (
                              <span key={i} className="px-3 py-1.5 bg-surface-main border border-border-main rounded-lg text-[10px] font-bold text-text-primary">{alt}</span>
                           ))
                         ) : (
                           <p className="text-[10px] font-bold text-text-secondary opacity-60">No specific alternatives found.</p>
                         )}
                      </div>
                   </div>
               </div>

               <div className="p-6 bg-info/5 rounded-3xl border border-info/10 flex gap-4 items-start">
                 <div className="p-2 bg-info/10 text-info rounded-lg mt-1">
                   <Info size={16} />
                 </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Medical Disclaimer</h4>
                   <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
                     Generic alternatives are chemically identical but can vary in price and manufacturing. Always consult your pharmacist before switching brands.
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
