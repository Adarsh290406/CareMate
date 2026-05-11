import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Activity, AlertCircle, Search, Filter, Calendar, 
  MessageSquare, ChevronRight, TrendingUp, ShieldAlert, 
  Plus, Pill, Clock, FileText, CheckCircle, Brain, Sparkles, X
} from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import NotificationCenter from "../components/NotificationCenter";
import { useAuth } from "../hooks/useAuth";

export default function DoctorDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("surveillance");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [realAppointments, setRealAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchAppts = async () => {
      setLoadingAppts(true);
      try {
        // Fetch all appointments (In a real app, you'd filter by doctorId)
        const q = query(collection(db, "appointments"), orderBy("date", "asc"));
        const snap = await getDocs(q);
        setRealAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching appts:", err);
      } finally {
        setLoadingAppts(false);
      }
    };
    fetchAppts();
  }, [user]);

  const patients = [
    { id: "1", name: "Robert Smith", condition: "Type 2 Diabetes", adherence: 88, risk: "low", lastCheck: "14m ago", age: 62, blood: "A+", gender: "Male" },
    { id: "2", name: "Martha Wayne", condition: "Hypertension", adherence: 94, risk: "low", lastCheck: "2h ago", age: 58, blood: "O-", gender: "Female" },
    { id: "3", name: "John Doe", condition: "Heart Failure", adherence: 42, risk: "high", lastCheck: "now", age: 71, blood: "B+", gender: "Male" },
    { id: "4", name: "Sarah Connor", condition: "Thyroid", adherence: 76, risk: "medium", lastCheck: "5h ago", age: 45, blood: "AB+", gender: "Female" },
  ];

  const stats = [
    { label: "Active Patients", value: "24", icon: Users, color: "text-primary" },
    { label: "Avg Adherence", value: "82%", icon: TrendingUp, color: "text-success" },
    { label: "Critical Risks", value: "3", icon: AlertCircle, color: "text-danger" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter text-text-primary">Medical Command</h1>
            <p className="text-text-secondary text-sm font-medium">
              {profile?.name || "Healthcare Provider"} — {profile?.specialty || "General Medicine"}
            </p>
          </div>
          <div className="flex gap-2">
            <NotificationCenter userId={user?.uid} />
            <button className="w-12 h-12 card bg-bg-main border border-border-main flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
              <Search size={22} />
            </button>
            <button className="w-12 h-12 card bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
              <Plus size={22} />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 p-1 bg-surface-main rounded-2xl border border-border-main overflow-x-auto no-scrollbar">
          {["Surveillance", "Appointments", "Adherence Analytics", "Reports"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.toLowerCase() ? "bg-primary text-black shadow-lg" : "text-text-secondary hover:bg-black/5"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4 flex flex-col items-center text-center gap-1 bg-surface-main border border-border-main">
            <stat.icon size={16} className={stat.color} />
            <span className="text-xl font-black italic tracking-tighter text-text-primary">{stat.value}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</span>
          </div>
        ))}
      </section>

      {activeTab === "surveillance" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary flex items-center gap-2">
              <Activity size={14} className="text-primary" /> Active Surveillance
            </h2>
            <div className="flex gap-2">
               <span className="text-[10px] font-black text-danger uppercase tracking-widest px-2 py-0.5 bg-danger/10 rounded-full flex items-center gap-1">
                  <ShieldAlert size={10} /> 3 Critical
               </span>
            </div>
          </div>

          <div className="space-y-3">
            {patients.map((p) => (
              <motion.div 
                key={p.id}
                layoutId={p.id}
                onClick={() => setSelectedPatient(p)}
                className="card p-5 group hover:border-primary/20 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg relative",
                    p.risk === 'high' ? "bg-danger shadow-lg shadow-danger/20" : 
                    p.risk === 'medium' ? "bg-warning shadow-lg shadow-warning/20" : "bg-primary/20 text-primary"
                  )}>
                    {p.name[0]}
                    {p.risk === 'high' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border-2 border-danger"><AlertCircle size={10} className="text-danger" /></div>}
                  </div>
                  <div>
                    <h3 className="font-bold text-[16px] tracking-tight mb-0.5 text-text-primary">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-widest text-text-secondary">{p.condition}</span>
                      <div className="w-1 h-1 rounded-full bg-border-main" />
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        p.risk === 'high' ? "text-danger" : p.risk === 'medium' ? "text-warning" : "text-primary"
                      )}>{p.risk} risk</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <p className={cn(
                      "mono text-lg font-black",
                      p.adherence > 80 ? "text-success" : p.adherence > 60 ? "text-warning" : "text-danger"
                    )}>{p.adherence}%</p>
                    <p className="text-[9px] uppercase font-black tracking-widest text-text-secondary">Compliance</p>
                  </div>
                  <ChevronRight size={18} className="text-border-main group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "appointments" && (
        <section className="space-y-6">
           <div className="flex items-center justify-between px-1">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary flex items-center gap-2">
               <Calendar size={14} className="text-primary" /> Daily Clinic Schedule
             </h2>
             <button className="text-[10px] font-black uppercase text-primary px-3 py-1 bg-primary/10 rounded-xl">
                Filter by Date
             </button>
           </div>

           <div className="space-y-4">
              {loadingAppts ? (
                <div className="p-12 text-center text-text-secondary animate-pulse uppercase text-[10px] font-black tracking-widest">
                   Syncing Clinic Schedule...
                </div>
              ) : realAppointments.length > 0 ? (
                realAppointments.map((appt, i) => (
                  <div key={appt.id || i} className="card p-6 bg-surface-main border border-border-main flex items-center justify-between group hover:border-primary/20 transition-all">
                     <div className="flex items-center gap-6">
                        <div className="text-center w-20">
                           <p className="text-lg font-black tracking-tighter text-text-primary">{appt.time}</p>
                           <p className="text-[8px] font-black uppercase text-text-secondary opacity-60">{appt.date}</p>
                        </div>
                        <div className="w-px h-10 bg-border-main" />
                        <div>
                           <h4 className="font-bold text-text-primary">{appt.patientName || "Patient"}</h4>
                           <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{appt.doctor || appt.title || "Consultation"}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                          appt.status === "confirmed" || appt.status === "scheduled" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        )}>
                           {appt.status}
                        </span>
                        <ChevronRight size={18} className="text-border-main group-hover:text-primary transition-colors" />
                     </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center card bg-surface-main border-dashed border-border-main text-text-secondary">
                   <p className="text-xs font-bold">No appointments found.</p>
                </div>
              )}
           </div>
        </section>
      )}

      {activeTab === "adherence analytics" && (
        <section className="space-y-6">
           <div className="card p-6 bg-surface-main border border-border-main space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Population Adherence</h3>
                 <span className="text-[10px] font-black uppercase text-primary px-2 py-1 bg-primary/10 rounded-lg">Last 30 Days</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 pt-4">
                 {[45, 62, 58, 85, 78, 92, 88].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                       <motion.div 
                         initial={{ height: 0 }}
                         animate={{ height: `${h}%` }}
                         className={cn(
                           "w-full rounded-t-lg transition-all",
                           h > 80 ? "bg-primary" : h > 60 ? "bg-warning" : "bg-danger"
                         )}
                       />
                       <span className="text-[8px] font-black uppercase text-text-secondary opacity-60">Day {i+1}</span>
                    </div>
                 ))}
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="card p-5 bg-danger/5 border border-danger/10 space-y-2">
                 <p className="text-[9px] font-black uppercase text-danger">Most Missed</p>
                 <p className="text-xl font-black text-text-primary">Morning Dose</p>
                 <p className="text-[8px] font-medium text-text-secondary opacity-60">64% adherence at 08:00 AM</p>
              </div>
              <div className="card p-5 bg-primary/5 border border-primary/10 space-y-2">
                 <p className="text-[9px] font-black uppercase text-primary">Best Adherence</p>
                 <p className="text-xl font-black text-text-primary">Night Dose</p>
                 <p className="text-[8px] font-medium text-text-secondary opacity-60">92% adherence at 10:00 PM</p>
              </div>
           </div>
        </section>
      )}

      {/* Intervention Banner */}
      <section className="bg-ai/5 border border-ai/20 rounded-[32px] p-8 space-y-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-ai/10 rounded-full blur-3xl" />
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-ai flex items-center justify-center text-black shadow-lg shadow-ai/20">
              <Brain size={22} />
           </div>
           <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-ai">AI Surveillance Note</h2>
              <p className="text-[9px] font-bold text-ai/60 uppercase tracking-[0.2em]">Clinical Decision Support Active</p>
           </div>
        </div>
        
        <p className="text-[15px] font-medium leading-relaxed text-text-secondary">
          Predictive models suggest a <span className="text-text-primary font-black">74% probability of symptom escalation</span> for John Doe within 48 hours due to repeated missed doses of Beta-Blockers.
        </p>

        <div className="flex gap-3">
           <button className="flex-1 py-4 bg-ai text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-ai/20 active:scale-95 transition-all">
             Emergency Nudge
           </button>
           <button className="flex-1 py-4 bg-surface-main border border-border-main text-text-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-bg-main transition-all">
             Full Analysis
           </button>
        </div>
      </section>

      {/* Patient Detail View (Modal) */}
      <AnimatePresence>
         {selectedPatient && (
            <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-bg-main/80 backdrop-blur-md">
               <motion.div 
                 layoutId={selectedPatient.id}
                 className="bg-surface-main w-full max-w-2xl sm:rounded-[40px] rounded-t-[40px] border border-border-main overflow-hidden flex flex-col h-[90vh] sm:h-auto max-h-[90vh]"
               >
                  {/* Header */}
                  <div className="p-8 bg-gradient-to-br from-primary/5 to-transparent flex items-start justify-between">
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-primary/20 text-primary flex items-center justify-center text-3xl font-black">
                           {selectedPatient.name[0]}
                        </div>
                        <div>
                           <h2 className="text-3xl font-black tracking-tighter text-text-primary">{selectedPatient.name}</h2>
                           <div className="flex gap-4 mt-2">
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase text-text-secondary">Age</span>
                                 <span className="text-sm font-bold text-text-primary">{selectedPatient.age}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase text-text-secondary">Blood</span>
                                 <span className="text-sm font-bold text-danger">{selectedPatient.blood}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase text-text-secondary">Condition</span>
                                 <span className="text-sm font-bold text-text-primary">{selectedPatient.condition}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setSelectedPatient(null)} className="p-3 bg-bg-main border border-border-main rounded-2xl text-text-secondary hover:text-text-primary transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 no-scrollbar">
                     {/* Grid Info */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="card p-6 bg-bg-main border border-border-main rounded-3xl space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Current Adherence</h4>
                              <Sparkles size={14} className="text-primary" />
                           </div>
                           <div className="flex items-end gap-2">
                              <span className={cn(
                                "text-4xl font-black italic tracking-tighter",
                                selectedPatient.adherence > 80 ? "text-success" : "text-danger"
                              )}>{selectedPatient.adherence}%</span>
                              <span className="text-xs font-bold text-text-secondary mb-2">avg</span>
                           </div>
                           <div className="h-1 w-full bg-border-main rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-1000", selectedPatient.adherence > 80 ? "bg-success" : "bg-danger")} 
                                style={{ width: `${selectedPatient.adherence}%` }} 
                              />
                           </div>
                        </div>
                        
                        <div className="card p-6 bg-bg-main border border-border-main rounded-3xl space-y-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Risk Assessment</h4>
                           <div className="flex items-center gap-3">
                              <div className={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                                selectedPatient.risk === 'high' ? "bg-danger/10 text-danger border border-danger/20" : "bg-primary/10 text-primary border border-primary/20"
                              )}>
                                 {selectedPatient.risk} Criticality
                              </div>
                           </div>
                           <p className="text-[10px] font-medium text-text-secondary opacity-70 leading-relaxed italic">
                              "Adherence has dropped by 12% in the last 72 hours. Patient reports mild fatigue via Chat AI."
                           </p>
                        </div>
                     </div>

                     {/* Prescription Timeline */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Current Prescription</h4>
                           <button 
                             onClick={() => setShowPrescriptionModal(true)}
                             className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary px-3 py-1.5 bg-primary/10 rounded-xl"
                           >
                              <Plus size={12} /> New Prescription
                           </button>
                        </div>
                        <div className="space-y-2">
                           {[
                             { name: "Metformin ER", dosage: "500mg", schedule: "08:00 AM, 08:00 PM", remaining: 12 },
                             { name: "Atorvastatin", dosage: "20mg", schedule: "10:00 PM", remaining: 8 }
                           ].map((med, i) => (
                              <div key={i} className="p-5 bg-bg-main rounded-3xl border border-border-main flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                       <Pill size={20} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-text-primary">{med.name} <span className="text-text-secondary font-bold ml-2 text-xs">{med.dosage}</span></p>
                                       <div className="flex items-center gap-2 mt-0.5">
                                          <Clock size={10} className="text-text-secondary" />
                                          <span className="text-[10px] font-bold text-text-secondary">{med.schedule}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-text-primary">{med.remaining} Left</p>
                                    <p className="text-[8px] font-black uppercase text-text-secondary">Refill Due</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* AI Patient Briefing */}
                     <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                           <Brain size={18} />
                           <h4 className="text-[10px] font-black uppercase tracking-widest">AI Patient Briefing</h4>
                        </div>
                        <p className="text-xs font-medium text-text-secondary opacity-80 leading-relaxed">
                          Robert is showing signs of "Weekend Non-Adherence". He misses doses on Sundays consistently. 
                          The system has scheduled an automated SMS nudge for Sunday morning 07:30 AM to counteract this.
                        </p>
                     </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-8 border-t border-border-main bg-bg-main/50 flex gap-4">
                     <button className="flex-1 py-4 bg-surface-main border border-border-main text-text-primary rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-bg-main transition-all flex items-center justify-center gap-2">
                        <MessageSquare size={16} /> Patient Chat
                     </button>
                     <button className="flex-1 py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Activity size={16} /> Clinical Check
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Prescription Modal (Mock) */}
      <AnimatePresence>
         {showPrescriptionModal && (
           <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-bg-main/90 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-main w-full max-w-md rounded-[40px] p-8 space-y-8 border border-border-main shadow-2xl"
              >
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                          <FileText size={22} />
                       </div>
                       <h3 className="text-xl font-black uppercase italic text-text-primary">New Prescription</h3>
                    </div>
                    <button onClick={() => setShowPrescriptionModal(false)} className="p-2 text-text-secondary">
                       <X size={20} />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Medication Name</label>
                       <input placeholder="e.g. Lisinopril" className="w-full h-14 bg-bg-main border border-border-main rounded-2xl px-6 text-sm font-bold text-text-primary outline-none focus:border-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Dosage</label>
                          <input placeholder="e.g. 10mg" className="w-full h-14 bg-bg-main border border-border-main rounded-2xl px-6 text-sm font-bold text-text-primary outline-none focus:border-primary" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Quantity</label>
                          <input type="number" placeholder="30" className="w-full h-14 bg-bg-main border border-border-main rounded-2xl px-6 text-sm font-bold text-text-primary outline-none focus:border-primary" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Schedule Recommendation</label>
                       <div className="p-4 bg-primary/5 border border-dashed border-primary/20 rounded-2xl flex items-center gap-3 text-primary italic">
                          <Brain size={16} />
                          <span className="text-[10px] font-bold">AI Suggestion: Morning after breakfast</span>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => setShowPrescriptionModal(false)}
                   className="w-full h-16 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                 >
                    <CheckCircle size={20} /> Issue Prescription
                 </button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
