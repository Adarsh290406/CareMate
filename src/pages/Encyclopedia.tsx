import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Info, Book, Heart, Shield, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchMedInfo } from "../lib/gemini";
import { cn } from "../lib/utils";

export default function Encyclopedia() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!query || loading) return;
    setLoading(true);
    try {
      const res = await searchMedInfo(query);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const trendingMeds = ["Metformin", "Atorvastatin", "Lisinopril", "Levothyroxine", "Amlodipine"];

  return (
    <div className="min-h-screen bg-dark-primary p-6 safe-area-bottom pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Med Encyclopedia</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4">
            <Book size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-white">Smart Drug Library</h2>
          <p className="text-text-secondary text-sm font-medium">
            Simplified medical knowledge powered by CareMate AI.
          </p>
        </section>

        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center text-text-muted group-focus-within:text-blue-500 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search medication name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-16 bg-surface border border-border rounded-2xl pl-14 pr-6 font-bold text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            disabled={!query || loading}
            className="absolute right-3 top-3 bottom-3 px-6 bg-blue-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
          >
            {loading ? "Searching..." : "Explore"}
          </button>
        </div>

        {!result && !loading && (
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary px-1">Trending Searches</h3>
             <div className="flex flex-wrap gap-2">
                {trendingMeds.map(med => (
                  <button 
                    key={med}
                    onClick={() => { setQuery(med); handleSearch(); }}
                    className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <Search size={12} className="opacity-40" /> {med}
                  </button>
                ))}
             </div>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
               <div className="card p-8 space-y-6 border-blue-500/20 bg-blue-500/5">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
                           <Heart size={32} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black uppercase italic text-white">{result.name}</h3>
                           <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Clinical Overview</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">General Description</p>
                        <p className="text-sm font-medium leading-relaxed text-zinc-300">{result.generalDescription}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Common Uses</p>
                        <p className="text-sm font-medium leading-relaxed text-zinc-300">{result.commonUses}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-danger">
                           <Info size={14} />
                           <p className="text-[10px] font-black uppercase tracking-widest">Side Effects</p>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">{result.sideEffects}</p>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-warning">
                           <Shield size={14} />
                           <p className="text-[10px] font-black uppercase tracking-widest">Precautions</p>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">{result.precautions}</p>
                     </div>
                  </div>

                  <div className="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex gap-4 items-center">
                     <Sparkles className="text-blue-500 shrink-0" size={24} />
                     <p className="text-xs font-bold text-blue-400 italic">"{result.interestingFact}"</p>
                  </div>
               </div>

               <div className="flex gap-3">
                  <button className="flex-1 h-14 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                     <Book size={16} /> Save to Library
                  </button>
                  <button onClick={() => navigate('/chat')} className="flex-1 h-14 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                     <Sparkles size={16} /> Consult AI
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
