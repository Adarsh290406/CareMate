import React from "react";
import { motion } from "motion/react";
import { ChevronLeft, Calendar, CheckCircle2, XCircle, Clock, Filter, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMedSchedule } from "../hooks/useMedSchedule";
import { cn } from "../lib/utils";

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

export default function DosageHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { doses, loading } = useMedSchedule(user?.uid);
  const [activeFilter, setActiveFilter] = React.useState("All");

  const filteredDoses = doses.filter(dose => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Taken") return dose.status === "taken";
    if (activeFilter === "Missed") return dose.status === "missed";
    if (activeFilter === "Pending") return dose.status === "pending";
    return true;
  });

  return (
    <div className="min-h-screen bg-bg-main p-6 safe-area-bottom pb-32">
      <header className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-surface-main border border-border-main rounded-xl text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-text-primary">Dosage History</h1>
        <button className="p-2 text-text-secondary hover:text-primary transition-colors">
           <Download size={20} />
        </button>
      </header>

      <div className="max-w-md mx-auto space-y-8">
        {/* Summary Card */}
        <section className="grid grid-cols-2 gap-4">
           <div className="card p-5 bg-surface-main border border-border-main rounded-3xl">
              <p className="text-[8px] font-black uppercase tracking-widest text-text-secondary opacity-60 mb-1">Adherence Rate</p>
              <p className="text-2xl font-black text-primary italic">94%</p>
           </div>
           <div className="card p-5 bg-surface-main border border-border-main rounded-3xl">
              <p className="text-[8px] font-black uppercase tracking-widest text-text-secondary opacity-60 mb-1">Total Doses</p>
              <p className="text-2xl font-black text-text-primary italic">{doses.length}</p>
           </div>
        </section>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
           {["All", "Taken", "Missed", "Pending"].map((f) => (
             <button 
               key={f} 
               onClick={() => setActiveFilter(f)}
               className={cn(
                 "px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                 activeFilter === f 
                   ? "bg-primary border-primary text-text-primary shadow-lg shadow-primary/20" 
                   : "bg-surface-main border-border-main text-text-secondary hover:text-primary hover:border-primary/30"
               )}
             >
                {f}
             </button>
           ))}
        </div>

        {/* History Timeline */}
        <div className="space-y-6 relative">
          <div className="absolute left-[21px] top-4 bottom-0 w-0.5 bg-border-main/30" />
          
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-4 opacity-40">
               <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-widest">Retrieving Logs...</p>
            </div>
          ) : filteredDoses.length > 0 ? (
            filteredDoses.map((dose, i) => {
              const date = dose.scheduledAt.toDate();
              const isTaken = dose.status === "taken";
              const isMissed = dose.status === "missed";
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={dose.id} 
                  className="flex gap-6 relative"
                >
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-lg",
                    isTaken ? "bg-safe text-white" : isMissed ? "bg-danger text-white" : "bg-surface-main border-2 border-border-main text-text-secondary"
                  )}>
                    {isTaken ? <CheckCircle2 size={24} /> : isMissed ? <XCircle size={24} /> : <Clock size={24} />}
                  </div>
                  
                  <div className="flex-1 space-y-1 pb-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-black uppercase tracking-tight text-text-primary">{dose.medName || "Medication"}</h3>
                       <span className="text-[10px] font-bold text-text-secondary opacity-60">{formatTime(date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Calendar size={12} className="text-text-secondary opacity-40" />
                       <span className="text-[10px] font-medium text-text-secondary">{formatDate(date)}</span>
                    </div>
                    <div className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest mt-1",
                      isTaken ? "bg-safe/10 text-safe" : isMissed ? "bg-danger/10 text-danger" : "bg-border-main text-text-secondary"
                    )}>
                      {dose.status}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="py-20 text-center opacity-40">
               <p className="font-bold">No history records yet.</p>
               <p className="text-xs">Your logs will appear here as you take your doses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
