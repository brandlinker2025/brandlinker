import type { Provider } from "../policy";
import type { Adapter, Request } from "../router";

export const googleAIStudioProvider: Provider = {
  id: "google-ai-studio",
  name: "Google AI Studio (Gemini Free Tier)",
  enabled: true,
  healthy: true,
  free: true,
  remaining: 1500, // 1500 RPD free tier limit
  confidentialAllowed: false, // Terms: user data outside EU may be used for tuning on free tier
  rateLimitRPM: 15,
  rateLimitRPD: 1500,
  models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"],
};

export function createGoogleAIStudioAdapter(apiKey?: string, customModel?: string): Adapter {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_KEY || "";
  const model = customModel || "gemini-2.5-flash";

  return {
    provider: {
      ...googleAIStudioProvider,
      enabled: Boolean(effectiveKey),
      healthy: Boolean(effectiveKey),
    },
    execute: async (req: Request, signal: AbortSignal): Promise<string> => {
      if (!effectiveKey) {
        throw new Error("Google AI Studio API key not configured");
      }

      if (req.confidential) {
        throw new Error("Confidential data is strictly forbidden on public cloud free tiers.");
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        effectiveKey
      )}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: req.prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
        signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Google AI Studio HTTP ${res.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text || typeof text !== "string") {
        throw new Error("Google AI Studio returned empty output");
      }

      return text.trim();
    },
  };
}
