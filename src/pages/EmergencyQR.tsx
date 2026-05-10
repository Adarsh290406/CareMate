import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { Download, Shield, Camera, Heart, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmergencyQR() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);

  const emergencyUrl = `${window.location.origin}/emergency-profile/${user?.uid}`;

  const downloadQR = () => {
    const svg = document.querySelector("#emergency-qr-code");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 100, 100, 800, 800);
        
        // Add text to the image
        ctx.fillStyle = "black";
        ctx.font = "bold 40px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`EMERGENCY MEDICAL ID: ${profile?.name?.toUpperCase()}`, 500, 950);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `CareMate_Emergency_QR_${profile?.name}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-dark-primary p-6 safe-area-bottom">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Emergency ID</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-critical/10 rounded-full flex items-center justify-center text-critical mx-auto mb-4 animate-pulse">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Life-Saving Access</h2>
          <p className="text-text-secondary text-sm font-medium">
            Responders can scan this code to see your medical history and emergency contacts.
          </p>
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[2.5rem] p-10 flex flex-col items-center gap-8 shadow-2xl shadow-critical/20"
          ref={qrRef}
        >
          <div className="p-4 bg-white border-4 border-critical/10 rounded-3xl">
            <QRCodeSVG 
              id="emergency-qr-code"
              value={emergencyUrl}
              size={250}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/logo192.png",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-black font-black text-lg uppercase tracking-tight">{profile?.name}</p>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Medical Oversight by CareMate</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={downloadQR}
            className="w-full h-16 bg-critical text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-critical/20 active:scale-95 transition-all"
          >
            <Download size={20} /> Download PNG
          </button>
          
          <button 
            className="w-full h-16 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
          >
            <Camera size={20} /> Set as Lockscreen
          </button>
        </div>

        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex gap-4 items-start">
          <div className="p-2 bg-info/10 text-info rounded-lg mt-1">
            <Heart size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Pro Tip</h4>
            <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
              Set this image as your lockscreen wallpaper so paramedics can access it without unlocking your phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
