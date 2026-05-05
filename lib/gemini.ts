import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Analyzes CI/CD failure logs using the 2026 stable Gemini 3 Flash model.
 * Includes robust parsing and defensive error checks.
 */
export async function analyzeError(logs: string) {
  // 1. Validation Check: Ensure API Key exists
  if (!process.env.GEMINI_API_KEY) {
    console.error("[Gemini] GEMINI_API_KEY is missing.");
    return {
      error: "AI Config Error",
      file: "N/A",
      suggestedFix: "Set GEMINI_API_KEY in Vercel environment variables."
    };
  }

  // 2. Validation Check: Ensure logs aren't empty
  if (!logs || logs.trim().length === 0) {
    return {
      error: "Empty Log Input",
      file: "N/A",
      suggestedFix: "GitHub token may lack 'workflow' scope to read logs."
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are an SRE AI. Analyze these CI/CD logs, find the root cause, and fix it.
      Output ONLY a valid JSON object. No markdown backticks.

      LOGS:
      ${logs}

      JSON SCHEMA:
      {
        "error": "Short description of what broke",
        "file": "path/to/broken/file",
        "suggestedFix": "Full corrected file content"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 3. Resilient JSON Extraction (ignores conversational filler)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI response did not contain a valid JSON block.");

    return JSON.parse(jsonMatch[0]);

  } catch (error: any) {
    console.error("[Gemini] Analysis failed:", error.message);
    
    return {
      error: "AI Analysis Failed",
      file: "System Logs",
      suggestedFix: `Gemini Error: ${error.message || "Unknown error"}`
    };
  }
}