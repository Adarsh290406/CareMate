import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Upload, CheckCircle, AlertTriangle, ChevronLeft, Sparkles, Brain, Info, RefreshCcw, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { identifyPill } from "../lib/gemini";
import { cn } from "../lib/utils";

export default function PillScanner() {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePill = async () => {
    if (!image || loading) return;
    setLoading(true);
    try {
      // identifyPill expects the base64 part only
      const base64 = image.split(',')[1];
      const res = await identifyPill(base64);
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
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-text-primary">Vision AI Scanner</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <Camera size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-text-primary">Pill Verifier</h2>
          <p className="text-text-secondary text-sm font-medium">
            AI identifies your pill and cross-checks with your prescription.
          </p>
        </section>

        {/* Camera / Upload Area */}
        <div className="relative aspect-square w-full max-w-[300px] mx-auto group">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "absolute inset-0 rounded-[3rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden",
                image ? "border-primary/50" : "border-border-main hover:border-primary/30 bg-surface-main"
              )}
            >
              {image ? (
                <img src={image} alt="Pill" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                     <Upload size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Snap or Upload Photo</p>
                </>
              )}
           </div>
           
           {image && (
             <button 
               onClick={() => setImage(null)}
               className="absolute -top-2 -right-2 w-10 h-10 bg-danger text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
             >
                <RefreshCcw size={18} />
             </button>
           )}
        </div>

        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleCapture}
        />

        <div className="space-y-4">
            <button 
              onClick={analyzePill}
              disabled={!image || loading}
              className="w-full h-16 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <RefreshCcw size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {loading ? "AI Identifying..." : "Start Identification"}
            </button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
               <div className={cn(
                 "card p-8 border-2 space-y-6",
                 result.match ? "bg-safe/5 border-safe/20" : "bg-danger/5 border-danger/20"
               )}>
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        result.match ? "bg-safe/20 text-safe" : "bg-danger/20 text-danger"
                      )}>
                         {result.match ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                      </div>
                      <div>
                         <h3 className="text-xl font-black uppercase italic leading-none text-text-primary">{result.pillName}</h3>
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">{result.match ? "Verified Match" : "Warning: No Match"}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="p-4 bg-surface-main rounded-2xl border border-border-main">
                         <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary opacity-60 mb-1">AI Visual analysis</p>
                         <p className="text-sm font-medium text-text-secondary leading-relaxed">{result.description}</p>
                      </div>
                     
                     {!result.match && (
                       <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-start gap-3">
                          <AlertTriangle className="text-danger shrink-0 mt-0.5" size={16} />
                          <p className="text-xs font-bold text-danger leading-relaxed italic">
                            "This pill looks like ${result.identifiedAs}. It does NOT match your current prescription list. Do not consume without double checking."
                          </p>
                       </div>
                     )}
                  </div>

                   <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="text-center p-3 bg-bg-main border border-border-main rounded-xl">
                         <p className="text-[8px] font-black uppercase text-text-secondary opacity-60 mb-1">Shape</p>
                         <p className="text-xs font-bold text-text-primary uppercase">{result.visuals?.shape}</p>
                      </div>
                      <div className="text-center p-3 bg-bg-main border border-border-main rounded-xl">
                         <p className="text-[8px] font-black uppercase text-text-secondary opacity-60 mb-1">Color</p>
                         <p className="text-xs font-bold text-text-primary uppercase">{result.visuals?.color}</p>
                      </div>
                   </div>
               </div>

                <div className="flex gap-3">
                   <button onClick={() => setImage(null)} className="flex-1 py-4 bg-surface-main border border-border-main rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-primary">Rescan</button>
                   <button className="flex-1 py-4 bg-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Save Result</button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 bg-info/5 rounded-3xl border border-info/10 flex gap-4 items-start">
          <div className="p-2 bg-info/10 text-info rounded-lg mt-1">
            <Info size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Vision Disclaimer</h4>
            <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
              Camera identification can be affected by lighting and image quality. Never rely solely on AI for pill identification. Always check the physical packaging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
