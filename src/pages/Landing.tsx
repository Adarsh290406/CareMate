import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  Brain, Shield, Heart, Activity, ArrowRight, Zap, 
  Mic, Database, Cpu, Globe, Languages, Lock, 
  User, Users, Stethoscope, ChevronRight, Share2,
  Play, CheckCircle2, AlertCircle, Phone, Menu, X,
  Check, Smartphone, Info, BarChart3, Pill, Bell
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
      "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-3 md:px-4 py-4 transition-all duration-500",
      isScrolled ? "bg-surface-main/95 backdrop-blur-xl border-b border-border-main py-2.5 sm:py-3" : "bg-transparent"
    )}>
      <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => navigate("/")}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,212,170,0.3)] shrink-0">
          <Brain size={20} className="sm:w-6 sm:h-6" />
        </div>
        <span className="text-lg sm:text-2xl font-display font-extrabold tracking-tighter text-text-primary uppercase italic whitespace-nowrap">CareMate</span>
      </div>
      
      <div className="hidden lg:flex items-center gap-8">
        <a href="#features" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-colors">Features</a>
        <a href="#how-it-works" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-colors">Protocol</a>
        <a href="#roles" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-colors">Roles</a>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        {user ? (
          <button 
            onClick={() => navigate(dashboardPath)}
            className="btn-gradient px-4 sm:px-3 py-2 sm:py-2.5 text-[9px] sm:text-[11px] rounded-lg shadow-lg shadow-primary/20 shrink-0 whitespace-nowrap"
          >
            Dashboard
          </button>
        ) : (
          <>
            <button 
              onClick={() => navigate("/login")}
              className="text-[11px] font-extrabold uppercase tracking-widest text-text-secondary hover:text-text-primary shrink-0"
            >
              Patient
            </button>
            <button 
              onClick={() => navigate("/login")}
              className="hidden sm:block text-[11px] font-extrabold uppercase tracking-widest text-text-secondary hover:text-text-primary shrink-0"
            >
              Caregiver
            </button>
            <button 
              onClick={() => navigate("/login")}
              className="btn-gradient px-4 sm:px-3 py-2 sm:py-2.5 text-[11px] rounded-lg shadow-lg shadow-primary/20 shrink-0 whitespace-nowrap"
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
  <div className="p-6 md:p-10 flex flex-col items-center justify-center text-center group border-x border-border-main first:border-l-0 last:border-r-0">
     <motion.span className="text-4xl md:text-6xl font-display font-extrabold text-text-primary italic tracking-tighter mb-2">
       <Counter value={value} />
     </motion.span>
     <span className="text-[11px] font-bold uppercase tracking-[3px] text-text-secondary/90">{label}</span>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, color, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="p-6 glass rounded-2xl border border-border-main hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group cursor-default"
  >
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-110", color)}>
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-display font-bold text-text-primary mb-2 uppercase italic tracking-tight">{title}</h3>
    <p className="text-text-secondary text-[13px] leading-relaxed font-medium">
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
      <span className="invisible font-display font-extrabold uppercase italic select-none pointer-events-none whitespace-nowrap">
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
  const [activeRole, setActiveRole] = useState(1);

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
      <section className="relative min-h-[80vh] pt-24 pb-8 px-3 md:px-4 flex items-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-ai/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute inset-0 opacity-[0.05]" 
               style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '60px 60px' }} 
          />
        </div>

        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center z-10">
          <div className="space-y-8">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="inline-flex items-center gap-3 px-4 py-1.5 bg-ai/20 border border-ai/30 rounded-full text-ai text-[11px] font-extrabold uppercase tracking-[2px]"
            >
               🏆 BGI Hackathon 2026 — Viksit Bharat
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-[1.1] uppercase italic tracking-tight max-w-4xl"
            >
              <span className="block mb-2">Protect Every</span>
              <div className="flex flex-wrap items-center gap-x-3">
                <WordCycle />
                <span className="">With Love.</span>
              </div>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-lg md:text-xl text-text-secondary/90 font-medium max-w-xl leading-relaxed"
            >
              Because your health is more than just a schedule. 
              CareMate is a companion that brings families and doctors 
              together, ensuring your loved ones are safe, supported, and never alone.
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
              
              <button className="flex items-center gap-3 text-[12px] font-extrabold uppercase tracking-[2px] text-text-secondary hover:text-text-primary transition-colors italic group border-b border-text-secondary/30 pb-1">
                <Play size={18} className="fill-current" /> Watch Demo
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-8 pt-4"
            >
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary uppercase tracking-widest">
                <Zap size={14} className="text-primary" /> Works Offline
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary uppercase tracking-widest">
                <Brain size={14} className="text-ai" /> 29 AI Features
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary uppercase tracking-widest">
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
                    <p className="text-[11px] text-white/70">You have 3 doses today.</p>
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
                             <p className="text-[10px] text-text-secondary/80 font-bold">{med.time}</p>
                           </div>
                         </div>
                         <div className="text-[10px] font-bold text-text-secondary/70">{med.status}</div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full h-12 bg-primary text-black rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
                    Mark as Taken <Check size={14} />
                  </button>

                  <div className="p-4 bg-bg-main rounded-2xl border border-border-main text-center">
                    <p className="text-[11px] text-text-secondary uppercase tracking-widest mb-1 opacity-80">Risk Score</p>
                    <p className="text-2xl font-mono font-bold text-primary">72<span className="text-xs opacity-60 ml-1 text-text-secondary">Moderate</span></p>
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
                  <p className="text-[11px] font-bold text-white">Metformin taken</p>
                  <p className="text-[10px] text-white/70">8:02 AM Today</p>
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
                  <p className="text-[11px] font-bold text-white">Lisinopril due</p>
                  <p className="text-[10px] text-white/70">in 15 minutes</p>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-surface-main border-y border-white/5 relative z-20 py-1 sm:py-0">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5 text-center">
           <StatItem label="Families We Support" value="50Cr+" />
           <StatItem label="Care-First Features" value="29" />
           <StatItem label="Support Networks" value="3" />
           <StatItem label="Always Reliable" value="100%" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-12 px-3 md:px-4 max-w-[1440px] mx-auto">
        <div className="text-center space-y-4 mb-8">
           <span className="text-primary text-[11px] font-extrabold uppercase tracking-[5px]">Complete Care Ecosystem</span>
           <h2 className="text-4xl md:text-6xl font-display font-extrabold uppercase italic">Every detail, <br /> handled with care</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <FeatureCard 
              icon={Mic}
              color="bg-primary/20 text-primary"
              title="Voice Companion"
              description="Talk naturally in Hindi or English. It's like having a helpful friend by your side."
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
              title="Protective Alerts"
              description="Caregivers are notified gently before a dose is missed, ensuring safety."
              delay={0.3}
            />
           <FeatureCard 
              icon={Activity}
              color="bg-ai/20 text-ai"
              title="Safety Monitoring"
              description="A dynamic view of health progress, helping you stay on the right track."
              delay={0.4}
            />
           <FeatureCard 
              icon={BarChart3}
              color="bg-safe/20 text-safe"
              title="Weekly Progress"
              description="A gentle summary of your health journey delivered every Sunday."
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
      <section id="how-it-works" className="py-12 px-3 md:px-4 bg-surface-main/30 border-y border-white/5">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <span className="text-primary text-[11px] font-extrabold uppercase tracking-[5px]">Simple for Everyone</span>
            <h2 className="text-4xl md:text-6xl font-display font-extrabold uppercase italic">A simple journey <br /> to wellness</h2>
          </div>

          <div className="flex justify-center p-1.5 bg-bg-main/80 backdrop-blur-md rounded-2xl border border-white/5 max-w-2xl mx-auto">
            {[
              { id: "patient", icon: User, label: "Patient" },
              { id: "caregiver", icon: Users, label: "Caregiver" },
              { id: "doctor", icon: Stethoscope, label: "Doctor" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest transition-all duration-300 relative overflow-hidden group",
                  activeTab === tab.id ? "text-black" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary shadow-xl shadow-primary/20"
                  />
                )}
                <tab.icon size={16} className="relative z-10" /> 
                <span className="relative z-10">{tab.label}</span>
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
                  <div key={i} className="p-8 glass rounded-3xl flex flex-col gap-6 group hover:border-primary/20 transition-all hover:bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                       <span className="text-4xl font-display font-extrabold italic text-primary/20 group-hover:text-primary/40 transition-colors">{step.step}</span>
                       <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <step.icon size={22} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xl font-bold text-text-primary uppercase italic tracking-tight">{step.title}</h4>
                       <p className="text-[14px] text-text-secondary leading-relaxed font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}
                
                {activeTab === "caregiver" && [
                   { step: "01", icon: Share2, title: "Link Accounts", desc: "Connect securely to your patient via code." },
                   { step: "02", icon: Activity, title: "Monitor Live", desc: "See adherence status as it happens." },
                   { step: "03", icon: AlertCircle, title: "Smart Alerts", desc: "Get notified only when intervention is needed." },
                   { step: "04", icon: Mic, title: "Voice Logs", desc: "Review patient voice health updates." }
                ].map((step, i) => (
                  <div key={i} className="p-8 glass rounded-3xl flex flex-col gap-6 group hover:border-secondary/20 transition-all hover:bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                       <span className="text-4xl font-display font-extrabold italic text-secondary/20 group-hover:text-secondary/40 transition-colors">{step.step}</span>
                       <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                          <step.icon size={22} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xl font-bold text-text-primary uppercase italic tracking-tight">{step.title}</h4>
                       <p className="text-[14px] text-text-secondary leading-relaxed font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}

                {activeTab === "doctor" && [
                   { step: "01", icon: Activity, title: "Health Trends", desc: "Instantly see patient adherence and health trends." },
                   { step: "02", icon: BarChart3, title: "Patient Reports", desc: "Get pre-appointment summaries of patient progress." },
                   { step: "03", icon: Pill, title: "Remote Care", desc: "Adjust and manage prescriptions with confidence." },
                   { step: "04", icon: Shield, title: "Better Outcomes", desc: "Track treatment effectiveness with real data." }
                ].map((step, i) => (
                  <div key={i} className="p-8 glass rounded-3xl flex flex-col gap-6 group hover:border-ai/20 transition-all hover:bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                       <span className="text-4xl font-display font-extrabold italic text-ai/20 group-hover:text-ai/40 transition-colors">{step.step}</span>
                       <div className="w-12 h-12 rounded-2xl bg-ai/10 flex items-center justify-center text-ai group-hover:scale-110 transition-transform">
                          <step.icon size={22} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xl font-bold text-text-primary uppercase italic tracking-tight">{step.title}</h4>
                       <p className="text-[14px] text-text-secondary leading-relaxed font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="py-12 px-3 md:px-4 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center border-t border-white/5">
        <div className="space-y-12">
          <div className="space-y-4 max-w-xl">
            <span className="text-primary text-[11px] font-extrabold uppercase tracking-[5px]">Helpful Insights</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold uppercase italic leading-[1.1] tracking-tight">
              Understanding <br className="hidden sm:block" /> Your Health
            </h2>
          </div>

          <div className="space-y-4">
            {aiFeatures.map((f, i) => (
              <div 
                key={i} 
                onClick={() => setActiveAIFeature(i)}
                className={cn(
                  "p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between group relative overflow-hidden",
                  activeAIFeature === i 
                    ? "bg-primary/10 border-primary shadow-[0_0_40px_rgba(0,212,170,0.15)] scale-[1.02]" 
                    : "bg-transparent border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                )}
              >
                {activeAIFeature === i && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <div className="flex items-center gap-6">
                  <f.icon size={24} className={activeAIFeature === i ? "text-primary" : "text-text-secondary"} />
                  <div>
                    <h4 className={cn("text-lg font-bold uppercase italic", activeAIFeature === i ? "text-text-primary" : "text-text-secondary")}>{f.title}</h4>
                    <p className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider">
                      {i === 0 ? "Real-time Safety Check" : 
                       i === 1 ? "Predictive Analysis" : 
                       i === 2 ? "Safety Network" : 
                       i === 3 ? "Multilingual Voice" : "Health Progress"}
                    </p>
                  </div>
                </div>
                {activeAIFeature === i && <Zap size={16} className="text-primary animate-pulse" />}
              </div>
            ))}
          </div>
        </div>

        <div className="mockup-side h-[600px] bg-surface-main/40 backdrop-blur-2xl rounded-[3rem] p-12 border border-white/5 flex items-center justify-center relative overflow-hidden group shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
           <div className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none" 
                style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '24px 24px' }} 
           />
           
           <AnimatePresence mode="wait">
             <motion.div
               key={activeAIFeature}
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 1.1, y: -20 }}
               className="w-full h-full flex items-center justify-center relative z-10 p-4"
             >
                {activeAIFeature === 0 && (
                   <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="glass p-10 rounded-[2.5rem] space-y-8 border-l-[6px] border-primary bg-bg-main/60 shadow-2xl w-full max-w-md">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                           <AlertCircle className="text-primary" size={24} />
                        </div>
                        <div>
                           <h4 className="font-extrabold text-text-primary uppercase italic">Interaction Guard</h4>
                           <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Safety Priority</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                         <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <span className="text-xs font-bold text-text-primary">Metformin</span>
                            <span className="text-[10px] text-text-secondary uppercase">Morning</span>
                         </div>
                         <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <span className="text-xs font-bold text-text-primary">Aspirin</span>
                            <span className="text-[10px] text-text-secondary uppercase">Evening</span>
                         </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed font-medium bg-primary/5 p-4 rounded-xl border border-primary/10">
                        "System monitoring for gastrointestinal sensitivity. No immediate contraindication, but increased observation recommended."
                      </p>
                   </motion.div>
                )}

                {activeAIFeature === 1 && (
                  <div className="space-y-12 text-center">
                    <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                       <svg className="w-full h-full -rotate-90">
                          <circle cx="128" cy="128" r="110" className="stroke-white/5 fill-none" strokeWidth="16" />
                          <motion.circle 
                            cx="128" cy="128" r="110" 
                            className="stroke-primary fill-none" 
                            strokeWidth="16" 
                            strokeDasharray="690.8"
                            initial={{ strokeDashoffset: 690.8 }}
                            animate={{ strokeDashoffset: 690.8 * 0.28 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                          />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <h3 className="text-7xl font-display font-extrabold italic text-text-primary">72</h3>
                          <p className="text-[12px] font-extrabold uppercase tracking-[5px] text-primary">Safe Score</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 w-full max-w-md mx-auto">
                       <div className="p-6 glass rounded-[2rem] text-center space-y-2">
                          <p className="text-3xl font-bold text-text-primary">85%</p>
                          <p className="text-[10px] text-text-secondary uppercase font-extrabold tracking-widest">Adherence</p>
                       </div>
                       <div className="p-6 glass rounded-[2rem] text-center space-y-2">
                          <p className="text-3xl font-bold text-text-primary">12pt</p>
                          <p className="text-[10px] text-text-secondary uppercase font-extrabold tracking-widest">Growth</p>
                       </div>
                    </div>
                  </div>
                )}

                {activeAIFeature === 2 && (
                   <div className="relative w-full max-w-md space-y-8">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[11px] font-extrabold uppercase tracking-[4px] text-primary">Safety Network</span>
                         <span className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                           <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" /> Live Scan
                         </span>
                      </div>
                      {[1, 2, 3].map((_, i) => (
                         <motion.div 
                           key={i}
                           initial={{ x: -30, opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           transition={{ delay: i * 0.15 }}
                           className="p-6 glass rounded-[2rem] flex items-center gap-6 border-l-[6px] border-primary"
                         >
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                               <Shield size={24} />
                            </div>
                            <div className="flex-1">
                               <p className="text-sm font-extrabold text-text-primary uppercase italic">{i === 0 ? "Vital Anomaly Detected" : i === 1 ? "Pattern Recognition" : "Safety Check"}</p>
                               <p className="text-[11px] text-text-secondary font-medium">{i === 0 ? "Blood pressure slightly elevated" : i === 1 ? "Medication window approaching" : "All systems normal"}</p>
                            </div>
                         </motion.div>
                      ))}
                   </div>
                )}

                {activeAIFeature === 3 && (
                   <div className="space-y-16 text-center w-full max-w-md">
                      <div className="flex items-center justify-center gap-2.5 h-32">
                         {[...Array(15)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ 
                                height: [30, 90, 45, 110, 30][(i + Math.floor(Math.random() * 5)) % 5],
                                opacity: [0.4, 1, 0.6, 1, 0.4][(i + Math.floor(Math.random() * 5)) % 5]
                              }}
                              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: i * 0.05 }}
                              className="w-2 bg-primary rounded-full shadow-[0_0_25px_rgba(0,212,170,0.4)]"
                            />
                         ))}
                      </div>
                      <div className="space-y-6">
                         <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-full">
                            <Mic size={18} className="text-primary" />
                            <span className="text-[12px] font-extrabold text-text-primary uppercase tracking-[5px]">Listening...</span>
                         </div>
                         <p className="text-2xl font-medium text-text-primary italic leading-relaxed">
                            "Should I take Metformin before or after lunch?"
                         </p>
                         <p className="text-sm text-text-secondary/80 font-bold uppercase tracking-widest">
                            Available in 12+ Indian Languages
                         </p>
                      </div>
                   </div>
                )}

                {activeAIFeature === 4 && (
                   <div className="space-y-10 w-full max-w-md">
                      <div className="p-6 glass rounded-3xl space-y-6 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4">
                            <BarChart3 className="text-primary opacity-20" size={40} />
                         </div>
                         <h4 className="text-xl font-display font-extrabold italic text-text-primary uppercase">Weekly Performance</h4>
                         <div className="space-y-4">
                            <div>
                               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                                  <span className="text-text-secondary">Adherence</span>
                                  <span className="text-primary">98%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: "98%" }}
                                      className="h-full bg-primary shadow-[0_0_10px_rgba(0,212,170,0.4)]" 
                                   />
                                </div>
                            </div>
                            <div>
                               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                                  <span className="text-text-secondary">Risk Score Reduction</span>
                                  <span className="text-primary">-12pt</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: "75%" }}
                                      className="h-full bg-primary shadow-[0_0_10px_rgba(0,212,170,0.4)]" 
                                   />
                                </div>
                            </div>
                         </div>
                      </div>
                      <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20">
                         <p className="text-sm text-text-primary italic font-medium leading-relaxed">
                            "Sunita has maintained a perfect adherence score this week. Her risk score has dropped by 12 points since Monday."
                         </p>
                      </div>
                   </div>
                )}
             </motion.div>
           </AnimatePresence>
        </div>
      </section>

      {/* Three Roles Section */}
      <section id="roles" className="py-24 px-3 md:px-4 max-w-[1440px] mx-auto border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 0)`, backgroundSize: '40px 40px' }} 
        />
        
        <div className="text-center space-y-4 mb-20 relative z-10 max-w-3xl mx-auto">
           <span className="text-primary text-[11px] font-extrabold uppercase tracking-[5px]">Stronger Together</span>
           <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold uppercase italic leading-[1.1] tracking-tight">United in Care</h2>
           <p className="text-text-secondary/60 text-xs font-bold uppercase tracking-widest">Select your role to explore specialized features</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center min-h-[600px] relative z-10">
           {[
             {
               id: 0,
               title: "For Patients",
               icon: User,
               color: "primary",
               items: ['Voice reminders', 'Drug interaction alerts', 'Self risk monitoring', 'Offline pill logging', 'Medical document vault'],
               buttonText: "I'm a Patient"
             },
             {
               id: 1,
               title: "For Caregivers",
               icon: Users,
               color: "secondary",
               items: ['Real-time tracking', 'Predictive alerts', 'Voice broadcast', 'Adherence sync', 'Emergency escalation'],
               buttonText: "I'm a Caregiver"
             },
             {
               id: 2,
               title: "For Doctors",
               icon: Stethoscope,
               color: "ai",
               items: ['Volatility heatmaps', 'Adherence scoring', 'Prescription portal', 'AI pre-charting', 'Telemetry export'],
               buttonText: "I'm a Doctor"
             }
           ].map((role, idx) => (
             <motion.div
               key={role.id}
               onMouseEnter={() => setActiveRole(role.id)}
               onClick={() => setActiveRole(role.id)}
               animate={{ 
                 y: activeRole === role.id ? -30 : 20,
                 scale: activeRole === role.id ? 1.05 : 0.95,
                 opacity: activeRole === role.id ? 1 : 0.6,
               }}
               transition={{ type: "spring", stiffness: 300, damping: 25 }}
               className={cn(
                 "p-10 rounded-[2.5rem] border transition-all duration-500 flex flex-col items-start gap-8 relative group cursor-pointer h-full",
                 activeRole === role.id 
                   ? `bg-surface-main border-${role.color} shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] z-20` 
                   : "bg-surface-main/20 border-white/5 z-10"
               )}
             >
                {/* Glow Effect */}
                {activeRole === role.id && (
                  <div className={cn("absolute inset-0 blur-[80px] opacity-10 pointer-events-none rounded-[2.5rem]", `bg-${role.color}`)} />
                )}

                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                  activeRole === role.id ? `bg-${role.color} text-black scale-110 shadow-lg shadow-${role.color}/20` : `bg-${role.color}/10 text-${role.color}`
                )}>
                  <role.icon size={32} />
                </div>

                <div className="space-y-2">
                   <h3 className="text-3xl font-display font-extrabold italic uppercase tracking-tight">{role.title}</h3>
                   <div className={cn("h-1 w-12 rounded-full transition-all duration-500", activeRole === role.id ? `bg-${role.color}` : "bg-white/10")} />
                </div>

                <ul className="space-y-4 flex-1 w-full">
                  {role.items.map(item => (
                    <li key={item} className={cn(
                      "flex items-center gap-4 text-[13px] font-bold transition-all duration-500",
                      activeRole === role.id ? "text-text-primary" : "text-text-secondary/40"
                    )}>
                      <CheckCircle2 size={16} className={cn("shrink-0", activeRole === role.id ? `text-${role.color}` : "text-white/10")} /> 
                      {item}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/login");
                  }}
                  className={cn(
                    "w-full h-16 rounded-2xl font-extrabold uppercase tracking-[3px] text-[11px] transition-all duration-500 flex items-center justify-center gap-2",
                    activeRole === role.id 
                      ? `bg-${role.color} text-black shadow-xl shadow-${role.color}/20 hover:scale-[1.02]` 
                      : "bg-white/5 text-text-secondary/40 border border-white/5"
                  )}
                >
                  {role.buttonText} <ChevronRight size={16} />
                </button>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Offline Capability */}
      <section className="py-12 px-3 md:px-4 bg-dark-secondary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
             <h2 className="text-5xl md:text-7xl font-display font-extrabold uppercase italic leading-[0.9]">Works Even Without <br /> Internet.</h2>
             <p className="text-text-secondary text-lg leading-relaxed font-medium">
               Leveraging advanced PWA caching and local-first data architecture. 
               The core medication tracker remains operational in zero-connectivity 
               environments common in rural stretches.
             </p>
             <div className="space-y-4">
                {['Local pill logging', 'Offline smart reminders', 'Encrypted local storage'].map(item => (
                   <div key={item} className="flex items-center gap-4 text-xs font-extrabold uppercase tracking-widest text-primary">
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
               <p className="text-[11px] font-extrabold italic uppercase text-primary mb-2">PWA_PROTOCOL_ENABLED</p>
               <p className="text-sm text-text-secondary/90">Data syncs to cloud automatically once LTE/Wifi is detected.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Human Story Section */}
      <section className="py-12 px-3 md:px-4 bg-bg-main relative overflow-hidden border-t border-white/5">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="relative order-2 lg:order-1">
             <div className="aspect-square sm:aspect-video lg:aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border border-border-main relative">
                <img 
                  src="/C:\Users\Deepak Agrawal\.gemini\antigravity\brain\6bf999bc-dd2e-464d-8683-6147a8d0dd4c\caregiver_alert_scenario_1778648677554.png" 
                  alt="Caregiver receiving alert" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
             </div>
             
             {/* Simulated Alert UI */}
             <motion.div 
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="absolute -bottom-6 -right-6 sm:bottom-12 sm:-right-12 w-full max-w-[320px] glass-elevated p-6 rounded-2xl border-l-4 border-critical shadow-2xl z-20"
             >
                <div className="flex items-start gap-4 mb-4">
                   <div className="w-10 h-10 rounded-full bg-critical/10 flex items-center justify-center text-critical shrink-0">
                      <AlertCircle size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-critical mb-1">Critical Alert</p>
                      <h4 className="text-sm font-bold text-text-primary">Dad missed his 4 PM dose</h4>
                      <p className="text-xs text-text-secondary mt-1">Lisinopril (Heart) • 20 min overdue</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button className="h-10 rounded-lg bg-surface-main border border-border-main text-[10px] font-bold uppercase tracking-widest hover:bg-white/50 transition-all">Snooze</button>
                   <button className="h-10 rounded-lg bg-critical text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-critical/20 flex items-center justify-center gap-2">
                      <Phone size={12} /> Call Dad
                   </button>
                </div>
             </motion.div>
          </div>

          <div className="space-y-10 order-1 lg:order-2 max-w-xl">
             <div className="space-y-4">
                <span className="text-primary text-[11px] font-extrabold uppercase tracking-[5px]">The Heart of CareMate</span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-display font-extrabold uppercase italic leading-[1.1] tracking-tight">
                  Behind Every <br className="hidden sm:block" /> Reminder Is A <br className="hidden sm:block" /> Human Life.
                </h2>
             </div>
             
             <div className="space-y-6">
                <p className="text-text-secondary/90 text-lg leading-relaxed font-medium">
                  When your parents forget a dose, it’s not just a missed task—it’s 
                  the person who raised you. We built CareMate for the moments 
                  when you can’t be there in person.
                </p>
                <p className="text-text-secondary/90 text-lg leading-relaxed">
                  Our system doesn't just log data; it watches over your family 
                  with the same vigilance you would. If a critical medication is 
                  missed, CareMate quietly ensures the right person is notified 
                  instantly.
                </p>
             </div>

             <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-8">
                <div className="space-y-2">
                   <p className="text-3xl font-display font-extrabold italic text-text-primary">100%</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Peace of Mind</p>
                </div>
                <div className="h-10 w-[1px] bg-border-main hidden sm:block" />
                <div className="space-y-2">
                   <p className="text-3xl font-display font-extrabold italic text-primary">Live</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Family Connection</p>
                </div>
                <div className="h-10 w-[1px] bg-border-main hidden sm:block" />
                <div className="space-y-2">
                   <p className="text-3xl font-display font-extrabold italic text-secondary">Smart</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Emergency Safeguards</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Inside CareMate Section */}
      <section className="py-12 px-3 md:px-4 bg-surface-main relative border-y border-border-main">
        <div className="max-w-[1440px] mx-auto space-y-20">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-primary text-[11px] font-extrabold uppercase tracking-[5px]">Product Experience</span>
            <h2 className="text-4xl md:text-6xl font-display font-extrabold uppercase italic">Inside CareMate</h2>
            <p className="text-text-secondary/90 text-lg leading-relaxed">
              Designed for clarity, built for safety. Every screen is optimized for 
              speed, accessibility, and absolute peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Mockup */}
            <div className="lg:col-span-8 relative group">
               <div className="rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,212,170,0.1)] border border-border-main bg-bg-main p-2">
                  <img 
                    src="/C:\Users\Deepak Agrawal\.gemini\antigravity\brain\6bf999bc-dd2e-464d-8683-6147a8d0dd4c\caremate_dashboard_mockup_1778648835377.png" 
                    alt="CareMate Dashboard Mockup" 
                    className="w-full h-auto rounded-[2rem]"
                  />
               </div>
               <div className="absolute -top-4 -right-4 bg-primary text-black text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-lg shadow-xl">
                  v1.2 Live
               </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="lg:col-span-4 grid grid-cols-1 gap-6">
               <div className="p-6 glass rounded-2xl border-l-4 border-primary space-y-3">
                  <Activity size={24} className="text-primary" />
                  <h4 className="font-bold text-white uppercase italic text-sm">Adherence Insights</h4>
                  <p className="text-xs text-text-secondary/80 leading-relaxed">Beautifully visualized adherence trends that help you understand your recovery at a glance.</p>
               </div>
               <div className="p-6 glass rounded-2xl border-l-4 border-ai space-y-3">
                  <Brain size={24} className="text-ai" />
                  <h4 className="font-bold text-white uppercase italic text-sm">AI Risk Engine</h4>
                  <p className="text-xs text-text-secondary/80 leading-relaxed">Real-time safety analysis that flags potential risks before they become emergencies.</p>
               </div>
               <div className="p-6 glass rounded-2xl border-l-4 border-secondary space-y-3">
                  <Users size={24} className="text-secondary" />
                  <h4 className="font-bold text-white uppercase italic text-sm">Caregiver Live</h4>
                  <p className="text-xs text-text-secondary/80 leading-relaxed">A specialized dashboard for family members to monitor and support from anywhere.</p>
               </div>
            </div>
          </div>

          {/* Mini Grid of specific features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { icon: Pill, title: "Meds Tracker", desc: "Easy one-tap logging" },
               { icon: Bell, title: "Smart Alerts", desc: "Critical missed dose calls" },
               { icon: Smartphone, title: "PWA Support", desc: "Installs on any device" },
               { icon: Shield, title: "Secure Vault", desc: "Encrypted health records" }
             ].map((feat, i) => (
               <div key={i} className="p-6 bg-bg-main border border-border-main rounded-2xl flex items-center gap-4 hover:border-primary/20 transition-all cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-surface-main flex items-center justify-center text-text-primary">
                     <feat.icon size={20} />
                  </div>
                  <div>
                     <h4 className="font-bold text-white uppercase italic text-[11px] tracking-tight">{feat.title}</h4>
                     <p className="text-[10px] text-text-secondary">{feat.desc}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* India Focus Section */}
      <section className="py-16 px-3 md:px-4 relative overflow-hidden bg-black/95">
         <div className="absolute inset-0 opacity-[0.03] grayscale z-0 pointer-events-none">
           <Globe size={800} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
         </div>
         <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-12">
               <div className="space-y-4">
                  <span className="text-primary text-[11px] font-extrabold uppercase tracking-[5px] italic">Built for Bharat</span>
                  <h2 className="text-4xl md:text-7xl font-display font-extrabold uppercase italic leading-[0.95]">Built for the <br /> Realities of <br /> Our Homes.</h2>
               </div>
               
               <p className="text-text-secondary/90 text-lg leading-relaxed max-w-xl">
                 In India, care is a family journey. We built CareMate 
                 to respect our traditions—handling diverse languages and 
                 patchy internet, while providing a familiar, supportive voice. 
                 It's more than technology; it's our promise to look after the ones we love.
               </p>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <div className="text-2xl">🇮🇳</div>
                     <h4 className="font-bold uppercase italic text-white text-sm">Every Language</h4>
                     <p className="text-xs text-text-secondary/80 leading-relaxed">Talk to CareMate in Hindi or English, just like you would at home.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="text-2xl">📶</div>
                     <h4 className="font-bold uppercase italic text-white text-sm">Offline First</h4>
                     <p className="text-xs text-text-secondary/80 leading-relaxed">Patched internet? No problem. Core tracking works anywhere, always.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="text-2xl">👴</div>
                     <h4 className="font-bold uppercase italic text-white text-sm">Elder Friendly</h4>
                     <p className="text-xs text-text-secondary/80 leading-relaxed">Big buttons, clear voices, and a simple interface built for seniors.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="text-2xl">👨‍👩‍👧‍👦</div>
                     <h4 className="font-bold uppercase italic text-white text-sm">Family Sync</h4>
                     <p className="text-xs text-text-secondary/80 leading-relaxed">Keep everyone in the loop. One missing dose sends a quiet nudge.</p>
                  </div>
               </div>
            </div>

            <div className="relative">
               <div className="aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative">
                  <img 
                    src="/images/hero-bharat.png" 
                    alt="Elderly care story" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 p-6 glass rounded-2xl border-l-4 border-primary">
                     <p className="text-xs italic text-white/90">"CareMate gives me peace of mind. I know my grandmother is taking her meds, even when I'm at work in the city."</p>
                     <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-3">— Rohan, Caregiver</p>
                  </div>
               </div>
               
               {/* Decorative accent */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[100px] rounded-full" />
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-12 px-3 md:px-4 text-center bg-gradient-to-b from-dark-primary to-primary/20">
         <div className="max-w-4xl mx-auto space-y-10">
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-display font-extrabold uppercase italic leading-[1.1] sm:leading-[0.8]">Begin Your Journey <br /> of Better Care.</h2>
            <p className="text-base md:text-xl text-text-secondary font-medium">Simple to use. Free for families. Always by your side.</p>
            <button 
              onClick={() => navigate(dashboardPath)}
              className="btn-gradient h-16 sm:h-20 px-10 sm:px-16 rounded-2xl text-base sm:text-lg flex items-center justify-center gap-4 italic mx-auto"
            >
              {user ? "Go to Dashboard" : "Get Started Free"} <ArrowRight size={24} />
            </button>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-text-secondary/90">PWA — Install directly from browser</p>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-3 md:px-4 bg-black border-t border-white/5">
         <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black">
                      <Brain size={24} />
                    </div>
                    <span className="text-3xl font-display font-extrabold tracking-tighter text-text-primary uppercase italic">CareMate AI</span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                    Your Compassionate Health Companion. Ensuring safety and family connection for every Indian home.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <p className="text-[11px] font-extrabold uppercase tracking-widest text-white italic">Protocol</p>
                     <ul className="space-y-3">
                        {['Features', 'Privacy', 'Security', 'Sync'].map(link => (
                          <li key={link}><a href="#" className="text-text-secondary text-xs hover:text-primary transition-colors">{link}</a></li>
                        ))}
                     </ul>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[11px] font-extrabold uppercase tracking-widest text-white italic">Roles</p>
                     <ul className="space-y-3">
                        {['Patient', 'Caregiver', 'Doctor', 'Pharmacy'].map(link => (
                          <li key={link}><a href="#" className="text-text-secondary text-xs hover:text-primary transition-colors">{link}</a></li>
                        ))}
                     </ul>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="space-y-2">
                     <p className="text-[11px] font-extrabold uppercase tracking-widest text-white italic">Event Spotlight</p>
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
