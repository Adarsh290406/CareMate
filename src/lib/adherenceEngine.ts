import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import { callAi } from "./ai";

export async function analyzeAdherencePatterns(patientId: string) {
  try {
    // 1. Fetch last 50 doses
    const q = query(
      collection(db, "doses"),
      where("patientId", "==", patientId),
      orderBy("scheduledAt", "desc"),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const doses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (doses.length < 5) return { prediction: "Insufficient data for prediction.", pattern: "Unknown" };

    // 2. Prepare data for AI
    const doseSummary = doses.map((d: any) => ({
      time: d.scheduledAt.toDate().toLocaleTimeString(),
      day: d.scheduledAt.toDate().toLocaleDateString('en-US', { weekday: 'long' }),
      status: d.status
    }));

    // 3. Call AI to detect patterns
    const system = "You are a health psychologist and data scientist. Analyze a patient's medication history and identify predictive patterns of non-adherence. Specifically look for time-of-day or day-of-week trends.";
    const userPrompt = `History: ${JSON.stringify(doseSummary)}. Predict the next likely miss and explain why. Be brief (1-2 sentences).`;

    const res = await callAi(system, userPrompt);
    return {
      prediction: res.text || "No clear patterns detected yet.",
      pattern: res.text?.includes("Sunday") ? "Weekend Slump" : res.text?.includes("Morning") ? "Morning Fog" : "Stable"
    };
  } catch (error) {
    console.error("Adherence analysis error:", error);
    return { prediction: "Analysis unavailable.", pattern: "Error" };
  }
}
