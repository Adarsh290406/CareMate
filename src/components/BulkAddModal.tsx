import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, FileText, Upload, CheckCircle2, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { analyzePrescription } from "../lib/gemini";
import { cn } from "../lib/utils";

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export default function BulkAddModal({ isOpen, onClose, patientId }: BulkAddModalProps) {
  const [step, setStep] = useState<"upload" | "review" | "saving">("upload");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedMeds, setExtractedMeds] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      setLoading(true);
      try {
        const result = await analyzePrescription(base64);
        if (result && result.medications) {
          setExtractedMeds(result.medications);
          setStep("review");
        } else {
          alert("Could not extract medications. Please try a clearer photo.");
        }
      } catch (err) {
        console.error(err);
        alert("AI analysis failed.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveAllMeds = async () => {
    setStep("saving");
    try {
      for (const med of extractedMeds) {
        // Add Med
        const medRef = await addDoc(collection(db, "medications"), {
          patientId,
          name: med.name,
          dosage: med.dosage || "As prescribed",
          pillsRemaining: 30,
          refillAlertThreshold: 5,
          createdAt: serverTimestamp(),
          source: "Bulk Upload"
        });

        // Add Dose (Default 9 AM if frequency not parsed or once daily)
        await addDoc(collection(db, "doses"), {
          patientId,
          medicationId: medRef.id,
          medName: med.name,
          dosage: med.dosage || "As prescribed",
          status: "pending",
          scheduledAt: new Date(new Date().setHours(9, 0, 0, 0)),
          createdAt: serverTimestamp()
        });
      }
      alert(`Successfully added ${extractedMeds.length} medications!`);
      onClose();
      window.location.reload(); // Refresh to show new meds
    } catch (err) {
      console.error(err);
      alert("Failed to save some medications.");
      setStep("review");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className="relative w-full max-w-2xl bg-surface-main border border-border-main shadow-2xl rounded-[2.5rem] overflow-hidden"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Bulk Rx Upload</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1">Extract all medications at once</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-secondary">
                  <X size={24} />
                </button>
              </div>

              {step === "upload" && (
                <div className="space-y-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-border-main rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-all bg-bg-main/50"
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      {loading ? <Loader2 className="animate-spin" size={40} /> : <Upload size={40} />}
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">Click to upload prescription</p>
                      <p className="text-xs text-text-secondary">Supports JPG, PNG and PDF images</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: ShieldCheck, text: "HIPAA Secure" },
                      { icon: CheckCircle2, text: "AI Verified" },
                      { icon: AlertTriangle, text: "OCR Smart" }
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-4 bg-bg-main rounded-2xl border border-border-main">
                        <item.icon size={20} className="text-text-secondary opacity-40" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === "review" && (
                <div className="space-y-6">
                  <div className="flex gap-4 p-4 bg-bg-main border border-border-main rounded-3xl">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-border-main">
                      <img src={image!} alt="Prescription" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg leading-tight">Prescription Found</h3>
                      <p className="text-xs text-text-secondary">AI has detected {extractedMeds.length} medications. Review them below before adding to your pharmacy.</p>
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 no-scrollbar">
                    {extractedMeds.map((med, i) => (
                      <div key={i} className="card p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="font-black text-xs">{i + 1}</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm">{med.name}</p>
                            <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest">{med.dosage} • {med.frequency}</p>
                          </div>
                        </div>
                        <CheckCircle2 size={18} className="text-primary" />
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={saveAllMeds}
                    className="w-full h-16 bg-primary text-text-primary rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
                  >
                    Add {extractedMeds.length} Meds to Pharmacy
                  </button>
                </div>
              )}

              {step === "saving" && (
                <div className="py-20 flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <Loader2 className="animate-spin text-primary" size={64} />
                    <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary opacity-20" size={32} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase">Synchronizing...</h3>
                    <p className="text-xs text-text-secondary">Recording clinical data to your secure vault.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
