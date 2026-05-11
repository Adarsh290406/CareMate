import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, LogOut, Bell, Shield, Heart, FileText, Moon, Sun, Settings, Edit3, ChevronRight, TrendingUp, Award, Zap, Clock, Book, Brain, Activity, Camera, Users } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { useMedications } from "../hooks/useMedications";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

import { requestNotificationPermission, showNotification } from "../services/notificationService";

export default function Profile() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [pushEnabled, setPushEnabled] = useState(() => Notification.permission === 'granted');
  const [elderlyMode, setElderlyMode] = useState(() => document.documentElement.classList.contains('elderly-mode'));

  const handleElderlyToggle = () => {
    const newVal = !elderlyMode;
    setElderlyMode(newVal);
    if (newVal) {
      document.documentElement.classList.add('elderly-mode');
    } else {
      document.documentElement.classList.remove('elderly-mode');
    }
  };

  const handlePushToggle = async () => {
    if (!pushEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPushEnabled(true);
        showNotification("Notifications Enabled", {
          body: "CareMate will now remind you of your medications and critical alerts.",
          icon: "/pwa-192x192.png"
        });
      } else {
        alert("Please enable notification permissions in your browser settings.");
      }
    } else {
      alert("To disable notifications, please change the permission in your browser site settings.");
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const { medications } = useMedications(profile?.uid || auth.currentUser?.uid);

  const stats = [
    { label: "Total Doses", value: "482", icon: Zap, color: "text-primary" },
    { label: "Best Streak", value: "28d", icon: Award, color: "text-orange-500" },
    { label: "Compliance", value: "94%", icon: TrendingUp, color: "text-blue-500" },
  ];

  const sections = [
    {
      title: "Medication Settings",
      items: [
        { label: "My Prescription List", icon: FileText, badge: `${medications.length} Active`, path: "/meds" },
        { label: "Check Drug Interactions", icon: Zap, path: "/check-interaction" },
        { label: "Voice AI Assistant", icon: Brain, path: "/voice-assistant" },
        { label: "Med Encyclopedia", icon: Book, path: "/encyclopedia" },
        { label: "Dose Impact Simulator", icon: Activity, path: "/dose-simulator" },
        { label: "AI Schedule Optimizer", icon: Clock, path: "/optimize-schedule" },
        { label: "Pill Photo Verifier", icon: Camera, path: "/pill-scanner" },
        { label: "Prescription OCR Scanner", icon: FileText, path: "/scan-prescription" },
        { label: "Drug Brand Converter", icon: Zap, path: "/convert-drug" },
        { 
          label: "Push Notifications", 
          icon: Bell, 
          type: "toggle", 
          active: pushEnabled, 
          onToggle: handlePushToggle 
        },
        { label: "Dosage History", icon: Clock },
      ]
    },
    {
      title: "Security & Access",
      items: [
        { label: "Emergency Medical ID", icon: Shield, badge: "Critical", path: "/emergency-qr" },
        { label: "My Family Circle", icon: Users, badge: "2 Connected", path: "/family-circle" },
        { label: "Data Share Settings", icon: Shield },
      ]
    },
    {
      title: "Accessibility",
      items: [
        { 
          label: "Elderly Mode", 
          icon: Moon, 
          type: "toggle", 
          active: elderlyMode, 
          onToggle: handleElderlyToggle 
        },
      ]
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tighter">My Profile</h1>
        <button 
          onClick={() => {
            const settingsEl = document.getElementById('main-settings');
            settingsEl?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="p-2 bg-surface-main border border-border-main rounded-xl text-text-secondary hover:text-text-primary transition-colors active:scale-95 shadow-sm"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-ai flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-primary/20">
            {profile?.name?.[0] || "P"}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-zinc-800 rounded-full border-2 border-[var(--bg)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
            <Edit3 size={14} />
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tighter">{profile?.name || "Patient User"}</h2>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary px-3 py-1 bg-primary/5 rounded-full mt-2 inline-block">
            {profile?.role || "Patient"} Account
          </span>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4 text-center flex flex-col items-center gap-1 bg-surface-main border border-border-main rounded-2xl">
            <stat.icon size={16} className={stat.color} />
            <span className="mono text-xl tracking-tighter text-text-primary">{stat.value}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</span>
          </div>
        ))}
      </section>

      <section id="main-settings" className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary px-1">{section.title}</h3>
            <div className="card divide-y divide-border-main bg-surface-main border border-border-main rounded-3xl overflow-hidden shadow-sm">
              {section.items.map((item) => (
                <div 
                  key={item.label} 
                  onClick={() => item.path && navigate(item.path)}
                  className="p-5 flex items-center justify-between group cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {item.icon && <item.icon size={18} className="text-text-secondary" />}
                    <span className="text-[14px] font-semibold text-text-primary">{item.label}</span>
                  </div>
                  {item.type === 'toggle' ? (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        item.onToggle?.();
                      }}
                      className={cn(
                        "w-12 h-7 rounded-full transition-all duration-300 p-1 flex items-center",
                        item.active ? "bg-primary" : "bg-bg-main border border-border-main"
                      )}
                    >
                      <motion.div 
                        layout
                        className="w-5 h-5 bg-white rounded-full shadow-md"
                        animate={{ x: item.active ? 20 : 0 }}
                      />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                       {item.badge && <span className="text-[10px] font-black text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-full">{item.badge}</span>}
                       <ChevronRight size={16} className="text-border-main group-hover:text-primary transition-colors" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Global Controls */}
        <div className="space-y-4">
           {/* Dark Mode */}
           <div 
             onClick={() => setDarkMode(!darkMode)}
             className="card p-5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform bg-surface-main border border-border-main rounded-3xl"
           >
              <div className="flex items-center gap-4">
                {darkMode ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-warning" />}
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">Dark Mode</p>
                  <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest">{darkMode ? "Eye protection active" : "Classic interface"}</p>
                </div>
              </div>
              <div className={cn(
                "w-12 h-7 rounded-full p-1 transition-all duration-300 flex items-center",
                darkMode ? "bg-primary" : "bg-bg-main border border-border-main"
              )}>
                <motion.div 
                   layout
                   className="w-5 h-5 bg-white rounded-full shadow-md"
                   animate={{ x: darkMode ? 20 : 0 }}
                />
              </div>
           </div>

           {/* Test Alert Button */}
           <button 
             onClick={async () => {
                if (Notification.permission !== 'granted') {
                   const granted = await requestNotificationPermission();
                   if (!granted) {
                      alert("Please enable notification permissions in your browser settings to test the alert system.");
                      return;
                   }
                }
                showNotification("Test CareMate Notification", {
                   body: "This is a test notification from CareMate AI.",
                   icon: "/pwa-192x192.png",
                   tag: "test-notification"
                });
             }}
             className="w-full card border-primary/20 bg-primary/10 p-5 flex items-center justify-between group active:scale-[0.99] transition-transform rounded-3xl shadow-sm"
           >
              <div className="flex items-center gap-4 text-left">
                <Zap size={18} className="text-primary" />
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">Test Alert System</p>
                  <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest opacity-60">Verify notifications are working</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary text-black rounded-lg text-[10px] font-black uppercase tracking-widest">
                Test
              </div>
           </button>
        </div>

        <button 
          onClick={() => auth.signOut()}
          className="w-full py-6 text-danger text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <LogOut size={16} /> Secure Sign Out
        </button>
      </section>
    </div>
  );
}
