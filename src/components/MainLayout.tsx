import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Home, Pill, MessageSquare, Heart, User, Bell, ChevronLeft, X, Brain, Settings, Sun, Moon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/utils";
import { NotificationManager } from "./NotificationManager";
import { useIncomingCall } from "../hooks/useIncomingCall";
import IncomingCallOverlay from "./IncomingCallOverlay";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, profile } = useAuth();
  const { incomingCall, setIncomingCall } = useIncomingCall(user?.uid);
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [notifications] = useState([
    { id: 1, title: "Welcome to CareMate!", message: "Your intelligent health oversight is now active.", time: "Just now", type: "info" },
    { id: 2, title: "PWA Available", message: "Install CareMate for the best offline experience.", time: "5m ago", type: "safe" }
  ]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
    <div className="min-h-screen pb-24 lg:pb-0 lg:pl-72 transition-all duration-500">
      <NotificationManager />
      <IncomingCallOverlay call={incomingCall} onClose={() => setIncomingCall(null)} />
      
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-surface-main border-r border-border-main hidden lg:flex flex-col z-[70]">
        <div className="p-10 flex flex-col items-center text-center">
          <Link to="/" className="flex flex-col items-center gap-4 group">
            <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-black shadow-2xl shadow-primary/20 group-hover:scale-110 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <Brain size={32} className="relative z-10" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-display font-black tracking-tighter italic uppercase leading-none text-text-primary">CareMate</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-8 h-[1px] bg-primary/30" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">Intelligence</span>
                <div className="w-8 h-[1px] bg-primary/30" />
              </div>
            </div>
          </Link>
        </div>

        <div className="flex-1 px-8 space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 group relative",
                  isActive 
                    ? "bg-primary text-black shadow-2xl shadow-primary/20 scale-105" 
                    : "text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary hover:translate-x-2"
                )}
              >
                <item.icon size={22} className={cn("transition-transform group-hover:scale-110", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                {isActive && (
                   <motion.div 
                     layoutId="sidebar-indicator"
                     className="absolute right-0 w-1.5 h-8 bg-black rounded-l-full"
                   />
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-8 border-t border-border-main space-y-6">
           <div className="flex items-center gap-4 p-4 bg-bg-main/50 border border-border-main rounded-3xl">
              <div className="w-10 h-10 rounded-full border-2 border-primary p-0.5 overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'CareMate'}`} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover" 
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black text-text-primary truncate uppercase tracking-tight">{profile?.name || "User"}</p>
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest">{profile?.role || "Patient"}</p>
              </div>
              <button onClick={toggleTheme} className="p-2 hover:bg-primary/10 rounded-xl transition-colors text-text-secondary">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
           </div>
        </div>
      </aside>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="fixed top-0 right-0 bottom-0 w-96 bg-surface-main border-l border-border-main z-[110] shadow-2xl p-8 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-text-primary leading-none">Notifications</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2">Personal Assistant</p>
                </div>
                <button onClick={() => setShowNotifications(false)} className="p-3 bg-bg-main border border-border-main rounded-2xl hover:text-danger transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div key={n.id} className="p-5 rounded-3xl bg-bg-main border border-border-main space-y-3 group hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        n.type === 'info' ? "bg-secondary/10 text-secondary" : "bg-safe/10 text-safe"
                      )}>{n.type}</span>
                      <span className="text-[10px] text-text-secondary font-bold opacity-40">{n.time}</span>
                    </div>
                    <h3 className="text-sm font-bold text-text-primary leading-tight">{n.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed opacity-70">{n.message}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-10 pt-8 border-t border-border-main text-center">
                <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline group flex items-center justify-center gap-2 mx-auto">
                   Clear all messages <ChevronLeft size={14} className="rotate-180" />
                </button>
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
            className="fixed top-0 left-0 right-0 z-[100] p-4 bg-primary text-white flex items-center justify-between shadow-lg lg:left-72"
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
        "fixed top-0 left-0 right-0 h-20 px-6 sm:px-10 flex items-center justify-between z-[60] transition-all duration-500 lg:left-72",
        scrolled || showInstall ? "bg-surface-main/95 backdrop-blur-xl border-b border-border-main shadow-2xl shadow-primary/5" : "bg-transparent"
      )}>
        <div className="flex items-center gap-4">
          {location.pathname !== "/" && location.pathname !== "/patient" && location.pathname !== "/caregiver" && location.pathname !== "/doctor" && (
            <button 
              onClick={() => window.history.back()}
              className="p-3 bg-surface-main border border-border-main rounded-2xl text-text-secondary hover:text-primary transition-all hover:scale-110 active:scale-95 shadow-lg"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="hidden lg:block">
             <h2 className="text-2xl font-black italic uppercase tracking-tighter text-text-primary leading-none">
                {navItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
             </h2>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-2">Personal Oversight</p>
          </div>
          <Link to="/" className="flex items-center gap-3 group lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Brain size={22} />
            </div>
            <span className="text-2xl font-display font-black tracking-tighter italic uppercase text-text-primary">CareMate</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:flex items-center gap-6 px-6 py-2 bg-bg-main/50 border border-border-main rounded-full mr-4">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary leading-none">System Status</span>
                <span className="text-[10px] font-bold text-safe uppercase mt-1">Operational</span>
             </div>
             <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          </div>

          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-3 bg-surface-main border border-border-main rounded-2xl hover:text-primary transition-all hover:scale-110 active:scale-95 shadow-lg group"
          >
            <Bell size={22} className="text-text-secondary group-hover:text-primary transition-colors" />
            <div className="absolute top-3 right-3 w-3 h-3 bg-critical rounded-full border-2 border-surface-main animate-pulse shadow-sm" />
          </button>

          <Link 
            to="/profile" 
            className="w-12 h-12 rounded-full border-2 border-primary p-1 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/10 overflow-hidden bg-surface-main"
          >
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'CareMate'}`} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover" 
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 px-6 sm:px-10 max-w-[1600px] mx-auto transition-all duration-500">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-surface-main/90 backdrop-blur-2xl border-t border-border-main flex items-center justify-around px-4 z-[60] lg:hidden shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 min-w-[70px] transition-all duration-500",
                isActive ? "text-primary scale-110" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl transition-all duration-500 relative",
                isActive ? "bg-primary/10 shadow-[0_0_30px_rgba(0,212,170,0.3)]" : "bg-transparent"
              )}>
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute inset-0 bg-primary/10 rounded-2xl z-[-1]"
                  />
                )}
                <item.icon size={24} className={isActive ? "stroke-[2.5px]" : "stroke-[2px]"} />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-all",
                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
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
