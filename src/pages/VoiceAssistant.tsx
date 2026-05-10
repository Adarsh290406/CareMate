import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Brain, ChevronLeft, Activity, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMedSchedule } from "../hooks/useMedSchedule";
import { chatWithAI } from "../lib/gemini";
import { cn } from "../lib/utils";

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { doses } = useMedSchedule(user?.uid);
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const current = event.results[event.results.length - 1][0].transcript;
      setTranscript(current);
      
      if (event.results[event.results.length - 1].isFinal) {
        handleVoiceCommand(current);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognitionRef.current?.stop();
      synthRef.current.cancel();
    };
  }, []);

  const handleVoiceCommand = async (command: string) => {
    setIsAnalyzing(true);
    try {
      const context = `The patient's current schedule is: ${JSON.stringify(doses.map(d => ({ med: d.medName, time: d.time, status: d.status })))}. 
      Respond to the following query concisely: "${command}"`;
      
      const aiResponse = await chatWithAI(context, []);
      setResponse(aiResponse);
      speak(aiResponse);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speak = (text: string) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      setResponse("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-between safe-area-bottom">
      <header className="w-full flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-ai animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ai">CareMate Voice AI</span>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12 w-full max-w-sm">
        {/* Visualizer */}
        <div className="relative w-64 h-64 flex items-center justify-center">
           <AnimatePresence>
             {(isListening || isSpeaking || isAnalyzing) && (
               <>
                 <motion.div 
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: 1.5, opacity: 0.2 }}
                   exit={{ scale: 0.5, opacity: 0 }}
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="absolute inset-0 rounded-full bg-ai"
                 />
                 <motion.div 
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: 1.2, opacity: 0.4 }}
                   exit={{ scale: 0.5, opacity: 0 }}
                   transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                   className="absolute inset-0 rounded-full bg-primary"
                 />
               </>
             )}
           </AnimatePresence>
           
           <div className={cn(
             "relative z-10 w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500",
             isListening ? "bg-danger shadow-danger/40 scale-110" : "bg-ai shadow-ai/40"
           )}>
              {isListening ? <MicOff size={48} /> : <Mic size={48} />}
           </div>
        </div>

        <div className="text-center space-y-6 w-full">
           <div className="min-h-[60px] space-y-2">
             {transcript && (
               <p className="text-sm font-medium text-text-secondary italic">"{transcript}"</p>
             )}
             {isAnalyzing && (
               <div className="flex justify-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-ai animate-bounce" />
                  <div className="w-1 h-1 rounded-full bg-ai animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 rounded-full bg-ai animate-bounce [animation-delay:0.4s]" />
               </div>
             )}
             {response && !isAnalyzing && (
               <motion.p 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="text-lg font-bold tracking-tight leading-snug"
               >
                 {response}
               </motion.p>
             )}
           </div>

           <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 justify-center">
                 <Sparkles size={14} className="text-ai" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Try Saying</span>
              </div>
              <div className="flex flex-col gap-2">
                 {["What medications are due?", "Summarize my health stats", "Mark my morning dose taken"].map((hint) => (
                   <button 
                     key={hint} 
                     onClick={() => handleVoiceCommand(hint)}
                     className="py-2 text-[11px] font-bold text-ai/80 hover:text-ai transition-colors"
                   >
                     "{hint}"
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <footer className="w-full pb-8">
        <button 
          onClick={toggleListening}
          className={cn(
            "w-full h-20 rounded-full font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all",
            isListening ? "bg-white text-danger" : "bg-ai text-white"
          )}
        >
          {isListening ? "Tap to Stop" : "Tap to Speak"}
        </button>
      </footer>
    </div>
  );
}
