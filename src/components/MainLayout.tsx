import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Home, Pill, MessageSquare, Heart, User, Bell, ChevronLeft, X, Brain, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/utils";
import { NotificationManager } from "./NotificationManager";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { profile } = useAuth();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: 1, title: "Welcome to CareMate!", message: "Your intelligent health oversight is now active.", time: "Just now", type: "info" },
    { id: 2, title: "PWA Available", message: "Install CareMate for the best offline experience.", time: "5m ago", type: "safe" }
  ]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) {
      setShowInstall(false);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  const navItems = [
    { label: "Home", icon: Home, path: profile?.role === 'caregiver' ? "/caregiver" : (profile?.role === 'doctor' ? "/doctor" : "/patient") },
    { label: "Meds", icon: Pill, path: "/meds" },
    { label: "Care", icon: Heart, path: "/care" },
    { label: "Docs", icon: Brain, path: "/knowledge" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <NotificationManager />
      
      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-dark-elevated border-l border-white/5 z-[80] shadow-2xl p-6 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Notifications</h2>
                <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="text-text-secondary" />
                </button>
              </div>
              
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 group hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                        n.type === 'info' ? "bg-secondary/20 text-secondary" : "bg-safe/20 text-safe"
                      )}>{n.type}</span>
                      <span className="text-[10px] text-text-secondary font-bold">{n.time}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{n.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Mark all as read</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstall && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[100] p-4 bg-primary text-white flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Heart size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Install CareMate</p>
                <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">Native experience on your home screen</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleInstallClick} className="px-4 py-2 bg-white text-primary rounded-full text-xs font-bold">Install</button>
              <button onClick={() => {
                setShowInstall(false);
                localStorage.setItem('pwa_dismissed', 'true');
              }} className="p-2">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Status Bar */}
      <header className={cn(
        "fixed top-0 left-0 right-0 h-16 px-4 sm:px-6 flex items-center justify-between z-[60] transition-all duration-300",
        scrolled || showInstall ? "bg-dark-primary/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-primary/5" : "bg-transparent"
      )}>
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Brain size={20} />
          </div>
          <span className="text-xl sm:text-2xl font-display font-black tracking-tighter italic uppercase text-white">CareMate</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <Bell size={22} className="text-text-secondary" />
            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-critical rounded-full border-2 border-dark-primary animate-pulse" />
          </button>
          <Link to="/profile" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <Settings size={22} className="text-text-secondary" />
          </Link>
          <Link 
            to="/profile" 
            className="w-10 h-10 rounded-full border-2 border-primary p-0.5 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/10 overflow-hidden"
          >
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'CareMate'}`} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover bg-dark-secondary" 
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-dark-primary/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-[60]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300",
                isActive ? "text-primary" : "text-text-secondary hover:text-white"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive ? "bg-primary/10 shadow-[0_0_20px_rgba(0,212,170,0.2)]" : "bg-transparent"
              )}>
                <item.icon size={22} className={isActive ? "stroke-[2.5px]" : "stroke-[2px]"} />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-all",
                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
