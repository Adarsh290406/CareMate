import React, { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { 
  Plus, Clock, ChevronRight, Check, Trash2, SlidersHorizontal, 
  Sun, Moon, Sunset, Coffee, ShieldCheck, Activity, Info, 
  AlertCircle, Zap, Heart, Search, Filter, Play, Pause
} from "lucide-react";
import { cn } from "../lib/utils";
import { useMedications } from "../hooks/useMedications";
import { useAuth } from "../hooks/useAuth";
import AddMedModal from "../components/AddMedModal";
import BulkAddModal from "../components/BulkAddModal";
import InteractionChecker from "../components/InteractionChecker";
import { FileUp } from "lucide-react";

interface MedRowProps {
  med: any;
  color: string;
  key?: React.Key;
}

const MedRow = ({ med, color }: MedRowProps) => {
  const x = useMotionValue(0);
  const [swiped, setSwiped] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-surface-main mb-3 group">
      {/* Swipe Actions */}
      <div className="absolute inset-0 flex items-center justify-end px-6 gap-6 bg-danger/10">
        <div className="flex flex-col items-center gap-1 text-danger">
          <Trash2 size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Delete</span>
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ right: 0, left: -100 }}
        style={{ x }}
        className="relative z-10 card p-5 flex flex-col gap-4 border-none bg-surface-main"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: color }}>
              <Activity size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight leading-none mb-1 text-text-primary">{med.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary font-medium">{med.dosage}</span>
                <div className="w-1 h-1 rounded-full bg-border-main" />
                <span className="text-[10px] text-primary font-black uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black italic tracking-tighter block">14 DAY</span>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">STREAK 🔥</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-main/50">
          <div className="flex flex-col gap-1">
             <span className="text-[9px] font-black uppercase tracking-widest opacity-40 text-text-secondary">Generic Name</span>
             <span className="text-xs font-bold truncate text-text-primary">Lisinopril-HCTZ</span>
          </div>
          <div className="flex flex-col gap-1">
             <span className="text-[9px] font-black uppercase tracking-widest opacity-40 text-text-secondary">Frequency</span>
             <span className="text-xs font-bold text-text-primary">{med.frequency || "Once Daily"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
           <div className="flex -space-x-2">
             {[1, 2, 3, 4, 5].map(i => (
               <div key={i} className={cn(
                 "w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center",
                 i < 4 ? "bg-primary text-white" : "bg-border text-text-secondary"
               )}>
                 <Check size={10} />
               </div>
             ))}
           </div>
           <button className="flex items-center gap-1.5 text-primary hover:text-text-primary transition-colors">
             <span className="text-[10px] font-black uppercase tracking-widest">Details</span>
             <ChevronRight size={14} />
           </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Meds() {
  const { user } = useAuth();
  const { medications } = useMedications(user?.uid);
  const [activeTab, setActiveTab] = useState<"active" | "paused">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCheckerOpen, setIsCheckerOpen] = useState(false);

  const colors = ["#3B82F6", "#00C896", "#FF7F50", "#7C3AED"];
  
  const filteredMeds = medications.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-text-primary">Pharmacy</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1">{medications.length} Medications Registered</p>
          </div>
          <button 
            onClick={() => setIsCheckerOpen(true)}
            className="w-12 h-12 bg-ai/10 text-ai border border-ai/20 rounded-2xl flex items-center justify-center hover:bg-ai/20 transition-all active:scale-95"
            title="Interaction Checker"
          >
            <ShieldCheck size={24} />
          </button>
        </div>

        <div className="flex gap-2 p-1.5 bg-surface-main border border-border-main rounded-2xl">
          <button 
            onClick={() => setActiveTab("active")}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === "active" ? "bg-primary text-text-primary shadow-lg shadow-primary/20" : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Play size={14} fill={activeTab === "active" ? "currentColor" : "none"} /> Active
          </button>
          <button 
            onClick={() => setActiveTab("paused")}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === "paused" ? "bg-bg-main text-text-primary shadow-lg" : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Pause size={14} fill={activeTab === "paused" ? "currentColor" : "none"} /> Paused
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-60" />
            <input 
              type="text"
              placeholder="Search medications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-surface-main border border-border-main rounded-2xl pl-12 pr-4 text-sm font-medium text-text-primary focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="h-14 px-6 bg-surface-main border border-border-main rounded-2xl flex items-center gap-2 hover:border-primary/50 transition-all text-text-secondary hover:text-primary group"
          >
            <FileUp size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Bulk Upload</span>
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {activeTab === "active" ? (
          filteredMeds.length > 0 ? (
            filteredMeds.map((med, i) => (
              <MedRow key={med.id || i} med={med} color={colors[i % colors.length]} />
            ))
          ) : (
            <div className="py-20 flex flex-col items-center text-center space-y-4 opacity-40">
               <div className="w-20 h-20 bg-border rounded-full flex items-center justify-center">
                  <Activity size={32} />
               </div>
               <div className="space-y-1">
                 <p className="font-bold">No Active Medications</p>
                 <p className="text-xs">Tap the + button to add your first medicine.</p>
               </div>
            </div>
          )
        ) : (
          <div className="py-20 flex flex-col items-center text-center space-y-4 opacity-40">
             <div className="w-20 h-20 bg-border rounded-full flex items-center justify-center">
                <Pause size={32} />
             </div>
             <p className="font-bold">No Paused Medications</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-text-primary rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center animate-bounce-subtle z-40 transition-transform active:scale-90"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {user && (
        <AddMedModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          patientId={user.uid} 
        />
      )}

      {user && (
        <BulkAddModal 
          isOpen={isBulkModalOpen} 
          onClose={() => setIsBulkModalOpen(false)} 
          patientId={user.uid} 
        />
      )}

      <InteractionChecker 
        isOpen={isCheckerOpen} 
        onClose={() => setIsCheckerOpen(false)} 
      />
    </div>
  );
}
