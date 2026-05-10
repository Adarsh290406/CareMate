import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Image, Mic, ChevronLeft, MoreVertical, CheckCheck, Smile } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../lib/utils";

export default function FamilyChat() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! Did you take your morning Metformin?", sender: "other", time: "08:30 AM" },
    { id: 2, text: "Yes, just took it with breakfast. Thanks for the reminder!", sender: "me", time: "08:32 AM" },
    { id: 3, text: "Great! Your adherence score looks good today.", sender: "other", time: "08:35 AM" },
  ]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMessage = {
      id: Date.now(),
      text: message,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-dark-primary safe-area-bottom">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/5 bg-dark-elevated">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
               <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black">
                  E
               </div>
               <div>
                  <h2 className="font-bold text-white leading-none">Elena Gilbert</h2>
                  <p className="text-[10px] font-bold text-safe uppercase mt-1">Online</p>
               </div>
            </div>
         </div>
         <button className="p-2 text-zinc-500">
            <MoreVertical size={20} />
         </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
         {messages.map((msg) => (
           <motion.div 
             key={msg.id}
             initial={{ opacity: 0, y: 10, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             className={cn(
               "flex flex-col max-w-[80%]",
               msg.sender === "me" ? "ml-auto items-end" : "items-start"
             )}
           >
              <div className={cn(
                "p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-lg",
                msg.sender === "me" ? "bg-primary text-black rounded-tr-none" : "bg-white/5 text-white rounded-tl-none border border-white/10"
              )}>
                 {msg.text}
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                 <span className="text-[9px] font-bold text-zinc-500">{msg.time}</span>
                 {msg.sender === "me" && <CheckCheck size={12} className="text-primary" />}
              </div>
           </motion.div>
         ))}
         <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 pt-2 bg-dark-primary">
         <div className="flex items-center gap-2 p-2 bg-dark-elevated border border-white/10 rounded-[2rem] shadow-2xl">
            <button className="p-3 text-zinc-500 hover:text-white transition-colors">
               <Smile size={22} />
            </button>
            <input 
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none outline-none text-white text-sm font-medium py-2 px-2"
            />
            <button className="p-3 text-zinc-500 hover:text-white transition-colors">
               <Image size={22} />
            </button>
            <button 
              onClick={handleSend}
              className={cn(
                "p-3 rounded-full transition-all",
                message.trim() ? "bg-primary text-black scale-110 shadow-lg shadow-primary/20" : "bg-white/5 text-zinc-600"
              )}
            >
               <Send size={20} />
            </button>
         </div>
      </div>
    </div>
  );
}
