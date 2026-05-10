import { useState } from "react";
import { X, Search, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { checkMedsInteraction } from "../lib/gemini";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface AiResponse {
  safe: boolean;
  advice: string;
  warnings: string[];
}

interface InteractionCheckerProps {
  currentMeds?: string[];
  isOpen?: boolean;
  onClose?: () => void;
}

export default function InteractionChecker({ currentMeds = [], isOpen, onClose }: InteractionCheckerProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);

  const handleCheck = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await checkMedsInteraction(query, currentMeds);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="glass rounded-3xl p-6 space-y-6 relative max-w-lg w-full bg-surface border border-white/10 shadow-2xl">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted">
          <X size={20} />
        </button>
      )}
      <div className="space-y-1">
        <h3 className="text-xl font-bold tracking-tight">Interaction Guard</h3>
        <p className="text-xs text-text-muted">Check if a new medication is safe with your current ones.</p>
      </div>

      <div className="flex gap-2">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter new medication..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-accent/50"
        />
        <button 
          onClick={handleCheck}
          disabled={loading || !query}
          className="bg-primary-accent hover:bg-primary-accent/90 disabled:opacity-50 p-3 rounded-xl text-white transition-colors"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "p-4 rounded-2xl border flex gap-4",
              result.safe ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full shrink-0 flex items-center justify-center",
              result.safe ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
            )}>
              {result.safe ? <ShieldCheck /> : <AlertTriangle />}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold">{result.safe ? "Safe to proceed" : "Interaction Warning"}</h4>
              <p className="text-xs text-text-muted">{result.advice}</p>
              {!result.safe && result.warnings && (
                <ul className="text-[10px] space-y-1 mt-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-danger">•</span> {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isOpen === undefined) return content;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="z-10 w-full flex justify-center"
          >
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
