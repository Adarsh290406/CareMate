import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  MessageCircle, Bell, AlertTriangle, CheckCircle, Clock, 
  ChevronRight, User, Search, Plus, UserPlus, Pill, 
  Edit3, Trash2, Save, X, Activity, TrendingUp, Sparkles, Brain, Video
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { useCaregiverPatients } from "../hooks/useCaregiverPatients";
import { useAlerts } from "../hooks/useAlerts";
import { 
  collection, query, where, getDocs, updateDoc, 
  arrayUnion, doc, addDoc, serverTimestamp, deleteDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import NotificationCenter from "../components/NotificationCenter";

interface PatientCardProps {
  patient: any;
  onClick: () => void;
  key?: React.Key;
}

function PatientCard({ patient, onClick }: PatientCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="card p-6 space-y-6 bg-surface-main cursor-pointer hover:border-primary/20 transition-all active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-black/10 bg-primary/20 text-primary">
            {patient.name?.split(' ').map((n: string) => n[0]).join('') || "P"}
          </div>
          <div>
            <h3 className="text-lg font-extrabold tracking-tighter leading-none mb-1 text-text-primary">{patient.name}</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">{patient.relationship || "Patient"}</span>
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Safety Score</span>
          <p className={cn("text-2xl font-black italic tracking-tighter", (patient.riskScore || 85) > 80 ? "text-safe" : "text-warning")}>
            {patient.riskScore || 85}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="p-3 bg-bg-main/50 rounded-2xl flex items-center gap-3">
            <Activity size={16} className="text-primary" />
            <div>
               <p className="text-[8px] font-black uppercase text-text-secondary opacity-60">Condition</p>
               <p className="text-[11px] font-bold text-text-primary">{patient.condition || "Stable"}</p>
            </div>
         </div>
         <div className="p-3 bg-bg-main/50 rounded-2xl flex items-center gap-3">
            <Clock size={16} className="text-warning" />
            <div>
               <p className="text-[8px] font-black uppercase text-text-secondary opacity-60">Next Dose</p>
               <p className="text-[11px] font-bold text-text-primary">08:00 PM</p>
            </div>
         </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); /* Chat logic */ }}
          className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
        >
          <MessageCircle size={14} /> Message
        </button>
        <button className="px-4 py-3 bg-primary text-black rounded-xl transition-all shadow-lg shadow-primary/20">
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export default function CaregiverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patients, loading: patientsLoading } = useCaregiverPatients(user?.uid);
  const { alerts, loading: alertsLoading } = useAlerts(user?.uid);
  const [searchEmail, setSearchEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientMeds, setPatientMeds] = useState<any[]>([]);
  const [medLoading, setMedLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMed, setEditingMed] = useState<any>(null);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientMeds();
    }
  }, [selectedPatient]);

  const fetchPatientMeds = async () => {
    if (!selectedPatient) return;
    setMedLoading(true);
    try {
      // Use patientId as defined in the medications schema
      const q = query(collection(db, "medications"), where("patientId", "==", selectedPatient.uid || selectedPatient.id));
      const snap = await getDocs(q);
      setPatientMeds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setMedLoading(false);
    }
  };

  const linkPatient = async () => {
    const email = searchEmail.trim().toLowerCase();
    if (!email || !user) return;
    setLinking(true);
    try {
      // Search for patient with matching email. Role check is case-insensitive if possible, but standardizing on lowercase.
      const q = query(collection(db, "users"), where("email", "==", email), where("role", "==", "patient"));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        alert("Patient not found. Please verify the email and ensure they are registered as a patient.");
        return;
      }

      const patientDoc = snap.docs[0];
      const patientId = patientDoc.id;

      // Use setDoc with merge to ensure the document exists
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "users", user.uid), {
        patientIds: arrayUnion(patientId)
      }, { merge: true });

      alert(`Successfully linked with ${patientDoc.data().name}!`);
      setSearchEmail("");
      setShowAddPatient(false);
    } catch (err) {
      console.error("Link Error:", err);
      alert("An error occurred while linking. Please try again.");
    } finally {
      setLinking(false);
    }
  };

  const handleUpdateMed = async (medId: string, updates: any) => {
     try {
        await updateDoc(doc(db, "medications", medId), {
           ...updates,
           updatedAt: serverTimestamp()
        });
        fetchPatientMeds();
        setEditingMed(null);
     } catch (err) {
        console.error(err);
     }
  };

  const handleDeleteMed = async (medId: string) => {
     if (!window.confirm("Are you sure? This will remove the medication for the patient.")) return;
     try {
        await deleteDoc(doc(db, "medications", medId));
        fetchPatientMeds();
     } catch (err) {
        console.error(err);
     }
  };

  const [activeDetailTab, setActiveDetailTab] = useState("overview");

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tighter text-text-primary">Care Network</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddPatient(!showAddPatient)}
            className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <UserPlus size={18} /> Link
          </button>
          <NotificationCenter userId={user?.uid} />
        </div>
      </header>

      {showAddPatient && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-primary/5 border-primary/20 space-y-4"
        >
          <div className="space-y-1">
            <h3 className="font-bold text-text-primary uppercase italic tracking-tight">Connect with Patient</h3>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Link using patient's email address.</p>
          </div>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              linkPatient();
            }}
            className="flex gap-2"
          >
            <input 
              autoFocus
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="patient@example.com"
              className="flex-1 bg-bg-main border border-border-main rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
            <button 
              type="submit"
              disabled={linking || !searchEmail.trim()}
              className="bg-primary text-black px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
            >
              {linking ? "Linking..." : "Link"}
            </button>
          </form>
        </motion.div>
      )}

      <section className="space-y-4">
        {patients.length === 0 && !patientsLoading && (
          <div className="py-20 text-center space-y-4 opacity-40">
            <User className="mx-auto" size={48} />
            <p className="text-xs font-black uppercase tracking-widest">No patients linked yet.</p>
          </div>
        )}
        {patients.map(p => (
          <PatientCard key={p.uid} patient={p} onClick={() => setSelectedPatient(p)} />
        ))}
      </section>

      {/* Patient Detail View */}
      <AnimatePresence>
         {selectedPatient && (
           <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-bg-main/90 backdrop-blur-md">
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-surface-main w-full max-w-2xl sm:rounded-[40px] rounded-t-[40px] border border-border-main overflow-hidden flex flex-col h-[90vh] sm:h-auto max-h-[90vh]"
              >
                 <div className="p-8 bg-gradient-to-br from-primary/5 to-transparent flex items-start justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-2xl font-black">
                          {selectedPatient.name[0]}
                       </div>
                       <div>
                          <h2 className="text-2xl font-black tracking-tighter text-text-primary">{selectedPatient.name}</h2>
                          <div className="flex gap-3 mt-1">
                             <span className="text-[10px] font-black uppercase text-text-secondary">{selectedPatient.condition || "Patient"}</span>
                             <div className="w-1 h-1 rounded-full bg-zinc-800 self-center" />
                             <span className="text-[10px] font-black uppercase text-safe">Adherent</span>
                          </div>
                       </div>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="p-3 bg-bg-main border border-border-main rounded-2xl text-text-secondary">
                       <X size={24} />
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 no-scrollbar">
                    {activeDetailTab === "overview" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                           <div className="p-4 bg-bg-main border border-border-main rounded-2xl text-center space-y-1">
                              <p className="text-[8px] font-black uppercase text-text-secondary">Adherence</p>
                              <p className="text-xl font-black text-safe">94%</p>
                           </div>
                           <div className="p-4 bg-bg-main border border-border-main rounded-2xl text-center space-y-1">
                              <p className="text-[8px] font-black uppercase text-text-secondary">Alerts</p>
                              <p className="text-xl font-black text-warning">1</p>
                           </div>
                           <div className="p-4 bg-bg-main border border-border-main rounded-2xl text-center space-y-1">
                              <p className="text-[8px] font-black uppercase text-text-secondary">Risk</p>
                              <p className="text-xl font-black text-primary">Low</p>
                           </div>
                        </div>

                        {/* Medications Section */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Remote Medication List</h4>
                              <button className="flex items-center gap-2 text-[10px] font-black uppercase text-primary px-3 py-1.5 bg-primary/10 rounded-xl">
                                 <Plus size={12} /> Add New
                              </button>
                           </div>

                           {medLoading ? (
                             <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-text-secondary">Fetching live data...</div>
                           ) : (
                             <div className="space-y-3">
                                {patientMeds.map(med => (
                                   <div key={med.id} className="p-5 bg-bg-main rounded-3xl border border-border-main flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-primary">
                                            <Pill size={20} />
                                         </div>
                                         <div>
                                            <p className="text-sm font-black text-text-primary">{med.name} <span className="text-text-secondary font-bold ml-2 text-xs">{med.dosage}</span></p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                               <Clock size={10} className="text-text-secondary" />
                                               <span className="text-[10px] font-bold text-text-secondary">{med.frequency}</span>
                                            </div>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                         <button 
                                           onClick={() => setEditingMed(med)}
                                           className="p-2.5 rounded-xl bg-bg-main text-text-secondary hover:text-text-primary"
                                         >
                                            <Edit3 size={16} />
                                         </button>
                                         <button 
                                           onClick={() => handleDeleteMed(med.id)}
                                           className="p-2.5 rounded-xl bg-bg-main text-text-secondary hover:text-danger"
                                         >
                                            <Trash2 size={16} />
                                         </button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                           )}
                        </div>

                        {/* AI Surveillance Briefing */}
                        <div className="p-6 bg-ai/5 border border-ai/10 rounded-3xl space-y-4">
                           <div className="flex items-center gap-2 text-ai">
                              <Brain size={18} />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Caregiver Intelligence</h4>
                           </div>
                           <p className="text-xs font-medium text-text-secondary opacity-80 leading-relaxed italic">
                             "The patient is currently on a stable adherence trend. No missed doses detected in the last 48 hours. Consider suggesting a schedule adjustment if they mention afternoon fatigue."
                           </p>
                        </div>
                      </motion.div>
                    )}

                    {activeDetailTab === "video" && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="aspect-video bg-black rounded-[32px] relative overflow-hidden group"
                      >
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                               <Video size={40} className="text-primary" />
                            </div>
                         </div>
                         <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                                  <User size={20} className="text-white" />
                               </div>
                               <div>
                                  <p className="text-xs font-black text-white">{selectedPatient.name}</p>
                                  <p className="text-[8px] font-black text-primary uppercase tracking-widest">Connecting...</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => setActiveDetailTab("overview")}
                              className="px-6 py-2 bg-danger text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                            >
                               End Call
                            </button>
                         </div>
                      </motion.div>
                    )}

                    {activeDetailTab === "analytics" && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                         <div className="p-6 bg-surface-main border border-border-main rounded-3xl space-y-6">
                            <div className="flex items-center justify-between">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Weekly Adherence</h4>
                               <TrendingUp size={16} className="text-safe" />
                            </div>
                            <div className="h-40 flex items-end justify-between gap-2 px-2">
                               {[65, 80, 45, 90, 100, 85, 95].map((h, i) => (
                                 <div key={i} className="flex-1 space-y-2">
                                    <motion.div 
                                      initial={{ height: 0 }}
                                      animate={{ height: `${h}%` }}
                                      className={cn("w-full rounded-t-lg transition-all", h > 80 ? "bg-safe" : h > 60 ? "bg-primary" : "bg-warning")}
                                    />
                                    <p className="text-[8px] font-black text-center text-text-secondary opacity-40">D{i+1}</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-bg-main border border-border-main rounded-2xl">
                               <p className="text-[8px] font-black uppercase text-text-secondary opacity-60">Avg. Delay</p>
                               <p className="text-lg font-black text-text-primary">12 min</p>
                            </div>
                            <div className="p-4 bg-bg-main border border-border-main rounded-2xl">
                               <p className="text-[8px] font-black uppercase text-text-secondary opacity-60">Missed Doses</p>
                               <p className="text-lg font-black text-warning">2</p>
                            </div>
                         </div>
                      </motion.div>
                    )}
                 </div>

                 <div className="p-8 border-t border-border-main bg-bg-main flex gap-3">
                    <button 
                      onClick={() => {
                        setActiveDetailTab("overview");
                        navigate(`/family-chat/${selectedPatient.uid}`);
                      }}
                      className={cn(
                        "flex-1 py-4 border rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2",
                        activeDetailTab === "overview" ? "bg-surface-main border-border-main text-text-primary" : "bg-transparent border-transparent text-text-secondary"
                      )}
                    >
                       <MessageCircle size={14} /> Chat
                    </button>
                    <button 
                      onClick={() => setActiveDetailTab("video")}
                      className={cn(
                        "flex-1 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2",
                        activeDetailTab === "video" ? "bg-primary text-black shadow-primary/20" : "bg-transparent text-text-secondary"
                      )}
                    >
                       <Video size={14} /> Video
                    </button>
                    <button 
                      onClick={() => setActiveDetailTab("analytics")}
                      className={cn(
                        "flex-1 py-4 border rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2",
                        activeDetailTab === "analytics" ? "bg-surface-main border-border-main text-text-primary" : "bg-transparent border-transparent text-text-secondary"
                      )}
                    >
                       <TrendingUp size={14} /> Analytics
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* Edit Med Modal */}
      <AnimatePresence>
         {editingMed && (
           <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-bg-main/95 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-main w-full max-w-sm rounded-[40px] p-8 space-y-8 border border-border-main"
              >
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Pill size={22} className="text-primary" />
                       <h3 className="text-xl font-black uppercase italic text-text-primary">Edit Medication</h3>
                    </div>
                    <button onClick={() => setEditingMed(null)} className="p-2 text-zinc-500">
                       <X size={20} />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Medication Name</label>
                       <input 
                         defaultValue={editingMed.name}
                         id="edit-med-name"
                         className="w-full h-14 bg-bg-main border border-border-main rounded-2xl px-6 text-sm font-bold text-text-primary outline-none focus:border-primary" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Dosage</label>
                       <input 
                         defaultValue={editingMed.dosage}
                         id="edit-med-dosage"
                         className="w-full h-14 bg-bg-main border border-border-main rounded-2xl px-6 text-sm font-bold text-text-primary outline-none focus:border-primary" 
                       />
                    </div>
                 </div>

                 <button 
                   onClick={() => {
                     const name = (document.getElementById('edit-med-name') as HTMLInputElement).value;
                     const dosage = (document.getElementById('edit-med-dosage') as HTMLInputElement).value;
                     handleUpdateMed(editingMed.id, { name, dosage });
                   }}
                   className="w-full h-16 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                 >
                    <Save size={20} /> Save Changes
                 </button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
