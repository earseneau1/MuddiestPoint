import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function generateFeedbackSuggestions(topic: string, confusionLevel: string): Promise<string[]> {
  try {
    const prompt = `You are an AI assistant helping students provide constructive feedback about confusing course topics. 

The student is ${confusionLevel} confused about: "${topic}"

Generate 3 helpful, specific feedback suggestions that would help a professor understand what's confusing and how to improve their teaching. Each suggestion should:
- Be specific and actionable
- Explain what part is confusing and why
- Suggest how the concept could be taught differently
- Be respectful and constructive
- Be 1-2 sentences long

Respond with JSON in this format: { "suggestions": ["suggestion1", "suggestion2", "suggestion3"] }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions || [];
  } catch (error) {
    console.error("Error generating feedback suggestions:", error);
    return [];
  }
}

export async function improveFeedbackText(originalText: string, topic: string): Promise<string> {
  try {
    const prompt = `You are an AI assistant helping students improve their feedback about confusing course topics.

Topic: "${topic}"
Original feedback: "${originalText}"

Please improve this feedback to be more:
- Specific and detailed
- Constructive and helpful for the professor
- Clear about what exactly is confusing
- Respectful in tone

Keep the core message the same but make it more effective. Respond with just the improved text, no extra formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.5,
    });

    return response.choices[0].message.content?.trim() || originalText;
  } catch (error) {
    console.error("Error improving feedback text:", error);
    return originalText;
  }
}