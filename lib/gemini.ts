// lib/gemini.ts

export async function analyzeError(logs: string) {
  // Always use the latest stable alias for Gemini 3
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
    
    // RESILIENT PARSING: Strips away ```json and ``` if Gemini adds them
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    // This is what is currently being saved to your KV:
    return {
      error: "AI analysis failed to format correctly.",
      file: "Check logs",
      suggestedFix: "Please check the workflow logs manually."
    };
  }
}