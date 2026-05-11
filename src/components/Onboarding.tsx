import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Clipboard, Shield, Anchor, ArrowRight, Check, Activity, 
  Clock, Zap, Heart, MapPin, Phone, Calendar, Briefcase, 
  Users, Bell, Globe, Sparkles, ChevronLeft, Camera, Plus, X
} from "lucide-react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cn } from "../lib/utils";

interface OnboardingProps {
  uid: string;
  role: "patient" | "caregiver" | "doctor";
  onComplete: () => void;
}

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" }
];

export default function Onboarding({ uid, role, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for back
  
  const [formData, setFormData] = useState<any>({
    // Common
    language: "en",
    profilePhoto: "",
    
    // Patient
    dob: "",
    gender: "",
    conditions: [],
    allergies: [],
    bloodGroup: "",
    height: "",
    weight: "",
    emergencyContact1: { name: "", relationship: "", phone: "" },
    emergencyContact2: { name: "", relationship: "", phone: "" },
    address: "",
    city: "",
    pinCode: "",
    lifestyle: {
      wakeTime: "06:00",
      breakfastTime: "08:00",
      lunchTime: "13:00",
      dinnerTime: "20:00",
      sleepTime: "22:00",
      workHours: "9AM - 5PM",
      workDays: "Mon-Fri"
    },
    caregiverEmail: "",
    womenHealthEnabled: false,
    womenHealth: {
      isPregnant: false,
      onBirthControl: false,
      hasPCOS: false,
      cycleLength: "28",
      lastPeriodDate: ""
    },
    
    // Caregiver
    relationship: "",
    isMedicalPro: false,
    designation: "",
    hospitalName: "",
    patientCount: "1 patient",
    alertMethod: "Both",
    alertSensitivity: "All alerts",
    quietHours: { from: "23:00", to: "07:00", bypassCritical: true },
    notificationLanguage: "en",
    linkedPatientEmail: "",
    
    // Doctor
    mciNumber: "",
    specialization: "",
    qualification: "",
    experience: "",
    doctorHospital: "",
    doctorCity: "",
    doctorAddress: "",
    consultationHours: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      from: "10:00",
      to: "17:00"
    },
    expectedPatients: "10-50",
    reportFormat: "Both",
    doctorAlertPreference: "Both"
  });

  const steps = {
    patient: [
      { id: 1, title: "Basic Account", icon: User, desc: "Let's set up your core profile." },
      { id: 2, title: "Health Profile", icon: Clipboard, desc: "Vital medical information for AI monitoring." },
      { id: 3, title: "Emergency Info", icon: Shield, desc: "Who should we contact in an emergency?" },
      { id: 4, title: "Lifestyle", icon: Clock, desc: "Optimize your schedule with AI." },
      { id: 5, title: "Caregiver", icon: Heart, desc: "Link someone to help monitor you." },
      { id: 6, title: "Women's Health", icon: Sparkles, desc: "Specialized tracking and alerts." }
    ],
    caregiver: [
      { id: 1, title: "Basic Account", icon: User, desc: "Set up your caregiver identity." },
      { id: 2, title: "Caregiver Profile", icon: Anchor, desc: "Tell us about your care capacity." },
      { id: 3, title: "Alert Preferences", icon: Bell, desc: "How and when should we notify you?" },
      { id: 4, title: "Patient Linking", icon: Users, desc: "Connect with the person you care for." }
    ],
    doctor: [
      { id: 1, title: "Basic Account", icon: User, desc: "Set up your professional identity." },
      { id: 2, title: "Professional Details", icon: Briefcase, desc: "Verify your credentials." },
      { id: 3, title: "Practice Details", icon: MapPin, desc: "Where do you provide care?" },
      { id: 4, title: "Management", icon: Activity, desc: "Configure patient oversight rules." }
    ]
  };

  const currentSteps = steps[role];

  // Auto-save logic
  const handleNext = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", uid);
      
      // Update Firestore with current form data
      const updatePayload: any = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      // If it's the last step, mark as onboarded
      if (step === currentSteps.length) {
        updatePayload.onboarded = true;
      }

      await updateDoc(userRef, updatePayload);

      if (step < currentSteps.length) {
        setDirection(1);
        setStep(step + 1);
      } else {
        onComplete();
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const skipStep = () => {
    if (step < currentSteps.length) {
      setDirection(1);
      setStep(step + 1);
    } else {
      handleNext();
    }
  };

  const renderProgress = () => (
    <div className="flex gap-2 mb-8">
      {currentSteps.map((s) => (
        <div 
          key={s.id} 
          className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-500",
            step >= s.id ? "bg-primary shadow-[0_0_10px_rgba(0,212,170,0.5)]" : "bg-white/5"
          )} 
        />
      ))}
    </div>
  );

  const renderCommonStep1 = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-surface-main border border-border-main flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
            {formData.profilePhoto ? (
              <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera size={32} className="text-text-secondary opacity-40 group-hover:text-primary transition-colors" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-primary text-black rounded-full shadow-lg">
            <Plus size={16} />
          </button>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Upload Profile Photo</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Preferred Language</label>
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map(lang => (
              <button 
                key={lang.code}
                onClick={() => setFormData({...formData, language: lang.code})}
                className={cn(
                  "py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all",
                  formData.language === lang.code ? "bg-primary/10 border-primary text-primary" : "bg-bg-main border border-border-main text-text-secondary opacity-60 hover:text-text-primary"
                )}
              >
                <span>{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {role === 'patient' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Date of Birth</label>
                <input 
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                  className="w-full h-14 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none focus:border-primary transition-all [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full h-14 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none focus:border-primary transition-all appearance-none [&>option]:bg-surface-main [&>option]:text-text-primary"
                >
                  <option value="" className="bg-surface-main text-text-primary">Select</option>
                  <option value="Male" className="bg-surface-main text-text-primary">Male</option>
                  <option value="Female" className="bg-surface-main text-text-primary">Female</option>
                  <option value="Other" className="bg-surface-main text-text-primary">Other</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderPatientSteps = () => {
    switch(step) {
      case 1: return renderCommonStep1();
      case 2: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Chronic Conditions</label>
            <div className="grid grid-cols-2 gap-2">
              {['Diabetes', 'Hypertension', 'Heart Disease', 'Thyroid', 'Asthma', 'Kidney Disease', 'Cancer', 'None'].map(c => (
                <button 
                  key={c}
                  onClick={() => {
                    const newConditions = formData.conditions.includes(c) 
                      ? formData.conditions.filter((item: string) => item !== c)
                      : [...formData.conditions, c];
                    setFormData({...formData, conditions: newConditions});
                  }}
                  className={cn(
                    "py-3 px-4 rounded-xl text-xs font-bold transition-all border",
                    formData.conditions.includes(c) ? "bg-primary/20 border-primary text-primary" : "bg-bg-main border border-border-main text-text-secondary opacity-60 hover:text-text-primary"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Blood Group</label>
              <select 
                value={formData.bloodGroup}
                onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
                className="w-full h-12 bg-bg-main border border-border-main rounded-xl px-3 text-xs font-bold text-text-primary outline-none [&>option]:bg-surface-main [&>option]:text-text-primary"
              >
                <option value="" className="bg-surface-main text-text-primary">-</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg} className="bg-surface-main text-text-primary">{bg}</option>)}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Height (cm)</label>
                  <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full h-12 bg-bg-main border border-border-main rounded-xl px-3 text-xs font-bold text-text-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Weight (kg)</label>
                  <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full h-12 bg-bg-main border border-border-main rounded-xl px-3 text-xs font-bold text-text-primary outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-border-main">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Emergency Contact 1</h3>
            <input placeholder="Full Name" value={formData.emergencyContact1.name} onChange={e => setFormData({...formData, emergencyContact1: {...formData.emergencyContact1, name: e.target.value}})} className="w-full h-12 bg-surface-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Relationship" value={formData.emergencyContact1.relationship} onChange={e => setFormData({...formData, emergencyContact1: {...formData.emergencyContact1, relationship: e.target.value}})} className="h-12 bg-surface-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
              <input placeholder="Phone" value={formData.emergencyContact1.phone} onChange={e => setFormData({...formData, emergencyContact1: {...formData.emergencyContact1, phone: e.target.value}})} className="h-12 bg-surface-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Home Address</label>
            <input placeholder="Street Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
              <input placeholder="Pin Code" value={formData.pinCode} onChange={e => setFormData({...formData, pinCode: e.target.value})} className="h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData.lifestyle).filter(([key]) => key.includes('Time')).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">{key.replace('Time', '').toUpperCase()}</label>
                <input type="time" value={value as string} onChange={e => setFormData({...formData, lifestyle: {...formData.lifestyle, [key]: e.target.value}})} className="w-full h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none [color-scheme:dark]" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Work/School Hours</label>
            <input placeholder="e.g. 9AM to 5PM" value={formData.lifestyle.workHours} onChange={e => setFormData({...formData, lifestyle: {...formData.lifestyle, workHours: e.target.value}})} className="w-full h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-black italic uppercase tracking-tight text-text-primary">Invite your caregiver</h3>
              <p className="text-[10px] font-bold text-text-secondary max-w-[200px]">Link a family member or professional nurse to your circle.</p>
            </div>
            <input 
              type="email" 
              placeholder="Caregiver Email Address" 
              value={formData.caregiverEmail}
              onChange={e => setFormData({...formData, caregiverEmail: e.target.value})}
              className="w-full h-14 bg-surface-main border border-border-main rounded-2xl px-6 text-sm font-bold outline-none focus:border-primary text-center text-text-primary"
            />
          </div>
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-text-secondary">They will receive an invitation to connect.</p>
        </div>
      );
      case 6: return (
        <div className="space-y-6">
          {formData.gender === 'Female' ? (
            <div className="space-y-6">
               <button 
                onClick={() => setFormData({...formData, womenHealthEnabled: !formData.womenHealthEnabled})}
                className={cn(
                  "w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all",
                  formData.womenHealthEnabled ? "bg-ai/10 border-ai text-ai" : "bg-white/5 border-border-main text-text-secondary opacity-60 hover:text-text-primary"
                )}
              >
                <div className="flex items-center gap-4">
                  <Sparkles size={24} className={formData.womenHealthEnabled ? "fill-ai" : ""} />
                  <div className="text-left">
                    <p className="font-black italic uppercase tracking-tight">Enable Women's Health</p>
                    <p className="text-[10px] font-bold opacity-70">Cycle tracking, pregnancy support & more.</p>
                  </div>
                </div>
                {formData.womenHealthEnabled ? <Check size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-white/10" />}
              </button>

              {formData.womenHealthEnabled && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-4">
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setFormData({...formData, womenHealth: {...formData.womenHealth, isPregnant: !formData.womenHealth.isPregnant}})} className={cn("py-4 rounded-xl text-xs font-bold border transition-all", formData.womenHealth.isPregnant ? "bg-ai/20 border-ai text-ai" : "bg-bg-main border border-border-main text-text-secondary opacity-60 hover:text-text-primary")}>Currently Pregnant?</button>
                      <button onClick={() => setFormData({...formData, womenHealth: {...formData.womenHealth, onBirthControl: !formData.womenHealth.onBirthControl}})} className={cn("py-4 rounded-xl text-xs font-bold border transition-all", formData.womenHealth.onBirthControl ? "bg-ai/20 border-ai text-ai" : "bg-bg-main border border-border-main text-text-secondary opacity-60 hover:text-text-primary")}>On Birth Control?</button>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Last Period Start Date</label>
                      <input type="date" value={formData.womenHealth.lastPeriodDate} onChange={e => setFormData({...formData, womenHealth: {...formData.womenHealth, lastPeriodDate: e.target.value}})} className="w-full h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none [color-scheme:dark]" />
                   </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Check size={40} />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-text-primary">All Set!</h3>
              <p className="text-text-secondary text-sm font-medium">You've completed the onboarding process.</p>
            </div>
          )}
        </div>
      );
      default: return null;
    }
  };

  const renderCaregiverSteps = () => {
    switch(step) {
      case 1: return renderCommonStep1();
      case 2: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Relationship to Patient</label>
            <div className="grid grid-cols-2 gap-2">
              {['Spouse', 'Son / Daughter', 'Parent', 'Sibling', 'Professional Nurse', 'Friend'].map(r => (
                <button 
                  key={r}
                  onClick={() => setFormData({...formData, relationship: r})}
                  className={cn(
                    "py-3 px-4 rounded-xl text-xs font-bold transition-all border",
                    formData.relationship === r ? "bg-primary/20 border-primary text-primary" : "bg-bg-main border border-border-main text-text-secondary opacity-60 hover:text-text-primary"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setFormData({...formData, isMedicalPro: !formData.isMedicalPro})}
            className={cn(
              "w-full p-4 rounded-2xl border flex items-center justify-between transition-all",
              formData.isMedicalPro ? "bg-secondary/10 border-secondary text-secondary" : "bg-bg-main border border-border-main text-text-secondary opacity-60 hover:text-text-primary"
            )}
          >
            <span className="font-bold">Are you a Medical Professional?</span>
            {formData.isMedicalPro ? <Check size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-white/10" />}
          </button>
          {formData.isMedicalPro && (
            <input placeholder="Designation (Nurse / ANM / Health Worker)" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
          )}
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Preferred Alert Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['Push', 'SMS', 'Both'].map(m => (
                <button key={m} onClick={() => setFormData({...formData, alertMethod: m})} className={cn("py-3 rounded-xl text-xs font-bold border transition-all", formData.alertMethod === m ? "bg-primary/20 border-primary text-primary" : "bg-bg-main border border-border-main text-text-secondary opacity-60 hover:text-text-primary")}>{m}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Quiet Hours (DND)</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={formData.quietHours.from} onChange={e => setFormData({...formData, quietHours: {...formData.quietHours, from: e.target.value}})} className="h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none [color-scheme:dark]" />
              <input type="time" value={formData.quietHours.to} onChange={e => setFormData({...formData, quietHours: {...formData.quietHours, to: e.target.value}})} className="h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none [color-scheme:dark]" />
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Anchor size={40} />
          </div>
          <h3 className="text-xl font-black italic uppercase tracking-tight text-text-primary">Link your patient</h3>
          <input 
            placeholder="Patient Email or Phone" 
            value={formData.linkedPatientEmail}
            onChange={e => setFormData({...formData, linkedPatientEmail: e.target.value})}
            className="w-full h-14 bg-bg-main border border-border-main rounded-2xl px-6 text-sm font-bold outline-none text-center text-text-primary"
          />
          <p className="text-[10px] font-bold text-text-secondary">We'll send them a connection request.</p>
        </div>
      );
      default: return null;
    }
  };

  const renderDoctorSteps = () => {
    switch(step) {
      case 1: return renderCommonStep1();
      case 2: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">MCI/NMC Registration Number</label>
            <input placeholder="Enter Registration No." value={formData.mciNumber} onChange={e => setFormData({...formData, mciNumber: e.target.value})} className="w-full h-14 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none focus:border-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Specialization</label>
            <select 
              value={formData.specialization} 
              onChange={e => setFormData({...formData, specialization: e.target.value})} 
              className="w-full h-14 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none [&>option]:bg-surface-main [&>option]:text-text-primary"
            >
              <option value="" className="bg-surface-main text-text-primary">Select Specialization</option>
              {['General Physician', 'Diabetologist', 'Cardiologist', 'Endocrinologist', 'Gynecologist', 'Neurologist'].map(s => <option key={s} value={s} className="bg-surface-main text-text-primary">{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
             <input placeholder="Qualification (MBBS/MD)" value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
             <input placeholder="Years of Exp." value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <input placeholder="Hospital / Clinic Name" value={formData.doctorHospital} onChange={e => setFormData({...formData, doctorHospital: e.target.value})} className="w-full h-14 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
          <input placeholder="City" value={formData.doctorCity} onChange={e => setFormData({...formData, doctorCity: e.target.value})} className="w-full h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none" />
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Consultation Hours</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={formData.consultationHours.from} onChange={e => setFormData({...formData, consultationHours: {...formData.consultationHours, from: e.target.value}})} className="h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none [color-scheme:dark]" />
              <input type="time" value={formData.consultationHours.to} onChange={e => setFormData({...formData, consultationHours: {...formData.consultationHours, to: e.target.value}})} className="h-12 bg-bg-main border border-border-main rounded-xl px-4 text-sm font-bold text-text-primary outline-none [color-scheme:dark]" />
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Expected Patient Volume</label>
            <div className="grid grid-cols-2 gap-2">
              {['Under 10', '10-50', '50-100', '100+'].map(v => (
                <button key={v} onClick={() => setFormData({...formData, expectedPatients: v})} className={cn("py-4 rounded-xl text-xs font-bold border transition-all", formData.expectedPatients === v ? "bg-ai/20 border-ai text-ai" : "bg-bg-main border border-border-main text-text-secondary opacity-60 hover:text-text-primary")}>{v}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Preferred Report Format</label>
            <div className="grid grid-cols-3 gap-2">
              {['Weekly', 'Critical Only', 'Both'].map(f => (
                <button key={f} onClick={() => setFormData({...formData, reportFormat: f})} className={cn("py-3 rounded-xl text-xs font-bold border transition-all", formData.reportFormat === f ? "bg-primary/20 border-primary text-primary" : "bg-bg-main border border-border-main text-text-secondary opacity-60 hover:text-text-primary")}>{f}</button>
              ))}
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-main z-[200] flex flex-col p-6 safe-area-bottom overflow-y-auto no-scrollbar">
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col pt-10 pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack} 
            disabled={step === 1}
            className={cn("p-2 rounded-xl transition-all", step === 1 ? "opacity-0 pointer-events-none" : "bg-surface-main border border-border-main text-text-secondary hover:text-text-primary")}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Step {step} of {currentSteps.length}</span>
            <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">~{role === 'patient' ? '3' : '2'} mins remaining</span>
          </div>
          <button 
            onClick={skipStep}
            className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip
          </button>
        </div>

        {renderProgress()}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            <div className="space-y-2 mb-8">
              <h1 className="text-4xl font-black tracking-tighter leading-none italic uppercase text-text-primary">
                {currentSteps[step - 1].title}
              </h1>
              <p className="text-text-secondary text-sm font-medium leading-relaxed max-w-[280px]">
                {currentSteps[step - 1].desc}
              </p>
            </div>

            <div className="card p-6 mb-8 bg-surface-main">
               {role === 'patient' && renderPatientSteps()}
               {role === 'caregiver' && renderCaregiverSteps()}
               {role === 'doctor' && renderDoctorSteps()}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="pt-4">
          <button 
            disabled={loading}
            onClick={handleNext}
            className="w-full h-16 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,212,170,0.2)]"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
            ) : (
              <>
                {step < currentSteps.length ? "Continue" : "Finalize Profile"}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
