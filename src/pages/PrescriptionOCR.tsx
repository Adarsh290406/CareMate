import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Upload, CheckCircle, AlertTriangle, ChevronLeft, 
  Sparkles, Brain, Info, RefreshCcw, Image as ImageIcon,
  Pill, Clock, Calendar, Plus, Save
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { analyzePrescription } from "../lib/gemini";
import { cn } from "../lib/utils";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

export default function PrescriptionOCR() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeOCR = async () => {
    if (!image || loading) return;
    setLoading(true);
    try {
      const base64 = image.split(',')[1];
      const res = await analyzePrescription(base64);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveMedications = async () => {
    if (!result || !user?.uid || saving) return;
    setSaving(true);
    try {
      for (const med of result.medications) {
        await addDoc(collection(db, "medications"), {
          userId: user.uid,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          pillsRemaining: 30, // Default
          refillAlertThreshold: 5,
          color: "primary",
          icon: "Pill",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      navigate('/meds');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main p-6 safe-area-bottom pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-surface-main border border-border-main rounded-xl text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-text-primary">OCR Smart Scanner</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center text-success mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-text-primary">Prescription AI</h2>
          <p className="text-text-secondary text-sm font-medium">
            Scan physical prescriptions to auto-import your medications.
          </p>
        </section>

        {!result ? (
          <div className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "aspect-[3/4] w-full rounded-[3rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden",
                image ? "border-success/50" : "border-border-main hover:border-success/30 bg-surface-main"
              )}
            >
              {image ? (
                <img src={image} alt="Prescription" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                     <Upload size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60 text-center px-8">
                    Place your prescription on a flat surface with good lighting
                  </p>
                </>
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleCapture}
            />

            <button 
              onClick={analyzeOCR}
              disabled={!image || loading}
              className="w-full h-16 bg-success text-black rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-success/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <RefreshCcw size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {loading ? "Digitizing..." : "Extract Medications"}
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
             <div className="card p-8 border-success/20 bg-success/5 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-success/20 text-success flex items-center justify-center">
                       <CheckCircle size={32} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black uppercase italic leading-none text-text-primary">Extraction Successful</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-success mt-1">{result.medications.length} Medications Found</p>
                    </div>
                 </div>

                <div className="space-y-4">
                    {result.medications.map((med: any, i: number) => (
                      <div key={i} className="p-5 bg-surface-main rounded-[2rem] border border-border-main space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-bg-main border border-border-main flex items-center justify-center text-success">
                                  <Pill size={20} />
                               </div>
                               <span className="font-black text-text-primary">{med.name}</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-text-secondary opacity-60">{med.dosage}</span>
                         </div>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2">
                              <Clock size={12} className="text-zinc-500" />
                              <span className="text-[10px] font-bold text-zinc-400">{med.frequency}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <Calendar size={12} className="text-zinc-500" />
                              <span className="text-[10px] font-bold text-zinc-400">{med.duration || 'Long term'}</span>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

                 <div className="p-4 bg-surface-main rounded-2xl border border-border-main flex gap-3 items-center">
                    <Brain className="text-success shrink-0" size={16} />
                    <p className="text-[9px] font-medium text-text-secondary">
                      AI identified these medications from the image. Please verify each one before saving.
                    </p>
                 </div>
             </div>

              <div className="flex gap-3">
                 <button 
                   onClick={() => setResult(null)} 
                   className="flex-1 h-14 bg-surface-main border border-border-main text-text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                 >
                   Discard
                 </button>
                 <button 
                   onClick={saveMedications}
                   disabled={saving}
                   className="flex-1 h-14 bg-success text-black rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-success/20 flex items-center justify-center gap-2"
                 >
                    {saving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving..." : "Import List"}
                 </button>
              </div>
          </motion.div>
        )}

        <div className="p-6 bg-info/5 rounded-3xl border border-info/10 flex gap-4 items-start">
          <div className="p-2 bg-info/10 text-info rounded-lg mt-1">
            <Info size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">OCR Accuracy</h4>
            <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
              Handwritten prescriptions can be difficult for AI to read with 100% accuracy. Always double-check the dosages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
