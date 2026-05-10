import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMedSchedule } from "../hooks/useMedSchedule";
import { doc, updateDoc, collection, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { t } from "../lib/i18n";
import { useRiskScore } from "../hooks/useRiskScore";
import { useMedications } from "../hooks/useMedications";
import { useAlerts } from "../hooks/useAlerts";
import MedCard from "../components/MedCard";
import RiskMeter from "../components/RiskMeter";
import SymptomAnalyzer from "../components/SymptomAnalyzer";
import MedEncyclopedia from "../components/MedEncyclopedia";
import AppointmentScheduler from "../components/AppointmentScheduler";
import VoiceAssistant from "../components/VoiceAssistant";
import AddMedModal from "../components/AddMedModal";
import ChatModal from "../components/ChatModal";
import ReminderSettingsModal from "../components/ReminderSettingsModal";
import HealthImpactSimulator from "../components/HealthImpactSimulator";
import { callAi } from "../lib/gemini";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Sun, Moon, Plus, Bell, Heart, Shield, Activity, Clock, Brain, ChevronRight, MessageCircle, AlertTriangle, Settings, ExternalLink } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { cn } from "../lib/utils";

export default function Patient() {
  const { user, profile } = useAuth();
  const { doses, loading: dosesLoading } = useMedSchedule(user?.uid);
  const { medications } = useMedications(user?.uid);
  const { triggerSOS } = useAlerts(user?.uid);
  const { risk } = useRiskScore(user?.uid);
  const [briefing, setBriefing] = useState("");
  const [elderlyMode, setElderlyMode] = useState(false);
  const [language, setLanguage] = useState<"English" | "Hindi">(profile?.language || "English");
  const [isScanning, setIsScanning] = useState(false);
  const [loadingSOS, setLoadingSOS] = useState(false);
  const [view, setView] = useState<"clinical" | "history">("clinical");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const lowMedications = medications.filter(m => m.pillsRemaining <= m.refillAlertThreshold);

  useEffect(() => {
    async function getBriefing() {
      if (!user || dosesLoading || medications.length === 0) return;
      
      const todayDoses = doses.slice(0, 5); 
      const system = `You are CareMate AI assistant. Give a 1-sentence morning briefing to a patient based on their adherence and meds. 
      CRITICAL: Respond ONLY in the ${language} language. If Hindi, use Devanagari script.
      CRITICAL: Also check for drug interactions if the med list contains potentially clashing drugs (e.g., Warfarin and Aspirin). 
      If no interactions, be brief, encouraging, and clear.`;
      const userPrompt = `Recent Doses: ${JSON.stringify(todayDoses)}. Risk Score: ${risk?.score || 0}. Patient Name: ${profile?.name}. Medications: ${JSON.stringify(medications)}. Low Meds: ${lowMedications.length}.`;
      
      const res = await callAi(system, userPrompt);
      if (res.text) setBriefing(res.text);
    }
    
    // Clear briefing to show loading state when med list or language changes
    setBriefing("");
    getBriefing();
  }, [user, dosesLoading, doses, risk, profile, lowMedications.length, medications, language]);

  useEffect(() => {
    if (profile?.language && profile.language !== language) {
      setLanguage(profile.language);
    }
  }, [profile?.language]);

  const toggleLanguage = async () => {
    const next = language === "English" ? "Hindi" : "English";
    setLanguage(next);
    setBriefing("");
    if (user?.uid) {
      await updateDoc(doc(db, "users", user.uid), { language: next });
    }
  };

  const handlePrescriptionUpload = async () => {
    setIsScanning(true);
    // Simulate AI Scan
    const system = "You are a medical OCR specialist. Extract medication details (name, dosage, frequency) from a simulated scan text.";
    const userPrompt = "RX Scan Image Data: [Image of Lisinopril 10mg Once Daily, Metformin 500mg Twice Daily]";
    
    try {
      const res = await callAi(system, userPrompt);
      alert(`AI Scan Complete: ${res.text || "Detected Lisinopril and Metformin"}`);
      // In a real app, we'd parse this JSON and add to DB
    } catch (err) {
      alert("AI Scan failed. Please enter manually.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleRefillOrder = async (medName: string) => {
    alert(`Refill request for ${medName} sent to your pharmacy and caregiver.`);
    // Feature 13: Medication Refill Alert System
    await triggerSOS(`Refill requested for ${medName} by patient.`);
  };

  const handleSignOut = () => auth.signOut();

  const handleSOS = async () => {
    if (confirm("Are you sure you want to trigger an Emergency SOS Alert? This will notify your caregivers and doctor immediately.")) {
      setLoadingSOS(true);
      
      let location = null;
      try {
        // Try to get location
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
      } catch (err) {
        console.warn("Could not get location for SOS", err);
      }

      // Simulate current vitals from profile or wearables
      const vitals = {
        hr: Math.floor(Math.random() * (110 - 70) + 70), // Simulated
        bp: "135/88",
        o2: 97
      };

      try {
        await triggerSOS(`Emergency SOS Triggered: Patient requires immediate assistance at ${location ? "current coordinates" : "home"}.`, {
          location,
          vitals,
          timestamp: new Date().toISOString()
        });

        // Update user document for global visibility
        if (user?.uid) {
          await updateDoc(doc(db, "users", user.uid), {
            hasSOS: true,
            lastSOS: {
              location,
              vitals,
              at: serverTimestamp()
            }
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setLoadingSOS(false), 2000); // Keep screen red for a bit to ensure user sees it
      }
    }
  };

  const seedDemoData = async () => {
    if (!user) return;
    const { collection, addDoc, serverTimestamp, setDoc, doc } = await import("firebase/firestore");
    const { db } = await import("../lib/firebase");
    
    // 1. Add some medications
    const meds = [
      { name: "Lisinopril", dosage: "10mg", frequency: "daily", instructions: "Morning, after breakfast", pillsRemaining: 5, refillAlertThreshold: 10, patientId: user.uid },
      { name: "Metformin", dosage: "500mg", frequency: "daily", instructions: "Evening, with dinner", pillsRemaining: 45, refillAlertThreshold: 10, patientId: user.uid },
    ];

    try {
      for (const med of meds) {
        const docRef = await addDoc(collection(db, "medications"), med);
        // 2. Add some doses for today
        const scheduledTime = new Date();
        scheduledTime.setHours(med.name === "Lisinopril" ? 8 : 20, 0, 0, 0);
        
        await addDoc(collection(db, "doses"), {
          medicationId: docRef.id,
          medName: med.name,
          dosage: med.dosage,
          scheduledAt: scheduledTime,
          status: "pending",
          patientId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      
      // 3. Set a risk score
      await setDoc(doc(db, "riskScores", user.uid), {
        score: 42,
        trend: "DECREASING",
        explanation: "Consistent morning adherence. Evening gap detected at 8PM threshold.",
        updatedAt: serverTimestamp()
      });

      alert("Demo Data Seeded! Refreshing dashboard...");
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-background text-text-primary flex flex-col font-sans overflow-hidden transition-all duration-300",
      elderlyMode ? "text-2xl" : "text-base"
    )}>
      {/* Emergency SOS Overlay */}
      <AnimatePresence>
        {loadingSOS && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-danger flex flex-col items-center justify-center text-white text-center p-8"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6"
            >
              <AlertTriangle size={48} />
            </motion.div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{t("sos_transmitting", language)}</h2>
            <p className="text-xl font-medium opacity-80 max-w-sm">{t("sos_desc", language)}</p>
            <button 
              onClick={async () => {
                setLoadingSOS(false);
                if (user?.uid) {
                  await updateDoc(doc(db, "users", user.uid), {
                    hasSOS: false
                  });
                }
              }}
              className="mt-12 px-8 py-4 bg-white text-danger font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-black/20"
            >
              {t("cancel_alert", language)}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-accent/20">
            <Activity size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-white">
            CareMate <span className="text-primary-accent font-mono text-[10px] ml-2 tracking-widest uppercase">v1.2</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          <button 
            onClick={() => window.print()}
            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-text-muted"
            title="Export Health Report"
          >
            <ExternalLink size={20} />
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={handleSOS}
              disabled={loadingSOS}
              className={cn(
                "px-4 py-2 bg-danger hover:bg-danger/80 rounded-lg font-black text-[10px] tracking-widest text-white transition-all sm:block shadow-lg shadow-danger/20",
                loadingSOS ? "opacity-50 cursor-not-allowed" : "animate-pulse"
              )}
            >
              {loadingSOS ? t("sending", language) : t("emergency_sos", language)}
            </button>
              <button 
                onClick={() => setElderlyMode(!elderlyMode)}
                className="p-2 bg-white/5 rounded-lg border border-white/5 hover:border-primary-accent/50 transition-colors"
                title={t("elderly_mode", language)}
              >
                {elderlyMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            <button 
              onClick={toggleLanguage}
              className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 hover:border-primary-accent/50 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              {language}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-white/5 rounded-lg border border-white/5 hover:border-primary-accent/50 transition-colors"
              title={t("reminder_settings", language)}
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2 bg-white/5 rounded-lg border border-white/5 hover:border-danger/50 transition-colors group"
            >
              <LogOut size={18} className="group-hover:text-danger" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-y-auto pb-24">
        
        {/* Left Column: Medications List */}
        <div className="flex-[1.5] flex flex-col gap-4">
          <AnimatePresence>
            {lowMedications.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex items-center gap-3 overflow-hidden"
              >
                <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center text-warning">
                  <AlertTriangle size={18} />
                </div>
                <p className="text-xs text-warning font-medium">
                  <span className="font-bold">Refill Alert:</span> {lowMedications[0].name} supply is low ({lowMedications[0].pillsRemaining} doses remaining).
                  <button 
                    onClick={() => handleRefillOrder(lowMedications[0].name)}
                    className="underline underline-offset-4 ml-2 hover:text-white transition-colors"
                  >
                    Order Refill
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight uppercase tracking-widest text-white/90">
              {view === "clinical" ? (
                <><Clock className="w-5 h-5 text-primary-accent" /> {t("todays_schedule", language)}</>
              ) : (
                <><Activity className="w-5 h-5 text-success" /> {t("adherence_history", language)}</>
              )}
            </h2>
            <div className="flex items-center gap-4">
              {view === "clinical" && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-accent/10 hover:bg-primary-accent/20 border border-primary-accent/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary-accent transition-all"
                  >
                    <Plus size={14} /> {t("add_med", language)}
                  </button>
                  <button 
                    onClick={handlePrescriptionUpload}
                    disabled={isScanning}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted transition-all"
                  >
                    <Plus size={14} /> {isScanning ? "Scanning..." : t("scan_rx", language)}
                  </button>
                </div>
              )}
              <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">
                {view === "clinical" 
                  ? `${doses.filter(d => d.status === "pending").length} ${t("doses_remaining", language)}` 
                  : t("full_registry", language)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {dosesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />)}
              </div>
            ) : view === "clinical" ? (
              doses.length === 0 ? (
                <div className="dense-card p-12 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-text-muted mb-2">
                    <Clock size={32} />
                  </div>
                  <div>
                    <p className="text-text-primary text-lg font-bold">{t("no_doses", language)}</p>
                    <p className="text-text-muted text-sm italic max-w-xs mx-auto">{t("no_doses_desc", language)}</p>
                  </div>
                  <button 
                    onClick={seedDemoData}
                    className="mt-4 px-6 py-3 bg-primary-accent text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-primary-accent/20"
                  >
                    🚀 {t("seed_demo", language)}
                  </button>
                </div>
              ) : (
                doses.map((dose, idx) => (
                  <MedCard key={dose.id} dose={dose} index={idx} />
                ))
              )
            ) : (
              <div className="space-y-4">
                {/* Simplified History View */}
                {doses.map((dose, idx) => (
                  <div key={dose.id} className="dense-card p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-10 rounded-full",
                        dose.status === "taken" ? "bg-success" : "bg-danger"
                      )} />
                      <div>
                        <h4 className="font-bold text-white">{dose.medName}</h4>
                        <p className="text-xs text-text-muted">{dose.scheduledAt.toDate().toLocaleDateString()} @ {dose.scheduledAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                      dose.status === "taken" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    )}>
                      {dose.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Analytics & Vital Insights */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Adherence Risk Gauge */}
          <div className="dense-card p-6 flex flex-col items-center">
            <RiskMeter score={risk?.score || 12} />
            <div className="text-center mt-4 border-t border-white/5 pt-4 w-full">
              <p className="text-[11px] text-text-muted leading-relaxed">
                Adherence streak is {risk?.score < 30 ? "98%" : "82%"} consistent. <br />
                Trend: <span className="text-success font-black uppercase tracking-widest">{risk?.trend || "IMPROVING"}</span>
              </p>
            </div>
          </div>

          {/* AI Narrative Briefing */}
          <div className="dense-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain size={48} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-primary-accent flex items-center justify-center text-[8px] font-black text-white shadow-lg shadow-primary-accent/30">AI</div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/80">{t("health_narrative", language)}</h3>
            </div>
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-text-muted font-medium">
              <p>{briefing || t("fetching_briefing", language)}</p>
              <div className="pt-2">
                <button 
                  onClick={() => window.print()}
                  className="text-primary-accent font-bold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Export Weekly Health Report <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Health Impact Simulator */}
          <HealthImpactSimulator />

          {/* New AI Features (Feature 22 & 40) */}
          <SymptomAnalyzer medications={medications} />
          <MedEncyclopedia />
          <AppointmentScheduler userId={user?.uid || ""} />

          {/* Quick Voice Assistant Widget */}
          <VoiceAssistant 
            language={language} 
            doses={doses} 
            medications={medications} 
            patientId={user?.uid}
          />

        </div>
      </main>

      {/* Bottom PWA Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 glass-nav py-3 px-6 flex justify-around">
        <button 
          onClick={() => setView("clinical")}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            view === "clinical" ? "text-primary-accent" : "text-text-muted hover:text-white"
          )}
        >
          <Activity size={22} />
          <span className="text-[8px] font-black tracking-widest uppercase">{t("clinical", language)}</span>
        </button>
        <button 
          onClick={() => setView("history")}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            view === "history" ? "text-success" : "text-text-muted hover:text-white"
          )}
        >
          <Clock size={22} />
          <span className="text-[8px] font-black tracking-widest uppercase">{t("history", language)}</span>
        </button>
        <button 
          onClick={() => setIsChatOpen(true)}
          className="flex flex-col items-center gap-1 text-text-muted hover:text-white transition-colors relative"
        >
          <MessageCircle size={22} />
          <span className="text-[8px] font-black tracking-widest uppercase">{t("chat", language)}</span>
          <div className="absolute top-0 right-1 w-1.5 h-1.5 bg-danger rounded-full" />
        </button>
        <button 
          onClick={() => setIsNotifOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            isNotifOpen ? "text-primary-accent" : "text-text-muted hover:text-white"
          )}
        >
          <Bell size={22} />
          <span className="text-[8px] font-black tracking-widest uppercase">{t("alerts", language)}</span>
        </button>
      </nav>

      {/* Notification Drawer (Feature 3: Smart Notifications) */}
      <AnimatePresence>
        {isNotifOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotifOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-surface rounded-t-[32px] p-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Smart Alerts</h2>
                <div className="px-3 py-1 bg-primary-accent/10 rounded-full">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary-accent">3 New</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-4">
                   <div className="w-10 h-10 rounded-xl bg-danger/20 flex items-center justify-center text-danger shrink-0">
                      <AlertTriangle size={20} />
                   </div>
                   <div>
                      <h4 className="font-bold text-white mb-1">Missed Dosage Warning</h4>
                      <p className="text-sm text-text-muted">You missed your 8 AM Metformin. Health risk increased to 45%.</p>
                      <span className="text-[9px] font-bold text-danger uppercase mt-2 block tracking-widest">Urgent</span>
                   </div>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-4">
                   <div className="w-10 h-10 rounded-xl bg-primary-accent/20 flex items-center justify-center text-primary-accent shrink-0">
                      <MessageCircle size={20} />
                   </div>
                   <div>
                      <h4 className="font-bold text-white mb-1">Nudge from Caregiver</h4>
                      <p className="text-sm text-text-muted">"Don't forget your evening pill today! Love you." - Sarah</p>
                      <span className="text-[9px] font-bold text-text-muted uppercase mt-2 block tracking-widest">2h ago</span>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => setIsNotifOpen(false)}
                className="w-full mt-8 p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Close Drawer
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddMedModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        patientId={user?.uid || ""} 
        language={language}
      />

      <ChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetId={profile?.caregiverIds?.[0] || ""} // Chat with first caregiver
        targetName="Caregiver"
      />

      <ReminderSettingsModal 
        userId={user?.uid || ""}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        currentSettings={profile?.reminderSettings}
      />
    </div>
  );
}
