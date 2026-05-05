import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Analyzes CI/CD logs with built-in safety checks for API and formatting issues.
 */
export async function analyzeError(logs: string) {
  // 1. Pre-flight Check: Environment
  if (!process.env.GEMINI_API_KEY) {
    console.error("[Gemini] API Key missing from environment.");
    return fallbackResponse("Configuration Error: Missing GEMINI_API_KEY.");
  }

  // 2. Pre-flight Check: Input Data
  if (!logs || logs.trim().length < 10) {
    console.warn("[Gemini] Insufficient log data received.");
    return fallbackResponse("Logs are empty or too short to analyze.");
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are an SRE bot. Analyze these logs to find the root cause and a fix.
      Output ONLY a valid JSON object. No markdown backticks.

      LOGS:
      ${logs}

      JSON SCHEMA:
      {
        "error": "Brief cause",
        "file": "path/to/broken/file",
        "suggestedFix": "Full corrected content"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // 3. Resilient JSON Parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI output was not in JSON format.");
    
    return JSON.parse(jsonMatch[0]);

  } catch (error: any) {
    console.error("[Gemini] Analysis failed:", error.message);
    
    // Check for specific API errors (like quota or safety blocks)
    const reason = error.message.includes("429") 
      ? "AI Rate limit reached. Try again in a minute." 
      : "Gemini was unable to process these specific logs.";
      
    return fallbackResponse(reason);
  }
}

function fallbackResponse(msg: string) {
  return {
    error: "Analysis Failed",
    file: "N/A",
    suggestedFix: msg
  };
}