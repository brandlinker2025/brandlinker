import type { Provider } from "../policy";
import type { Adapter, Request } from "../router";

export const ollamaLocalProvider: Provider = {
  id: "ollama-local",
  name: "Local Ollama (Private Workstation Compute)",
  enabled: true,
  healthy: true,
  free: true,
  remaining: 999999, // Local compute is zero cost and unlimited
  confidentialAllowed: true, // Safe for confidential partner documents & PII
  rateLimitRPM: 60,
  rateLimitRPD: 86400,
  models: ["qwen2.5:3b", "llama3.2", "mistral"],
};

export function createOllamaLocalAdapter(baseUrl?: string, customModel?: string): Adapter {
  const url = baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = customModel || process.env.OLLAMA_MODEL || "qwen2.5:3b";

  return {
    provider: {
      ...ollamaLocalProvider,
    },
    execute: async (req: Request, signal: AbortSignal): Promise<string> => {
      const endpoint = `${url.replace(/\/$/, "")}/api/chat`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: req.prompt }],
          stream: false,
        }),
        signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Ollama HTTP ${res.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data?.message?.content;

      if (!text || typeof text !== "string") {
        throw new Error("Ollama returned empty response");
      }

      return text.trim();
    },
  };
}
