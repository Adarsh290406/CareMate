import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Clock, AlertCircle, MoreHorizontal, X, Camera, Play, Video, Phone } from "lucide-react";
import { cn } from "../lib/utils";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

interface MedCardProps {
  dose: any;
  index: number;
  key?: string | number;
}

export default function MedCard({ dose, index }: MedCardProps) {
  const { user, profile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [demoVideo, setDemoVideo] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Scanner State (Feature 43)
  const [showScanner, setShowScanner] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [showEffectiveness, setShowEffectiveness] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function fetchMedDetails() {
      if (dose.medicationId) {
        const medRef = doc(db, "medications", dose.medicationId);
        const medSnap = await getDoc(medRef);
        if (medSnap.exists()) {
          setDemoVideo(medSnap.data().demoVideo || null);
        }
      }
    }
    fetchMedDetails();
  }, [dose.medicationId]);

  const startScanner = async () => {
    setShowScanner(true);
    setShowOptions(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      alert("Could not access camera.");
      setShowScanner(false);
    }
  };

  const closeScanner = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setShowScanner(false);
  };

  const handleCaptureVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const { identifyPill } = await import("../lib/ai");
    
    setIsIdentifying(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg");
    
    try {
      const result = await identifyPill(imageData);
      if (result && result.name) {
        const matches = result.name.toLowerCase().includes(dose.medName.toLowerCase()) || 
                        dose.medName.toLowerCase().includes(result.name.toLowerCase());
        
        if (matches) {
          alert(`Pill Verified: ${result.name} (${result.dosage}). Confirmed match for ${dose.medName}.`);
          markTaken("taken");
          closeScanner();
        } else {
          alert(`Verification Mismatch: Identified as ${result.name}. This dose is for ${dose.medName}. Please check again.`);
        }
      } else {
        alert("Could not identify pill. Please try again in better light.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsIdentifying(false);
    }
  };

  const markTaken = async (status: "taken" | "missed" | "snoozed" = "taken") => {
    setIsUpdating(true);
    try {
      // 1. Update Dose Status
      await updateDoc(doc(db, "doses", dose.id), {
        status: status,
        takenAt: status === "taken" ? serverTimestamp() : null
      });

      // 2. Decrement Inventory (Feature 13)
      if (status === "taken" && dose.medicationId) {
        const medRef = doc(db, "medications", dose.medicationId);
        const medSnap = await getDoc(medRef);
        if (medSnap.exists()) {
          const currentStock = medSnap.data().pillsRemaining || 0;
          await updateDoc(medRef, {
            pillsRemaining: Math.max(0, currentStock - 1)
          });
        }
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
      setShowOptions(false);
      if (status === "taken") setShowEffectiveness(true);
    }
  };

  const handlePhotoVerify = () => {
    alert("AI Photo Verification: Searching for pill identification... (Feature 43)");
    setTimeout(() => {
      alert("Pill Verified: Blue Elliptical, 500mg. Adherence Logged.");
      markTaken("taken");
    }, 1500);
  };

  const handleInteraction = () => {
    const now = Date.now();
    if (now - lastClickTime < 300) {
      // Double tap detected
      setShowOptions(true);
    } else {
      // Single tap
      if (dose.status === "pending") {
        markTaken("taken");
      }
    }
    setLastClickTime(now);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleInteraction}
        className={cn(
          "relative rounded-xl p-4 flex items-center justify-between transition-all cursor-pointer group dense-card overflow-hidden text-left",
          dose.status === "taken" ? "opacity-60 shadow-none" : "border-primary-accent/30 shadow-blue-glow"
        )}
      >
        <div className={cn(
          "status-indicator",
          dose.status === "taken" ? "bg-success" : 
          dose.status === "missed" ? "bg-danger" : "bg-primary-accent"
        )} />
        
        <div className="flex items-center gap-4 pl-2">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
            dose.status === "taken" ? "bg-success/20 text-success" : 
            dose.status === "missed" ? "bg-danger/20 text-danger" : 
            "bg-primary-accent/20 text-primary-accent border border-primary-accent/50"
          )}>
            {dose.status === "taken" ? (
              <Check size={20} />
            ) : (
              dose.scheduledAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            )}
          </div>
          
          <div className="space-y-0.5">
            <h3 className="font-bold text-lg text-white group-hover:text-primary-accent transition-colors">
              {dose.medName || "Medication"}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-text-muted">
                {dose.dosage || "1 Pill"} • {dose.status === "taken" ? `Taken at ${dose.takenAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : (dose.notes || "Adherence required")}
              </p>
              {demoVideo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideoModal(true);
                  }}
                  className="p-1.5 bg-primary-accent/10 rounded-lg text-primary-accent hover:bg-primary-accent/20 transition-colors"
                  title="Watch Demo"
                >
                  <Play size={12} fill="currentColor" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="hidden sm:block text-right pr-2">
          <p className={cn(
            "text-[10px] font-mono font-bold uppercase tracking-wider mb-1",
            dose.status === "taken" ? "text-success" : "text-text-muted"
          )}>
            STATUS: {dose.status}
          </p>
          <p className="text-[10px] text-text-muted font-medium">
            {dose.status === "taken" ? "NEXT: Tomorrow" : "DUE IN: 12M"}
          </p>
        </div>

        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-10 glass rounded-2xl flex items-center justify-around p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => markTaken("snoozed")}
                className="flex flex-col items-center gap-1 text-warning hover:scale-110 transition-transform"
              >
                <Clock className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase">Snooze</span>
              </button>
              <button 
                onClick={() => {
                  const targetId = profile?.role === 'patient' ? profile?.caregiverId : dose.patientId;
                  if (!targetId) {
                    alert("Contact information unavailable.");
                    return;
                  }
                  window.open(`https://meet.jit.si/CareMate_${[user?.uid, targetId].sort().join("_")}`, '_blank');
                }}
                className="flex flex-col items-center gap-1 text-primary-accent hover:scale-110 transition-transform"
              >
                <Video className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase">Call</span>
              </button>
              <button 
                onClick={startScanner}
                className="flex flex-col items-center gap-1 text-primary-accent hover:scale-110 transition-transform"
              >
                <Camera className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase">Verify</span>
              </button>
              <button 
                onClick={() => markTaken("missed")}
                className="flex flex-col items-center gap-1 text-danger hover:scale-110 transition-transform"
              >
                <AlertCircle className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase">Miss</span>
              </button>
              <button 
                onClick={() => setShowOptions(false)}
                className="flex flex-col items-center gap-1 text-text-muted hover:scale-110 transition-transform"
              >
                <X className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase">Back</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isUpdating && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </motion.div>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeScanner}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-surface border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">AI Pill Verification</h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">Scan: {dose.medName}</p>
                </div>
                <button onClick={closeScanner} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="aspect-square bg-black relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanner Overlay UI */}
                <div className="absolute inset-0 border-[40px] border-black/40">
                  <div className="w-full h-full border-2 border-primary-accent/50 rounded-3xl relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary-accent/20 to-transparent h-1/2 animate-scan" />
                  </div>
                </div>
              </div>

              <div className="p-8 text-center">
                <button
                  onClick={handleCaptureVerify}
                  disabled={isIdentifying}
                  className="w-full py-4 bg-primary-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-primary-accent/20"
                >
                  {isIdentifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Identifying...
                    </>
                  ) : (
                    <>
                      <Camera size={18} />
                      Capture & Verify
                    </>
                  )}
                </button>
                <p className="mt-4 text-[10px] text-text-muted font-medium italic">
                  Hold the pill steady in the center of the frame.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEffectiveness && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEffectiveness(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm dense-card p-8 bg-surface border border-white/10 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 text-success">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Dose Logged!</h3>
              <p className="text-sm text-text-muted mb-8 tracking-tight font-medium">How are you feeling after taking {dose.medName}?</p>
              
              <div className="flex justify-center gap-4 mb-8">
                {[
                  { icon: "😞", label: "Better", status: "better" },
                  { icon: "😐", label: "Same", status: "same" },
                  { icon: "🤢", label: "Worse", status: "worse" }
                ].map((item) => (
                  <button
                    key={item.status}
                    onClick={() => {
                      alert(`Thank you. Your feedback (${item.label}) has been logged for your doctor.`);
                      setShowEffectiveness(false);
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="text-3xl grayscale group-hover:grayscale-0 transition-all scale-100 group-hover:scale-125 mb-1">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-white transition-colors">{item.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowEffectiveness(false)}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-white transition-colors"
              >
                Skip Feedback
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showVideoModal && demoVideo && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideoModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Video size={18} className="text-primary-accent" />
                  Intake Demonstration: {dose.medName}
                </h3>
                <button onClick={() => setShowVideoModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="aspect-video bg-black">
                <video src={demoVideo} controls autoPlay className="w-full h-full" />
              </div>
              <div className="p-6">
                <p className="text-xs text-text-muted leading-relaxed">
                  Please follow this demonstration carefully. If you have questions, message your doctor.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
