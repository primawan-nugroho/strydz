// Provider-agnostic: any OpenAI-compatible chat-completions API works.
// Groq:       https://api.groq.com/openai/v1       llama-3.1-8b-instant
// Mistral:    https://api.mistral.ai/v1            mistral-small-latest
// Cerebras:   https://api.cerebras.ai/v1           llama3.1-8b
// OpenRouter: https://openrouter.ai/api/v1         meta-llama/llama-3.1-8b-instruct:free
const API_BASE_URL = process.env.AI_API_BASE_URL ?? "https://api.groq.com/openai/v1";
const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL ?? "llama-3.1-8b-instant";

export function isCoachConfigured(): boolean {
  return Boolean(API_KEY);
}

export async function generateCoachText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 220
): Promise<string> {
  if (!API_KEY) throw new Error("AI_API_KEY not configured");

  const res = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI API ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const text: string | undefined = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from AI API");
  return text;
}
