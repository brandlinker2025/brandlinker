import type { Provider } from "../policy";
import type { Adapter, Request } from "../router";

export const openRouterFreeProvider: Provider = {
  id: "openrouter-free",
  name: "OpenRouter (Free Tier Models)",
  enabled: true,
  healthy: true,
  free: true,
  remaining: 50, // 50 RPD free tier limit
  confidentialAllowed: false,
  rateLimitRPM: 20,
  rateLimitRPD: 50,
  models: [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-4-26b-a4b-it:free",
    "qwen/qwen3-coder:free",
  ],
};

export function createOpenRouterFreeAdapter(apiKey?: string, customModel?: string): Adapter {
  const effectiveKey = apiKey || process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY || "";
  const model = customModel || "openrouter/free";

  return {
    provider: {
      ...openRouterFreeProvider,
      enabled: Boolean(effectiveKey),
      healthy: Boolean(effectiveKey),
    },
    execute: async (req: Request, signal: AbortSignal): Promise<string> => {
      if (!effectiveKey) {
        throw new Error("OpenRouter API key not configured");
      }

      if (req.confidential) {
        throw new Error("Confidential data is strictly forbidden on public cloud free tiers.");
      }

      // Ensure model has :free suffix or is openrouter/free to strictly prevent accidental paid usage
      const safeModel = model.includes(":free") || model === "openrouter/free" ? model : `${model}:free`;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveKey}`,
          "HTTP-Referer": "https://rslina.com",
          "X-Title": "RS AI Command Center",
        },
        body: JSON.stringify({
          model: safeModel,
          messages: [{ role: "user", content: req.prompt }],
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`OpenRouter HTTP ${res.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== "string") {
        throw new Error("OpenRouter returned empty content");
      }

      return content.trim();
    },
  };
}
