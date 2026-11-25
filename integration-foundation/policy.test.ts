import { strict as assert } from "node:assert";
import {
  eligibleProviders,
  canTransition,
  requiresApproval,
  canPerformAction,
  validateSafeOperation,
  type Provider,
} from "./policy";
import { agents, findAgent } from "./agents";
import { executeFree, type Adapter } from "./router";

// 1. Foundation assertions
const base: Provider = {
  id: "free-1",
  name: "Test Free Provider",
  enabled: true,
  healthy: true,
  free: true,
  remaining: 1,
  confidentialAllowed: false,
  rateLimitRPM: 15,
  rateLimitRPD: 1500,
  models: ["test-model"],
};

assert.equal(eligibleProviders([base]).length, 1);
assert.equal(eligibleProviders([base], true).length, 0); // Confidential blocked on public free
assert.equal(eligibleProviders([{ ...base, free: false }]).length, 0); // Paid blocked
assert.equal(eligibleProviders([{ ...base, remaining: 0 }]).length, 0); // Zero quota blocked
assert.equal(eligibleProviders([{ ...base, healthy: false }]).length, 0); // Unhealthy blocked

// Confidential allowed only on private provider
const privateLocal: Provider = {
  ...base,
  id: "ollama-local",
  confidentialAllowed: true,
};
assert.equal(eligibleProviders([privateLocal], true).length, 1);

// 2. State transition assertions
assert.equal(canTransition("queued", "running"), true);
assert.equal(canTransition("succeeded", "running"), false);
assert.equal(canTransition("running", "awaiting_approval"), true);
assert.equal(canTransition("awaiting_approval", "queued"), true);

// 3. Approval requirement assertions
assert.equal(requiresApproval("publish"), true);
assert.equal(requiresApproval("unknown"), true);
assert.equal(requiresApproval("draft"), false);
assert.equal(requiresApproval("read_public"), false);
assert.equal(requiresApproval("calculate"), false);

// 4. Role-based access control assertions
assert.equal(canPerformAction("admin", "approve_actions"), true);
assert.equal(canPerformAction("partner", "approve_actions"), false);
assert.equal(canPerformAction("auditor", "audit_code"), true);
assert.equal(canPerformAction("auditor", "manage_orders"), false);

// 5. Safe operation validation
assert.equal(validateSafeOperation("purchase", false, false).allowed, false);
assert.equal(validateSafeOperation("purchase", false, true).allowed, true);
assert.equal(validateSafeOperation("deploy", true, false).allowed, false);

// 6. Agent registry assertions
assert.equal(new Set(agents.map((a) => a.id)).size, agents.length);
assert.equal(agents.length >= 12, true);
assert.equal(findAgent("executive")?.id, "executive");
assert.equal(findAgent("property")?.id, "property");
assert.equal(findAgent("commerce")?.id, "commerce");
assert.equal(findAgent("creative")?.id, "creative");
assert.equal(findAgent("travel")?.id, "travel");
assert.equal(findAgent("tutor")?.id, "tutor");
assert.equal(findAgent("agreement")?.confidentialDefault, true);

// 7. Router closed-fail policy test
async function testRouter() {
  const dummyAdapter: Adapter = {
    provider: base,
    execute: async () => "Simulated response for test",
  };

  const controller = new AbortController();
  const res = await executeFree(
    { prompt: "Test prompt", confidential: false },
    [dummyAdapter],
    controller.signal
  );

  assert.equal(res.status, "succeeded");
  if (res.status === "succeeded") {
    assert.equal(res.providerId, "free-1");
  }

  // Test confidential rejection when only public provider is present
  const confRes = await executeFree(
    { prompt: "Private agreement text", confidential: true },
    [dummyAdapter],
    controller.signal
  );
  assert.equal(confRes.status, "unavailable");

  console.log("All foundation and policy assertions passed cleanly!");
}

testRouter().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
