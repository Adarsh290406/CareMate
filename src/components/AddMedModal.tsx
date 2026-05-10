import React, { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { checkMedsInteraction } from "../lib/gemini";
import { useMedications } from "../hooks/useMedications";
import { motion, AnimatePresence } from "motion/react";
import { X, Pill, Clock, Hash, AlertCircle, Mic, Video, StopCircle, RotateCcw, Play, Camera } from "lucide-react";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md dense-card p-6 bg-surface border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Pill className="text-primary-accent" size={20} />
                New Medication
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => startCamera("prescription")}
                  className="p-1 px-2 bg-primary-accent/10 text-primary-accent rounded-lg border border-primary-accent/20 hover:bg-primary-accent/20 transition-all flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest"
                >
                  <Camera size={12} /> Scan Rx
                </button>
                <button 
                  type="button"
                  onClick={() => startCamera("scan")}
                  className="p-1 px-2 bg-primary-accent/10 text-primary-accent rounded-lg border border-primary-accent/20 hover:bg-primary-accent/20 transition-all flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest"
                >
                  <Camera size={12} /> Scan Pill
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors ml-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Drug Name</label>
                <div className="relative">
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary-accent/50"
                    placeholder="e.g., Lisinopril"
                  />
                  <button
                    type="button"
                    onClick={() => startListening("name")}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                      listeningField === "name" ? "bg-danger text-white animate-pulse" : "text-text-muted hover:bg-white/10"
                    )}
                  >
                    <Mic size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Dosage</label>
                  <div className="relative">
                    <input 
                      required
                      value={formData.dosage}
                      onChange={e => setFormData({...formData, dosage: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary-accent/50"
                      placeholder="10mg"
                    />
                    <button
                      type="button"
                      onClick={() => startListening("dosage")}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                        listeningField === "dosage" ? "bg-danger text-white animate-pulse" : "text-text-muted hover:bg-white/10"
                      )}
                    >
                      <Mic size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Next Time</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      required
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary-accent/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Stock Level</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      required
                      type="number"
                      value={formData.pillsRemaining}
                      onChange={e => setFormData({...formData, pillsRemaining: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary-accent/50"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Refill Threshold</label>
                  <div className="relative">
                    <AlertCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      required
                      type="number"
                      value={formData.refillThreshold}
                      onChange={e => setFormData({...formData, refillThreshold: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary-accent/50"
                    />
                  </div>
                </div>
              </div>

              {/* Video Instruction Feature (Feature 17) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <Video size={12} /> Demonstration Video
                </label>
                
                {!showCamera && !videoBase64 && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-text-muted hover:border-primary-accent/50 hover:text-primary-accent transition-all flex flex-col items-center gap-2"
                  >
                    <Video size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Record Intake Demo</span>
                  </button>
                )}

                {showCamera && (
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                      {cameraMode === "video" ? (
                        !isRecording ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="bg-danger text-white p-3 rounded-full shadow-lg"
                          >
                            <Video size={20} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="bg-white text-danger p-3 rounded-full shadow-lg animate-pulse"
                          >
                            <StopCircle size={20} />
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={capturePhoto}
                          disabled={isScanning}
                          className="bg-primary-accent text-white px-6 py-3 rounded-full shadow-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                        >
                          {isScanning ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Camera size={16} />
                          )}
                          {isScanning ? "Identifying..." : cameraMode === "prescription" ? "Scan Prescription" : "Identify Pill"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {videoBase64 && (
                  <div className="relative rounded-xl overflow-hidden aspect-video group">
                    <video src={videoBase64} controls className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setVideoBase64(null);
                        setVideoBlob(null);
                        startCamera();
                      }}
                      className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )}
              </div>

              {interactionResult && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="p-4 bg-danger/10 border border-danger/20 rounded-xl space-y-2"
                >
                  <div className="flex items-center gap-2 text-danger font-black text-[10px] uppercase tracking-widest">
                    <AlertCircle size={14} /> AI Interaction Warning
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {interactionResult.advice}
                  </p>
                  <ul className="text-[10px] space-y-1">
                    {interactionResult.warnings.map((w, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-danger">•</span> {w}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setInteractionResult(null)}
                      className="text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white"
                    >
                      Wait, let me change
                    </button>
                    <button 
                      type="submit"
                      className="text-[9px] font-black uppercase tracking-widest text-danger underline"
                      onClick={() => { /* Skipping check will happen next time because interactionResult is truthfully set */ }}
                    >
                      I understand, add anyway
                    </button>
                  </div>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary-accent hover:brightness-110 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-primary-accent/20 mt-4"
              >
                {loading ? "Registering Med..." : "Commit Medication Record"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

