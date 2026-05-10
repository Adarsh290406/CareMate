import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import { Send, X, MessageSquare, Shield, Video } from "lucide-react";
import { cn } from "../lib/utils";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string; // The person we are talking to
  targetName: string;
}

export default function ChatModal({ isOpen, onClose, targetId, targetName }: ChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    if (!targetId) {
      setMessages([]);
      return;
    }

    // Chat ID is alphabetical sorted UIDs to ensure uniqueness between two people
    const chatId = [user.uid, targetId].sort().join("_");

    const q = query(
      collection(db, "chats"),
      where("chatId", "==", chatId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setMessages(docs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, (error) => {
      console.error("Chat fetch error:", error);
    });

    return () => unsubscribe();
  }, [isOpen, user, targetId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !targetId) return;

    const chatId = [user.uid, targetId].sort().join("_");
    const text = newMessage;
    setNewMessage("");

    try {
      await addDoc(collection(db, "chats"), {
        chatId,
        senderId: user.uid,
        text,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Chat send error:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 pointer-events-none">
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-full max-w-sm h-[600px] dense-card flex flex-col shadow-2xl pointer-events-auto overflow-hidden bg-surface border border-white/10"
          >
            {/* Header */}
            <div className="p-4 bg-primary-accent text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">{targetName}</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-80 flex items-center gap-1">
                    <Shield size={10} /> Secure Clinical Node
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(`https://meet.jit.si/CareMate_${[user?.uid, targetId].sort().join("_")}`, '_blank')}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                  title="Video Call"
                >
                  <Video size={18} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/50">
              {!targetId ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                  <MessageSquare size={48} className="mb-4" />
                  <p className="font-bold">No Contact Linked</p>
                  <p className="text-xs mt-2">Connect with a caregiver or patient to enable secure clinical messaging.</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-30">
                  <p className="text-xs uppercase tracking-[0.2em] font-black">Private Channel Established</p>
                </div>
              ) : messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.senderId === user?.uid ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                    msg.senderId === user?.uid 
                      ? "bg-primary-accent text-white rounded-tr-none" 
                      : "bg-surface border border-white/5 text-white/90 rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-text-muted mt-1 uppercase font-bold tracking-widest">
                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-surface border-t border-white/5 flex gap-2">
              <input 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary-accent/50"
              />
              <button 
                type="submit"
                className="p-2 bg-primary-accent text-white rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary-accent/20"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
