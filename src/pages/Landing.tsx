import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  Brain, Shield, Heart, Activity, ArrowRight, Zap, 
  Mic, Database, Cpu, Globe, Languages, Lock, 
  User, Users, Stethoscope, ChevronRight, Share2,
  Play, CheckCircle2, AlertCircle, Phone, Menu, X,
  Check, Smartphone, Info, BarChart3, Pill
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/utils";

const Nav = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  const dashboardPath = profile?.role === "patient" ? "/patient" : 
                        profile?.role === "caregiver" ? "/caregiver" : 
                        profile?.role === "doctor" ? "/doctor" : "/login";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-5 transition-all duration-500",
      isScrolled ? "bg-surface-main/95 backdrop-blur-xl border-b border-border-main py-3 sm:py-4" : "bg-transparent"
    )}>
      <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => navigate("/")}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,212,170,0.3)] shrink-0">
          <Brain size={20} className="sm:w-6 sm:h-6" />
        </div>
        <span className="text-lg sm:text-2xl font-display font-extrabold tracking-tighter text-text-primary uppercase italic whitespace-nowrap">CareMate</span>
      </div>
      
      <div className="hidden lg:flex items-center gap-8">
        <a href="#features" className="text-[10px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-colors">Features</a>
        <a href="#how-it-works" className="text-[10px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-colors">Protocol</a>
        <a href="#roles" className="text-[10px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-colors">Roles</a>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        {user ? (
          <button 
            onClick={() => navigate(dashboardPath)}
            className="btn-gradient px-4 sm:px-6 py-2 sm:py-2.5 text-[9px] sm:text-[11px] rounded-lg shadow-lg shadow-primary/20 shrink-0 whitespace-nowrap"
          >
            Dashboard
          </button>
        ) : (
          <>
            <button 
              onClick={() => navigate("/login")}
              className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary shrink-0"
            >
              Patient
            </button>
            <button 
              onClick={() => navigate("/login")}
              className="hidden sm:block text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary shrink-0"
            >
              Caregiver
            </button>
            <button 
              onClick={() => navigate("/login")}
              className="btn-gradient px-4 sm:px-6 py-2 sm:py-2.5 text-[9px] sm:text-[11px] rounded-lg shadow-lg shadow-primary/20 shrink-0 whitespace-nowrap"
            >
              Get Started
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

const Counter = ({ value, duration = 2 }: { value: string, duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  const numericValue = parseInt(value) || 0;
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = numericValue;
      if (start === end) {
        setCount(end);
        return;
      }
      
      let totalMiliseconds = duration * 1000;
      let incrementTime = totalMiliseconds / end;
      
      let timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, incrementTime);
      
      return () => clearInterval(timer);
    }
  }, [isInView, numericValue, duration]);

  return (
    <span ref={ref} className="font-mono">
      {count}{suffix}
    </span>
  );
};

const StatItem = ({ label, value }: any) => (
  <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center group border-x border-border-main first:border-l-0 last:border-r-0">
     <motion.span className="text-4xl md:text-6xl font-display font-black text-text-primary italic tracking-tighter mb-2">
       <Counter value={value} />
     </motion.span>
     <span className="text-[11px] font-bold uppercase tracking-[3px] text-text-secondary">{label}</span>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, color, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    whileHover={{ y: -8 }}
    className="p-8 glass rounded-2xl border border-border-main hover:border-primary/30 transition-all duration-300 group"
  >
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all group-hover:scale-110", color)}>
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-display font-bold text-text-primary mb-3 uppercase italic tracking-tight">{title}</h3>
    <p className="text-text-secondary text-sm leading-relaxed font-medium">
      {description}
    </p>
  </motion.div>
);

