import assert from "node:assert/strict";
import {
  googleAIStudioProvider,
  openRouterFreeProvider,
  ollamaLocalProvider,
  huggingFaceFreeProvider,
  createGoogleAIStudioAdapter,
  createOpenRouterFreeAdapter,
  createOllamaLocalAdapter,
  createHuggingFaceFreeAdapter,
} from "./adapters";
import { executeFree } from "./router";

async function verifyProviderSafetyAndConnectivity() {
  console.log("Starting Live Provider Connectivity & Free-Only Billing Audit...");

  // 1. Audit Billing Configuration across all providers
  const providers = [
    googleAIStudioProvider,
    openRouterFreeProvider,
    ollamaLocalProvider,
    huggingFaceFreeProvider,
  ];

  for (const p of providers) {
    assert.equal(p.free, true, `Provider ${p.id} must have free: true`);
    assert.equal(Number.isFinite(p.remaining), true, `Provider ${p.id} must define remaining quota`);
    if (p.id === "ollama-local") {
      assert.equal(p.confidentialAllowed, true, "Local compute must allow confidential data");
    } else {
      assert.equal(
        p.confidentialAllowed,
        false,
        `Public provider ${p.id} must strictly disallow confidential data`
      );
    }
  }

  // 2. OpenRouter free model suffix audit
  for (const m of openRouterFreeProvider.models || []) {
    const isFree = m.endsWith(":free") || m === "openrouter/free";
    assert.equal(isFree, true, `Model ${m} must be strictly free-tier verified`);
  }

  // 3. Google AI Studio free tier limits audit
  assert.equal((googleAIStudioProvider.rateLimitRPM ?? 15) <= 15, true);
  assert.equal((googleAIStudioProvider.rateLimitRPD ?? 1500) <= 1500, true);

  // 4. Closed-Fail Execution with unconfigured/mock adapters
  const unconfiguredGoogle = createGoogleAIStudioAdapter("unconfigured-key-placeholder");
  const unconfiguredOpenRouter = createOpenRouterFreeAdapter("unconfigured-key-placeholder");
  const localOllama = createOllamaLocalAdapter("http://127.0.0.1:11434");

  const ctrl = new AbortController();
  const safePrompt = { prompt: "Say hello", confidential: false };

  // When providers fail network/auth, router MUST fail closed without attempting paid endpoints
  const result = await executeFree(safePrompt, [unconfiguredGoogle, unconfiguredOpenRouter], ctrl.signal);
  assert.equal(result.status, "unavailable");
  if (result.status === "unavailable") {
    assert.equal(result.attempted.length > 0, true);
  }

  console.log("Free-only provider configuration and closed-fail security verified successfully!");
}

verifyProviderSafetyAndConnectivity().catch((err) => {
  console.error("Provider connectivity audit failure:", err);
  process.exitCode = 1;
});
