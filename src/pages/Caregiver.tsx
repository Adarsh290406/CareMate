import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import RiskMeter from "../components/RiskMeter";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, Heart, ChevronRight, Activity, Bell, Zap, AlertTriangle } from "lucide-react";
import ChatModal from "../components/ChatModal";
import { analyzeAdherencePatterns } from "../lib/adherenceEngine";
import { cn } from "../lib/utils";

export default function Caregiver() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!profile?.patientIds?.length) {
      setLoading(false);
      return;
    }

    // Initialize patients list with static data first
    const initPatients = async () => {
      const initialData = await Promise.all(
        profile.patientIds.map(async (id: string) => {
          const userSnap = await getDoc(doc(db, "users", id));
          const riskSnap = await getDoc(doc(db, "riskScores", id));
          const predictionData = await analyzeAdherencePatterns(id);
          return {
            id,
            ...userSnap.data(),
            risk: riskSnap.data() || { score: 0 },
            prediction: predictionData,
            alertCount: 0
          };
        })
      );
      setPatients(initialData);
      setLoading(false);
    };

    initPatients();

    // Set up real-time alert listeners and user status listeners for each patient
    const unsubscribes = profile.patientIds.map((id: string) => {
      const q = query(
        collection(db, "alerts"),
        where("patientId", "==", id),
        where("read", "==", false)
      );
      
      const unsubAlerts = onSnapshot(q, (snapshot) => {
        setPatients(prev => prev.map(p => {
          if (p.id === id) {
            const docs = snapshot.docs.map(d => d.data());
            docs.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            return { ...p, alertCount: snapshot.size, latestAlert: docs[0] };
          }
          return p;
        }));
      });

      const unsubUser = onSnapshot(doc(db, "users", id), (doc) => {
        setPatients(prev => prev.map(p => {
          if (p.id === id) {
             return { ...p, ...doc.data() };
          }
          return p;
        }));
      });
      
      return () => {
        unsubAlerts();
        unsubUser();
      };
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [profile]);

  return (
    <div className="min-h-screen bg-bg-main p-6 transition-colors duration-300">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-2 text-text-primary">Care Circles</h1>
        <p className="text-text-secondary">Monitoring {patients.length} patients in your care</p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 glass rounded-2xl animate-pulse" />)}
        </div>
      ) : patients.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center space-y-6">
          <Heart className="mx-auto text-primary opacity-20" size={80} />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-text-primary">No Patients Linked</h2>
            <p className="text-text-secondary max-w-xs mx-auto">
              Share your Caregiver ID with a patient to start monitoring their adherence.
            </p>
          </div>
          <div className="p-4 bg-surface-main rounded-xl font-mono text-sm border border-border-main break-all text-text-primary">
            ID: {profile?.id || "Shared on Login"}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {patients.map((patient, idx) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "dense-card p-6 flex flex-col md:flex-row gap-6 relative group overflow-hidden transition-all",
                patient.hasSOS && "border-danger ring-2 ring-danger animate-pulse bg-danger/5"
              )}
            >
              <div className={cn("status-indicator", patient.hasSOS ? "bg-danger" : "bg-primary-accent")} />
              
              <div className="flex items-center gap-6">
                <RiskMeter score={patient.risk?.score} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-text-primary">{patient.name}</h2>
                    {patient.hasSOS && (
                      <span className="px-2 py-0.5 bg-danger text-white text-[8px] font-black rounded uppercase tracking-widest">EMERGENCY SOS</span>
                    )}
                  </div>
                  <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    <span className="flex items-center gap-1.5"><Heart size={12} className="text-danger fill-danger/20" /> {patient.risk?.trend || "stable"}</span>
                    <span className={cn(
                      "flex items-center gap-1.5",
                      (patient.alertCount > 0 || patient.hasSOS) ? "text-danger font-bold animate-pulse" : "text-warning"
                    )}>
                      <Bell size={12} /> {patient.alertCount} alert{patient.alertCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* SOS Metadata Overlay (Feature 16) */}
                <AnimatePresence>
                  {patient.hasSOS && patient.lastSOS && (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="hidden sm:flex flex-col gap-1 p-3 bg-danger/10 border border-danger/20 rounded-xl"
                    >
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-danger" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-danger">Life Metrics</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono text-danger">
                        <span>HR: {patient.lastSOS.vitals?.hr}bpm</span>
                        <span>O2: {patient.lastSOS.vitals?.o2}%</span>
                        <span>BP: {patient.lastSOS.vitals?.bp}</span>
                        <span className="col-span-2 underline underline-offset-2">
                          LOC: {patient.lastSOS.location ? `${patient.lastSOS.location.lat.toFixed(4)}, ${patient.lastSOS.location.lng.toFixed(4)}` : "Home"}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Predictive Adherence Engine (Feature 8) */}
                {!patient.hasSOS && (
                  <div className="hidden lg:flex flex-col gap-1 px-4 py-2 bg-primary-accent/5 border border-primary-accent/10 rounded-xl max-w-[240px]">
                    <div className="flex items-center gap-1.5">
                      <Zap size={10} className="text-primary-accent" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary-accent">AI Prediction</span>
                    </div>
                    <p className="text-[10px] text-text-muted leading-tight font-medium italic">
                      "{patient.prediction?.prediction || "Crunching historical vectors..."}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 flex items-center justify-end gap-3 mt-4 md:mt-0">
                <button 
                  onClick={() => {
                    setSelectedPatient(patient);
                    setIsChatOpen(true);
                  }}
                  className="flex-1 md:flex-none p-3 bg-surface-main border border-border-main rounded-xl flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors text-text-primary"
                >
                  <MessageCircle size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Chat</span>
                </button>
                <button 
                  onClick={() => window.open(`/patient-view/${patient.id}`, '_blank')}
                  className="flex-1 md:flex-none p-3 bg-primary-accent rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all text-white shadow-lg shadow-primary-accent/20"
                >
                  <ChevronRight size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Portal</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetId={selectedPatient?.id || ""}
        targetName={selectedPatient?.name || "Patient"}
      />
    </div>
  );
}
