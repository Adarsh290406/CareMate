import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, X, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";

export default function AppointmentScheduler({ userId }: { userId: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAppt, setNewAppt] = useState({
    title: "",
    date: "",
    time: "",
    doctor: ""
  });

  useEffect(() => {
    if (!userId) return;
    const fetchAppts = async () => {
      const q = query(collection(db, "appointments"), where("patientId", "==", userId));
      const snap = await getDocs(q);
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchAppts();
  }, [userId]);

  const schedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "appointments"), {
        ...newAppt,
        patientId: userId,
        status: "scheduled",
        createdAt: serverTimestamp()
      });
      setIsOpen(false);
      // Refresh
      const q = query(collection(db, "appointments"), where("patientId", "==", userId));
      const snap = await getDocs(q);
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full dense-card p-4 flex items-center justify-between group hover:border-primary-accent/50 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-accent/10 flex items-center justify-center text-primary-accent">
            <Calendar size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm tracking-tight text-white">Next Appointment</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">
              {appointments.length > 0 ? appointments[0].date : "None Scheduled"}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-text-muted group-hover:text-primary-accent transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md dense-card p-8 bg-surface border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Calendar className="text-primary-accent" size={28} />
                  Clinic Schedule
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-text-muted">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <form onSubmit={schedule} className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-accent mb-2">Book Appointment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="date"
                      required
                      value={newAppt.date}
                      onChange={e => setNewAppt({...newAppt, date: e.target.value})}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                    />
                    <input 
                      type="time"
                      required
                      value={newAppt.time}
                      onChange={e => setNewAppt({...newAppt, time: e.target.value})}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>
                  <input 
                    placeholder="Doctor Name / Clinic"
                    required
                    value={newAppt.doctor}
                    onChange={e => setNewAppt({...newAppt, doctor: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                  />
                  <button 
                    disabled={loading}
                    className="w-full py-3 bg-primary-accent text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-accent/20"
                  >
                    {loading ? "Processing..." : "Confirm Schedule"}
                  </button>
                </form>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Upcoming</h3>
                  {appointments.map(appt => (
                    <div key={appt.id} className="p-4 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{appt.doctor}</p>
                          <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">{appt.date} @ {appt.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
