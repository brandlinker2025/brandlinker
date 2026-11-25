import type { Provider } from "../policy";
import type { Adapter, Request } from "../router";

export const huggingFaceFreeProvider: Provider = {
  id: "huggingface-free",
  name: "Hugging Face Inference (Free Serverless)",
  enabled: true,
  healthy: true,
  free: true,
  remaining: 300,
  confidentialAllowed: false,
  rateLimitRPM: 30,
  rateLimitRPD: 1000,
  models: ["meta-llama/Llama-3.2-3B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3"],
};

export function createHuggingFaceFreeAdapter(apiKey?: string, customModel?: string): Adapter {
  const token = apiKey || process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || "";
  const model = customModel || "meta-llama/Llama-3.2-3B-Instruct";

  return {
    provider: {
      ...huggingFaceFreeProvider,
      enabled: Boolean(token),
      healthy: Boolean(token),
    },
    execute: async (req: Request, signal: AbortSignal): Promise<string> => {
      if (!token) {
        throw new Error("Hugging Face API token not configured");
      }

      if (req.confidential) {
        throw new Error("Confidential data is strictly forbidden on public cloud free tiers.");
      }

      const endpoint = `https://api-inference.huggingface.co/models/${model}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputs: req.prompt,
          parameters: {
            max_new_tokens: 1024,
            return_full_text: false,
          },
        }),
        signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`HuggingFace HTTP ${res.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await res.json();
      let text = "";
      if (Array.isArray(data) && data[0]?.generated_text) {
        text = data[0].generated_text;
      } else if (data?.generated_text) {
        text = data.generated_text;
      }

      if (!text || typeof text !== "string") {
        throw new Error("Hugging Face returned empty generated text");
      }

      return text.trim();
    },
  };
}
