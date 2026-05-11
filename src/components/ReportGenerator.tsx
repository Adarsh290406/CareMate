import React, { useState } from "react";
import { FileText, Share2, Download, Brain, Loader2 } from "lucide-react";
import { generateDoctorReport } from "../lib/gemini";
import { jsPDF } from "jspdf";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ReportGeneratorProps {
  user: any;
  profile: any;
  medications: any[];
}

export default function ReportGenerator({ user, profile, medications }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);

  const generateReport = async (action: 'view' | 'download' | 'share') => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      // 1. Fetch recent dose history for the report
      const dosesQ = query(
        collection(db, "doses"),
        where("patientId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const dosesSnap = await getDocs(dosesQ);
      const doses = dosesSnap.docs.map(d => d.data());

      // 2. Generate AI Summary
      const summary = await generateDoctorReport(profile, medications, doses);

      // 3. Create PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(0, 212, 170); // Primary color
      doc.text("CareMate clinical Summary", 20, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
      
      // Patient Info
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Patient Information", 20, 45);
      doc.setFontSize(10);
      doc.text(`Name: ${profile.name}`, 20, 52);
      doc.text(`Conditions: ${profile.conditions?.join(", ") || "None listed"}`, 20, 57);
      doc.text(`Blood Group: ${profile.bloodGroup || "N/A"}`, 20, 62);

      // AI Analysis
      doc.setFontSize(14);
      doc.text("Clinical AI Analysis", 20, 75);
      doc.setFontSize(10);
      const splitSummary = doc.splitTextToSize(summary, 170);
      doc.text(splitSummary, 20, 82);

      // Medications
      let y = 82 + (splitSummary.length * 5) + 10;
      doc.setFontSize(14);
      doc.text("Current Medications", 20, y);
      doc.setFontSize(10);
      medications.forEach((med, i) => {
        y += 7;
        doc.text(`• ${med.name} (${med.dosage}) - ${med.frequency}`, 25, y);
      });

      if (action === 'download') {
        doc.save(`CareMate_Report_${profile.name.replace(/\s+/g, '_')}.pdf`);
      } else if (action === 'view') {
        window.open(doc.output('bloburl'), '_blank');
      } else if (action === 'share') {
        const blob = doc.output('blob');
        const file = new File([blob], "Medical_Report.pdf", { type: "application/pdf" });
        if (navigator.share) {
          await navigator.share({
            files: [file],
            title: 'My Medical Report',
            text: 'Sharing my clinical summary from CareMate AI.',
          });
        } else {
          alert("Sharing not supported on this browser. Downloading instead.");
          doc.save(`CareMate_Report.pdf`);
        }
      }
    } catch (err) {
      console.error("Report Generation Error:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ai/10 flex items-center justify-center text-ai shadow-lg shadow-ai/10">
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Brain size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none mb-1 text-text-primary">Pre-Appointment AI Summary</h3>
            <p className="text-xs text-text-secondary max-w-xs">A clinical-grade briefing of your last 3 months, ready for your doctor.</p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-ai px-2 py-1 bg-ai/10 rounded">Smart Report</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
         <button 
          onClick={() => generateReport('view')}
          disabled={loading}
          className="flex flex-col items-center gap-2 p-3 bg-bg-main border border-border-main rounded-2xl hover:border-primary/50 transition-all text-text-primary disabled:opacity-50"
         >
            <FileText size={18} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest">View PDF</span>
         </button>
         <button 
          onClick={() => generateReport('share')}
          disabled={loading}
          className="flex flex-col items-center gap-2 p-3 bg-bg-main border border-border-main rounded-2xl hover:border-primary/50 transition-all text-text-primary disabled:opacity-50"
         >
            <Share2 size={18} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest">Share Link</span>
         </button>
         <button 
          onClick={() => generateReport('download')}
          disabled={loading}
          className="flex flex-col items-center gap-2 p-3 bg-bg-main border border-border-main rounded-2xl hover:border-primary/50 transition-all text-text-primary disabled:opacity-50"
         >
            <Download size={18} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest">Download</span>
         </button>
      </div>
    </div>
  );
}
