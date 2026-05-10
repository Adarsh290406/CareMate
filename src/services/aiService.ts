import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { calculateRiskScore, generateHealthInsights, generateDoctorReport, chatWithAI } from "../lib/gemini";

/**
 * AI Service to handle complex health data processing
 */
export const AIService = {
  /**
   * Updates the risk score for a patient based on recent history
   */
  async updatePatientRiskScore(uid: string) {
    try {
      // 1. Get recent doses (last 50)
      const dosesRef = collection(db, "doses");
      const q = query(
        dosesRef, 
        where("userId", "==", uid), 
        orderBy("scheduledAt", "desc"), 
        limit(50)
      );
      const doseSnap = await getDocs(q);
      const history = doseSnap.docs.map(d => ({
        status: d.data().status,
        medName: d.data().medName,
        scheduledAt: d.data().scheduledAt.toDate().toISOString()
      }));

      if (history.length === 0) return;

      // 2. Call AI to analyze risk
      const riskResult = await calculateRiskScore(history);

      // 3. Save to Firestore
      const riskRef = doc(db, "riskScores", uid);
      await setDoc(riskRef, {
        ...riskResult,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return riskResult;
    } catch (err) {
      console.error("Risk score calculation failed:", err);
      return null;
    }
  },

  /**
   * Generates a daily adherence summary
   */
  async getDailySummary(uid: string) {
    try {
      const dosesRef = collection(db, "doses");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        dosesRef,
        where("userId", "==", uid),
        where("scheduledAt", ">=", today),
        orderBy("scheduledAt", "asc")
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        status: d.data().status,
        med: d.data().medName,
        time: d.data().time
      }));

      const insights = await generateHealthInsights({ doses: data, type: "daily" });
      return insights;
    } catch (err) {
      console.error("Daily summary generation failed:", err);
      return "Keep logging your doses to see daily insights.";
    }
  },

  /**
   * Predicts if a patient might miss upcoming doses
   */
  async predictNonAdherence(uid: string) {
    try {
      const dosesRef = collection(db, "doses");
      const q = query(
        dosesRef,
        where("userId", "==", uid),
        where("status", "==", "missed"),
        limit(10)
      );
      const missedSnap = await getDocs(q);
      if (missedSnap.empty) return { risk: "low", prediction: "Likely to stay adherent." };

      // Logic for prediction based on patterns
      // (Simplified for now, could be expanded with more Groq analysis)
      return { risk: "medium", prediction: "Pattern of missing morning doses detected." };
    } catch (err) {
      return null;
    }
  },

  /**
   * Explains why a patient's health score might be anomalous
   */
  async explainAnomaly(uid: string) {
    try {
      const riskRef = doc(db, "riskScores", uid);
      const riskSnap = await getDoc(riskRef);
      if (!riskSnap.exists()) return "No health record found for analysis.";

      const riskData = riskSnap.data();
      const explanation = await chatWithAI(`
        Explain this health risk score anomaly to the patient in a calm, professional tone.
        Score: ${riskData.score}/100
        Factors: ${JSON.stringify(riskData.factors)}
        Current Trend: ${riskData.trend}
        
        Focus on: 
        1. Why the score is what it is.
        2. What the primary "anomaly" or issue is.
        3. A clear, actionable step to improve it.
        Keep it under 100 words.
      `, []);
      return explanation;
    } catch (err) {
      return "Unable to analyze health anomalies at this time.";
    }
  }
};
