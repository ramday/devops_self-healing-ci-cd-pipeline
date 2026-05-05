import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Analyzes CI/CD logs to find the root cause and provide a fix.
 * Using the 2026 'gemini-flash-latest' alias to ensure stability.
 */
export async function analyzeError(logs: string) {
  // Use the alias to point to the current stable Flash model (Gemini 3 Flash)
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    You are an expert DevOps and SRE engineer. 
    Analyze the following CI/CD failure logs and identify the root cause.
    Provide a concise suggested fix in the exact format required.

    LOGS:
    ${logs}

    RESPONSE FORMAT (JSON ONLY):
    {
      "error": "Short description of the error",
      "file": "Path to the broken file",
      "suggestedFix": "The complete corrected code for that file"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up any potential markdown backticks from Gemini
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}