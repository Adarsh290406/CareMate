import React from "react";
import { motion } from "motion/react";
import { Calendar, Stethoscope, Activity, ChevronRight, FileText, Share2, Download, History, Brain } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useMedications } from "../hooks/useMedications";
import AppointmentScheduler from "../components/AppointmentScheduler";
import SymptomAnalyzer from "../components/SymptomAnalyzer";
import HealthImpactSimulator from "../components/HealthImpactSimulator";
import { cn } from "../lib/utils";

export default function Care() {
  const { user, profile } = useAuth();
  const { medications } = useMedications(user?.uid);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-text-primary">Care Coordination</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1">Manage your health team and clinical data</p>
      </header>

      {/* Grid Layout for Desktop, Stack for Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Appointments Section */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] px-1">Clinical Schedule</h2>
          <AppointmentScheduler userId={user?.uid || ""} />
          
          <div className="card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <History size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-sm tracking-tight text-text-primary">Clinical History</h3>
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">View past appointments</p>
               </div>
             </div>
             <ChevronRight size={16} className="text-text-muted" />
          </div>
        </div>

        {/* Symptom & Side-Effects */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] px-1">Diagnostic Tools</h2>
          <SymptomAnalyzer medications={medications} />
          <HealthImpactSimulator />
        </div>

      </div>

      {/* Medical Reports Section */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] px-1">Health Records</h2>
        <div className="card p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-ai/10 flex items-center justify-center text-ai shadow-lg shadow-ai/10">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-none mb-1 text-text-primary">Pre-Appointment AI Summary</h3>
                <p className="text-xs text-text-secondary max-w-xs">A clinical-grade briefing of your last 3 months, ready for your doctor.</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-ai px-2 py-1 bg-ai/10 rounded">Smart Report</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <button className="flex flex-col items-center gap-2 p-3 bg-bg-main border border-border-main rounded-2xl hover:border-primary/50 transition-all text-text-primary">
                <FileText size={18} className="text-primary" />
                <span className="text-[8px] font-black uppercase tracking-widest">View PDF</span>
             </button>
             <button className="flex flex-col items-center gap-2 p-3 bg-bg-main border border-border-main rounded-2xl hover:border-primary/50 transition-all text-text-primary">
                <Share2 size={18} className="text-primary" />
                <span className="text-[8px] font-black uppercase tracking-widest">Share Link</span>
             </button>
             <button className="flex flex-col items-center gap-2 p-3 bg-bg-main border border-border-main rounded-2xl hover:border-primary/50 transition-all text-text-primary">
                <Download size={18} className="text-primary" />
                <span className="text-[8px] font-black uppercase tracking-widest">Download</span>
             </button>
          </div>
        </div>
      </section>

      {/* Care Team Section */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] px-1">Your Care Circle</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {[
             { name: "Dr. Sarah Johnson", role: "Primary Physician", status: "Connected" },
             { name: "Michael Chen", role: "Primary Caregiver", status: "Online" }
           ].map((member, i) => (
             <div key={i} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-main border border-border-main overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-none mb-1 text-text-primary">{member.name}</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-safe">
                  <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
                  {member.status}
                </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
