import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Chat Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "");
      const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").replace(/['"]/g, "").trim();
      
      if (GROQ_API_KEY) {
        console.log(`Groq Key Loaded: ${GROQ_API_KEY.substring(0, 4)}...${GROQ_API_KEY.slice(-4)}`);
      } else {
        console.log("Groq Key is NOT being read from .env!");
      }
      
      const ai = GEMINI_API_KEY ? new (GoogleGenAI as any)({ apiKey: GEMINI_API_KEY }) : null;

      const systemInstruction = `You are CareMate, a specialized healthcare assistant. 
      Your primary goal is to help patients manage their medications, understand health trends, and provide supportive advice. 
      Keep responses concise, empathetic, and professional. 
      Always include a medical disclaimer in the first message of a session.
      If the user mentions an emergency or critical symptoms, urge them to call emergency services immediately.`;

      // Try Groq First
      if (GROQ_API_KEY) {
         try {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
               method: "POST",
               headers: {
                 "Content-Type": "application/json",
                 "Authorization": `Bearer ${GROQ_API_KEY}`
               },
               body: JSON.stringify({
                 model: "llama-3.3-70b-versatile",
                 messages: [
                    { role: "system", content: systemInstruction },
                    ...history.map((h: any) => ({
                      role: h.sender === "user" ? "user" : "assistant",
                      content: h.text
                    })),
                    { role: "user", content: message }
                 ],
                 temperature: 0.5,
                 max_tokens: 1024
               })
            });
            const data = await groqRes.json();
            if (data.choices?.[0]?.message?.content) {
               return res.json({ text: data.choices[0].message.content });
            } else {
               console.error("Groq API Error Details:", JSON.stringify(data));
            }
         } catch (e: any) {
            console.error("Groq Connection Error:", e.message || e);
         }
      } else {
         console.log("Groq Key missing or empty.");
      }

      // Fallback to Gemini
      if (!ai) throw new Error("AI Service not configured");
      
      console.log("Attempting Gemini call with gemini-2.0-flash...");
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          ...history.map((h: any) => ({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          })),
          { role: "user", parts: [{ text: message }] }
        ],
        config: { 
          systemInstruction: systemInstruction 
        }
      });

      res.json({ text: result.text });
    } catch (err: any) {
      console.error("AI API Error:", err.message || err);
      res.status(500).json({ error: "I'm having trouble connecting to my AI core right now." });
    }
  });

  // Generic AI Generation Endpoint
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { systemInstruction, userPrompt } = req.body;
      const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "");
      const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").replace(/['"]/g, "");
      
      const ai = GEMINI_API_KEY ? new (GoogleGenAI as any)({ apiKey: GEMINI_API_KEY }) : null;

      // Try Groq First
      if (GROQ_API_KEY) {
         try {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
               method: "POST",
               headers: {
                 "Content-Type": "application/json",
                 "Authorization": `Bearer ${GROQ_API_KEY}`
               },
               body: JSON.stringify({
                 model: "llama-3.1-8b-instant",
                 messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                 ],
                 temperature: 0.5
               })
            });
            const data = await groqRes.json();
            if (data.choices?.[0]?.message?.content) {
               return res.json({ text: data.choices[0].message.content });
            }
         } catch (e) {}
      }

      // Fallback to Gemini
      if (!ai) throw new Error("AI Service not configured");
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: { systemInstruction }
      });
      res.json({ text: result.text });
    } catch (err: any) {
      res.status(500).json({ error: "Generation failed." });
    }
  });

  // AI Vision/OCR Endpoint
  app.post("/api/ai/analyze-prescription", async (req, res) => {
    try {
      const { image } = req.body;
      const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "");
      const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").replace(/['"]/g, "").trim();
      
      const ai = new (GoogleGenAI as any)({ apiKey: GEMINI_API_KEY });
      const base64Data = image.includes(",") ? image.split(",")[1] : image;
      
      const prompt = `Extract medications from this prescription. Return ONLY JSON:
      {
        "medications": [
          { "name": "Name", "dosage": "Dosage", "frequency": "Frequency", "duration": "Duration" }
        ]
      }`;

      // Try Gemini First (Best for OCR)
      try {
        console.log("Attempting Gemini Vision with gemini-1.5-flash...");
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

        const jsonStr = result.text.match(/\{[\s\S]*\}/)?.[0];
        if (jsonStr) return res.json(JSON.parse(jsonStr));
      } catch (geminiErr: any) {
        console.error("Gemini Vision Failed, trying Groq Vision...", geminiErr.message || geminiErr);
      }

      // Fallback to Groq Vision
      if (GROQ_API_KEY) {
        console.log("Attempting Groq Vision with Llama 4 Scout...");
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { 
                    type: "image_url", 
                    image_url: { 
                      url: `data:image/jpeg;base64,${base64Data}` 
                    } 
                  }
                ]
              }
            ],
            max_tokens: 1024,
            response_format: { type: "json_object" }
          })
        });
        const data = await groqRes.json();
        if (data.error) {
          console.error("Groq Vision API Error:", JSON.stringify(data.error));
        }
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          console.log("Groq Vision Response received.");
          const jsonStr = content.match(/\{[\s\S]*\}/)?.[0];
          return res.json(jsonStr ? JSON.parse(jsonStr) : { medications: [] });
        } else {
          console.error("Groq Vision returned no content:", JSON.stringify(data));
        }
      }

      res.status(500).json({ error: "Vision analysis failed." });
    } catch (err: any) {
      console.error("Vision System Error:", err);
      res.status(500).json({ error: "Vision system offline." });
    }
  });

  // Vite middleware for development
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  if (vite) {
    server.on('upgrade', (req, socket, head) => {
      vite.ws.handleUpgrade(req, socket, head);
    });
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
