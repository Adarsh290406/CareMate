import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, Clock, ChevronRight, Sparkles, TrendingUp, Brain, AlertCircle, Zap, ShieldAlert, 
  FileText, HelpCircle, X, Check, MapPin, ShoppingCart, Package, Info, Bell, MessageSquare, Video, User
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { useMedications } from "../hooks/useMedications";
import { useMedSchedule } from "../hooks/useMedSchedule";
import { doc, updateDoc, increment, addDoc, serverTimestamp, collection } from "firebase/firestore";
import { db } from "../lib/firebase";
import NotificationCenter from "../components/NotificationCenter";
import { AIService } from "../services/aiService";
import { useAlerts } from "../hooks/useAlerts";
import { useRiskScore } from "../hooks/useRiskScore";
import PillReminderOverlay from "../components/PillReminderOverlay";
import { generateSOSSummary, explainAnomaly, generateDoctorReport, callAi } from "../lib/gemini";
import { jsPDF } from "jspdf";
import { useNavigate, useLocation } from "react-router-dom";
import { usePatientCaregivers } from "../hooks/usePatientCaregivers";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const { caregivers, loading: caregiversLoading } = usePatientCaregivers(user?.uid);

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

  const [selectedCaregiver, setSelectedCaregiver] = useState<any>(null);
  const [activeDetailTab, setActiveDetailTab] = useState("overview");

  useEffect(() => {
    if (location.state?.openCaregiver) {
      setSelectedCaregiver(location.state.openCaregiver);
      if (location.state.tab) setActiveDetailTab(location.state.tab);
      // Clear state after reading to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const startVideoCall = async (member: any) => {
    setSelectedCaregiver(member);
    setActiveDetailTab("video");
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
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Primary Health & Actions */}
        <div className="lg:col-span-7 space-y-10">
          <header className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none text-text-primary">
                  Hello, {profile?.name?.split(' ')[0] || 'User'}
                </h1>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-text-secondary mt-2 opacity-50">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3 lg:hidden">
                <NotificationCenter userId={user?.uid} />
                <button 
                  onClick={toggleVoice}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                    isListening ? "bg-danger text-white border-danger shadow-lg shadow-danger/20 animate-pulse" : "bg-surface-main border-border-main text-text-secondary hover:text-text-primary"
                  )}
                >
                  <Brain size={24} />
                </button>
              </div>
            </div>

            {/* Predictive Alert */}
            {prediction && prediction.risk !== 'low' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-6 bg-warning/5 border-warning/20 flex items-center gap-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning shadow-lg shadow-warning/10">
                  <ShieldAlert size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-warning mb-1">Predictive AI Alert</p>
                  <p className="text-base font-bold text-text-primary leading-tight">{prediction.prediction}</p>
                </div>
                <button className="p-2 hover:bg-black/5 rounded-full" onClick={() => setPrediction(null)}>
                  <X size={18} className="text-text-secondary" />
                </button>
              </motion.div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-6">
               <div className="card p-6 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20 space-y-4 group">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                      <Activity size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Healthy</span>
                  </div>
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black tracking-tighter italic leading-none text-text-primary">{healthScore}</span>
                      <span className="text-sm font-bold text-text-secondary mb-1">/100</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-text-secondary mt-2">Overall Health Score</p>
                  </div>
                  {healthScore < 80 && (
                    <button 
                      onClick={fetchAnomalyExplanation}
                      disabled={loadingAnomaly}
                      className="w-full py-2 bg-danger/10 border border-danger/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-danger hover:bg-danger/20 transition-all"
                    >
                      {loadingAnomaly ? "Analyzing..." : "Explain Score"}
                    </button>
                  )}
               </div>
               <div className="card p-6 bg-gradient-to-br from-safe/10 via-transparent to-transparent border-safe/20 space-y-4 group">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-safe/20 flex items-center justify-center text-safe transition-transform group-hover:scale-110">
                      <TrendingUp size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-safe">Streak</span>
                  </div>
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black tracking-tighter italic leading-none text-text-primary">{streakCount}</span>
                      <span className="text-sm font-bold text-text-secondary mb-1 uppercase">Days</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-text-secondary mt-2">Adherence Mastery</p>
                  </div>
               </div>
            </div>

            {/* Care Circle */}
            {!caregiversLoading && caregivers.length > 0 && (
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Your Care Support</h4>
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-safe">
                       <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                       {caregivers.length} Active
                    </div>
                 </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 px-2">
                    {caregivers.map((cg) => (
                      <div 
                        key={cg.uid}
                        className="shrink-0 w-72 card bg-surface-main p-5 space-y-4 hover:border-primary/30 transition-all shadow-xl group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                              {cg.name?.[0] || "C"}
                            </div>
                            <div>
                              <p className="text-base font-black text-text-primary leading-none mb-1">{cg.name}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{cg.role || "Caregiver"}</p>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-safe rounded-full animate-pulse shadow-[0_0_10px_rgba(46,204,113,0.5)]" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => {
                              setSelectedCaregiver(cg);
                              setActiveDetailTab("overview");
                            }}
                            className="flex items-center justify-center gap-2 py-3.5 bg-bg-main border border-border-main rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95 group/btn"
                          >
                            <MessageSquare size={14} className="group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-transform" /> Chat
                          </button>
                          <button 
                            onClick={() => startVideoCall(cg)}
                            className="flex items-center justify-center gap-2 py-3.5 bg-bg-main border border-border-main rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-safe hover:border-safe/30 hover:bg-safe/5 transition-all active:scale-95 group/btn"
                          >
                            <Video size={14} className="group-hover/btn:scale-110 group-hover/btn:-rotate-12 transition-transform" /> Video
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}
          </header>

          {/* Zone A: SOS & Quick Actions */}
          <section className="flex gap-4">
            <button 
              onClick={handleSOS}
              disabled={isSOSLoading}
              className="flex-1 bg-danger hover:bg-danger/90 text-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 shadow-2xl shadow-danger/20 transition-all active:scale-95 disabled:opacity-50 group"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse group-hover:scale-110 transition-transform">
                <Zap size={32} fill="currentColor" />
              </div>
              <span className="text-sm font-black uppercase tracking-[0.3em]">Emergency SOS</span>
            </button>

            <div className="flex-1 flex flex-col gap-4">
              <button 
                onClick={fetchDoctorReport}
                className="flex-1 bg-primary hover:bg-primary/90 text-black rounded-[2rem] p-6 flex items-center justify-center gap-4 shadow-xl shadow-primary/10 transition-all active:scale-95 group"
              >
                <FileText size={24} className="group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">Doctor Summary</span>
              </button>
              
              <button 
                onClick={toggleVoice}
                className={cn(
                  "flex-1 rounded-[2rem] p-6 flex items-center justify-center gap-4 transition-all active:scale-95 border-2 group",
                  isListening 
                    ? "bg-ai/10 border-ai text-ai shadow-xl shadow-ai/10" 
                    : "bg-surface-main border-border-main text-text-secondary hover:border-primary/30"
                )}
              >
                <div className={cn("relative transition-transform group-hover:scale-110", isListening && "animate-pulse")}>
                  <Brain size={24} />
                  {isListening && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-ai rounded-full" />}
                </div>
                <span className="text-xs font-black uppercase tracking-widest">
                  {isListening ? "Listening..." : "Voice Control"}
                </span>
              </button>
            </div>
          </section>

          {/* Today's Schedule */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black uppercase tracking-widest text-text-secondary">Today's Schedule</h2>
              <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 group">
                View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {doses.slice(0, 4).map((dose, i) => {
                const isTaken = dose.status === "taken";
                return (
                  <motion.div 
                    key={dose.id || i}
                    className={cn(
                      "card p-6 flex flex-col justify-between h-48 transition-all hover:shadow-2xl hover:scale-[1.02]",
                      !isTaken && "border-primary/20 shadow-lg shadow-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                       <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        i % 4 === 0 ? "bg-blue-500/10 text-blue-500" :
                        i % 4 === 1 ? "bg-primary/10 text-primary" :
                        i % 4 === 2 ? "bg-orange-500/10 text-orange-500" :
                        "bg-purple-500/10 text-purple-500"
                      )}>
                        <Activity size={24} />
                      </div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full",
                        isTaken ? "bg-safe/10 text-safe" : "bg-primary/20 text-primary animate-pulse"
                      )}>
                        {isTaken ? "Completed" : "Upcoming"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-xl leading-none mb-1">{dose.medName}</h3>
                      <div className="flex items-center gap-3 text-text-secondary">
                        <p className="text-xs font-bold">{dose.dosage || "10mg"}</p>
                        <div className="w-1 h-1 rounded-full bg-border-main" />
                        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase">
                          <Clock size={12} />
                          {dose.time}
                        </div>
                      </div>
                    </div>
                    {!isTaken && (
                      <button 
                        onClick={() => markTaken(dose.id, dose.medId)}
                        className="w-full py-3 bg-primary text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                      >
                        Mark Taken
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Insights & Stats */}
        <div className="lg:col-span-5 space-y-10">
          
          {/* Health Score Card */}
          <section className="bg-surface-main rounded-[3rem] p-8 relative overflow-hidden border border-border-main shadow-2xl">
            <div className="absolute top-6 right-6">
               <button onClick={fetchExplanation} className="p-3 bg-ai/10 text-ai rounded-2xl hover:bg-ai/20 transition-all">
                 {isExplaining ? <Sparkles size={18} className="animate-spin" /> : <HelpCircle size={18} />}
               </button>
            </div>
            
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-secondary mb-8">Clinical Risk Assessment</h3>
            
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="10" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none" stroke="#00D4AA" strokeWidth="10" strokeLinecap="round"
                    initial={{ strokeDasharray: "0 264" }}
                    animate={{ strokeDasharray: `${(healthScore / 100) * 264} 264` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black italic tracking-tighter text-text-primary leading-none">{healthScore}</span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-safe mt-2">Optimal</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-8 w-full pt-8 border-t border-border-main mt-4">
                 <div className="text-center">
                    <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">Weekly</p>
                    <p className="text-lg font-black text-text-primary">94%</p>
                 </div>
                 <div className="text-center border-x border-border-main">
                    <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">Meds</p>
                    <p className="text-lg font-black text-text-primary">12/12</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">Refill</p>
                    <p className="text-lg font-black text-danger">Low</p>
                 </div>
              </div>
            </div>
          </section>

          {/* AI Insight Card */}
          <section className="bg-ai/5 border border-ai/20 rounded-[3rem] p-8 space-y-6 relative overflow-hidden shadow-xl">
            <AnimatePresence>
              {loadingInsight && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-surface-main/80 backdrop-blur-md z-10 flex items-center justify-center p-8 text-center">
                  <div className="space-y-4">
                     <div className="flex justify-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-ai animate-bounce [animation-delay:-0.3s]" />
                       <div className="w-3 h-3 rounded-full bg-ai animate-bounce [animation-delay:-0.15s]" />
                       <div className="w-3 h-3 rounded-full bg-ai animate-bounce" />
                     </div>
                     <p className="text-xs font-black uppercase tracking-widest text-ai">Synthesizing clinical data...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-ai flex items-center justify-center text-white shadow-lg shadow-ai/20">
                  <Sparkles size={20} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-ai">Advanced AI Analysis</span>
              </div>
              <button onClick={fetchInsights} className="p-2 hover:bg-ai/10 rounded-xl transition-all">
                <TrendingUp size={18} className="text-ai" />
              </button>
            </div>
            
            <p className="text-base font-medium leading-relaxed text-text-primary min-h-[100px]">
              {insight || "Generating your health trend analysis..."}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {["Adherence", "Vitals", "Interactions"].map((chip) => (
                <span key={chip} className="px-4 py-2 bg-ai/10 text-ai rounded-full text-[10px] font-black uppercase tracking-widest border border-ai/10">
                  {chip}
                </span>
              ))}
            </div>
          </section>

          {/* Refill Alerts */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black uppercase tracking-widest text-text-secondary">Pharmacy Center</h2>
              <span className="px-3 py-1 bg-danger/10 text-danger rounded-full text-[9px] font-black uppercase tracking-widest">2 Refills Due</span>
            </div>
            
            <div className="space-y-4">
              {medications.filter(m => m.pillsRemaining <= m.refillAlertThreshold * 2).map((med, i) => (
                <div key={med.id || i} className="card p-6 flex flex-col gap-6 hover:border-danger/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-surface-main border border-border-main flex items-center justify-center text-warning shadow-lg">
                        <Package size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-lg leading-none mb-1">{med.name}</h4>
                        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">{med.pillsRemaining} Capsules Remaining</p>
                      </div>
                    </div>
                    <div className="w-32 h-2 bg-bg-main rounded-full overflow-hidden border border-border-main">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(med.pillsRemaining / 30) * 100}%` }}
                        className={cn("h-full rounded-full", med.pillsRemaining <= med.refillAlertThreshold ? "bg-danger" : "bg-warning")}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => window.open(`https://www.google.com/maps/search/pharmacy+near+me`, '_blank')} className="py-4 bg-surface-main border border-border-main rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-bg-main transition-all">
                      <MapPin size={16} /> Locate Pharmacy
                    </button>
                    <button onClick={() => window.open(`https://www.1mg.com/search/all?name=${med.name}`, '_blank')} className="py-4 bg-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                      <ShoppingCart size={16} /> Refill Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Compliance Chart */}
          <section className="bg-surface-main rounded-[3rem] p-8 border border-border-main shadow-xl">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-secondary mb-10">7-Day Adherence Performance</h2>
            <div className="h-48 flex items-end justify-between gap-4">
              {[60, 80, 40, 100, 95, 20, 85].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group">
                  <div className="relative w-full h-full flex flex-col justify-end">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.3 + (i * 0.08), duration: 0.5, ease: "circOut" }}
                      className={cn(
                        "w-full rounded-2xl transition-all group-hover:scale-105",
                        i === 6 ? "bg-primary shadow-lg shadow-primary/30" : h < 50 ? "bg-danger shadow-lg shadow-danger/20" : "bg-text-secondary/10"
                      )}
                    />
                  </div>
                  <span className="text-[10px] font-black text-text-secondary/50">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

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
      <PillReminderOverlay 
        doses={doses} 
        onMarkTaken={handleMarkTaken} 
      />
      <AnimatePresence>
        {selectedCaregiver && (
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
                    {selectedCaregiver.name[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter text-text-primary">{selectedCaregiver.name}</h2>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] font-black uppercase text-text-secondary">{selectedCaregiver.role || "Caregiver"}</span>
                      <div className="w-1 h-1 rounded-full bg-zinc-800 self-center" />
                      <span className="text-[10px] font-black uppercase text-safe">Online</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCaregiver(null)} className="p-3 bg-bg-main border border-border-main rounded-2xl text-text-secondary">
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-bg-main border border-border-main rounded-2xl text-center space-y-1">
                        <p className="text-[8px] font-black uppercase text-text-secondary">Response Time</p>
                        <p className="text-xl font-black text-safe">~5 min</p>
                      </div>
                      <div className="p-4 bg-bg-main border border-border-main rounded-2xl text-center space-y-1">
                        <p className="text-[8px] font-black uppercase text-text-secondary">Experience</p>
                        <p className="text-xl font-black text-primary">Senior</p>
                      </div>
                    </div>

                    <div className="p-6 bg-surface-main border border-border-main rounded-3xl space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Professional Bio</h4>
                      <p className="text-xs font-medium text-text-secondary opacity-80 leading-relaxed">
                        Dedicated care professional specializing in clinical monitoring and medication adherence support. Available for real-time video consultations and daily health check-ins.
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
                          <p className="text-xs font-black text-white">{selectedCaregiver.name}</p>
                          <p className="text-[8px] font-black text-primary uppercase tracking-widest">Connecting Session...</p>
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
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Health Score Trends</h4>
                        <TrendingUp size={16} className="text-safe" />
                      </div>
                      <div className="h-40 flex items-end justify-between gap-2 px-2">
                        {[70, 85, 60, 95, 100, 90, 85].map((h, i) => (
                          <div key={i} className="flex-1 space-y-2">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              className={cn("w-full rounded-t-lg transition-all", h > 80 ? "bg-safe" : h > 60 ? "bg-primary" : "bg-warning")}
                            />
                            <p className="text-[8px] font-black text-center text-text-secondary opacity-40">W{i+1}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-8 border-t border-border-main bg-bg-main flex gap-3">
                <button 
                  onClick={() => {
                    setActiveDetailTab("overview");
                    navigate(`/family-chat/${selectedCaregiver.uid}`);
                  }}
                  className={cn(
                    "flex-1 py-4.5 border rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/btn",
                    activeDetailTab === "overview" 
                      ? "bg-white/5 border-white/10 text-text-primary shadow-xl" 
                      : "bg-transparent border-transparent text-text-secondary hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <MessageSquare size={16} className="group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-transform" /> Chat
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const docRef = await addDoc(collection(db, "calls"), {
                        fromId: user?.uid,
                        fromName: profile?.name || user?.email,
                        toId: selectedCaregiver.uid || selectedCaregiver.id,
                        status: "calling",
                        createdAt: serverTimestamp(),
                        type: "video"
                      });
                      navigate(`/video-room/${docRef.id}`);
                    } catch (err) {
                      console.error("Call failed:", err);
                    }
                  }}
                  className={cn(
                    "flex-1 py-4.5 border rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/btn",
                    activeDetailTab === "video" 
                      ? "bg-primary text-black shadow-lg shadow-primary/20 border-primary" 
                      : "bg-transparent border-transparent text-text-secondary hover:text-safe hover:bg-safe/5"
                  )}
                >
                  <Video size={18} className="group-hover/btn:scale-110 group-hover/btn:-rotate-12 transition-transform" /> Video
                </button>
                <button 
                  onClick={() => setActiveDetailTab("analytics")}
                  className={cn(
                    "flex-1 py-4.5 border rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/btn",
                    activeDetailTab === "analytics" 
                      ? "bg-white/5 border-white/10 text-text-primary shadow-xl" 
                      : "bg-transparent border-transparent text-text-secondary hover:text-ai hover:bg-ai/5"
                  )}
                >
                  <TrendingUp size={16} className="group-hover/btn:scale-110 group-hover/btn:-translate-y-1 transition-transform" /> Trends
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
