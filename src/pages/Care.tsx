import React from "react";
import { motion } from "motion/react";
import { Calendar, Stethoscope, Activity, ChevronRight, FileText, Share2, Download, History, Brain, MessageSquare } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useMedications } from "../hooks/useMedications";
import AppointmentScheduler from "../components/AppointmentScheduler";
import SymptomAnalyzer from "../components/SymptomAnalyzer";
import HealthImpactSimulator from "../components/HealthImpactSimulator";
import ReportGenerator from "../components/ReportGenerator";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { usePatientCaregivers } from "../hooks/usePatientCaregivers";

export default function Care() {
  const { user, profile } = useAuth();
  const { medications } = useMedications(user?.uid);
  const { caregivers, loading: caregiversLoading } = usePatientCaregivers(user?.uid);
  const navigate = useNavigate();

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
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary px-1">Clinical Schedule</h2>
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
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary px-1">Diagnostic Tools</h2>
          <SymptomAnalyzer medications={medications} />
          <HealthImpactSimulator />
        </div>

      </div>

      {/* Medical Reports Section */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary px-1">Health Records</h2>
        <ReportGenerator user={user} profile={profile} medications={medications} />
      </section>

      {/* Care Team Section */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary px-1">Your Care Circle</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {caregiversLoading ? (
             <div className="col-span-full py-10 text-center text-[10px] font-black uppercase tracking-widest opacity-40">Syncing care circle...</div>
           ) : caregivers.length === 0 ? (
             <div className="col-span-full card p-10 flex flex-col items-center justify-center text-center opacity-40">
                <Brain className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">No caregivers linked yet</span>
             </div>
           ) : (
             caregivers.map((member, i) => (
               <div 
                 key={member.uid} 
                 className="card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all"
                 onClick={() => navigate(`/family-chat/${member.uid}`)}
               >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                      {member.name?.[0] || "C"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold leading-none mb-1 text-text-primary">{member.name}</h4>
                      <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-safe">
                    <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
                    Online
                  </div>
               </div>
             ))
           )}
        </div>
      </section>
    </div>
  );
}
