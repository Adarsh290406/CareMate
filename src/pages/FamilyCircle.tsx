import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, UserPlus, Heart, Shield, Activity, 
  ChevronRight, MessageSquare, Phone, Plus, X, 
  CheckCircle, AlertTriangle, Sparkles, MapPin, 
  MoreVertical, Link as LinkIcon, Video
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "../lib/utils";

export default function FamilyCircle() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("members");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("caregiver");
  
  const members = [
    { id: "1", name: "Elena Gilbert", role: "Primary Caregiver", status: "online", adherence: 94, relationship: "Daughter" },
    { id: "2", name: "Jeremy Gilbert", role: "Family Member", status: "offline", adherence: null, relationship: "Son" },
    { id: "3", name: "Dr. Alaric", role: "Healthcare Provider", status: "online", adherence: null, relationship: "Doctor" },
  ];

  const handleInvite = async () => {
    if (!inviteEmail || !user?.uid) return;
    try {
      // In a real app, we'd send an email invitation and create a connection record
      alert(`Invitation sent to ${inviteEmail} as ${inviteRole}`);
      setShowInviteModal(false);
      setInviteEmail("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary p-6 safe-area-bottom pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl">
          <ChevronRight className="rotate-180" size={24} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Care Circle</h1>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="p-2 bg-primary/10 text-primary rounded-xl"
        >
          <UserPlus size={24} />
        </button>
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
             <Heart size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-white">Family Monitoring</h2>
          <p className="text-text-secondary text-sm font-medium">
            Your trusted circle can monitor your adherence and help in emergencies.
          </p>
        </section>

        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
          {["Members", "Permissions", "Logs"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.toLowerCase() ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
           {members.map((member) => (
             <motion.div 
               key={member.id}
               className="card p-5 group hover:border-primary/20 transition-all flex items-center justify-between"
             >
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white font-black">
                         {member.name[0]}
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-elevated",
                        member.status === "online" ? "bg-safe" : "bg-zinc-600"
                      )} />
                   </div>
                   <div>
                      <h3 className="font-bold text-white tracking-tight">{member.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{member.relationship} • {member.role}</p>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => navigate(`/family-chat/${member.id}`)}
                     className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-primary transition-colors"
                   >
                      <MessageSquare size={18} />
                   </button>
                   <button className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-primary transition-colors">
                      <Phone size={18} />
                   </button>
                   <button className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-primary transition-colors">
                      <Video size={18} />
                   </button>
                   <button className="p-2.5 rounded-xl bg-white/5 text-zinc-400">
                      <MoreVertical size={18} />
                   </button>
                </div>
             </motion.div>
           ))}
        </div>

        <div className="p-6 bg-ai/5 border border-ai/20 rounded-[32px] space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-ai flex items-center justify-center text-white">
                 <Sparkles size={20} />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase tracking-widest text-ai">Circle Intelligence</h4>
                 <p className="text-[9px] font-bold text-ai/60 uppercase tracking-widest">Shared Safety Protocol</p>
              </div>
           </div>
           <p className="text-[13px] font-medium leading-relaxed text-zinc-300">
             Your Care Circle has been notified that your adherence is <span className="text-safe font-black">EXCELLENT (94%)</span> this week. Elena Gilbert received a positive report.
           </p>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
         {showInviteModal && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-dark-elevated w-full max-w-sm rounded-[40px] p-8 space-y-8 border border-white/10"
              >
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                          <UserPlus size={22} />
                       </div>
                       <h3 className="text-xl font-black uppercase italic text-white">Add Member</h3>
                    </div>
                    <button onClick={() => setShowInviteModal(false)} className="p-2 text-zinc-500">
                       <X size={20} />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
                       <input 
                         value={inviteEmail}
                         onChange={e => setInviteEmail(e.target.value)}
                         placeholder="family@example.com" 
                         className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none focus:border-primary" 
                       />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Role</label>
                       <div className="grid grid-cols-2 gap-2">
                          {["Caregiver", "Family"].map(r => (
                            <button 
                              key={r}
                              onClick={() => setInviteRole(r.toLowerCase())}
                              className={cn(
                                "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                inviteRole === r.toLowerCase() ? "bg-primary text-white" : "bg-white/5 text-zinc-500"
                              )}
                            >
                               {r}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={handleInvite}
                   className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                 >
                    <LinkIcon size={20} /> Send Invitation
                 </button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
