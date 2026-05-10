import { GoogleGenAI } from "@google/genai";

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

// Initialize Gemini (For Vision tasks: OCR & Pill Identification)
const ai = GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE" ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

/**
 * High-speed Groq API caller for all text/logic tasks
 */
async function callGroq(messages: any[], jsonMode: boolean = false) {
  if (!GROQ_API_KEY) {
    console.warn("GROQ_API_KEY missing, falling back to Gemini...");
    return null;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages,
        temperature: 0.5,
        max_tokens: 1024,
        response_format: jsonMode ? { type: "json_object" } : undefined
      })
    });

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    return null;
  } catch (error) {
    console.error("Groq API Error:", error);
    return null;
  }
}

/**
 * Gemini Vision API Caller
 */
async function callGeminiVision(prompt: string, base64Image: string) {
  if (!ai) return null;
  try {
    const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ]
      }]
    });
    return result.text;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
}

/**
 * Generic AI caller used by various components
 */
export async function callAi(systemInstruction: string, userPrompt: string) {
  const groqRes = await callGroq([
    { role: "system", content: systemInstruction },
    { role: "user", content: userPrompt }
  ]);

  if (groqRes) return { text: groqRes };

  if (!ai) return { text: "AI service offline." };
  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: { systemInstruction }
    });
    return { text: result.text };
  } catch (error) {
    return { text: "AI error." };
  }
}

/**
 * Conversational AI
 */
export async function chatWithAI(message: string, history: { text: string; sender: "ai" | "user" }[]) {
  const systemInstruction = `You are CareMate, a specialized healthcare assistant. 
  Your primary goal is to help patients manage their medications, understand health trends, and provide supportive advice. 
  Keep responses concise, empathetic, and professional. 
  Always include a medical disclaimer in the first message of a session.
  If the user mentions an emergency or critical symptoms, urge them to call emergency services immediately.`;

  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(h => ({
      role: h.sender === "user" ? "user" : "assistant",
      content: h.text
    })),
    { role: "user", content: message }
  ];

  const groqRes = await callGroq(messages);
  if (groqRes) return groqRes;

  if (!ai) return "I'm sorry, the AI service is not configured correctly.";
  try {
    const contents = history.map(h => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents,
      config: { systemInstruction }
    });
    return result.text;
  } catch (error) {
    return "I'm having trouble connecting right now. Please try again later.";
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

  const groqRes = await callGroq([{ role: "user", content: prompt }], true);
  if (groqRes) return JSON.parse(groqRes);

  if (!ai) return { safe: true, advice: "Interaction check unavailable.", warnings: [] };
  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.text || "{}");
  } catch (error) {
    return { safe: false, advice: "Consult a doctor.", warnings: ["Verification failed."] };
  }
}

/**
 * Health Insights Generator
 */
export async function generateHealthInsights(adherenceData: any) {
  const prompt = `Analyze adherence: ${JSON.stringify(adherenceData)}. 
  Return 3 bullet points: positive reinforcement, tip, and prediction.`;
  const groqRes = await callGroq([{ role: "user", content: prompt }]);
  return groqRes || "Keep logging your doses to see your health trends!";
}

/**
 * SOS Emergency Summary
 */
export async function generateSOSSummary(profile: any, medications: string[]) {
  const prompt = `CRITICAL 2-sentence medical summary for paramedics.
  Patient: ${profile.name}, Conditions: ${profile.conditions}.
  Meds: ${medications.join(", ")}.`;
  const groqRes = await callGroq([{ role: "user", content: prompt }]);
  return groqRes || `Patient ${profile.name} has a medical emergency.`;
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

  const groqRes = await callGroq([{ role: "user", content: prompt }], true);
  if (groqRes) return JSON.parse(groqRes);

  return { score: 0, explanation: "Assessment unavailable.", trend: "stable" };
}

/**
 * Risk Score Anomaly Explainer (Groq)
 */
export async function explainAnomaly(riskScore: number, adherenceData: any) {
  const prompt = `A patient has a health risk score of ${riskScore}/100.
  Adherence Data: ${JSON.stringify(adherenceData)}.
  Explain WHY this score is at this level in 1-2 simple sentences.`;

  const groqRes = await callGroq([{ role: "user", content: prompt }]);
  return groqRes || "Your risk score is based on adherence patterns.";
}

