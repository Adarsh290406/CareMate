import React from "react";
import { motion } from "motion/react";
import { Search, Brain, BookOpen, ChevronRight, Sparkles, AlertCircle, Info, Bookmark, ExternalLink, MessageSquare } from "lucide-react";
import MedEncyclopedia from "../components/MedEncyclopedia";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Knowledge() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Medical Knowledge</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-1">AI-Powered Medication Encyclopedia</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="space-y-1">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">AI Learning Assistant</h4>
             <p className="text-sm font-medium leading-relaxed">
               Search for any medication to understand its purpose, side effects, and precautions in simple terms.
             </p>
          </div>
        </div>
      </header>

      {/* Main Encyclopedia Search */}
      <section className="space-y-4">
        <MedEncyclopedia />
      </section>

      {/* Recommended Topics */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] px-1">Common Questions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { q: "How to manage blood pressure?", icon: AlertCircle },
            { q: "What is Type 2 Diabetes?", icon: Info },
            { q: "Interactions: Alcohol & Meds", icon: Bookmark },
            { q: "Vitamin Supplements 101", icon: Sparkles }
          ].map((topic, i) => (
            <div key={i} className="card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-[var(--text-secondary)] group-hover:text-primary transition-colors">
                   <topic.icon size={16} />
                 </div>
                 <span className="text-sm font-bold">{topic.q}</span>
               </div>
               <ExternalLink size={14} className="text-text-muted" />
            </div>
          ))}
        </div>
      </section>

      {/* Glossary / Fact Card */}
      <section className="bg-surface border border-border rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Brain size={120} />
        </div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Daily Medical Fact</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight leading-snug">
            Did you know that taking certain medications with grapefruit juice can interfere with how your body absorbs them?
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            Grapefruit contains compounds that block an enzyme responsible for breaking down many common drugs, leading to potentially dangerous levels in the bloodstream.
          </p>
          <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
            Read more in our blog <ChevronRight size={12} />
          </button>
        </div>
      </section>
      
      <button 
        onClick={() => navigate("/chat")}
        className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center animate-bounce-subtle z-40 transition-transform active:scale-90"
      >
        <MessageSquare size={32} strokeWidth={2.5} />
      </button>
    </div>
  );
}
