import React, { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Brain, ArrowRight, Shield, Heart, Mail, Phone, Lock, User, ChevronLeft, Send, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Role = "patient" | "caregiver" | "doctor";
type View = "welcome" | "role" | "method" | "login" | "register" | "forgot" | "phone" | "otp";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("welcome");
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (view === "phone" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, [view]);

  const handleAuthResult = async (userResult: any, selectedRole: Role) => {
    const userRef = doc(db, "users", userResult.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: userResult.uid,
        email: userResult.email || "",
        name: userResult.displayName || name || "",
        phone: userResult.phoneNumber || phone || "",
        role: selectedRole,
        onboarded: false,
        createdAt: new Date().toISOString()
      });
    } else {
      const existingData = userSnap.data();
      if (existingData.role !== selectedRole) {
        await updateDoc(userRef, { role: selectedRole });
      }
    }
    navigate(`/${selectedRole}`);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleAuthResult(result.user, role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleAuthResult(result.user, role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await handleAuthResult(result.user, role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
      setView("login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      setError("Please include your country code (e.g., +1 for USA)");
      setLoading(false);
      return;
    }

    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setView("otp");
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed") {
        setError("Phone authentication is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.");
      } else {
        setError(err.message);
      }
      // Reset reCAPTCHA if it fails
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(otp);
        await handleAuthResult(result.user, role);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <button 
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-xs font-bold text-text-secondary opacity-60 hover:text-text-primary mb-6 mx-auto uppercase tracking-widest pl-2"
      >
        <ChevronLeft size={14} /> Back to Home
      </button>

      <button 
        onClick={() => { setIsRegistering(false); setView("role"); }}
        className="w-full h-16 bg-primary text-black rounded-2xl font-extrabold text-[15px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all outline-none"
      >
        Sign In <ArrowRight size={18} />
      </button>
      <button 
        onClick={() => { setIsRegistering(true); setView("role"); }}
        className="w-full h-16 bg-surface-main border-2 border-primary/20 text-primary rounded-2xl font-extrabold text-[15px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary/5 transition-all"
      >
        Create Account
      </button>
      
      <div className="pt-4 flex items-center justify-center gap-4 opacity-50">
        <div className="h-[1px] flex-1 bg-border-main"></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Connect with CareMate</span>
        <div className="h-[1px] flex-1 bg-border-main"></div>
      </div>
    </motion.div>
  );

  const renderRoleSelection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <button onClick={() => setView("welcome")} className="flex items-center gap-2 text-xs font-bold text-text-secondary opacity-60 hover:text-text-primary mb-4">
        <ChevronLeft size={14} /> Back
      </button>

      <div className="text-left mb-6">
        <h2 className="text-2xl font-black tracking-tight text-text-primary">
          {isRegistering ? "Join as..." : "Sign in as..."}
        </h2>
        <p className="text-xs text-text-secondary opacity-60">Choose your role to get specialized features.</p>
      </div>

      <button 
        onClick={() => { setRole("patient"); setView("method"); }}
        className="w-full h-14 bg-surface-main border-2 border-border-main text-text-primary rounded-xl font-bold flex items-center justify-between px-6 hover:bg-primary/5 hover:border-primary/30 transition-all"
      >
        <span>I am a Patient</span>
        <Heart size={18} className="text-danger" />
      </button>
      <button 
        onClick={() => { setRole("caregiver"); setView("method"); }}
        className="w-full h-14 bg-surface-main border-2 border-border-main text-text-primary rounded-xl font-bold flex items-center justify-between px-6 hover:bg-primary/5 hover:border-primary/30 transition-all"
      >
        <span>I am a Caregiver</span>
        <Shield size={18} className="text-primary" />
      </button>
      <button 
        onClick={() => { setRole("doctor"); setView("method"); }}
        className="w-full h-14 bg-surface-main border-2 border-border-main text-text-primary rounded-xl font-bold flex items-center justify-between px-6 hover:bg-primary/5 hover:border-primary/30 transition-all"
      >
        <span>Healthcare Provider</span>
        <Brain size={18} className="text-primary" />
      </button>
    </motion.div>
  );

  const renderMethodSelection = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <button onClick={() => setView("role")} className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary mb-4">
        <ChevronLeft size={14} /> Back to roles
      </button>
      
      <div className="text-left mb-6">
        <h2 className="text-2xl font-black tracking-tight text-text-primary">Welcome, {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
        <p className="text-xs text-text-muted">{isRegistering ? "Create your secure account." : "Choose how you want to sign in."}</p>
      </div>

      <button 
        onClick={loginWithGoogle}
        disabled={loading}
        className="w-full h-14 bg-surface border border-border text-text-primary rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-surface/80 transition-all"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {isRegistering ? "Register with Google" : "Continue with Google"}
      </button>

      <button 
        onClick={() => setView(isRegistering ? "register" : "login")}
        className="w-full h-14 bg-surface border border-border text-text-primary rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-surface/80 transition-all"
      >
        <Mail size={18} /> {isRegistering ? "Register with Email" : "Continue with Email"}
      </button>

      <button 
        onClick={() => setView("phone")}
        className="w-full h-14 bg-surface border border-border text-text-primary rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-surface/80 transition-all"
      >
        <Phone size={18} /> {isRegistering ? "Register with Phone" : "Continue with Phone"}
      </button>
    </motion.div>
  );

  const renderEmailLogin = () => (
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleEmailLogin}
      className="space-y-4 text-left"
    >
      <button type="button" onClick={() => setView("method")} className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary mb-4">
        <ChevronLeft size={14} /> Back
      </button>

      <h2 className="text-2xl font-black tracking-tight text-text-primary">Sign In</h2>
      
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-surface border border-border rounded-xl px-12 text-sm focus:border-primary transition-all outline-none"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-surface border border-border rounded-xl px-12 text-sm focus:border-primary transition-all outline-none"
              placeholder="Min 6 characters"
            />
          </div>
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-6"
      >
        {loading ? "Authenticating..." : "Sign In"}
      </button>

      <div className="flex items-center justify-between pt-4">
        <button type="button" onClick={() => setView("forgot")} className="text-[10px] font-bold text-text-muted hover:text-primary">Forgot Password?</button>
        <button type="button" onClick={() => setView("register")} className="text-[10px] font-bold text-primary hover:underline">Create Account</button>
      </div>
    </motion.form>
  );

  const renderEmailRegister = () => (
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleEmailRegister}
      className="space-y-4 text-left"
    >
      <button type="button" onClick={() => setView("login")} className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary mb-4">
        <ChevronLeft size={14} /> Back
      </button>

      <h2 className="text-2xl font-black tracking-tight text-text-primary">Create Account</h2>
      
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 bg-surface border border-border rounded-xl px-12 text-sm focus:border-primary transition-all outline-none"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-surface border border-border rounded-xl px-12 text-sm focus:border-primary transition-all outline-none"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-surface border border-border rounded-xl px-12 text-sm focus:border-primary transition-all outline-none"
              placeholder="Min 6 characters"
            />
          </div>
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-6"
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>

      <div className="text-center pt-4">
        <button type="button" onClick={() => setView("login")} className="text-[10px] font-bold text-text-muted hover:text-primary">Already have an account? Sign In</button>
      </div>
    </motion.form>
  );

  const renderForgotPassword = () => (
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleForgotPassword}
      className="space-y-4 text-left"
    >
      <button type="button" onClick={() => setView("login")} className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary mb-4">
        <ChevronLeft size={14} /> Back
      </button>

      <h2 className="text-2xl font-black tracking-tight text-text-primary">Reset Password</h2>
      <p className="text-xs text-text-muted">Enter your email and we'll send you a link to reset your password.</p>
      
      <div className="space-y-1 pt-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 bg-surface border border-border rounded-xl px-12 text-sm focus:border-primary transition-all outline-none"
            placeholder="name@example.com"
          />
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-6"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      <div className="pt-6 border-t border-border">
         <p className="text-[10px] font-bold text-text-muted text-center mb-3">OR RECOVER VIA MOBILE</p>
         <button 
           type="button" 
           onClick={() => { setIsRegistering(false); setView("phone"); }}
           className="w-full h-12 bg-surface border border-border text-text-primary rounded-xl font-bold flex items-center justify-center gap-2 text-xs hover:bg-surface/80"
         >
           <Phone size={14} /> Login with OTP
         </button>
      </div>
    </motion.form>
  );

  const renderPhoneAuth = () => (
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleSendOtp}
      className="space-y-4 text-left"
    >
      <button type="button" onClick={() => setView("method")} className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary mb-4">
        <ChevronLeft size={14} /> Back
      </button>

      <h2 className="text-2xl font-black tracking-tight text-text-primary">Phone Sign In</h2>
      <p className="text-xs text-text-muted">Enter your phone number to receive a one-time code.</p>
      
      <div className="space-y-1 pt-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-14 bg-surface border border-border rounded-xl px-12 text-sm focus:border-primary transition-all outline-none"
            placeholder="+1 234 567 8900"
          />
        </div>
      </div>

      <div id="recaptcha-container"></div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-6"
      >
        {loading ? "Sending OTP..." : "Get OTP"}
      </button>
    </motion.form>
  );

  const renderOtpInput = () => (
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleVerifyOtp}
      className="space-y-4 text-left"
    >
      <button type="button" onClick={() => setView("phone")} className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary mb-4">
        <ChevronLeft size={14} /> Back
      </button>

      <h2 className="text-2xl font-black tracking-tight text-text-primary">Verify OTP</h2>
      <p className="text-xs text-text-muted">Enter the 6-digit code sent to {phone}.</p>
      
      <div className="space-y-1 pt-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Verification Code</label>
        <div className="relative">
          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full h-14 bg-surface border border-border rounded-xl px-12 text-center text-lg font-bold tracking-[0.5em] focus:border-primary transition-all outline-none"
            placeholder="000000"
          />
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-6"
      >
        {loading ? "Verifying..." : "Verify & Sign In"}
      </button>
    </motion.form>
  );

  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-300">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 10, repeat: Infinity }} className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[100px]" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 15, repeat: Infinity }} className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-ai/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm space-y-12 text-center z-10">
        <div className="space-y-6">
          <div className="flex justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-[28px] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20"
            >
               <Brain size={40} />
            </motion.div>
          </div>
          
          <AnimatePresence mode="wait">
            {view === "welcome" && (
              <motion.div 
                key="welcome-title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h1 className="text-5xl font-extrabold tracking-tighter italic uppercase text-text-primary">CareMate</h1>
                <p className="text-text-secondary text-lg font-medium leading-tight">Intelligent Medical Oversight</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {view === "welcome" && renderWelcome()}
            {view === "role" && renderRoleSelection()}
            {view === "method" && renderMethodSelection()}
            {view === "login" && renderEmailLogin()}
            {view === "register" && renderEmailRegister()}
            {view === "forgot" && renderForgotPassword()}
            {view === "phone" && renderPhoneAuth()}
            {view === "otp" && renderOtpInput()}
          </AnimatePresence>

          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-[10px] font-bold text-danger mt-4 bg-danger/5 p-3 rounded-lg border border-danger/10"
            >
              {error}
            </motion.p>
          )}
        </div>

        <div className="pt-8 grid grid-cols-2 gap-4">
           <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-primary/5 rounded-2xl text-primary">
                <Shield size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Secure Auth</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-ai/5 rounded-2xl text-ai">
                <Sparkles size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">AI-Verified</span>
           </div>
        </div>
      </div>

      <div className="fixed bottom-12 flex flex-col items-center gap-2">
         <span className="text-[10px] font-black uppercase tracking-[0.1em] opacity-20 flex items-center gap-2">
           <Heart size={10} className="fill-current" /> CareMate Global v2.1
         </span>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

