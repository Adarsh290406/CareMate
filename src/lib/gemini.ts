/**
 * CareMate AI Client Service
 * All AI logic is proxied through the backend for security and reliability.
 */

/**
 * Conversational AI
 */
export async function chatWithAI(message: string, history: { text: string; sender: "ai" | "user" }[]) {
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history })
    });
    const data = await response.json();
    return data.text || data.error || "No response from AI.";
  } catch (error) {
    console.error("Chat API Error:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}

/**
 * Analyze Prescription via OCR
 */
export async function analyzePrescription(base64Image: string): Promise<any> {
  try {
    const response = await fetch("/api/ai/analyze-prescription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image })
    });
    return await response.json();
  } catch (error) {
    console.error("Vision API Error:", error);
    return { medications: [] };
  }
}

export const readPrescription = analyzePrescription;

/**
 * Generic AI caller (Proxied to backend)
 */
export async function callAi(systemInstruction: string, userPrompt: string) {
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction, userPrompt })
    });
    return await response.json();
  } catch (error) {
    console.error("Generation API Error:", error);
    return { text: "AI service offline." };
  }
}

/**
 * Medication Interaction Checker
 */
export async function checkMedsInteraction(newMed: string, currentMeds: string[]) {
  const prompt = `Analyze if the new medication "${newMed}" has any significant interactions with current meds: ${currentMeds.join(", ")}.
  Return ONLY JSON:
  {
    "safe": boolean,
    "advice": "short string",
    "warnings": ["warning 1", "warning 2"]
  }`;

  const res = await callAi("You are a clinical pharmacist.", prompt);
  try {
    const jsonStr = res.text.match(/\{[\s\S]*\}/)?.[0];
    return JSON.parse(jsonStr || "{}");
  } catch (e) {
    return { safe: true, advice: "Consult a doctor.", warnings: [] };
  }
}

/**
 * Health Insights Generator
 */
export async function generateHealthInsights(adherenceData: any) {
  const prompt = `Analyze adherence: ${JSON.stringify(adherenceData)}. 
  Return 3 bullet points: positive reinforcement, tip, and prediction.`;
  const res = await callAi("You are a health coach.", prompt);
  return res.text || "Keep logging your doses to see your health trends!";
}

/**
 * SOS Emergency Summary
 */
export async function generateSOSSummary(profile: any, medications: string[]) {
  const prompt = `CRITICAL 2-sentence medical summary for paramedics.
  Patient: ${profile.name}, Conditions: ${profile.conditions}.
  Meds: ${medications.join(", ")}.`;
  const res = await callAi("You are an ER doctor.", prompt);
  return res.text || `Patient ${profile.name} has a medical emergency.`;
}

/**
 * Risk Assessment Engine
 */
export async function calculateRiskScore(history: any[]): Promise<any> {
  const prompt = `Analyze medical history and return ONLY JSON:
  {
    "score": <0-100>,
    "explanation": "<2 sentences max>",
    "trend": "improving" | "stable" | "declining",
    "topRisk": "<risk factor>"
  }
  History: ${JSON.stringify(history)}`;

  const res = await callAi("You are a medical actuary.", prompt);
  try {
    const jsonStr = res.text.match(/\{[\s\S]*\}/)?.[0];
    return JSON.parse(jsonStr || "{}");
  } catch (e) {
    return { score: 0, explanation: "Assessment unavailable.", trend: "stable" };
  }
}

/**
 * Risk Score Anomaly Explainer
 */
export async function explainAnomaly(riskScore: number, adherenceData: any) {
  const prompt = `A patient has a health risk score of ${riskScore}/100.
  Adherence Data: ${JSON.stringify(adherenceData)}.
  Explain WHY this score is at this level in 1-2 simple sentences.`;
  const res = await callAi("You are a medical analyst.", prompt);
  return res.text || "Your risk score is based on adherence patterns.";
}

/**
 * Medication Encyclopedia
 */
export async function searchMedInfo(medName: string): Promise<any> {
  const prompt = `Provide detailed simplified medical information for: ${medName}. Return ONLY JSON.`;
  const res = await callAi("You are a pharmacist.", prompt);
  try {
    const jsonStr = res.text.match(/\{[\s\S]*\}/)?.[0];
    return JSON.parse(jsonStr || "{}");
  } catch (e) {
    return { name: medName, generalDescription: "Information unavailable." };
  }
}

/**
 * Identify Pill via Vision
 */
export async function identifyPill(base64Image: string): Promise<any> {
  try {
    const response = await fetch("/api/ai/analyze-prescription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image, task: "identify-pill" })
    });
    return await response.json();
  } catch (error) {
    return { pillName: "Unknown", match: false, description: "Analysis failed." };
  }
}

/**
 * Brand to Generic Converter
 */
export async function convertDrugBrand(brandName: string): Promise<any> {
  const prompt = `Convert the drug brand name "${brandName}" to its generic equivalent and composition. Return ONLY JSON.`;
  const res = await callAi("You are a clinical pharmacologist.", prompt);
  try {
    const jsonStr = res.text.match(/\{[\s\S]*\}/)?.[0];
    return JSON.parse(jsonStr || "{}");
  } catch (e) {
    return { brandName, genericName: "Unknown" };
  }
}

/**
 * Doctor Pre-Appointment Report
 */
export async function generateDoctorReport(profile: any, medications: any[], doses: any[]) {
  const prompt = `Create a summary for a doctor. Patient: ${profile.name}, Meds: ${JSON.stringify(medications)}.`;
  const res = await callAi("You are a medical scribe.", prompt);
  return res.text || "Unable to generate report.";
}

/**
 * Simulate Missed Dose Impact
 */
export async function simulateMissedDose(medName: string): Promise<any> {
  const prompt = `Simulate impact of missing one dose of ${medName}. Return ONLY JSON.`;
  const res = await callAi("You are a medical simulation engine.", prompt);
  try {
    const jsonStr = res.text.match(/\{[\s\S]*\}/)?.[0];
    return JSON.parse(jsonStr || "{}");
  } catch (e) {
    return { severity: "Low", impact: "Simulation offline." };
  }
}

/**
 * Schedule Optimizer
 */
export async function optimizeSchedule(meds: any[], lifestyle: any): Promise<any> {
  const prompt = `Optimize schedule for ${JSON.stringify(meds)} based on lifestyle ${JSON.stringify(lifestyle)}. Return ONLY JSON.`;
  const res = await callAi("You are a chronotherapy expert.", prompt);
  try {
    const jsonStr = res.text.match(/\{[\s\S]*\}/)?.[0];
    return JSON.parse(jsonStr || "{}");
  } catch (e) {
    return { changes: [], rationale: "Optimization offline." };
  }
}
