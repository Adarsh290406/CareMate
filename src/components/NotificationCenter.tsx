import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, AlertTriangle, CheckCircle, Clock, Info, Heart } from "lucide-react";
import { cn } from "../lib/utils";
import { useAlerts } from "../hooks/useAlerts";

interface NotificationCenterProps {
  userId: string | undefined;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const { alerts, loading } = useAlerts(userId);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-surface-main border border-border-main rounded-xl relative text-text-secondary hover:text-text-primary transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-bg-main animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[190]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-[320px] bg-surface-main border border-border-main rounded-[2.5rem] shadow-2xl z-[200] overflow-hidden"
            >
              <div className="p-6 border-b border-border-main flex items-center justify-between bg-bg-main/20">
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Alerts</h3>
                   <p className="text-[9px] font-bold text-text-secondary uppercase mt-1">{unreadCount} Unread Notifications</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-text-secondary">
                   <X size={16} />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {loading ? (
                  <div className="p-12 text-center text-[10px] font-black uppercase text-text-secondary opacity-60">Syncing alerts...</div>
                ) : alerts.length === 0 ? (
                  <div className="p-12 text-center space-y-4">
                     <div className="w-12 h-12 bg-bg-main border border-border-main rounded-2xl flex items-center justify-center mx-auto text-text-secondary">
                        <CheckCircle size={24} />
                     </div>
                     <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">No active alerts</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-main">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={cn(
                        "p-5 flex items-start gap-4 hover:bg-bg-main/50 transition-colors",
                        !alert.read && "bg-primary/5"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          alert.priority === 'critical' ? "bg-danger/20 text-danger" : 
                          alert.priority === 'medium' ? "bg-warning/20 text-warning" : 
                          "bg-blue-500/20 text-blue-500"
                        )}>
                           {alert.type === 'sos' ? <Heart size={20} fill="currentColor" /> : 
                            alert.type === 'low_supply' ? <AlertTriangle size={20} /> : 
                            <Clock size={20} />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-[13px] font-bold text-text-primary leading-tight">{alert.message}</p>
                          <span className="text-[9px] font-black uppercase text-text-secondary">
                             {alert.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border-main bg-bg-main/50">
                 <button className="w-full py-3 bg-surface-main border border-border-main rounded-xl text-[9px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all">
                    View All Notifications
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