/**
 * Doctor Pre-Appointment Report (Groq)
 */
export async function generateDoctorReport(profile: any, medications: any[], doses: any[]) {
  const prompt = `Create a "30-second read" pre-appointment summary for a doctor.
  Patient: ${profile.name}, Conditions: ${profile.conditions}.
  Medications: ${JSON.stringify(medications.map(m => m.name))}.
  Recent Adherence: ${JSON.stringify(doses.slice(0, 20).map(d => ({ status: d.status, med: d.medName }))) || "No data"}.`;

  const groqRes = await callGroq([{ role: "user", content: prompt }]);
  return groqRes || "Unable to generate report at this time.";
}

/**
 * Medication Encyclopedia
 */
export async function searchMedInfo(medName: string): Promise<any> {
  const prompt = `Provide detailed simplified medical information for: ${medName}.
  Return ONLY JSON:
  {
    "name": "Drug Name",
    "generalDescription": "What it is",
    "commonUses": "Why it's taken",
    "sideEffects": "Common side effects",
    "precautions": "What to avoid",
    "interestingFact": "A short engaging fact"
  }`;
  const groqRes = await callGroq([{ role: "user", content: prompt }], true);
  if (groqRes) return JSON.parse(groqRes);
  return { name: medName, generalDescription: "Information unavailable." };
}

/**
 * Simulate Missed Dose Impact
 */
export async function simulateMissedDose(medName: string): Promise<any> {
  const prompt = `Simulate impact of missing one dose of ${medName}. Return ONLY JSON.`;
  const groqRes = await callGroq([{ role: "user", content: prompt }], true);
  if (groqRes) return JSON.parse(groqRes);
  return { severity: "Low", impact: "Simulation offline." };
}

/**
 * Schedule Optimizer
 */
export async function optimizeSchedule(meds: any[], lifestyle: any): Promise<any> {
  const prompt = `Optimize schedule for ${JSON.stringify(meds)} based on lifestyle ${JSON.stringify(lifestyle)}. Return ONLY JSON.`;
  const groqRes = await callGroq([{ role: "user", content: prompt }], true);
  if (groqRes) return JSON.parse(groqRes);
  return { changes: [], rationale: "Optimization offline." };
}

/**
 * Identify Pill via Vision
 */
export async function identifyPill(base64Image: string): Promise<any> {
  const prompt = `Identify this pill. Return ONLY JSON:
  {
    "pillName": "Name",
    "match": boolean,
    "identifiedAs": "Name",
    "description": "Visual analysis",
    "visuals": { "shape": "round|oval|etc", "color": "color" }
  }`;

  const res = await callGeminiVision(prompt, base64Image);
  if (res) {
    const jsonStr = res.match(/\{[\s\S]*\}/)?.[0];
    if (jsonStr) return JSON.parse(jsonStr);
  }
  return { pillName: "Unknown", match: false, description: "Analysis failed." };
}

/**
 * Analyze Prescription via OCR
 */
export async function analyzePrescription(base64Image: string): Promise<any> {
  const prompt = `Extract medications from this prescription. Return ONLY JSON:
  {
    "medications": [
      { "name": "Name", "dosage": "Dosage", "frequency": "Frequency", "duration": "Duration" }
    ]
  }`;

  const res = await callGeminiVision(prompt, base64Image);
  if (res) {
    const jsonStr = res.match(/\{[\s\S]*\}/)?.[0];
    if (jsonStr) return JSON.parse(jsonStr);
  }
  return { medications: [] };
}

/**
 * Brand to Generic Converter (Groq JSON)
 */
export async function convertDrugBrand(brandName: string): Promise<any> {
  const prompt = `Convert the drug brand name "${brandName}" to its generic equivalent and composition.
  Return ONLY JSON:
  {
    "brandName": "Name",
    "genericName": "Generic Name",
    "composition": "Chemical composition details",
    "usage": "Primary clinical use",
    "alternatives": ["Alt 1", "Alt 2"]
  }`;

  const groqRes = await callGroq([{ role: "user", content: prompt }], true);
  if (groqRes) return JSON.parse(groqRes);
  return { brandName, genericName: "Unknown", composition: "Information unavailable.", alternatives: [] };
}
