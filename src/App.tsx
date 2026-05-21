import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Meds from "./pages/Meds";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import Care from "./pages/Care";
import Knowledge from "./pages/Knowledge";
import Onboarding from "./components/Onboarding";
import EmergencyQR from "./pages/EmergencyQR";
import EmergencyProfile from "./pages/EmergencyProfile";
import InteractionChecker from "./pages/InteractionChecker";
import VoiceAssistant from "./pages/VoiceAssistant";
import Encyclopedia from "./pages/Encyclopedia";
import DoseSimulator from "./pages/DoseSimulator";
import ScheduleOptimizer from "./pages/ScheduleOptimizer";
import PillScanner from "./pages/PillScanner";
import PrescriptionOCR from "./pages/PrescriptionOCR";
import DrugConverter from "./pages/DrugConverter";
import FamilyCircle from "./pages/FamilyCircle";
import FamilyChat from "./pages/FamilyChat";
import DosageHistory from "./pages/DosageHistory";
import VideoRoom from "./pages/VideoRoom";
import { motion, AnimatePresence } from "motion/react";
import MainLayout from "./components/MainLayout";
import { Heart } from "lucide-react";

const CareView = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-extrabold tracking-tighter">Your Care Team</h1>
    </header>
    <div className="card p-6 flex flex-col items-center text-center space-y-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Heart size={40} />
      </div>
      <div>
        <h3 className="text-lg font-extrabold tracking-tighter">Dr. Jennifer Bloom</h3>
        <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)]">Primary Caregiver</p>
      </div>
      <button className="w-full py-3 bg-primary text-white rounded-xl font-bold">Message Doctor</button>
    </div>
  </div>
);

function RouteGuard({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, profile, loading } = useAuth();
  const [completingOnboarding, setCompletingOnboarding] = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  // Force onboarding for first-time users
  if (profile && !profile.onboarded && !completingOnboarding) {
    return (
      <Onboarding 
        uid={user.uid} 
        role={profile.role as any} 
        onComplete={() => {
          setCompletingOnboarding(true);
          window.location.reload(); // Refresh to get updated profile
        }} 
      />
    );
  }

  const needsLayout = !["/login"].includes(window.location.pathname) && !window.location.pathname.startsWith("/video-room");

  if (roles && profile && !roles.includes(profile.role)) {
    if (profile.role === "patient") return <Navigate to="/patient" />;
    if (profile.role === "caregiver") return <Navigate to="/caregiver" />;
    if (profile.role === "doctor") return <Navigate to="/doctor" />;
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );

  return needsLayout ? <MainLayout>{content}</MainLayout> : content;
}


function MainRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} {...{ key: location.pathname }}>
        <Route path="/login" element={<Login />} />
        
        <Route path="/patient" element={
          <RouteGuard roles={["patient"]}>
            <Home />
          </RouteGuard>
        } />
        
        <Route path="/caregiver" element={
          <RouteGuard roles={["caregiver"]}>
            <CaregiverDashboard />
          </RouteGuard>
        } />
        
        <Route path="/doctor" element={
          <RouteGuard roles={["doctor"]}>
            <DoctorDashboard />
          </RouteGuard>
        } />

        <Route path="/meds" element={<RouteGuard><Meds /></RouteGuard>} />
        <Route path="/chat" element={<RouteGuard><Chat /></RouteGuard>} />
        <Route path="/care" element={<RouteGuard><Care /></RouteGuard>} />
        <Route path="/knowledge" element={<RouteGuard><Knowledge /></RouteGuard>} />
        <Route path="/profile" element={<RouteGuard><Profile /></RouteGuard>} />
        <Route path="/emergency-qr" element={<RouteGuard roles={["patient"]}><EmergencyQR /></RouteGuard>} />
        <Route path="/check-interaction" element={<RouteGuard roles={["patient"]}><InteractionChecker /></RouteGuard>} />
        <Route path="/voice-assistant" element={<RouteGuard roles={["patient"]}><VoiceAssistant /></RouteGuard>} />
        <Route path="/encyclopedia" element={<RouteGuard><Encyclopedia /></RouteGuard>} />
        <Route path="/dose-simulator" element={<RouteGuard roles={["patient"]}><DoseSimulator /></RouteGuard>} />
        <Route path="/optimize-schedule" element={<RouteGuard roles={["patient"]}><ScheduleOptimizer /></RouteGuard>} />
        <Route path="/pill-scanner" element={<RouteGuard roles={["patient"]}><PillScanner /></RouteGuard>} />
        <Route path="/scan-prescription" element={<RouteGuard roles={["patient"]}><PrescriptionOCR /></RouteGuard>} />
        <Route path="/convert-drug" element={<RouteGuard roles={["patient"]}><DrugConverter /></RouteGuard>} />
        <Route path="/family-circle" element={<RouteGuard roles={["patient", "caregiver"]}><FamilyCircle /></RouteGuard>} />
        <Route path="/family-chat/:memberId" element={<RouteGuard roles={["patient", "caregiver"]}><FamilyChat /></RouteGuard>} />
        <Route path="/dosage-history" element={<RouteGuard><DosageHistory /></RouteGuard>} />
        <Route path="/video-room/:callId" element={<RouteGuard><VideoRoom /></RouteGuard>} />
        
        {/* Public Emergency Route */}
        <Route path="/emergency-profile/:patientId" element={<EmergencyProfile />} />

        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
