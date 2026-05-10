import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Mic, Sparkles, ChevronRight, Paperclip, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";

import { chatWithAI } from "../lib/gemini";

interface Message {
  id: string;
  text: string;
  sender: "ai" | "user";
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const welcomeMessages: Message[] = [
    { id: '1', text: "Welcome to CareMate AI. I'm here to help with your medications and recovery.", sender: "ai", timestamp: new Date() },
  ];

  useEffect(() => {
    setMessages(welcomeMessages);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: "user", timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    
    setIsTyping(true);
    try {
      const history = messages.map(m => ({ text: m.text, sender: m.sender }));
      const aiResponse = await chatWithAI(currentInput, history);
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: aiResponse || "I'm processed that, but couldn't generate a text response.", 
        sender: "ai", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ai flex items-center justify-center text-white shadow-lg shadow-ai/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tighter">Health AI</h1>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)]">Online Assistant</span>
            </div>
          </div>
        </div>
        <button className="p-2 text-[var(--text-secondary)]">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-4">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
              "max-w-[85%] flex flex-col gap-1",
              msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "px-4 py-3 rounded-2xl text-[14px] leading-relaxed font-medium shadow-sm",
              msg.sender === "user" 
                ? "bg-primary text-white rounded-tr-none" 
                : "bg-surface text-[var(--text-primary)] border border-[var(--border)] rounded-tl-none shadow-ai/5"
            )}>
              {msg.text}
            </div>
            <span className="text-[9px] font-mono font-bold opacity-30 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        ))}
        {isTyping && (
          <div className="mr-auto px-4 py-3 bg-surface border border-[var(--border)] rounded-2xl rounded-tl-none flex gap-1">
            <div className="w-1.5 h-1.5 bg-ai/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-ai/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-ai/40 rounded-full animate-bounce" />
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {["Tell me about side effects", "What's my next dose?", "I feel dizzy"].map((chip) => (
            <button 
              key={chip} 
              onClick={() => setInput(chip)}
              className="px-4 py-2 bg-ai/5 text-ai border border-ai/10 rounded-full text-[10px] font-bold whitespace-nowrap active:scale-95 transition-transform"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="card bg-[var(--surface)] p-2 flex items-center gap-2 border-[var(--border)]">
          <button className="p-2 text-[var(--text-secondary)] hover:text-primary transition-colors">
            <Paperclip size={20} />
          </button>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent py-2 text-[14px] focus:outline-none placeholder:text-[var(--text-secondary)]/50"
          />
          <div className="flex items-center gap-1">
            <button className="p-2 text-[var(--text-secondary)]">
              <Mic size={20} />
            </button>
            <button 
              onClick={sendMessage}
              disabled={!input.trim()}
              className={cn(
                "p-2 rounded-xl transition-all",
                input.trim() ? "bg-primary text-white scale-100 shadow-lg shadow-primary/25" : "bg-[var(--bg)] text-[var(--text-secondary)] scale-90"
              )}
            >
              <Send size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
