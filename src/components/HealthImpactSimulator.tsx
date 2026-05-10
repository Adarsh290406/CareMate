import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";
import { motion } from "motion/react";
import { TrendingDown, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

const data = [
  { time: "8 AM", protection: 98 },
  { time: "10 AM", protection: 95 },
  { time: "12 PM", protection: 90 },
  { time: "2 PM", protection: 85 },
  { time: "4 PM", protection: 40 }, // Missed dose drop
  { time: "6 PM", protection: 25 },
  { time: "8 PM", protection: 15 },
  { time: "10 PM", protection: 10 },
];

export default function HealthImpactSimulator() {
  return (
    <div className="dense-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Impact Simulator</h4>
          <h3 className="text-sm font-bold text-white tracking-tight">Vulnerability Projection</h3>
        </div>
        <div className="px-2 py-1 bg-danger/10 border border-danger/20 rounded-md">
           <span className="text-[9px] font-black uppercase tracking-widest text-danger animate-pulse">Missed Dose Risk</span>
        </div>
      </div>

      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorProt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-surface/90 border border-white/10 p-2 rounded-lg backdrop-blur-md shadow-xl">
                      <p className="text-[10px] font-black text-primary-accent uppercase">{payload[0].payload.time}</p>
                      <p className="text-xs font-bold text-white">{payload[0].value}% Protection</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="protection" 
              stroke="#8B5CF6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorProt)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Target</p>
            <p className="text-xs font-bold text-white">95%+</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center text-danger">
            <TrendingDown size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Projected</p>
            <p className="text-xs font-bold text-danger">15%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
