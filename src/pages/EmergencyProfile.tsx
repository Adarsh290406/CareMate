import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "motion/react";
import { Shield, Phone, Activity, Heart, AlertCircle, Clock, User } from "lucide-react";
import { cn } from "../lib/utils";

export default function EmergencyProfile() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatient() {
      if (!patientId) return;
      try {
        const docSnap = await getDoc(doc(db, "users", patientId));
        if (docSnap.exists()) {
          setPatient(docSnap.data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-critical border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-critical">Retrieving Emergency ID...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle size={48} className="text-danger" />
        <h1 className="text-xl font-black text-white uppercase italic">Record Not Found</h1>
        <p className="text-text-secondary text-sm">This emergency link is invalid or has been deactivated.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20 selection:bg-critical selection:text-white">
      {/* Critical Header */}
      <div className="fixed top-0 left-0 right-0 bg-danger text-white py-3 flex items-center justify-center gap-2 z-50">
        <Shield size={16} fill="white" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Emergency Medical Profile</span>
      </div>

      <div className="mt-12 max-w-md mx-auto space-y-8">
        {/* Identity Section */}
        <section className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full border-4 border-critical p-1 mx-auto relative">
             <img 
               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.name}`} 
               alt="Avatar" 
               className="w-full h-full rounded-full bg-zinc-900 object-cover"
             />
             <div className="absolute -bottom-2 -right-2 bg-critical text-white p-1.5 rounded-lg">
                <Shield size={16} />
             </div>
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{patient.name}</h1>
            <div className="flex items-center justify-center gap-4 mt-3">
               <div className="text-center">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Age</p>
                  <p className="text-xl font-black italic">{patient.age || 'N/A'}</p>
               </div>
               <div className="w-px h-8 bg-zinc-800" />
               <div className="text-center">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Blood</p>
                  <p className="text-xl font-black italic text-critical">{patient.bloodGroup || 'N/A'}</p>
               </div>
               <div className="w-px h-8 bg-zinc-800" />
               <div className="text-center">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Gender</p>
                  <p className="text-xl font-black italic">{patient.gender?.toUpperCase().charAt(0) || 'N/A'}</p>
               </div>
            </div>
          </div>
        </section>

        {/* Vital Info Cards */}
        <div className="grid grid-cols-1 gap-4">
           {/* Conditions */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-warning">
                 <Activity size={18} />
                 <h3 className="text-xs font-black uppercase tracking-widest">Chronic Conditions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                 {patient.conditions?.length > 0 ? (
                    patient.conditions.map((c: string) => (
                       <span key={c} className="px-3 py-1.5 bg-warning/10 text-warning border border-warning/10 rounded-full text-[10px] font-bold uppercase">{c}</span>
                    ))
                 ) : (
                    <span className="text-zinc-500 text-xs italic">None reported</span>
                 )}
              </div>
           </div>

           {/* Allergies */}
           <div className="bg-critical/5 border border-critical/20 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-critical">
                 <AlertCircle size={18} />
                 <h3 className="text-xs font-black uppercase tracking-widest">Allergies</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                 {patient.allergies?.length > 0 ? (
                    patient.allergies.map((a: string) => (
                       <span key={a} className="px-3 py-1.5 bg-critical text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-critical/20">{a}</span>
                    ))
                 ) : (
                    <span className="text-zinc-500 text-xs italic">No known allergies</span>
                 )}
              </div>
           </div>
        </div>

        {/* Emergency Contacts */}
        <section className="space-y-4">
           <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500 px-1">Emergency Contacts</h2>
           <div className="space-y-3">
              {patient.emergencyContacts?.map((contact: any, i: number) => (
                 <a 
                   key={i} 
                   href={`tel:${contact.phone}`}
                   className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-3xl group active:scale-95 transition-all"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center">
                          <User size={24} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-white">{contact.name}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{contact.relationship}</p>
                       </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-success text-white flex items-center justify-center shadow-lg shadow-success/20">
                       <Phone size={20} fill="white" />
                    </div>
                 </a>
              ))}
           </div>
        </section>

        {/* Current Medications */}
        <section className="space-y-4">
           <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500 px-1">Current Medications</h2>
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden divide-y divide-zinc-800">
              {patient.lifestyle?.breakfast ? (
                 <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Clock size={16} className="text-zinc-500" />
                       <span className="text-xs font-medium text-zinc-300">Routine timing data available</span>
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase">System Active</span>
                 </div>
              ) : null}
              <div className="p-4 text-center py-8">
                 <p className="text-xs text-zinc-500 font-medium">Please consult CareMate Dashboard for full history.</p>
              </div>
           </div>
        </section>

        <footer className="text-center py-10 opacity-30">
           <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-5 h-5 bg-critical rounded-lg flex items-center justify-center text-black">
                 <Activity size={12} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">CareMate AI System</span>
           </div>
           <p className="text-[8px] font-bold uppercase tracking-widest">Medical Record Version 2.4.0</p>
        </footer>
      </div>
    </div>
  );
}
