import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import { Send, X, User, Heart, Video } from "lucide-react";
import { cn, formatDate } from "../lib/utils";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

export default function ChatThread({ patient, onClose }: { patient: any, onClose: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Derive chatId: combined sorted UIDs
  const chatId = [user?.uid, patient.id].sort().join("_");

  useEffect(() => {
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const tempText = inputText;
    setInputText("");

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        senderId: user.uid,
        text: tempText,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="p-6 glass flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-accent/20 flex items-center justify-center border border-primary-accent/30">
            <User className="text-primary-accent" />
          </div>
          <div>
            <h2 className="font-bold text-xl">{patient.name}</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-success uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Live Support
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.open(`https://meet.jit.si/CareMate_${[user?.uid, patient.id].sort().join("_")}`, '_blank')}
            className="p-3 glass rounded-full hover:bg-white/10 transition-colors text-primary-accent"
            title="Video Call"
          >
            <Video size={24} />
          </button>
          <button onClick={onClose} className="p-3 glass rounded-full hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: isMe ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex flex-col max-w-[80%]",
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl font-medium",
                isMe ? "bg-primary-accent text-white rounded-br-none" : "glass rounded-bl-none"
              )}>
                {msg.text}
              </div>
              <span className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-widest">
                {formatDate(msg.timestamp)}
              </span>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-6 border-t border-white/5 bg-background">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-16 focus:outline-none focus:border-primary-accent/50 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 w-12 bg-primary-accent hover:bg-primary-accent/90 rounded-xl flex items-center justify-center text-white transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
