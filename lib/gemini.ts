import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeError(logs: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  // 1. Check if logs are empty before sending to AI
  if (!logs || logs.trim().length === 0) {
    return {
      error: "Empty Logs Received",
      file: "N/A",
      suggestedFix: "The GitHub PAT might lack 'workflow' permissions to read logs."
    };
  }

  const prompt = `
    Analyze these CI/CD logs. Identify the root cause and provide a fix.
    Output ONLY valid JSON.
    FORMAT: {"error": "...", "file": "...", "suggestedFix": "..."}
    LOGS: ${logs}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI response was not valid JSON");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // This will now show the REAL error on your dashboard
    return {
      error: "AI Analysis Error",
      file: "Debug Information",
      suggestedFix: `Error: ${error.message || "Unknown error"}. Check Vercel logs for /api/webhook.`
    };
  }
}