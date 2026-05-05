import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Analyzes CI/CD logs with defensive checks and resilient JSON parsing.
 */
export async function analyzeError(logs: string) {
  // 1. Pre-flight check for API Key
  if (!process.env.GEMINI_API_KEY) {
    return {
      error: "Configuration Error",
      file: "Environment Variables",
      suggestedFix: "GEMINI_API_KEY is not set in Vercel settings."
    };
  }

  // 2. Pre-flight check for content
  if (!logs || logs.trim().length === 0) {
    return {
      error: "Incomplete Data",
      file: "GitHub Logs",
      suggestedFix: "No logs were retrieved. Check if your PAT has 'workflow' scope."
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    Analyze these CI/CD logs. Identify the root cause and provide a fix.
    Output ONLY valid JSON. 
    FORMAT: {"error": "...", "file": "...", "suggestedFix": "..."}
    LOGS: ${logs}
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // 3. Extract JSON specifically to avoid markdown wrapper issues
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI response was not valid JSON");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("[Gemini] Pipeline Error:", error);
    return {
      error: "Analysis Failed",
      file: "N/A",
      suggestedFix: `Error processing AI response: ${error.message}`
    };
  }
}