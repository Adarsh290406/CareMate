import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { t } from "../lib/i18n";
import { motion, AnimatePresence } from "motion/react";
import { X, Volume2, Smartphone, Play, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface ReminderSettingsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  language: "English" | "Hindi";
  currentSettings?: {
    sound?: string;
    vibration?: string;
  };
}

const SOUNDS = [
  { id: "default", name: "Modern Chime" },
  { id: "bell", name: "Clinic Bell" },
  { id: "digital", name: "Digital Pulse" },
  { id: "peaceful", name: "Zen Morning" },
];

const VIBRATIONS = [
  { id: "default", name: "Standard", pattern: [200, 100, 200] },
  { id: "heartbeat", name: "Heartbeat", pattern: [200, 100, 400, 100, 200] },
  { id: "urgent", name: "Urgent", pattern: [500, 100, 500, 100, 500] },
  { id: "gentle", name: "Gentle", pattern: [50, 50, 50, 50, 50] },
];

export default function ReminderSettingsModal({ userId, isOpen, onClose, language, currentSettings }: ReminderSettingsModalProps) {
  const [sound, setSound] = useState(currentSettings?.sound || "default");
  const [vibration, setVibration] = useState(currentSettings?.vibration || "default");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setSound(currentSettings.sound || "default");
      setVibration(currentSettings.vibration || "default");
    }
  }, [currentSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        reminderSettings: { sound, vibration }
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const testVibration = (type: string) => {
    const pattern = VIBRATIONS.find(v => v.id === type)?.pattern;
    if (pattern && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[90%] max-w-md bg-surface rounded-[32px] p-8 border border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">{t("reminder_settings", language)}</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Sound Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <Volume2 size={14} /> {t("reminder_sound", language)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SOUNDS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSound(s.id)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all relative group",
                        sound === s.id 
                          ? "bg-primary-accent/10 border-primary-accent text-primary-accent" 
                          : "bg-white/5 border-white/5 text-text-muted hover:border-white/10"
                      )}
                    >
                      <span className="text-xs font-bold block">{s.name}</span>
                      {sound === s.id && (
                        <Check size={12} className="absolute top-2 right-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibration Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <Smartphone size={14} /> {t("vibration_pattern", language)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {VIBRATIONS.map((v) => (
                    <div key={v.id} className="relative group">
                      <button
                        onClick={() => {
                          setVibration(v.id);
                          testVibration(v.id);
                        }}
                        className={cn(
                          "w-full p-4 rounded-2xl border text-left transition-all",
                          vibration === v.id 
                            ? "bg-success/10 border-success text-success" 
                            : "bg-white/5 border-white/5 text-text-muted hover:border-white/10"
                        )}
                      >
                        <span className="text-xs font-bold block">{v.name}</span>
                        {vibration === v.id && (
                          <Check size={12} className="absolute top-2 right-2" />
                        )}
                      </button>
                      <button 
                        onClick={() => testVibration(v.id)}
                        className="absolute bottom-2 right-2 p-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
                        title={t("test_reminder", language)}
                      >
                        <Play size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full p-5 bg-primary-accent text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-accent/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : t("save_settings", language)}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
