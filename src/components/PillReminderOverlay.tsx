import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pill, Check, Clock, X, BellRing, Sparkles, Volume2 } from "lucide-react";
import { Dose } from "../hooks/useMedSchedule";
import { cn } from "../lib/utils";

interface PillReminderOverlayProps {
  doses: Dose[];
  onMarkTaken: (doseId: string, medId: string) => Promise<void>;
}

export default function PillReminderOverlay({ doses, onMarkTaken }: PillReminderOverlayProps) {
  const [activeDose, setActiveDose] = useState<Dose | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeDose) return; // Don't interrupt current notification

      const now = Date.now();
      const dueDose = doses.find(d => {
        if (d.status !== "pending") return false;
        const scheduledTime = d.scheduledAt.toMillis();
        // Trigger if it's within 1 minute of scheduled time OR is overdue by less than an hour
        return Math.abs(now - scheduledTime) < 60000 || (now > scheduledTime && now - scheduledTime < 3600000);
      });

      if (dueDose) {
        setActiveDose(dueDose);
        // Play notification sound if desired
        // new Audio('/notification.mp3').play().catch(() => {});
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [doses, activeDose]);

  const handleTaken = async () => {
    if (!activeDose || isProcessing) return;
    setIsProcessing(true);
    try {
      await onMarkTaken(activeDose.id, activeDose.medId);
      setActiveDose(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {activeDose && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-primary text-white flex flex-col items-center justify-between p-8 safe-area-inset"
        >
          {/* Animated Background Rings */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
             <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white rounded-full" />
             <motion.div animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }} transition={{ duration: 6, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white rounded-full" />
          </div>

          <div className="z-10 flex flex-col items-center gap-6 mt-20">
             <div className="relative">
                <div className="w-32 h-32 bg-white/20 rounded-[40px] flex items-center justify-center backdrop-blur-xl animate-bounce-subtle">
                  <Pill size={64} className="text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-full shadow-lg">
                  <BellRing size={20} className="text-black animate-swing" />
                </div>
             </div>
             
             <div className="text-center space-y-2">
                <h2 className="text-4xl font-black tracking-tighter leading-none">Time for your {activeDose.medName}</h2>
                <p className="text-lg font-medium opacity-80">{activeDose.dosage || "1 dose"} • {activeDose.scheduledAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
             </div>
          </div>

          <div className="z-10 w-full max-w-sm space-y-4 mb-10">
             <button 
               onClick={handleTaken}
               disabled={isProcessing}
               className="w-full h-24 bg-white text-primary rounded-[30px] flex items-center justify-center gap-4 text-2xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50"
             >
               {isProcessing ? <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /> : (
                 <>
                   <Check size={32} strokeWidth={4} /> MARK TAKEN
                 </>
               )}
             </button>
             
             <div className="flex gap-4">
                <button 
                  onClick={() => setActiveDose(null)}
                  className="flex-1 py-5 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all"
                >
                  <Clock size={18} /> Snooze 10m
                </button>
                <button 
                  onClick={() => setActiveDose(null)}
                  className="flex-1 py-5 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all"
                >
                  <X size={18} /> Dismiss
                </button>
             </div>

             <div className="pt-4 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                   <Sparkles size={12} className="text-ai" /> AI Reminder Service
                </div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
