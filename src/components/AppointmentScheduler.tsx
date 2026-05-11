import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, X, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function AppointmentScheduler({ userId }: { userId: string }) {
  const { profile } = useAuth();
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
      const q = query(
        collection(db, "appointments"), 
        where("patientId", "==", userId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort by date and time
      list.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date} ${a.time || "00:00"}`).getTime();
        const dateB = new Date(`${b.date} ${b.time || "00:00"}`).getTime();
        return dateA - dateB;
      });

      // Filter for future appointments only (Optional: keep history if needed, but for "Next" we need future)
      const now = new Date().getTime();
      const upcoming = list.filter((a: any) => new Date(`${a.date} ${a.time || "00:00"}`).getTime() > now);
      
      setAppointments(upcoming.length > 0 ? upcoming : list.length > 0 ? [list[0]] : []);
    };
    fetchAppts();
  }, [userId]);

  const schedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Authentication error. Please sign in again.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "appointments"), {
        ...newAppt,
        title: `Appointment with ${newAppt.doctor}`,
        patientId: userId,
        patientName: profile?.name || "Patient",
        status: "scheduled",
        createdAt: serverTimestamp()
      });
      setIsOpen(false);
      alert("Appointment scheduled successfully!");
      // Refresh
      const q = query(collection(db, "appointments"), where("patientId", "==", userId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date} ${a.time || "00:00"}`).getTime();
        const dateB = new Date(`${b.date} ${b.time || "00:00"}`).getTime();
        return dateA - dateB;
      });
      setAppointments(list);
      setNewAppt({ title: "", date: "", time: "", doctor: "" });
    } catch (err) {
      console.error(err);
      alert(`Failed to schedule appointment: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const nextAppt = appointments.length > 0 ? appointments[0] : null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full card p-4 flex items-center justify-between group hover:border-primary/50 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary">
            <Calendar size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm tracking-tight text-text-primary">Next Appointment</h3>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">
              {nextAppt ? `${nextAppt.date} @ ${nextAppt.time}` : "None Scheduled"}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
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
              className="relative w-full max-w-md card p-8 bg-surface-main border border-border-main"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Calendar className="text-primary" size={28} />
                  Clinic Schedule
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-text-secondary">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <form onSubmit={schedule} className="space-y-4 p-4 rounded-2xl bg-bg-main border border-border-main">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Book Appointment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="date"
                      required
                      value={newAppt.date}
                      onChange={e => setNewAppt({...newAppt, date: e.target.value})}
                      className="bg-bg-main border border-border-main rounded-xl px-4 py-2 text-xs text-text-primary"
                    />
                    <input 
                      type="time"
                      required
                      value={newAppt.time}
                      onChange={e => setNewAppt({...newAppt, time: e.target.value})}
                      className="bg-bg-main border border-border-main rounded-xl px-4 py-2 text-xs text-text-primary"
                    />
                  </div>
                  <input 
                    placeholder="Doctor Name / Clinic"
                    required
                    value={newAppt.doctor}
                    onChange={e => setNewAppt({...newAppt, doctor: e.target.value})}
                    className="w-full bg-bg-main border border-border-main rounded-xl px-4 py-3 text-xs text-text-primary"
                  />
                  <button 
                    disabled={loading}
                    className="w-full py-3 bg-primary text-text-primary shadow-primary/20"
                  >
                    {loading ? "Processing..." : "Confirm Schedule"}
                  </button>
                </form>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-2">Upcoming</h3>
                  {appointments.map(appt => (
                    <div key={appt.id} className="p-4 rounded-2xl bg-bg-main border border-border-main flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">{appt.doctor}</p>
                          <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest">{appt.date} @ {appt.time}</p>
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
