import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useMedSchedule } from "../hooks/useMedSchedule";
import { useRiskScore } from "../hooks/useRiskScore";
import MedCard from "../components/MedCard";
import RiskMeter from "../components/RiskMeter";
import { Shield, ChevronLeft, Activity, Mail } from "lucide-react";

export default function PatientProxy() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const { doses, loading: dosesLoading } = useMedSchedule(patientId);
  const { risk } = useRiskScore(patientId);

  useEffect(() => {
    async function fetchPatient() {
      if (!patientId) return;
      const docSnap = await getDoc(doc(db, "users", patientId));
      if (docSnap.exists()) setPatient(docSnap.data());
    }
    fetchPatient();
  }, [patientId]);

  if (!patient) return <div className="p-12 text-center text-text-muted">Initializing Portal...</div>;

  return (
    <div className="min-h-screen bg-background text-text-primary p-6">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors">
          <ChevronLeft size={20} />
          <span className="font-bold text-xs uppercase tracking-widest">Exit Portal</span>
        </button>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary-accent/10 border border-primary-accent/20 rounded-full">
          <Shield size={14} className="text-primary-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary-accent">Secure Caregiver Observer Mode</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <Activity className="text-primary-accent" size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tighter">{patient.name}</h1>
                <p className="text-text-muted flex items-center gap-2 text-sm">
                  <Mail size={14} /> {patient.email}
                </p>
             </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white/90 uppercase tracking-widest">Active Adherence Log</h2>
            {dosesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />)}
              </div>
            ) : (
              doses.map((dose, idx) => (
                <MedCard key={dose.id} dose={dose} index={idx} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="dense-card p-6">
              <RiskMeter score={risk?.score || 0} />
           </div>
           
           <div className="dense-card p-6 border-l-4 border-l-primary-accent">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-accent mb-4">Intervention Note</h3>
              <p className="text-xs text-text-muted leading-relaxed italic">
                "Patient is currently {risk?.score < 30 ? "highly compliant" : "struggling with regular doses"}. 
                {risk?.score >= 50 && " Consider sending a direct nudge or placing a call to discuss symptoms."}"
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