const WordCycle = () => {
  const words = ["Dose", "Reminder", "Refill", "Check-up"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="relative inline-grid place-items-start align-middle">
      <span className="invisible font-display font-black uppercase italic select-none pointer-events-none whitespace-nowrap">
        {words.reduce((a, b) => (a.length > b.length ? a : b))}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 w-full bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"patient" | "caregiver" | "doctor">("patient");
  const [activeAIFeature, setActiveAIFeature] = useState(0);

  const dashboardPath = profile?.role === "patient" ? "/patient" : 
                        profile?.role === "caregiver" ? "/caregiver" : 
                        profile?.role === "doctor" ? "/doctor" : "/login";

  const aiFeatures = [
    { title: "Drug Interaction Check", value: "Instant", icon: Share2 },
    { title: "Risk Score Engine", value: "Live 0-100", icon: Activity },
    { title: "Predictive Alerts", value: "Advanced", icon: AlertCircle },
    { title: "Voice Assistant", value: "Local", icon: Mic },
    { title: "Weekly Insights", value: "Narrative", icon: BarChart3 }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAIFeature((prev) => (prev + 1) % aiFeatures.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-bg-main text-text-primary selection:bg-primary/30 selection:text-white font-sans overflow-x-hidden transition-colors duration-300">
      <Nav />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-40 pb-20 px-6 md:px-12 flex items-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-ai/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute inset-0 opacity-[0.05]" 
               style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '60px 60px' }} 
          />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
          <div className="space-y-8">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="inline-flex items-center gap-3 px-4 py-1.5 bg-ai/20 border border-ai/30 rounded-full text-ai text-[10px] font-black uppercase tracking-[2px]"
            >
               🏆 BGI Hackathon 2026 — Viksit Bharat
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black leading-[1.1] uppercase italic"
            >
              <span className="block sm:inline mr-2 sm:mr-4">Never Miss A</span>
              <WordCycle />
              <span className="block sm:inline ml-2 sm:ml-4 mt-2 sm:mt-0">Again.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-lg md:text-xl text-text-secondary font-medium max-w-xl leading-relaxed"
            >
              AI-powered medication adherence for patients, caregivers and doctors. 
              Real-time monitoring, smart alerts, and personalized health insights — 
              all in one intelligent platform.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-wrap items-center gap-6"
            >
              <button 
                onClick={() => navigate(dashboardPath)}
                className="btn-gradient h-16 px-12 rounded-xl flex items-center justify-center gap-4 italic"
              >
                {user ? "Back to Dashboard" : "Start Free Today"} <ArrowRight size={20} />
              </button>
              
              <button className="flex items-center gap-3 text-[12px] font-black uppercase tracking-[2px] text-text-secondary hover:text-text-primary transition-colors italic group border-b border-white/10 pb-1">
                <Play size={18} className="fill-current" /> Watch Demo
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-8 pt-4"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                <Zap size={14} className="text-primary" /> Works Offline
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                <Brain size={14} className="text-ai" /> 29 AI Features
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                <Globe size={14} className="text-secondary" /> Hindi + English
              </div>
            </motion.div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            {/* Phone Mockup */}
            <motion.div 
               initial={{ opacity: 0, rotate: 5, scale: 0.9 }}
               animate={{ opacity: 1, rotate: 0, scale: 1 }}
               transition={{ duration: 1 }}
               className="relative w-[300px] h-[600px] bg-[#111] rounded-[40px] border-[8px] border-[#222] shadow-[0_0_80px_rgba(0,212,170,0.15)] overflow-hidden floating"
            >
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#222] rounded-b-2xl z-20" />
               <div className="p-6 pt-12 space-y-6">
                  <div className="flex justify-between items-center text-xs opacity-50">
                    <span>9:41 AM</span>
                    <Activity size={14} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Good Morning, Sunita 👋</h4>
                    <p className="text-[10px] text-white/40">You have 3 doses today.</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "Metformin", time: "8:00 AM", color: "border-primary", status: "Taken" },
                      { name: "Lisinopril", time: "1:00 PM", color: "border-warning", status: "Upcoming" },
                      { name: "Aspirin", time: "8:00 PM", color: "border-secondary", status: "Night" }
                    ].map((med, i) => (
                      <div key={i} className={cn("p-4 bg-bg-main border-l-4 rounded-r-xl flex items-center justify-between border-border-main", med.color)}>
                         <div className="flex items-center gap-3">
                           <Pill size={16} className="text-text-secondary opacity-60" />
                           <div>
                             <p className="text-xs font-bold text-text-primary">{med.name}</p>
                             <p className="text-[9px] text-text-secondary opacity-60">{med.time}</p>
                           </div>
                         </div>
                         <div className="text-[9px] font-bold text-text-secondary opacity-50">{med.status}</div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full h-12 bg-primary text-black rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
                    Mark as Taken <Check size={14} />
                  </button>

                  <div className="p-4 bg-bg-main rounded-2xl border border-border-main text-center">
                    <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-1 opacity-60">Risk Score</p>
                    <p className="text-2xl font-mono font-bold text-primary">72<span className="text-xs opacity-40 ml-1 text-text-secondary">Moderate</span></p>
                  </div>
               </div>
            </motion.div>

            {/* Floating Notification Cards */}
             <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="absolute right-0 sm:-right-6 top-[15%] sm:top-1/4 glass p-3 sm:p-4 rounded-xl border-l-4 border-primary flex items-center gap-3 shadow-2xl z-20 scale-90 sm:scale-100"
             >
               <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                 <CheckCircle2 size={16} />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-white">Metformin taken</p>
                 <p className="text-[9px] text-white/40">8:02 AM Today</p>
               </div>
            </motion.div>

             <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute left-0 sm:-left-12 bottom-[15%] sm:bottom-1/4 glass p-3 sm:p-4 rounded-xl border-l-4 border-warning flex items-center gap-3 shadow-2xl z-20 scale-90 sm:scale-100"
             >
               <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning">
                 <AlertCircle size={16} />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-white">Lisinopril due</p>
                 <p className="text-[9px] text-white/40">in 15 minutes</p>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-surface-main border-y border-border-main relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5 text-center">
           <StatItem label="Indians Affected by Adherence" value="50Cr+" />
           <StatItem label="AI-Powered Features" value="29" />
           <StatItem label="User Roles Supported" value="3" />
           <StatItem label="Core Runtime Offline" value="100%" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20">
           <span className="text-primary text-[10px] font-black uppercase tracking-[5px]">Everything Your Health Needs</span>
           <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic">Advanced Core Matrix</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <FeatureCard 
             icon={Mic}
             color="bg-primary/20 text-primary"
             title="Voice AI Assistant"
             description="Talk to your health companion naturally in Hindi or English."
             delay={0.1}
           />
           <FeatureCard 
             icon={Share2}
             color="bg-secondary/20 text-secondary"
             title="Drug Interaction Checker"
             description="Instant safety analysis for over 5,000+ medication combinations."
             delay={0.2}
           />
           <FeatureCard 
             icon={AlertCircle}
             color="bg-warning/20 text-warning"
             title="Predictive Alerts"
             description="AI warns caregivers 24h before doses are potentially missed."
             delay={0.3}
           />
           <FeatureCard 
             icon={Activity}
             color="bg-ai/20 text-ai"
             title="Risk Score Engine"
             description="Dynamic 0–100 health risk monitoring based on past adherence."
             delay={0.4}
           />
           <FeatureCard 
             icon={BarChart3}
             color="bg-safe/20 text-safe"
             title="Weekly AI Reports"
             description="Personalized narrative health insights delivered every Sunday."
             delay={0.5}
           />
           <FeatureCard 
             icon={Zap}
             color="bg-info/20 text-info"
             title="Works Offline"
             description="Core medication tracking works without an internet connection."
             delay={0.6}
           />
           <FeatureCard 
             icon={Languages}
             color="bg-primary/20 text-primary"
             title="Hindi Support"
             description="Optimized for Hinglish colloquialisms used in everyday care."
             delay={0.7}
           />
           <FeatureCard 
             icon={Pill}
             color="bg-critical/20 text-critical"
             title="Refill Tracker"
             description="Smart predictive inventory management for your medications."
             delay={0.8}
           />
           <FeatureCard 
             icon={Users}
             color="bg-secondary/20 text-secondary"
             title="Family Monitoring"
             description="One centralized dashboard to manage health for your whole family."
             delay={0.9}
           />
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 px-6 md:px-12 bg-surface-main/50 border-y border-border-main">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-primary text-[10px] font-black uppercase tracking-[5px]">Simple for Everyone</span>
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic">System Protocol</h2>
          </div>

          <div className="flex justify-center gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
            {[
              { id: "patient", icon: User, label: "Patient" },
              { id: "caregiver", icon: Users, label: "Caregiver" },
              { id: "doctor", icon: Stethoscope, label: "Doctor" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  activeTab === tab.id ? "bg-primary text-black" : "text-text-secondary hover:bg-white/5"
                )}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
              >
                {activeTab === "patient" && [
                  { step: "01", icon: Pill, title: "Add Schedule", desc: "List your medications and timing once." },
                  { step: "02", icon: Zap, title: "Get Reminders", desc: "Receive smart pulses at the exact moment." },
                  { step: "03", icon: Check, title: "Confirm Dose", desc: "One tap to verify you've taken your pill." },
                  { step: "04", icon: BarChart3, title: "AI Insights", desc: "Review your performance and risk level." }
                ].map((step, i) => (
                  <div key={i} className="p-8 glass rounded-2xl flex gap-6 group hover:border-primary/20 transition-all">
                    <span className="text-3xl font-mono font-black text-primary/30 group-hover:text-primary transition-colors">{step.step}</span>
                    <div className="space-y-2">
                       <h4 className="text-md font-bold text-white uppercase italic">{step.title}</h4>
                       <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
                
                {activeTab === "caregiver" && [
                   { step: "01", icon: Share2, title: "Link Accounts", desc: "Connect securely to your patient via code." },
                   { step: "02", icon: Activity, title: "Monitor Live", desc: "See adherence status as it happens." },
                   { step: "03", icon: AlertCircle, title: "Smart Alerts", desc: "Get notified only when intervention is needed." },
                   { step: "04", icon: Mic, title: "Voice Logs", desc: "Review patient voice health updates." }
                ].map((step, i) => (
                  <div key={i} className="p-8 glass rounded-2xl flex gap-6 group hover:border-secondary/20 transition-all">
                    <span className="text-3xl font-mono font-black text-secondary/30 group-hover:text-secondary transition-colors">{step.step}</span>
                    <div className="space-y-2">
                       <h4 className="text-md font-bold text-white uppercase italic">{step.title}</h4>
                       <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}

                {activeTab === "doctor" && [
                   { step: "01", icon: Activity, title: "Risk Scores", desc: "Instantly see patient health volatility scores." },
                   { step: "02", icon: BarChart3, title: "AI Summaries", desc: "Get pre-appointment narrative reports." },
                   { step: "03", icon: Pill, title: "Digital Meds", desc: "Adjust and manage prescriptions remotely." },
                   { step: "04", icon: Shield, title: "Verify Compliance", desc: "Track exact treatment effectiveness." }
                ].map((step, i) => (
                  <div key={i} className="p-8 glass rounded-2xl flex gap-6 group hover:border-ai/20 transition-all">
                    <span className="text-3xl font-mono font-black text-ai/30 group-hover:text-ai transition-colors">{step.step}</span>
                    <div className="space-y-2">
                       <h4 className="text-md font-bold text-white uppercase italic">{step.title}</h4>
                       <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-12">
          <div className="space-y-4">
            <span className="text-primary text-[10px] font-black uppercase tracking-[5px]">Human-Machine Interface</span>
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic">AI Deep Analysis</h2>
          </div>

          <div className="space-y-4">
            {aiFeatures.map((f, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-6 rounded-2xl border transition-all duration-500 cursor-default flex items-center justify-between group",
                  activeAIFeature === i ? "bg-white/5 border-primary shadow-[0_0_30px_rgba(0,212,170,0.1)]" : "bg-transparent border-white/5 hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center gap-6">
                  <f.icon size={24} className={activeAIFeature === i ? "text-primary" : "text-text-secondary"} />
                  <div>
                    <h4 className={cn("text-lg font-bold uppercase italic", activeAIFeature === i ? "text-white" : "text-text-secondary")}>{f.title}</h4>
                    <p className="text-xs text-text-secondary">{f.value} Processing</p>
                  </div>
                </div>
                {activeAIFeature === i && <Zap size={16} className="text-primary animate-pulse" />}
              </div>
            ))}
          </div>
        </div>

        <div className="mockup-side h-[600px] glass rounded-[40px] p-8 border-white/5 flex items-center justify-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
           
           <AnimatePresence mode="wait">
             <motion.div
               key={activeAIFeature}
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 1.1, y: -20 }}
               className="w-full space-y-8 relative z-10"
             >
                {activeAIFeature === 1 && (
                  <div className="space-y-8 text-center">
                    <div className="w-32 h-32 rounded-full border-[10px] border-primary/20 border-t-primary mx-auto animate-spin" />
                    <div className="space-y-2">
                       <h3 className="text-4xl font-mono font-black text-white">72<span className="text-lg opacity-40 ml-2">/100</span></h3>
                       <p className="text-xs uppercase tracking-[4px] text-primary">Live Risk Assessment</p>
                    </div>
                  </div>
                )}
                {activeAIFeature === 0 && (
                   <div className="glass p-6 rounded-2xl space-y-4 border-l-4 border-primary">
                      <div className="flex gap-4">
                        <AlertCircle className="text-primary" />
                        <h4 className="font-bold">Interaction Detected</h4>
                      </div>
                      <p className="text-sm text-white/60">Metformin + Aspirin detected. System monitoring for gastrointestinal sensitivity.</p>
                   </div>
                )}
                {activeAIFeature === 4 && (
                   <div className="space-y-4">
                      <div className="h-2 w-1/2 bg-primary/20 rounded-full" />
                      <div className="h-2 w-full bg-white/10 rounded-full" />
                      <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                      <p className="text-xs italic text-text-secondary italic">"Sunita has maintained a perfect 100% adherence score this week. Her risk score has dropped by 12 points since Monday..."</p>
                   </div>
                )}
                {/* Visual fallbacks for others */}
                {[2, 3].includes(activeAIFeature) && (
                   <div className="flex flex-col items-center gap-6">
                      <div className="w-48 h-48 rounded-full bg-primary/5 flex items-center justify-center">
                        <Cpu size={80} className="text-primary/20 animate-pulse" />
                      </div>
                      <div className="font-mono text-xs text-primary animate-pulse tracking-[8px] uppercase">Processing Data...</div>
                   </div>
                )}
             </motion.div>
           </AnimatePresence>
        </div>
      </section>

      {/* Three Roles Section */}
      <section id="roles" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20">
           <span className="text-secondary text-[10px] font-black uppercase tracking-[5px]">Built for Everyone</span>
           <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic">Ecosystem Access</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-10 glass rounded-3xl border border-primary/10 hover:border-primary/40 transition-all flex flex-col items-start gap-8 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                <User size={32} />
              </div>
              <h3 className="text-3xl font-display font-black italic uppercase">For Patients</h3>
              <ul className="space-y-4 flex-1">
                {['Voice reminders', 'Drug interaction alerts', 'Self risk monitoring', 'Offline pill logging', 'Medical document vault'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                    <CheckCircle2 size={14} className="text-primary" /> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate("/login")}
                className="w-full h-14 bg-primary/10 border border-primary/20 text-primary rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-primary hover:text-black transition-all"
              >
                I'm a Patient
              </button>
           </div>

           <div className="p-10 glass rounded-3xl border border-secondary/20 hover:border-secondary/50 transition-all flex flex-col items-start gap-8 group scale-105 shadow-2xl z-10 bg-dark-elevated">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-black transition-all">
                <Users size={32} />
              </div>
              <h3 className="text-3xl font-display font-black italic uppercase">For Caregivers</h3>
              <ul className="space-y-4 flex-1">
                {['Real-time tracking', 'Predictive alerts', 'Voice broadcast', 'Adherence sync', 'Emergency escalation'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                    <CheckCircle2 size={14} className="text-secondary" /> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate("/login")}
                className="w-full h-14 bg-secondary text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:shadow-[0_0_20px_rgba(79,142,247,0.4)] transition-all"
              >
                I'm a Caregiver
              </button>
           </div>

           <div className="p-10 glass rounded-3xl border border-ai/10 hover:border-ai/40 transition-all flex flex-col items-start gap-8 group">
              <div className="w-16 h-16 rounded-2xl bg-ai/10 flex items-center justify-center text-ai group-hover:bg-ai group-hover:text-black transition-all">
                <Stethoscope size={32} />
              </div>
              <h3 className="text-3xl font-display font-black italic uppercase">For Doctors</h3>
              <ul className="space-y-4 flex-1">
                {['Volatility heatmaps', 'Adherence scoring', 'Prescription portal', 'AI pre-charting', 'Telemetry export'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                    <CheckCircle2 size={14} className="text-ai" /> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate("/login")}
                className="w-full h-14 bg-ai/10 border border-ai/20 text-ai rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-ai hover:text-black transition-all"
              >
                I'm a Doctor
              </button>
           </div>
        </div>
      </section>

      {/* Offline Capability */}
      <section className="py-32 px-6 md:px-12 bg-dark-secondary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
             <h2 className="text-5xl md:text-7xl font-display font-black uppercase italic leading-[0.9]">Works Even Without <br /> Internet.</h2>
             <p className="text-text-secondary text-lg leading-relaxed font-medium">
               Leveraging advanced PWA caching and local-first data architecture. 
               The core medication tracker remains operational in zero-connectivity 
               environments common in rural stretches.
             </p>
             <div className="space-y-4">
                {['Local pill logging', 'Offline smart reminders', 'Encrypted local storage'].map(item => (
                   <div key={item} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-primary">
                      <Check size={18} /> {item}
                   </div>
                ))}
             </div>
             <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                <Smartphone size={16} className="text-primary" /> Install like a native app — no Play Store needed
             </div>
          </div>
          
          <div className="relative">
            <div className="w-full max-w-sm aspect-[9/16] glass rounded-[3rem] p-1 border-white/10 overflow-hidden shadow-2xl mx-auto">
               <div className="w-full h-full bg-[#111] p-8 space-y-6 pt-12">
                  <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span>Offline Mode</span>
                    <Globe size={14} className="opacity-20" />
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                    <CheckCircle2 className="text-primary" />
                    <div className="text-xs font-bold text-white uppercase italic">System Ready</div>
                  </div>
                  <div className="h-[2px] w-full bg-white/5" />
                  <div className="space-y-4 opacity-40">
                    <div className="h-10 w-full bg-white/5 rounded-xl" />
                    <div className="h-10 w-full bg-white/5 rounded-xl" />
                    <div className="h-10 w-full bg-white/5 rounded-xl" />
                  </div>
               </div>
            </div>
            <div className="absolute -bottom-10 -right-10 glass p-6 rounded-2xl border-l-4 border-primary shadow-2xl max-w-[240px]">
               <p className="text-[10px] font-black italic uppercase text-primary mb-2">PWA_PROTOCOL_ENABLED</p>
               <p className="text-xs text-text-secondary">Data syncs to cloud automatically once LTE/Wifi is detected.</p>
            </div>
          </div>
        </div>
      </section>

      {/* India Focus Section */}
      <section className="py-40 px-6 md:px-12 relative overflow-hidden bg-black">
         <div className="absolute inset-0 opacity-[0.05] grayscale z-0">
           <Globe size={800} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
         </div>
         <div className="max-w-4xl mx-auto text-center space-y-16 relative z-10">
            <div className="space-y-4">
              <span className="text-primary text-[10px] font-black uppercase tracking-[5px] italic">Built for Bharat</span>
              <h2 className="text-4xl md:text-7xl font-display font-black uppercase italic">Designed for India's <br /> Healthcare Reality</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="p-8 glass rounded-2xl border border-white/5 space-y-4">
                  <div className="text-4xl">🇮🇳</div>
                  <h4 className="font-bold uppercase italic text-white">Full Bilingual</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">System-wide support for Hindi and English interfaces.</p>
               </div>
               <div className="p-8 glass rounded-2xl border border-white/5 space-y-4">
                  <div className="text-4xl">📶</div>
                  <h4 className="font-bold uppercase italic text-white">Offline First</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">Optimized for low-bandwidth environments.</p>
               </div>
               <div className="p-8 glass rounded-2xl border border-white/5 space-y-4">
                  <div className="text-4xl">👴</div>
                  <h4 className="font-bold uppercase italic text-white">Senior Friendly</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">High contrast mode and voice-first interaction.</p>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-40 px-6 md:px-12 text-center bg-gradient-to-b from-dark-primary to-primary/20">
         <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-display font-black uppercase italic leading-[1.1] sm:leading-[0.8]">Start Your Free <br /> Health Journey.</h2>
            <p className="text-base md:text-xl text-text-secondary font-medium">No downloads. No payment. Works on any device.</p>
            <button 
              onClick={() => navigate(dashboardPath)}
              className="btn-gradient h-16 sm:h-20 px-10 sm:px-16 rounded-2xl text-base sm:text-lg flex items-center justify-center gap-4 italic mx-auto"
            >
              {user ? "Go to Dashboard" : "Get Started Free"} <ArrowRight size={24} />
            </button>
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">PWA — Install directly from browser</p>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 md:px-12 bg-black border-t border-white/5">
         <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-24">
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black">
                      <Brain size={24} />
                    </div>
                    <span className="text-3xl font-display font-extrabold tracking-tighter text-text-primary uppercase italic">CareMate AI</span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                    Your Intelligent Medication Companion. Solving medication non-adherence in India with AI.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <p className="text-[11px] font-black uppercase tracking-widest text-white italic">Protocol</p>
                     <ul className="space-y-3">
                        {['Features', 'Privacy', 'Security', 'Sync'].map(link => (
                          <li key={link}><a href="#" className="text-text-secondary text-xs hover:text-primary transition-colors">{link}</a></li>
                        ))}
                     </ul>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[11px] font-black uppercase tracking-widest text-white italic">Roles</p>
                     <ul className="space-y-3">
                        {['Patient', 'Caregiver', 'Doctor', 'Pharmacy'].map(link => (
                          <li key={link}><a href="#" className="text-text-secondary text-xs hover:text-primary transition-colors">{link}</a></li>
                        ))}
                     </ul>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="space-y-2">
                     <p className="text-[11px] font-black uppercase tracking-widest text-white italic">Event Spotlight</p>
                     <p className="text-xs text-text-secondary">Built for BGI Hackathon 2026</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary transition-colors cursor-pointer">
                        <Share2 size={18} />
                     </div>
                     <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary transition-colors cursor-pointer">
                        <Globe size={18} />
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">System Status: 100.0% Optimal</span>
               </div>

               <p className="text-[11px] font-bold text-text-secondary uppercase tracking-[4px]">Powered by Groq AI + Firebase</p>

               <div className="flex gap-8">
                  <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-white transition-colors">Terms</a>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
