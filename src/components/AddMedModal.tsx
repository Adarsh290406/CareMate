import React, { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { checkMedsInteraction } from "../lib/gemini";
import { useMedications } from "../hooks/useMedications";
import { motion, AnimatePresence } from "motion/react";
import { X, Pill, Clock, Hash, AlertCircle, Mic, Video, StopCircle, RotateCcw, Play, Camera, ChevronRight, Brain } from "lucide-react";
import { cn } from "../lib/utils";

interface AddMedModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  language?: "English" | "Hindi";
}

export default function AddMedModal({ patientId, isOpen, onClose, language = "English" }: AddMedModalProps) {
  const { medications } = useMedications(patientId);
  const [loading, setLoading] = useState(false);
  const [listeningField, setListeningField] = useState<string | null>(null);
  const [interactionResult, setInteractionResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    pillsRemaining: 30,
    refillThreshold: 5,
    frequency: "Daily",
    time: "09:00"
  });

  // Video Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<"video" | "scan" | "prescription">("video");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const readPrescriptionAction = async (imageBase64: string) => {
    const { readPrescription } = await import("../lib/gemini");
    setIsScanning(true);
    try {
      const result = await readPrescription(imageBase64);
      if (result && result.medications?.length > 0) {
        const first = result.medications[0];
        setFormData(prev => ({
          ...prev,
          name: first.name,
          dosage: first.dosage || prev.dosage
        }));
        alert(`Detected: ${first.name}. Pre-filling details.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
      setShowCamera(false);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    }
  };

  const identifyPillAction = async (imageBase64: string) => {
    const { identifyPill } = await import("../lib/gemini");
    setIsScanning(true);
    try {
      const result = await identifyPill(imageBase64);
      if (result && result.name) {
        setFormData(prev => ({
          ...prev,
          name: result.name,
          dosage: result.dosage || prev.dosage
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
      setShowCamera(false);
      // Stop tracks
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      if (cameraMode === "prescription") {
        readPrescriptionAction(dataUrl);
      } else {
        identifyPillAction(dataUrl);
      }
    }
  };

  const startListening = (field: "name" | "dosage") => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "English" ? "en-US" : "hi-IN";
    recognition.interimResults = false;

    recognition.onstart = () => setListeningField(field);
    recognition.onend = () => setListeningField(null);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({ ...prev, [field]: transcript }));
    };

    recognition.start();
  };

  const startCamera = async (mode: "video" | "scan" | "prescription" = "video") => {
    setCameraMode(mode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: mode === "video" });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera.");
    }
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoBlob(blob);
      
      // Convert to base64 for storage (Feature 17)
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        setVideoBase64(reader.result as string);
      };

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // AI Check for Interactions (Feature 11)
    if (!interactionResult) {
      const currentMeds = medications.map(m => m.name);
      const res = await checkMedsInteraction(formData.name, currentMeds);
      if (!res.safe) {
        setInteractionResult(res);
        setLoading(false);
        return;
      }
    }

    try {
      // 1. Add the Medication
      const medRef = await addDoc(collection(db, "medications"), {
        patientId,
        name: formData.name,
        dosage: formData.dosage,
        pillsRemaining: Number(formData.pillsRemaining),
        refillAlertThreshold: Number(formData.refillThreshold),
        demoVideo: videoBase64, // Optional demo video
        createdAt: serverTimestamp()
      });

      // 2. Schedule the first dose for today
      const [hours, minutes] = formData.time.split(":");
      const scheduledAt = new Date();
      scheduledAt.setHours(Number(hours), Number(minutes), 0, 0);

      await addDoc(collection(db, "doses"), {
        patientId,
        medicationId: medRef.id,
        medName: formData.name,
        dosage: formData.dosage,
        status: "pending",
        scheduledAt: scheduledAt,
        createdAt: serverTimestamp()
      });

      onClose();
    } catch (error) {
      console.error("Add med error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative w-full max-w-xl bg-surface-main border border-border-main rounded-[3rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-y-auto max-h-[95vh] no-scrollbar"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                  <Pill size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-text-primary leading-none">New Medication</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-2">Clinical Registration</p>
                </div>
              </div>
              <button onClick={onClose} className="p-4 bg-bg-main border border-border-main rounded-2xl text-text-secondary hover:text-danger transition-all hover:scale-110 active:scale-95 shadow-lg">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-8">
              <button 
                type="button"
                onClick={() => startCamera("prescription")}
                className="flex-1 py-4 bg-primary/10 text-primary rounded-2xl border border-primary/20 hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
              >
                <Camera size={18} /> Scan Prescription
              </button>
              <button 
                type="button"
                onClick={() => startCamera("scan")}
                className="flex-1 py-4 bg-secondary/10 text-secondary rounded-2xl border border-secondary/20 hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
              >
                <Camera size={18} /> Identify Pill
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60">Drug Name</label>
                  {listeningField === "name" && <span className="text-[9px] font-black uppercase tracking-widest text-danger animate-pulse">Listening...</span>}
                </div>
                <div className="relative group">
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-bg-main border-2 border-border-main rounded-3xl px-6 py-5 pr-14 text-lg font-bold text-text-primary focus:outline-none focus:border-primary transition-all group-hover:border-border-main/50"
                    placeholder="e.g., Lisinopril"
                  />
                  <button
                    type="button"
                    onClick={() => startListening("name")}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all",
                      listeningField === "name" ? "bg-danger text-white shadow-lg shadow-danger/20 animate-pulse" : "bg-surface-main border border-border-main text-text-secondary hover:text-primary hover:scale-110"
                    )}
                  >
                    <Mic size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60 px-2">Dosage Strength</label>
                  <div className="relative group">
                    <input 
                      required
                      value={formData.dosage}
                      onChange={e => setFormData({...formData, dosage: e.target.value})}
                      className="w-full bg-bg-main border-2 border-border-main rounded-3xl px-6 py-5 pr-14 text-lg font-bold text-text-primary focus:outline-none focus:border-primary transition-all group-hover:border-border-main/50"
                      placeholder="10mg"
                    />
                    <button
                      type="button"
                      onClick={() => startListening("dosage")}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all",
                        listeningField === "dosage" ? "bg-danger text-white shadow-lg shadow-danger/20 animate-pulse" : "bg-surface-main border border-border-main text-text-secondary hover:text-primary hover:scale-110"
                      )}
                    >
                      <Mic size={20} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60 px-2">Scheduled Intake</label>
                  <div className="relative group">
                    <Clock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                    <input 
                      required
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-bg-main border-2 border-border-main rounded-3xl pl-16 pr-6 py-5 text-lg font-black text-text-primary focus:outline-none focus:border-primary transition-all group-hover:border-border-main/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60 px-2">Current Stock</label>
                  <div className="relative group">
                    <Hash size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary" />
                    <input 
                      required
                      type="number"
                      value={formData.pillsRemaining}
                      onChange={e => setFormData({...formData, pillsRemaining: Number(e.target.value)})}
                      className="w-full bg-bg-main border-2 border-border-main rounded-3xl pl-16 pr-6 py-5 text-lg font-black text-text-primary focus:outline-none focus:border-primary transition-all group-hover:border-border-main/50"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60 px-2">Refill Alert At</label>
                  <div className="relative group">
                    <AlertCircle size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-warning" />
                    <input 
                      required
                      type="number"
                      value={formData.refillThreshold}
                      onChange={e => setFormData({...formData, refillThreshold: Number(e.target.value)})}
                      className="w-full bg-bg-main border-2 border-border-main rounded-3xl pl-16 pr-6 py-5 text-lg font-black text-text-primary focus:outline-none focus:border-primary transition-all group-hover:border-border-main/50"
                    />
                  </div>
                </div>
              </div>

              {/* Video Instruction Feature */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60 flex items-center gap-2">
                    <Video size={14} /> Intake Demonstration
                  </label>
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Optional AI Feature</span>
                </div>
                
                {!showCamera && !videoBase64 && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-10 border-2 border-dashed border-border-main rounded-[2.5rem] bg-bg-main/30 text-text-secondary hover:border-primary hover:bg-primary/5 hover:text-primary transition-all flex flex-col items-center gap-4 group shadow-inner"
                  >
                    <div className="w-16 h-16 rounded-full bg-bg-main border border-border-main flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                      <Video size={28} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black uppercase tracking-widest">Record Intake Tutorial</p>
                      <p className="text-[9px] opacity-50 uppercase tracking-widest mt-1">Help caregivers understand dosing</p>
                    </div>
                  </button>
                )}

                {showCamera && (
                  <div className="relative bg-black rounded-[2.5rem] overflow-hidden aspect-video shadow-2xl border-2 border-primary/20">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-x-0 bottom-6 flex justify-center gap-4">
                      {cameraMode === "video" ? (
                        !isRecording ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="bg-danger text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <Video size={28} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="bg-white text-danger w-16 h-16 rounded-full shadow-2xl flex items-center justify-center animate-pulse"
                          >
                            <StopCircle size={28} />
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={capturePhoto}
                          disabled={isScanning}
                          className="bg-primary text-black px-10 py-5 rounded-[2rem] shadow-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
                        >
                          {isScanning ? (
                            <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                          ) : (
                            <Camera size={20} />
                          )}
                          {isScanning ? "Processing AI..." : cameraMode === "prescription" ? "Analyze Prescription" : "Verify Pill"}
                        </button>
                      )}
                    </div>
                    {isScanning && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                         <div className="text-center space-y-4">
                            <Brain size={48} className="mx-auto text-black animate-bounce" />
                            <p className="text-sm font-black uppercase tracking-widest text-black">CareMate AI scanning...</p>
                         </div>
                      </div>
                    )}
                  </div>
                )}

                {videoBase64 && (
                  <div className="relative rounded-[2.5rem] overflow-hidden aspect-video group shadow-2xl border-2 border-primary/20">
                    <video src={videoBase64} controls className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setVideoBase64(null);
                        setVideoBlob(null);
                        startCamera();
                      }}
                      className="absolute top-4 right-4 p-4 bg-black/80 rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-danger hover:scale-110 active:scale-90"
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>
                )}
              </div>

              {interactionResult && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="p-8 bg-danger/10 border-2 border-danger/20 rounded-[2.5rem] space-y-4 shadow-xl"
                >
                  <div className="flex items-center gap-3 text-danger font-black text-xs uppercase tracking-widest">
                    <AlertCircle size={20} /> AI Interaction Warning
                  </div>
                  <p className="text-sm text-text-primary font-bold leading-relaxed">
                    {interactionResult.advice}
                  </p>
                  <ul className="text-xs space-y-2 opacity-80">
                    {interactionResult.warnings.map((w, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-danger font-black">•</span> {w}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setInteractionResult(null)}
                      className="flex-1 py-4 bg-bg-main border border-border-main rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all shadow-lg"
                    >
                      Modify Intake
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-danger text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-danger/20 hover:brightness-110 transition-all"
                      onClick={() => {}}
                    >
                      Ignore & Add
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-primary hover:brightness-110 disabled:opacity-50 text-black rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl shadow-primary/30 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>Register Medication <ChevronRight size={20} /></>
                  )}
                </button>
                <p className="text-center text-[9px] font-black uppercase tracking-widest text-text-secondary mt-6 opacity-40">
                  Data will be securely encrypted and synced to clinical cloud
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

