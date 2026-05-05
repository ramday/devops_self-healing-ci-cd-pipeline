import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeError(logs: string) {
  // 2. Use the stable 'gemini-flash-latest' alias (Gemini 3 Flash)
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    Analyze these CI/CD logs. Identify the root cause and provide a fix.
    Output ONLY valid JSON. Do not include markdown formatting or backticks.

    FORMAT:
    {
      "error": "description of error",
      "file": "path/to/file",
      "suggestedFix": "corrected code"
    }

    LOGS:
    ${logs}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // 3. Extract JSON using a regex to ignore any potential conversational filler
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return {
      error: "AI analysis failed to format correctly.",
      file: "Check logs",
      suggestedFix: "Please check the workflow logs manually."
    };
  }
}