import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";
import { motion } from "motion/react";
import { TrendingDown, ShieldCheck, AlertCircle, Clock } from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { simulateMissedDose } from "../lib/gemini";

interface ImpactSimulatorProps {
  medications: any[];
}

const data = [
  { time: "8 AM", protection: 98 },
  { time: "10 AM", protection: 95 },
  { time: "12 PM", protection: 90 },
  { time: "2 PM", protection: 85 },
  { time: "4 PM", protection: 40 },
  { time: "6 PM", protection: 25 },
  { time: "8 PM", protection: 15 },
  { time: "10 PM", protection: 10 },
];

export default function HealthImpactSimulator({ medications }: ImpactSimulatorProps) {
  const [selectedMed, setSelectedMed] = useState(medications[0]?.name || "");
  const [loading, setLoading] = useState(false);
  const [impactData, setImpactData] = useState<any>(null);
  const [chartData, setChartData] = useState(data);

  const runSimulation = async (medName: string) => {
    if (!medName) return;
    setLoading(true);
    try {
      const result = await simulateMissedDose(medName);
      setImpactData(result);
      
      const dropPoint = result.severity === "High" ? 10 : result.severity === "Medium" ? 30 : 50;
      setChartData([
        { time: "8 AM", protection: 98 },
        { time: "10 AM", protection: 96 },
        { time: "12 PM", protection: 94 },
        { time: "2 PM", protection: 92 },
        { time: "4 PM (MISSED)", protection: dropPoint },
        { time: "6 PM", protection: dropPoint - 5 },
        { time: "8 PM", protection: Math.max(5, dropPoint - 15) },
        { time: "10 PM", protection: Math.max(2, dropPoint - 20) },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (medications.length > 0 && !selectedMed) {
      setSelectedMed(medications[0].name);
    }
  }, [medications]);

  return (
    <div className="bg-bg-main border border-border-main rounded-3xl p-6 overflow-hidden space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
            <TrendingDown size={20} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-0.5">Health Impact Simulator</h4>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">Vulnerability Projection</h3>
          </div>
        </div>
        <div className="px-2 py-1 bg-danger/10 border border-danger/20 rounded-md">
           <span className="text-[9px] font-black uppercase tracking-widest text-danger animate-pulse">Missed Dose Risk</span>
        </div>
      </div>

      <div className="flex gap-2">
        <select 
          value={selectedMed}
          onChange={(e) => {
            setSelectedMed(e.target.value);
            runSimulation(e.target.value);
          }}
          className="flex-1 bg-surface-main border border-border-main rounded-xl px-4 py-2 text-xs font-bold text-text-primary outline-none focus:border-primary/50"
        >
          {medications.map(m => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
        <button 
          onClick={() => runSimulation(selectedMed)}
          disabled={loading || !selectedMed}
          className="px-4 py-2 bg-primary text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Simulate"}
        </button>
      </div>

      <div className="h-[140px] w-full bg-bg-main/50 rounded-2xl p-2 border border-border-main/30">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorProt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={impactData?.severity === "High" ? "#EF4444" : "#8B5CF6"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={impactData?.severity === "High" ? "#EF4444" : "#8B5CF6"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-surface-main/90 border border-border-main p-2 rounded-lg backdrop-blur-md shadow-xl">
                      <p className="text-[10px] font-black text-primary uppercase">{payload[0].payload.time}</p>
                      <p className="text-xs font-bold text-text-primary">{payload[0].value}% Protection</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="protection" 
              stroke={impactData?.severity === "High" ? "#EF4444" : "#8B5CF6"} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorProt)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-main">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Target</p>
            <p className="text-xs font-bold text-text-primary">95%+</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center text-danger">
            <AlertCircle size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Efficacy Drop</p>
            <p className="text-xs font-bold text-danger">-{impactData?.efficacyDrop || 0}%</p>
          </div>
        </div>
      </div>

      {impactData && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-bg-main border border-border-main rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-text-secondary">Safety Window</p>
              <p className="text-xs font-bold text-text-primary">{impactData.safetyWindow || 2}h</p>
            </div>
          </div>
          <div className="p-3 bg-bg-main border border-border-main rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ai/10 flex items-center justify-center text-ai">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-text-secondary">Severity</p>
              <p className="text-xs font-bold text-text-primary">{impactData.severity || "Low"}</p>
            </div>
          </div>
        </div>
      )}
      
      {impactData && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Recovery Action</span>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
          <p className="text-xs font-bold text-text-primary leading-relaxed">
            {impactData.recoveryAction || "Consult your physician if dose is missed by more than 4 hours."}
          </p>
          <p className="text-[10px] text-text-secondary italic opacity-60">
            {impactData.impact}
          </p>
        </motion.div>
      )}
    </div>
  );
}
