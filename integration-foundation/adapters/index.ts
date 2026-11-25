export * from "./google-ai-studio";
export * from "./openrouter-free";
export * from "./ollama-local";
export * from "./huggingface-free";

import { createGoogleAIStudioAdapter } from "./google-ai-studio";
import { createOpenRouterFreeAdapter } from "./openrouter-free";
import { createOllamaLocalAdapter } from "./ollama-local";
import { createHuggingFaceFreeAdapter } from "./huggingface-free";
import type { Adapter } from "../router";

export function getStandardFreeAdapters(keys?: {
  geminiKey?: string;
  openRouterKey?: string;
  hfToken?: string;
  ollamaUrl?: string;
}): Adapter[] {
  return [
    createGoogleAIStudioAdapter(keys?.geminiKey),
    createOpenRouterFreeAdapter(keys?.openRouterKey),
    createOllamaLocalAdapter(keys?.ollamaUrl),
    createHuggingFaceFreeAdapter(keys?.hfToken),
  ];
}
