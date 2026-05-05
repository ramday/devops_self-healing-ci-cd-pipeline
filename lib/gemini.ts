import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function analyzeError(logs: string) {
  const prompt = `
    You are a Senior DevOps Engineer. Analyze these GitHub Action logs. 
    Identify the failing file, the exact error message, and a brief 2-sentence fix. 
    Output ONLY valid JSON in this format: 
    { "file": "string", "error": "string", "suggestedFix": "string" }
    
    Logs:
    ${logs.slice(-2500)} // Analyze the tail of the log where the error usually is
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean potential markdown wrapping
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { 
      error: "Failed to parse error logs.", 
      file: "Unknown", 
      suggestedFix: "Please check the workflow logs manually." 
    };
  }
}