import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Image, Mic, ChevronLeft, MoreVertical, CheckCheck, Smile, MessageCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { 
  collection, addDoc, query, where, 
  onSnapshot, serverTimestamp, doc, getDoc 
} from "firebase/firestore";

export default function FamilyChat() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    if (!memberId || !user) return;

    // Fetch the other user's profile
    const fetchOtherUser = async () => {
      const snap = await getDoc(doc(db, "users", memberId));
      if (snap.exists()) {
        setOtherUser({ id: snap.id, ...snap.data() });
      }
    };
    fetchOtherUser();

    // Determine the patientId used for the alert-based chat
    // If I am the caregiver, the patientId is memberId. 
    // If I am the patient, the patientId is user.uid.
    const chatRefId = (otherUser?.role === "caregiver") ? user.uid : memberId;

    const participants = [user.uid, memberId].sort();
    const chatRoomId = participants.join("_");

    const q = query(
      collection(db, "alerts"),
      where("patientId", "==", chatRefId),
      where("type", "==", "chat_message")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((d: any) => d.metadata?.chatRoomId === chatRoomId);
      
      docs.sort((a: any, b: any) => {
        const t1 = a.createdAt?.toMillis?.() || Date.now();
        const t2 = b.createdAt?.toMillis?.() || Date.now();
        return t1 - t2;
      });
      setMessages(docs);
    }, (error) => {
      console.error("Chat Error:", error);
    });

    return () => unsubscribe();
  }, [memberId, user, otherUser?.role]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !user || !memberId) return;
    
    const participants = [user.uid, memberId].sort();
    const chatRoomId = participants.join("_");
    const chatRefId = (otherUser?.role === "caregiver") ? user.uid : memberId;

    const textToSend = message.trim();
    setMessage("");

    try {
      await addDoc(collection(db, "alerts"), {
        patientId: chatRefId,
        type: "chat_message",
        priority: "low",
        message: textToSend,
        read: false,
        createdAt: serverTimestamp(),
        metadata: {
          senderId: user.uid,
          receiverId: memberId,
          chatRoomId
        }
      });
    } catch (err: any) {
      console.error("Send error:", err);
      alert("Failed to send: " + (err.message || "Please check your connection"));
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-bg-main overflow-hidden z-[200]">
      {/* Header */}
      <header className="shrink-0 p-4 pt-safe flex items-center justify-between border-b border-border-main bg-surface-main/80 backdrop-blur-md z-10">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-text-primary">
               <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black">
                  {otherUser?.name?.[0] || "P"}
               </div>
                <div>
                   <h2 className="font-bold text-text-primary leading-none">{otherUser?.name || "Loading..."}</h2>
                   <p className="text-[10px] font-bold text-safe uppercase mt-1">Online</p>
                </div>
            </div>
         </div>
         <button className="p-2 text-zinc-500">
            <MoreVertical size={20} />
         </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
         {messages.length === 0 && (
           <div className="flex flex-col items-center justify-center h-full opacity-20 text-center space-y-4">
              <MessageCircle size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest">No messages yet. Say hello!</p>
           </div>
         )}
         {messages.map((msg) => {
           const isMe = msg.metadata?.senderId === user?.uid;
           const time = msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";

           return (
             <motion.div 
               key={msg.id}
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               className={cn(
                 "flex flex-col max-w-[80%]",
                 isMe ? "ml-auto items-end" : "items-start"
               )}
             >
                <div className={cn(
                  "p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-lg",
                  isMe ? "bg-primary text-black rounded-tr-none" : "bg-surface-main text-text-primary rounded-tl-none border border-border-main"
                )}>
                   {msg.message}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                   <span className="text-[9px] font-bold text-zinc-500">{time}</span>
                   {isMe && <CheckCheck size={12} className="text-primary" />}
                </div>
             </motion.div>
           );
         })}
         <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-main via-bg-main to-transparent">
         <div className="flex items-center gap-2 p-2 bg-surface-main/90 backdrop-blur-xl border border-border-main rounded-[2rem] shadow-2xl">
            <button className="p-3 text-text-secondary hover:text-text-primary transition-colors">
               <Smile size={22} />
            </button>
            <input 
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm font-medium py-2 px-2 placeholder:text-text-secondary/40"
            />
            <button className="p-3 text-text-secondary hover:text-text-primary transition-colors">
               <Image size={22} />
            </button>
            <button 
              onClick={handleSend}
              className={cn(
                "p-3 rounded-full transition-all",
                message.trim() ? "bg-primary text-black scale-110 shadow-lg shadow-primary/20" : "bg-bg-main border border-border-main text-text-secondary/40"
              )}
            >
               <Send size={20} />
            </button>
         </div>
      </div>
    </div>
  );
}
