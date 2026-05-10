import { useState, useEffect } from "react";
import { Mic, MicOff, Brain, Volume2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Dose } from "../hooks/useMedSchedule";
import { Medication } from "../hooks/useMedications";

interface VoiceAssistantProps {
  language?: "English" | "Hindi";
  doses?: Dose[];
  medications?: Medication[];
  patientId?: string;
}

export default function VoiceAssistant({ 
  language = "English", 
  doses = [], 
  medications = [],
  patientId
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Tap to ask about your meds");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const markMedTakenFunction: FunctionDeclaration = {
    name: "mark_med_taken",
    description: "Marks a specific medication as taken for the patient by matching the name.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        medName: {
          type: Type.STRING,
          description: "The name of the medication to mark as taken (e.g., 'Aspirin', 'Metformin').",
        },
      },
      required: ["medName"],
    },
  };

  const getMedInfoFunction: FunctionDeclaration = {
    name: "get_med_info",
    description: "Get information about a specific medication or general adherence.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        queryType: {
          type: Type.STRING,
          enum: ["next_dose", "adherence_summary", "dosage_info"],
          description: "The type of information requested.",
        },
        medName: {
          type: Type.STRING,
          description: "Optional medication name.",
        },
      },
      required: ["queryType"],
    },
  };

  const handleCommand = async (transcript: string) => {
    setIsProcessing(true);
    setStatus("Thinking...");

    try {
      const systemInstruction = `You are CareMate Voice Assistant. You help patients manage their medications.
      Patient ID: ${patientId}
      Current Meds: ${JSON.stringify(medications.map(m => ({ name: m.name, dosage: m.dosage })))}
      Remaining Doses: ${JSON.stringify(doses.filter(d => d.status === "pending").map(d => ({ name: d.medName, time: d.scheduledAt.toDate().toLocaleTimeString() })))}
      
      CRITICAL: Respond in ${language}. If Hindi, use Devanagari.
      If the user wants to mark a med as taken, use mark_med_taken.
      If they ask about their schedule, use get_med_info.`;

      const res = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: transcript,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [markMedTakenFunction, getMedInfoFunction] }],
        },
      });

      const functionCalls = res.functionCalls;
      let finalResponse = res.text || "";

      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === "mark_med_taken") {
            const medName = (call.args as any).medName;
            const pendingDose = doses.find(d => d.status === "pending" && d.medName?.toLowerCase().includes(medName.toLowerCase()));
            
            if (pendingDose) {
              await updateDoc(doc(db, "doses", pendingDose.id), {
                status: "taken",
                takenAt: serverTimestamp()
              });
              
              if (pendingDose.medId) {
                 const medRef = doc(db, "medications", pendingDose.medId);
                 const medSnap = await getDoc(medRef);
                 if (medSnap.exists()) {
                   await updateDoc(medRef, {
                     pillsRemaining: Math.max(0, (medSnap.data().pillsRemaining || 1) - 1)
                   });
                 }
              }
              finalResponse = language === "English" 
                ? `Done! I've marked your ${pendingDose.medName} as taken.` 
                : `ठीक है! मैंने आपकी ${pendingDose.medName} दवा को ले लिया गया मार्क कर दिया है।`;
            } else {
              finalResponse = language === "English"
                ? `I couldn't find a pending dose for ${medName}.`
                : `मुझे ${medName} के लिए कोई लंबित खुराक नहीं मिली।`;
            }
          }
        }
      }

      setResponse(finalResponse);
      speak(finalResponse);
      setStatus("Tap to ask again");
    } catch (err) {
      console.error(err);
      setStatus("Error processing voice command");
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "English" ? "en-US" : "hi-IN";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("Listening...");
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setStatus(`"${transcript}"`);
      setIsListening(false);
      handleCommand(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setStatus("Something went wrong");
    };

    recognition.start();
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "English" ? "en-US" : "hi-IN";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-gradient-to-br from-primary-accent via-indigo-600 to-primary-accent rounded-3xl p-6 flex flex-col gap-4 shadow-2xl shadow-primary-accent/30 relative overflow-hidden group">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] opacity-50" />
      
      <div className="flex items-center justify-between z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
              <Brain size={12} className="text-white" />
            </div>
            <h4 className="font-bold text-white tracking-tight text-sm">CareMate Voice</h4>
          </div>
          <p className="text-[10px] text-white/70 uppercase font-black tracking-widest">
            {isListening ? "Listening..." : isProcessing ? "Processing..." : t_voice("status_idle", language)}
          </p>
        </div>
        <button
          onClick={startListening}
          disabled={isListening || isProcessing}
          className={cn(
            "w-14 h-14 bg-white rounded-full flex items-center justify-center text-primary-accent shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50",
            isListening && "animate-pulse ring-8 ring-white/20"
          )}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {response && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10"
          >
            <div className="flex items-start gap-3">
               <Volume2 size={14} className="text-white/60 mt-1 shrink-0" />
               <p className="text-sm text-white/90 font-medium leading-relaxed">
                 {response}
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!response && !isListening && !isProcessing && (
        <div className="grid grid-cols-2 gap-2 z-10">
          {["Mark Aspirin as taken", "When is my next dose?"].map((hint, i) => (
            <div key={i} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] text-white/60 font-medium text-center">
               "{hint}"
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple translation helper for local usage if i18n not imported
function t_voice(key: string, lang: string) {
  const dict: any = {
    English: { status_idle: "Ask about your schedule" },
    Hindi: { status_idle: "अपने शेड्यूल के बारे में पूछें" }
  };
  return dict[lang][key] || key;
}
