import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { collection, query, getDocs, where, onSnapshot, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Users, Activity, ExternalLink, Search, Filter, MessageCircle, AlertTriangle } from "lucide-react";
import RiskMeter from "../components/RiskMeter";
import ChatModal from "../components/ChatModal";
import { cn } from "../lib/utils";

export default function Doctor() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPatient, setChatPatient] = useState<any>(null);

  useEffect(() => {
    let unsubscribeAlerts: (() => void)[] = [];
    
    async function fetchAllPatients() {
      const q = query(
        collection(db, "users"),
        where("role", "==", "patient")
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const riskSnap = await getDocs(collection(db, "riskScores"));
      const riskMap = riskSnap.docs.reduce((acc: any, d) => {
        acc[d.id] = d.data();
        return acc;
      }, {});

      const withRisk = docs.map((u: any) => ({
        ...u,
        risk: riskMap[u.id] || { score: 0, explanation: "Awaiting analysis..." },
        alertCount: 0,
        hasSOS: false
      }));

      withRisk.sort((a, b) => b.risk.score - a.risk.score);
      setPatients(withRisk);
      setLoading(false);

      // Set up real-time status listeners for each patient
      docs.forEach(p => {
        // Listen to User doc for hasSOS
        const unsubUser = onSnapshot(doc(db, "users", p.id), (doc) => {
          setPatients(current => current.map(pat => {
            if (pat.id === p.id) {
              return { ...pat, ...doc.data() };
            }
            return pat;
          }));
        });
        unsubscribeAlerts.push(unsubUser);

        // Listen to Alerts for badge count
        const alQ = query(
          collection(db, "alerts"),
          where("patientId", "==", p.id),
          where("read", "==", false)
        );
        const unsubAlerts = onSnapshot(alQ, (snap) => {
          setPatients(current => current.map(pat => {
            if (pat.id === p.id) {
              return { ...pat, alertCount: snap.size };
            }
            return pat;
          }));
        });
        unsubscribeAlerts.push(unsubAlerts);
      });
    }
    
    fetchAllPatients();
    return () => unsubscribeAlerts.forEach(u => u());
  }, []);

  const avgAdherence = patients.length > 0 
    ? (patients.reduce((acc, p) => acc + (100 - (p.risk?.score || 0)), 0) / patients.length).toFixed(1)
    : "84.2";

  const criticalCount = patients.filter(p => (p.risk?.score || 0) > 70 || p.hasSOS).length;
  const anomaliesCount = patients.reduce((acc, p) => acc + (p.alertCount || 0), 0);

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary-accent mb-2">
            <Shield size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Clinician Portal</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter">Patient Registry</h1>
          <p className="text-text-muted">Analyzing adherence patterns for {patients.length} active patients.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Registry ID lookup..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-2.5 bg-surface border border-white/5 rounded-xl w-64 focus:outline-none focus:border-primary-accent/50 text-sm font-medium"
            />
          </div>
          <button className="p-2.5 dense-card text-text-muted hover:text-white">
            <Filter size={18} />
          </button>
        </div>
      </header>

      {/* Analytics Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="dense-card p-6 space-y-4">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Global Adherence</h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tracking-tighter font-mono">{avgAdherence}</span>
            <span className="text-success text-[10px] font-black mb-2 uppercase">+2.4% Δ</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-success rounded-full" style={{ width: `${avgAdherence}%` }} />
          </div>
        </div>
        <div className="dense-card p-6 space-y-4 border-danger/20">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Critical Registry</h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tracking-tighter text-danger font-mono">{criticalCount}</span>
            <Activity className="text-danger mb-2" size={20} />
          </div>
          <p className="text-[10px] font-bold text-danger/80 uppercase tracking-widest">Immediate Referral Required</p>
        </div>
        <div className="dense-card p-6 space-y-4">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">AI Adherence Vectors</h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tracking-tighter font-mono">{anomaliesCount}</span>
            <div className="w-5 h-5 rounded-full bg-primary-accent flex items-center justify-center text-[10px] font-black mb-2">AI</div>
          </div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Anomalies Detected (24H)</p>
        </div>
      </section>

      {/* Patient Table */}
      <div className="dense-card overflow-hidden border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 uppercase text-[9px] font-black tracking-[0.2em] text-text-muted">
            <tr>
              <th className="px-8 py-4">Patient Profile</th>
              <th className="px-8 py-4">Risk Magnitude</th>
              <th className="px-8 py-4">Clinical Logic Inference</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <motion.tr 
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="border-t border-white/5 hover:bg-white/5 transition-colors group relative"
              >
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-lg tracking-tight">{p.name}</div>
                      {p.hasSOS && (
                        <span className="px-2 py-0.5 bg-danger text-white text-[8px] font-black rounded animate-pulse">SOS ACTIVE</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{p.email}</div>
                    {p.hasSOS && p.lastSOS && (
                      <div className="mt-2 p-2 bg-danger/10 border border-danger/20 rounded text-[9px] font-mono text-danger">
                        Vitals: {p.lastSOS.vitals?.hr}bpm, {p.lastSOS.vitals?.bp}, {p.lastSOS.vitals?.o2}% | 
                        Loc: {p.lastSOS.location ? `${p.lastSOS.location.lat.toFixed(4)}, ${p.lastSOS.location.lng.toFixed(4)}` : "Home"}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${p.risk.score}%` }}
                        className={cn(
                          "h-full rounded-full",
                          p.risk.score > 70 ? "bg-danger" : p.risk.score > 40 ? "bg-warning" : "bg-success"
                        )}
                      />
                    </div>
                    <span className="font-mono text-sm font-black italic">{p.risk.score}%</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-xs text-text-muted line-clamp-1 font-medium max-w-xs cursor-help" title={p.risk.explanation}>
                    {p.risk.explanation}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 text-white">
                    <button 
                      onClick={() => {
                        setChatPatient(p);
                        setIsChatOpen(true);
                      }}
                      className="p-2.5 bg-white/5 rounded-lg hover:bg-success hover:text-white transition-all shadow-sm border border-white/5"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button 
                      onClick={() => window.open(`/patient-view/${p.id}`, '_blank')}
                      className="p-2.5 bg-white/5 rounded-lg hover:bg-primary-accent hover:text-white transition-all shadow-sm border border-white/5"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <ChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetId={chatPatient?.id || ""}
        targetName={chatPatient?.name || "Patient"}
      />
    </div>
  );
}
