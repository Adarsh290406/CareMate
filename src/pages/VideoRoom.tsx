import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Users, 
  MessageSquare, Share2, Shield, Maximize2, MoreVertical, Heart,
  User,
  Activity
} from "lucide-react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cn } from "../lib/utils";

export default function VideoRoom() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const [callData, setCallData] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!callId) return;

    const unsubscribe = onSnapshot(doc(db, "calls", callId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCallData(data);
        if (data.status === "rejected" || data.status === "ended") {
          navigate(-1);
        }
      }
    });

    const timer = setInterval(() => setDuration(d => d + 1), 1000);

    // Mock local video
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => console.error("Camera access denied:", err));

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [callId]);

  const endCall = async () => {
    if (!callId) return;
    try {
      await updateDoc(doc(db, "calls", callId), {
        status: "ended",
        endedAt: serverTimestamp()
      });
      navigate(-1);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[300] bg-zinc-950 text-white flex flex-col overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-ai/10 pointer-events-none" />
      
      {/* Header Info */}
      <header className="absolute top-0 inset-x-0 p-8 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
            <Shield size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] opacity-80">Encrypted Clinical Stream</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 flex items-center gap-3">
              <Users size={16} />
              <span className="text-xs font-black uppercase tracking-widest">2 Participants</span>
           </div>
           <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
              <Settings size={18} />
           </button>
        </div>
      </header>

      {/* Main Video Stage */}
      <main className="flex-1 relative flex items-center justify-center p-6 lg:p-12">
        <div className="relative w-full h-full max-w-6xl aspect-video rounded-[3rem] overflow-hidden bg-zinc-900 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 group">
           {/* Remote Participant Placeholder */}
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center text-primary text-4xl font-black shadow-2xl animate-pulse">
                {callData?.fromName?.[0] || callData?.toName?.[0] || "C"}
              </div>
              <div>
                <p className="text-2xl font-black italic tracking-tighter uppercase text-white/80">
                  {callData?.fromName || callData?.toName || "Connecting..."}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-2">Streaming High Fidelity Audio</p>
              </div>
           </div>

           {/* Self View */}
           <div className="absolute bottom-8 right-8 w-48 lg:w-72 aspect-video bg-zinc-800 rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl group-hover:scale-105 transition-transform">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={cn("w-full h-full object-cover transition-opacity", isVideoOff ? "opacity-0" : "opacity-100")} 
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                   <User size={32} className="text-white/20" />
                </div>
              )}
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 rounded-lg backdrop-blur-md text-[8px] font-black uppercase tracking-widest text-white/80">
                You (Patient)
              </div>
           </div>

           {/* AI Vitals Overlay (Mock) */}
           <div className="absolute top-8 left-8 space-y-4">
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="px-6 py-4 bg-black/40 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-4"
              >
                 <Heart className="text-danger animate-pulse" size={24} />
                 <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 leading-none">Heart Rate</p>
                    <p className="text-lg font-black italic">72 BPM</p>
                 </div>
              </motion.div>
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="px-6 py-4 bg-black/40 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-4"
              >
                 <Activity className="text-primary" size={24} />
                 <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 leading-none">Oxygen Levels</p>
                    <p className="text-lg font-black italic">98%</p>
                 </div>
              </motion.div>
           </div>
        </div>
      </main>

      {/* Interaction Controls */}
      <footer className="h-40 flex flex-col items-center justify-center relative">
         <div className="flex items-center gap-4 lg:gap-8 px-10 py-6 bg-white/5 rounded-[3rem] backdrop-blur-3xl border border-white/10 shadow-2xl relative z-10">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90",
                isMuted ? "bg-danger text-white shadow-danger/20" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn(
                "w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90",
                isVideoOff ? "bg-danger text-white shadow-danger/20" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>

            <button 
              onClick={endCall}
              className="w-14 h-14 lg:w-24 lg:h-16 rounded-2xl bg-danger text-white flex items-center justify-center shadow-2xl shadow-danger/40 hover:brightness-110 transition-all active:scale-95"
            >
              <PhoneOff size={24} />
            </button>

            <div className="w-[1px] h-10 bg-white/10 mx-2" />

            <button className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-xl hover:bg-white/20 transition-all active:scale-90">
              <MessageSquare size={24} />
            </button>

            <button className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-xl hover:bg-white/20 transition-all active:scale-90">
              <Maximize2 size={24} />
            </button>
         </div>

         <div className="absolute inset-x-0 bottom-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">CareMate Telehealth Engine v2.0</p>
         </div>
      </footer>
    </div>
  );
}
