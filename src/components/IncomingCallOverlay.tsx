import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, PhoneOff, Video, User, Bell } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

interface IncomingCallOverlayProps {
  call: any;
  onClose: () => void;
}

export default function IncomingCallOverlay({ call, onClose }: IncomingCallOverlayProps) {
  const navigate = useNavigate();

  const handleAccept = async () => {
    try {
      await updateDoc(doc(db, "calls", call.id), {
        status: "accepted",
        acceptedAt: serverTimestamp()
      });
      navigate(`/video-room/${call.id}`);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    try {
      await updateDoc(doc(db, "calls", call.id), {
        status: "rejected",
        rejectedAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {call && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
          />
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="relative w-full max-w-sm bg-surface-main border border-border-main rounded-[3rem] p-10 text-center shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Pulsing Background Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full animate-ping" />
            
            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] animate-bounce">
                  <Bell size={12} /> Incoming Video Call
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-4 border-primary p-1 bg-bg-main shadow-2xl">
                    <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                       <img 
                         src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${call.fromName || 'CareMate'}`} 
                         alt="Caller" 
                         className="w-full h-full object-cover"
                       />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-safe rounded-full border-4 border-surface-main flex items-center justify-center text-white">
                    <Video size={18} />
                  </div>
                </div>

                <div>
                  <h3 className="text-3xl font-black italic tracking-tighter uppercase text-text-primary leading-none">{call.fromName || "Care Provider"}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-3 opacity-60">Emergency Response Team</p>
                </div>
              </div>

              <div className="flex gap-6 pt-8">
                <button 
                  onClick={handleReject}
                  className="flex-1 flex flex-col items-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-full bg-danger text-white flex items-center justify-center shadow-2xl shadow-danger/40 group-hover:scale-110 active:scale-90 transition-all">
                    <PhoneOff size={28} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Decline</span>
                </button>

                <button 
                  onClick={handleAccept}
                  className="flex-1 flex flex-col items-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-full bg-safe text-white flex items-center justify-center shadow-2xl shadow-safe/40 animate-pulse group-hover:scale-110 active:scale-90 transition-all">
                    <Phone size={28} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Accept</span>
                </button>
              </div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
