import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, Clock, ChevronRight, Sparkles, TrendingUp, Brain, AlertCircle, Zap, ShieldAlert, 
  FileText, HelpCircle, X, Check, MapPin, ShoppingCart, Package, Info, Bell
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { useMedications } from "../hooks/useMedications";
import { useMedSchedule } from "../hooks/useMedSchedule";
import { doc, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import NotificationCenter from "../components/NotificationCenter";
import { AIService } from "../services/aiService";
import { useAlerts } from "../hooks/useAlerts";
import { useRiskScore } from "../hooks/useRiskScore";
import PillReminderOverlay from "../components/PillReminderOverlay";
import { generateSOSSummary, explainAnomaly, generateDoctorReport, callAi } from "../lib/gemini";
import { jsPDF } from "jspdf";

export default function Home() {
  const { user, profile } = useAuth();
  const { medications } = useMedications(user?.uid);
  const { doses } = useMedSchedule(user?.uid);
  const { risk } = useRiskScore(user?.uid);
  const { triggerSOS, triggerLowSupplyAlert } = useAlerts(user?.uid);
  const [insight, setInsight] = useState("");
  const [showInsight, setShowInsight] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isSOSLoading, setIsSOSLoading] = useState(false);
  
  const [report, setReport] = useState("");
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  // #8 Predictive Non-Adherence
  const [prediction, setPrediction] = useState<any>(null);
  const [anomalyExplanation, setAnomalyExplanation] = useState("");
  const [loadingAnomaly, setLoadingAnomaly] = useState(false);
  const [showAnomaly, setShowAnomaly] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      AIService.updatePatientRiskScore(user.uid);
      AIService.predictNonAdherence(user.uid).then(setPrediction);
    }
  }, [user?.uid, doses.length]);

  useEffect(() => {
    // Voice Command setup
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log("Voice Command:", transcript);
      
      if (transcript.includes("mark") && (transcript.includes("taken") || transcript.includes("done"))) {
        const pendingDose = doses.find(d => d.status === 'pending');
        if (pendingDose) {
          markTaken(pendingDose.id, pendingDose.medId);
          const utterance = new SpeechSynthesisUtterance(`Marked ${pendingDose.medName} as taken.`);
          window.speechSynthesis.speak(utterance);
        }
      }
    };

    if (isListening) {
      recognition.start();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening, doses]);

  const toggleVoice = () => {
    if (!isListening) {
      const utterance = new SpeechSynthesisUtterance("Voice commands enabled. Say 'Mark as taken' to log your current medication.");
      window.speechSynthesis.speak(utterance);
    }
    setIsListening(!isListening);
  };

  const handleDoubleClick = async () => {
    const now = Date.now();
    if (now - lastClickTime < 300) { // Double click detected
      const pendingDose = doses.find(d => d.status === 'pending');
      if (pendingDose) {
        if (confirm(`Mark ${pendingDose.medName} as taken?`)) {
          await markTaken(pendingDose.id, pendingDose.medId);
        }
      }
    }
    setLastClickTime(now);
  };

  const handleSOS = async () => {
    if (isSOSLoading) return;
    if (!confirm("Trigger Emergency SOS? Your caregivers and paramedics will be notified immediately.")) return;
    setIsSOSLoading(true);
    try {
      const summary = await generateSOSSummary(profile || { name: user?.email }, medications.map(m => m.name));
      await triggerSOS(`EMERGENCY: ${summary}`);
      alert("SOS Alert Sent with AI Medical Summary!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSOSLoading(false);
    }
  };

  const fetchExplanation = async () => {
    if (isExplaining || !risk) return;
    setIsExplaining(true);
    try {
      const data = doses.slice(0, 10).map(d => ({ status: d.status, med: d.medName }));
      const res = await explainAnomaly(risk.score || 85, data);
      setExplanation(res);
      setShowExplanation(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExplaining(false);
    }
  };

  const fetchDoctorReport = async () => {
    if (isReportLoading) return;
    setIsReportLoading(true);
    setShowReportModal(true);
    try {
      const res = await generateDoctorReport(profile || { name: user?.email }, medications, doses);
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReportLoading(false);
    }
  };

  const fetchInsights = async () => {
    if (loadingInsight || !user?.uid) return;
    setLoadingInsight(true);
    try {
      const res = await AIService.getDailySummary(user.uid);
      setInsight(res);
      setShowInsight(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsight(false);
    }
  };

  const fetchAnomalyExplanation = async () => {
    if (loadingAnomaly || !user?.uid) return;
    setLoadingAnomaly(true);
    try {
      const res = await AIService.explainAnomaly(user.uid);
      setAnomalyExplanation(res);
      setShowAnomaly(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnomaly(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("CareMate Medical Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Patient: ${profile?.name || user?.email}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42);
    doc.line(20, 48, 190, 48);
    
    doc.setFontSize(14);
    doc.text("Executive Summary", 20, 60);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(report, 170);
    doc.text(splitText, 20, 70);
    
    doc.save(`CareMate_Report_${profile?.name || 'User'}.pdf`);
  };

  const markTaken = async (doseId: string, medId: string) => {
    try {
      await updateDoc(doc(db, "doses", doseId), {
        status: "taken",
        takenAt: new Date().toISOString(),
      });
      
      if (medId) {
        await updateDoc(doc(db, "medications", medId), {
          pillsRemaining: increment(-1)
        });

        const med = medications.find(m => m.id === medId);
        if (med && med.pillsRemaining - 1 <= med.refillAlertThreshold) {
          await triggerLowSupplyAlert(med.name, med.pillsRemaining - 1);
        }
      }
    } catch (err) {
      console.error("Failed to mark dose taken:", err);
    }
  };

  // Real Stats Calculation
  const [streakCount, setStreakCount] = useState(0);
  const [healthScore, setHealthScore] = useState(100);

  useEffect(() => {
    if (doses.length === 0) return;

    // 1. Calculate Streak
    const dosesByDay: Record<string, any[]> = {};
    doses.forEach(dose => {
      const dateKey = dose.scheduledAt.toDate().toLocaleDateString();
      if (!dosesByDay[dateKey]) dosesByDay[dateKey] = [];
      dosesByDay[dateKey].push(dose);
    });

    const sortedDates = Object.keys(dosesByDay).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    let streak = 0;
    const today = new Date().toLocaleDateString();

    for (const date of sortedDates) {
      if (date === today) {
        const anyPending = dosesByDay[date].some(d => d.status === 'pending');
        const anyTaken = dosesByDay[date].some(d => d.status === 'taken');
        if (anyTaken) streak++;
        continue;
      }
      
      const allTaken = dosesByDay[date].every(d => d.status === 'taken');
      if (allTaken) {
        streak++;
      } else {
        break;
      }
    }
    setStreakCount(streak);

    // 2. Calculate Health Score
    const last30 = doses.slice(0, 30);
    const takenCount = last30.filter(d => d.status === 'taken').length;
    const adherenceRate = last30.length > 0 ? (takenCount / last30.length) : 1;
    
    // Use the risk score directly as high-risk-is-bad (e.g., 0-100)
    const riskVal = risk?.score || 0;
    const composite = (adherenceRate * 100 * 0.6) + ((100 - riskVal) * 0.4);
    setHealthScore(Math.round(composite));

  }, [doses, risk]);

  const todayProgress = doses.length > 0 
    ? `${doses.filter(d => d.status === 'taken' && d.scheduledAt.toDate().toLocaleDateString() === new Date().toLocaleDateString()).length}/${doses.filter(d => d.scheduledAt.toDate().toLocaleDateString() === new Date().toLocaleDateString()).length}`
    : "0/0";

  useEffect(() => {
    fetchInsights();
  }, [medications.length, doses.length]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 select-none touch-none" onDoubleClick={handleDoubleClick}>
      
      <header className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              Hello, {profile?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter userId={user?.uid} />
            <button 
              onClick={toggleVoice}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                isListening ? "bg-danger text-white border-danger shadow-lg shadow-danger/20 animate-pulse" : "bg-surface border-border text-text-muted hover:text-white"
              )}
            >
              <Brain size={24} />
            </button>
          </div>
        </div>

        {/* #8 Predictive Non-Adherence Alert */}
        {prediction && prediction.risk !== 'low' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-4 bg-warning/10 border-warning/20 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-warning">
              <ShieldAlert size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-warning">AI Predictive Alert</p>
              <p className="text-sm font-bold text-white">{prediction.prediction}</p>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-full" onClick={() => setPrediction(null)}>
              <X size={16} className="text-text-secondary" />
            </button>
          </motion.div>
        )}

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-2 gap-4">
           <div className="card p-5 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Activity size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Healthy</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black tracking-tighter italic leading-none">{healthScore}</span>
                <span className="text-xs font-bold text-text-muted mb-1">/100</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Overall Health Score</p>
              {healthScore < 80 && (
                <button 
                  onClick={fetchAnomalyExplanation}
                  disabled={loadingAnomaly}
                  className="w-full mt-2 py-1.5 border border-danger/30 rounded-lg text-[8px] font-black uppercase tracking-widest text-danger hover:bg-danger/10 transition-all flex items-center justify-center gap-1"
                >
                  {loadingAnomaly ? "Analyzing..." : "Explain Score"}
                </button>
              )}
           </div>
           <div className="card p-5 bg-gradient-to-br from-success/10 to-transparent border-success/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-success/20 flex items-center justify-center text-success">
                  <TrendingUp size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-success">Streak</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black tracking-tighter italic leading-none">{streakCount}</span>
                <span className="text-xs font-bold text-text-muted mb-1">DAYS</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Adherence Mastery</p>
           </div>
        </div>

        {/* Daily Briefing Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-main border border-border-main group cursor-pointer" onClick={() => setShowInsight(true)}>
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-ai/5 opacity-50" />
           <div className="relative p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-ai/10 flex items-center justify-center text-ai shadow-xl shadow-ai/10 group-hover:scale-110 transition-transform">
                 <Sparkles size={28} />
              </div>
              <div className="flex-1">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-ai mb-1">CareMate AI Briefing</h4>
                 <p className={cn(
                   "text-sm font-medium leading-snug line-clamp-2",
                   loadingInsight ? "animate-pulse italic text-text-muted" : "text-white"
                 )}>
                   {insight || "Analyzing your clinical data for today's briefing..."}
                 </p>
              </div>
              <ChevronRight size={20} className="text-text-muted group-hover:translate-x-1 transition-transform" />
           </div>
        </div>
      </header>
      
      {/* Zone A: SOS & Quick Actions */}
      <section className="flex gap-3">
        <button 
          onClick={handleSOS}
          disabled={isSOSLoading}
          className="flex-1 bg-danger hover:bg-danger/90 text-white rounded-[var(--radius-card)] p-5 flex flex-col items-center justify-center gap-3 shadow-lg shadow-danger/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <Zap size={28} fill="currentColor" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest">Emergency SOS</span>
        </button>

        <div className="flex-1 flex flex-col gap-3">
          <button 
            onClick={fetchDoctorReport}
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-[var(--radius-card)] p-4 flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <FileText size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Doctor Summary</span>
          </button>
          
          <button 
            onClick={toggleVoice}
            className={cn(
              "flex-1 rounded-[var(--radius-card)] p-4 flex items-center justify-center gap-3 transition-all active:scale-95 border-2",
              isListening 
                ? "bg-ai/10 border-ai text-ai shadow-lg shadow-ai/10" 
                : "bg-surface border-border text-text-secondary"
            )}
          >
            <div className={cn("relative", isListening && "animate-pulse")}>
              <Brain size={20} />
              {isListening && <div className="absolute -top-1 -right-1 w-2 h-2 bg-ai rounded-full" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isListening ? "Listening..." : "Voice Mode"}
            </span>
          </button>
        </div>
      </section>

      {/* Zone B: Risk Score Hero */}
      <section className="bg-surface-main rounded-[var(--radius-card)] p-6 relative overflow-hidden h-[180px] flex flex-col justify-between border border-border-main">
        <div className="absolute top-3 right-3 z-10">
           <button 
             onClick={fetchExplanation}
             className="p-1.5 bg-ai/10 text-ai rounded-full hover:bg-ai/20 transition-colors"
             title="Why this score?"
           >
             {isExplaining ? <Sparkles size={14} className="animate-spin" /> : <HelpCircle size={14} />}
           </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="relative w-[120px] h-[120px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="var(--text-primary)"
                strokeOpacity="0.05"
                strokeWidth="8"
                strokeDasharray="125 251"
                strokeLinecap="round"
              />
              <motion.circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#00C896"
                strokeWidth="8"
                strokeDasharray={`${(healthScore / 100) * 125} 251`}
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 251" }}
                animate={{ strokeDasharray: `${(healthScore / 100) * 125} 251` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="mono text-4xl text-[#00C896] leading-none">{healthScore}</span>
              <span className="text-[9px] uppercase tracking-widest opacity-40 font-black mt-1">Safety Score</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 pr-2">
            <div className="flex items-center gap-2 text-text-secondary/40">
              <TrendingUp size={12} />
              <span className="text-[10px] uppercase font-black tracking-widest">+4% Trend</span>
            </div>
            <div className="w-24 h-8 flex items-end gap-1 px-1 mt-auto">
              {[0.4, 0.6, 0.5, 0.8, 0.9].map((h, i) => (
                 <div key={i} className="flex-1 bg-text-primary/10 rounded-t-sm" style={{ height: `${h * 100}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 px-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-black">Streak</span>
            <span className="text-sm font-bold text-white tracking-tighter">{streakCount} Days 🔥</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-black">Today</span>
            <span className="text-sm font-bold text-white tracking-tighter">{doses.filter(d => d.status === 'taken').length}/{doses.length} Doses</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-black">Refill</span>
            <span className="text-sm font-bold text-white tracking-tighter">
              {medications.length > 0 
                ? `${Math.min(...medications.map(m => m.pillsRemaining))} Left`
                : "None Set"}
            </span>
          </div>
        </div>
      </section>

      {/* Zone B: Today's Medications */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-text-secondary">Today's Schedule</h2>
          <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
            View All <ChevronRight size={12} />
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
          {doses.slice(0, 5).map((dose, i) => {
            const scheduledTime = dose.scheduledAt?.toDate() || new Date();
            const isTaken = dose.status === "taken";
            const isDue = !isTaken && Math.abs(Date.now() - scheduledTime.getTime()) < 3600000; // 1hr window
            const isLate = !isTaken && Date.now() > scheduledTime.getTime() + 3600000;
            const isUpcoming = !isTaken && !isDue && !isLate;

            const displayStatus = isTaken ? "TAKEN" : isDue ? "DUE NOW" : isLate ? "MISSED" : "UPCOMING";

            return (
              <motion.div 
                key={dose.id || i}
                whileActive={{ scale: 0.98 }}
                className={cn(
                  "shrink-0 w-[160px] h-[200px] card p-4 flex flex-col justify-between transition-all",
                  isDue && "pulse-border"
                )}
              >
                <div className="flex justify-end">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full",
                    isTaken ? "bg-green-500/10 text-green-500" :
                    isDue ? "bg-primary/20 text-primary animate-pulse" :
                    isLate ? "bg-danger/10 text-danger" :
                    "bg-[var(--border)] text-[var(--text-secondary)]"
                  )}>
                    {displayStatus}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    i % 4 === 0 ? "bg-blue-500/10 text-blue-500" :
                    i % 4 === 1 ? "bg-primary/10 text-primary" :
                    i % 4 === 2 ? "bg-orange-500/10 text-orange-500" :
                    "bg-purple-500/10 text-purple-500"
                  )}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] leading-none mb-1">{dose.medName}</h3>
                    <p className="text-[12px] text-[var(--text-secondary)]">{dose.dosage || "10mg"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-medium">
                    <Clock size={10} />
                    {dose.time}
                  </div>
                  <button 
                    onClick={() => !isTaken && markTaken(dose.id, dose.medId)}
                    className={cn(
                    "w-full py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                    isTaken 
                      ? "bg-green-500/10 text-green-500 cursor-default"
                      : "bg-primary text-white"
                  )}>
                    {isTaken ? "Taken ✓" : "Mark Taken"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Zone C: AI Insight Card */}
      <section className="bg-ai/5 border border-ai/20 rounded-[var(--radius-card)] p-5 space-y-4 relative overflow-hidden group">
        <AnimatePresence>
          {loadingInsight && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm z-10 flex items-center justify-center p-6 text-center"
            >
              <div className="space-y-4">
                 <div className="flex justify-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-ai animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-2 h-2 rounded-full bg-ai animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-2 h-2 rounded-full bg-ai animate-bounce" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-ai">Analyzing Trends...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-ai flex items-center justify-center text-white">
              <Sparkles size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-ai">CareMate AI Insight</span>
          </div>
          <button 
            onClick={fetchInsights}
            className="text-[10px] font-black uppercase tracking-widest text-ai/60 hover:text-ai transition-colors flex items-center gap-1"
          >
            <Sparkles size={10} /> Generate
          </button>
        </div>
        
        <p className="text-sm font-medium leading-relaxed min-h-[42px] whitespace-pre-wrap">
          {insight}
        </p>

        <div className="flex gap-2">
          {["Vitals Check", "Meds Interaction", "Weekly View"].map((chip) => (
            <button key={chip} className="px-3 py-1.5 bg-ai/10 text-ai rounded-full text-[9px] font-bold flex items-center gap-1.5 border border-ai/10">
              <div className="w-1.5 h-1.5 rounded-full bg-ai" />
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* Zone D: Refill Alerts Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">Refill Center</h2>
          <span className="text-[10px] font-black text-warning uppercase tracking-widest">2 Meds Low</span>
        </div>
        
        <div className="space-y-3">
          {medications.filter(m => m.pillsRemaining <= m.refillAlertThreshold * 2).map((med, i) => (
            <div key={med.id || i} className="card p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-warning">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-none mb-1">{med.name}</h4>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{med.pillsRemaining} Pills Left</p>
                  </div>
                </div>
                <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(med.pillsRemaining / 30) * 100}%` }}
                    className={cn(
                      "h-full rounded-full",
                      med.pillsRemaining <= med.refillAlertThreshold ? "bg-danger" : "bg-warning"
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/pharmacy+near+me`, '_blank')}
                  className="py-3 bg-surface border border-border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <MapPin size={14} /> Nearby
                </button>
                <button 
                  onClick={() => window.open(`https://www.1mg.com/search/all?name=${med.name}`, '_blank')}
                  className="py-3 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={14} /> Order Online
                </button>
              </div>
            </div>
          ))}
          {medications.filter(m => m.pillsRemaining <= m.refillAlertThreshold * 2).length === 0 && (
             <div className="card p-8 flex flex-col items-center justify-center text-center opacity-40">
                <Check className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">All supplies stocked</span>
             </div>
          )}
        </div>
      </section>

      {/* Zone E: 7-Day Chart */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">Weekly Progress</h2>
          <span className="text-[11px] font-black text-primary tracking-tighter">94% COMPLIANCE</span>
        </div>
        
        <div className="card h-48 p-6 flex flex-col justify-end">
          <div className="flex items-end justify-between h-32 gap-3">
            {[60, 80, 40, 100, 95, 20, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.3 + (i * 0.08), duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "w-full rounded-t-md",
                    i === 6 ? "bg-primary" : h < 50 ? "bg-danger" : "bg-[var(--text-secondary)]/20"
                  )}
                />
                <span className="text-[9px] font-bold uppercase text-[var(--text-secondary)]">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {showExplanation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExplanation(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="z-10 w-full max-w-sm bg-zinc-900 border border-ai/20 rounded-3xl p-8 space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-ai/10 flex items-center justify-center text-ai">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-xl font-bold tracking-tight">AI Explanation</h3>
              </div>
              <p className="text-sm font-medium leading-relaxed text-zinc-300">
                {explanation}
              </p>
              <button 
                onClick={() => setShowExplanation(false)}
                className="w-full py-4 bg-ai text-white rounded-2xl font-black uppercase text-xs tracking-widest"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}

        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="z-10 w-full max-w-2xl bg-white text-black rounded-3xl p-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                     <FileText size={20} />
                   </div>
                   <h3 className="text-xl font-black tracking-tighter">Pre-Appointment Summary</h3>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-black/5 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              {isReportLoading ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Synthesizing 3 months of data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 italic text-sm leading-relaxed whitespace-pre-wrap">
                    {report}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={downloadPDF} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest">Download PDF</button>
                    <button className="flex-1 py-4 bg-zinc-100 text-black rounded-2xl font-black uppercase text-xs tracking-widest">Share with Doctor</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PillReminderOverlay doses={doses} onMarkTaken={markTaken} />

      <AnimatePresence>
          {showAnomaly && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-surface border border-danger/20 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-danger/20 text-danger flex items-center justify-center">
                        <ShieldAlert size={32} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase italic leading-none text-white">Anomaly Analysis</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-danger mt-1">AI Root Cause Search</p>
                     </div>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-zinc-300">
                    {anomalyExplanation}
                  </p>
                  <button 
                    onClick={() => setShowAnomaly(false)}
                    className="w-full h-14 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Got it
                  </button>
               </motion.div>
            </div>
          )}
      </AnimatePresence>
    </div>
  );
}
