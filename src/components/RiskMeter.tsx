import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Brain, HelpCircle, X } from "lucide-react";
import { callAi } from "../lib/gemini";

export default function RiskMeter({ score = 0, explanation = "Analysis pending..." }: { score: number, explanation?: string }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(explanation);
  const [loading, setLoading] = useState(false);

  const getAiExplanation = async () => {
    if (loading) return;
    setShowExplanation(true);
    setLoading(true);
    
    try {
      const system = "You are a clinical risk analyzer. Explain a patient's medication adherence risk score (0-100, where 100 is fatal) in 1-2 punchy sentences. Focus on clinical consequences.";
      const userPrompt = `Score is ${score}. Base clinical status: ${score < 30 ? "Safe" : score < 70 ? "Warning" : "Critical"}.`;
      
      const res = await callAi(system, userPrompt);
      if (res.text) setAiAnalysis(res.text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-between w-full mb-4 px-2">
        <h3 className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">Adherence Risk</h3>
        <button 
          onClick={getAiExplanation}
          className="text-primary-accent hover:text-white transition-colors"
          title="Explain this score"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      <div className="relative w-48 h-24 overflow-hidden mb-2">
        {/* Background Arc */}
        <div className="absolute w-48 h-48 rounded-full border-[12px] border-white/5"></div>
        {/* Progress Arc */}
        <motion.div 
          initial={{ rotate: -135 }}
          animate={{ rotate: -135 + (score * 1.8) }} // 1.8 = 180 / 100
          transition={{ duration: 1.5, ease: "circOut" }}
          style={{ originX: "50%", originY: "50%" }}
          className={cn(
            "absolute w-48 h-48 rounded-full border-[12px] border-transparent border-t-current border-l-current",
            score < 30 ? "text-success" : score < 70 ? "text-warning" : "text-danger"
          )}
        ></motion.div>
        
        {/* Needle or Center Text */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-4xl font-black text-white tracking-tighter">{score}</span>
          <span className="text-[9px] text-text-muted font-bold tracking-widest uppercase">
            {score < 30 ? "SAFE" : score < 70 ? "STABLE" : "CRITICAL"}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden w-full"
          >
            <div className="bg-primary-accent/5 border border-primary-accent/20 rounded-xl p-3 mt-4 relative">
              <button 
                onClick={() => setShowExplanation(false)}
                className="absolute top-2 right-2 text-text-muted hover:text-white"
              >
                <X size={12} />
              </button>
              <div className="flex gap-2 mb-2">
                <Brain size={14} className="text-primary-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-accent">AI Diagnosis</span>
              </div>
              <p className={cn(
                "text-[11px] leading-relaxed",
                loading ? "animate-pulse italic text-text-muted" : "text-white/80"
              )}>
                {loading ? "Decrypting anomaly..." : aiAnalysis}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
