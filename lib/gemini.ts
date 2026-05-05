import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeError(logs: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    Analyze these CI/CD logs. Identify the root cause and provide a fix.
    
    STRICT RULES:
    1. Output ONLY valid JSON.
    2. The "file" field MUST be a specific file path (e.g., ".github/workflows/ci.yml").
    3. NEVER use wildcards like "*.yml" or "workflow.yml" if you aren't sure.
    4. If multiple files are involved, pick the primary workflow file.

    FORMAT: 
    {
      "error": "Short description",
      "file": ".github/workflows/main.yml",
      "suggestedFix": "Full corrected code"
    }

    LOGS: 
    ${logs}
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
    return {
      error: "AI Analysis Error",
      file: "N/A",
      suggestedFix: `Error: ${error.message}`
    };
  }
}