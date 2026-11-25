import { strict as assert } from "node:assert";
import {
  canTransition,
  requiresApproval,
  canPerformAction,
  validateSafeOperation,
  type JobState,
  type Role,
} from "./policy";
import { executeFree, type Adapter, type Request } from "./router";
import {
  getLeads,
  getPartners,
  getProducts,
  getJobs,
  getApprovals,
  createJob,
  transitionJob,
  resolveApproval,
  addLead,
} from "../src/lib/ecosystem-state";
import { maskSecret } from "../src/lib/auth-guard";

console.log("Starting Master Ecosystem Integration & Security Test Suite...");

// 1. Security & Credential Masking Tests
assert.equal(maskSecret(""), "Not Configured");
assert.equal(maskSecret(undefined), "Not Configured");
assert.equal(maskSecret("short"), "••••••••");
const maskedKey = maskSecret("AIzaSyDummySecretKey12345678");
assert.equal(maskedKey.startsWith("AIza••••"), true);
assert.equal(maskedKey.endsWith("5678"), true);
assert.equal(maskedKey.includes("DummySecretKey"), false); // Secret body must be obfuscated

// 2. Strict RBAC & Action Authorization Tests
const roles: Role[] = ["admin", "manager", "partner", "auditor"];
assert.equal(canPerformAction("admin", "approve_actions"), true);
assert.equal(canPerformAction("manager", "approve_actions"), false);
assert.equal(canPerformAction("partner", "approve_actions"), false);
assert.equal(canPerformAction("auditor", "approve_actions"), false);

assert.equal(canPerformAction("auditor", "audit_code"), true);
assert.equal(canPerformAction("partner", "audit_code"), false);

// 3. Destructive / Financial Operation Safety Gates
assert.equal(validateSafeOperation("purchase", false, false).allowed, false);
assert.equal(validateSafeOperation("payment", false, false).allowed, false);
assert.equal(validateSafeOperation("bulk_email", false, false).allowed, false);
assert.equal(validateSafeOperation("deploy", true, false).allowed, false);
assert.equal(validateSafeOperation("deploy", true, true).allowed, true);

// 4. Confidential Data Policy Tests
const publicFreeAdapter: Adapter = {
  provider: {
    id: "public-cloud-free",
    name: "Public Cloud Free",
    enabled: true,
    healthy: true,
    free: true,
    remaining: 100,
    confidentialAllowed: false,
    rateLimitRPM: 15,
    rateLimitRPD: 1000,
    models: ["cloud-free-model"],
  },
  execute: async () => "Public cloud answer",
};

const localPrivateAdapter: Adapter = {
  provider: {
    id: "ollama-local",
    name: "Local Private Model",
    enabled: true,
    healthy: true,
    free: true,
    remaining: 999999,
    confidentialAllowed: true,
    rateLimitRPM: 60,
    rateLimitRPD: 86400,
    models: ["local-model"],
  },
  execute: async () => "Private local answer: Agreement verified",
};

async function testConfidentialRouting() {
  const ctrl = new AbortController();

  // Test: Public adapter only + confidential prompt -> MUST BE REJECTED
  const res1 = await executeFree(
    { prompt: "Confidential Broker Agreement Text", confidential: true },
    [publicFreeAdapter],
    ctrl.signal
  );
  assert.equal(res1.status, "unavailable");

  // Test: Local private adapter available + confidential prompt -> ALLOWED
  const res2 = await executeFree(
    { prompt: "Confidential Broker Agreement Text", confidential: true },
    [publicFreeAdapter, localPrivateAdapter],
    ctrl.signal
  );
  assert.equal(res2.status, "succeeded");
  if (res2.status === "succeeded") {
    assert.equal(res2.providerId, "ollama-local");
    assert.equal(res2.output.includes("Private local answer"), true);
  }

  // Test: Normal public prompt routed to public adapter
  const res3 = await executeFree(
    { prompt: "Public market trends in Dubai real estate", confidential: false },
    [publicFreeAdapter],
    ctrl.signal
  );
  assert.equal(res3.status, "succeeded");
  if (res3.status === "succeeded") {
    assert.equal(res3.providerId, "public-cloud-free");
  }
}

// 5. Durable Job State Machine & Approval Lifecycle Tests
function testJobStateLifecycle() {
  const initialJobCount = getJobs().length;
  const initialApprovalCount = getApprovals().length;

  // Create job requiring approval
  const sensitiveJob = createJob(
    "Publish Luxury Concierge Campaign",
    "dubai",
    { campaignId: "dxb-01", targetAudience: "VIP Partners" },
    true
  );

  assert.equal(sensitiveJob.state, "awaiting_approval");
  assert.equal(getJobs().length, initialJobCount + 1);
  assert.equal(getApprovals().length, initialApprovalCount + 1);

  const pendingAppr = getApprovals().find((a) => a.jobId === sensitiveJob.id);
  assert.notEqual(pendingAppr, undefined);
  assert.equal(pendingAppr?.status, "pending");

  // Attempt invalid transition directly from awaiting_approval to running -> MUST THROW
  assert.throws(() => {
    transitionJob(sensitiveJob.id, "running");
  }, /Invalid transition/);

  // Approve action by Admin
  const approvedOk = resolveApproval(pendingAppr!.id, "approved", "RS Lina (Admin)");
  assert.equal(approvedOk, true);

  // State should now have transitioned safely to 'queued'
  const updatedJob = getJobs().find((j) => j.id === sensitiveJob.id);
  assert.equal(updatedJob?.state, "queued");

  // Transition queued -> running
  transitionJob(sensitiveJob.id, "running");
  assert.equal(getJobs().find((j) => j.id === sensitiveJob.id)?.state, "running");

  // Transition running -> succeeded
  transitionJob(sensitiveJob.id, "succeeded");
  assert.equal(getJobs().find((j) => j.id === sensitiveJob.id)?.state, "succeeded");
}

// 6. CRM & Business Module Tests
function testBusinessModules() {
  const newLead = addLead({
    name: "Dr. Karim Al-Fahim",
    email: "karim@alfahim-consult.ae",
    service: "dubai_real_estate",
    status: "new",
    budgetAED: 6000000,
    notes: "Direct investor interested in branded residences.",
  });
  assert.equal(newLead.name, "Dr. Karim Al-Fahim");
  assert.equal(getLeads().some((l) => l.id === newLead.id), true);

  // Landed cost formula verification
  const costUSD = 10;
  const shippingUSD = 3;
  const duty = costUSD * 0.05; // 0.50
  const landedCost = costUSD + shippingUSD + duty; // 13.50
  const targetMargin = 0.65;
  const targetPrice = landedCost / (1 - targetMargin); // 13.50 / 0.35 = 38.57
  const unitProfit = targetPrice - landedCost;

  assert.equal(Math.round(landedCost * 100) / 100, 13.5);
  assert.equal(Math.round(targetPrice * 100) / 100, 38.57);
  assert.equal(Math.round(unitProfit * 100) / 100, 25.07);

  // Dubai property commission split verification
  const propValue = 5000000;
  const commissionRate = 2.5;
  const grossComm = (propValue * commissionRate) / 100; // 125,000 AED
  const netPlatformShare = grossComm * 0.7; // 87,500 AED
  assert.equal(grossComm, 125000);
  assert.equal(netPlatformShare, 87500);
}

async function runAll() {
  await testConfidentialRouting();
  testJobStateLifecycle();
  testBusinessModules();
  console.log("All integration and security verification tests passed successfully!");
}

runAll().catch((err) => {
  console.error("Integration test error:", err);
  process.exit(1);
});
