import { strict as assert } from "node:assert";
import {
  canTransition,
  requiresApproval,
  canPerformAction,
  validateSafeOperation,
  type Role,
} from "./policy";
import { executeFree, type Adapter } from "./router";
import {
  getPlatforms,
  getPartners,
  getAgreements,
  getLeads,
  getJobs,
  getApprovals,
  getAuditLog,
  addLead,
  calculatePartnerCommission,
  resolveApproval,
} from "../src/lib/ecosystem-state";
import { maskSecret } from "../src/lib/auth-guard";
import { evaluateUaeVat } from "../src/lib/uae-tax";

console.log("Starting Master Ecosystem Integration & Security Test Suite...");

// 1. Security & Credential Masking Tests
assert.equal(maskSecret(""), "Not Configured");
assert.equal(maskSecret(undefined), "Not Configured");
assert.equal(maskSecret("short"), "••••••••");
const maskedKey = maskSecret("AIzaSyDummySecretKey12345678");
assert.equal(maskedKey.startsWith("AIza••••"), true);
assert.equal(maskedKey.endsWith("5678"), true);
assert.equal(maskedKey.includes("DummySecretKey"), false);

// 2. Strict RBAC & Action Authorization Tests
assert.equal(canPerformAction("admin", "approve_actions"), true);
assert.equal(canPerformAction("manager", "approve_actions"), false);
assert.equal(canPerformAction("partner", "approve_actions"), false);
assert.equal(canPerformAction("auditor", "approve_actions"), false);
assert.equal(canPerformAction("auditor", "audit_code"), true);

// 3. Destructive / Financial Operation Safety Gates
assert.equal(validateSafeOperation("purchase", false, false).allowed, false);
assert.equal(validateSafeOperation("payment", false, false).allowed, false);
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

  // Public adapter only + confidential prompt -> MUST BE REJECTED
  const res1 = await executeFree(
    { prompt: "Confidential Broker Agreement Text", confidential: true },
    [publicFreeAdapter],
    ctrl.signal
  );
  assert.equal(res1.status, "unavailable");

  // Local private adapter available + confidential prompt -> ALLOWED
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
}

// 5. Central bl_* Database Tables & Agreement Commission Tests
function testCentralDatabaseTables() {
  // Verify 5 canonical platforms
  const platforms = getPlatforms();
  assert.equal(platforms.length, 5);
  assert.equal(platforms.some((p) => p.id === "rslina"), true);
  assert.equal(platforms.some((p) => p.id === "brandlinker-dubai"), true);

  // Emaar Partner with approved agreement (300 bps = 3.00%)
  const emaarPartnerId = "11111111-1111-4111-8111-111111111111";
  const emaarCalc = calculatePartnerCommission(emaarPartnerId, 4000000, "2026-06-01");
  assert.equal(emaarCalc.commissionBps, 300);
  assert.equal(emaarCalc.commissionAED, 120000); // 3% of 4M AED = 120,000 AED

  // Sobha Partner with DRAFT agreement -> Calculation MUST throw
  const sobhaPartnerId = "33333333-3333-4333-8333-333333333333";
  assert.throws(() => {
    calculatePartnerCommission(sobhaPartnerId, 5000000, "2026-06-01");
  }, /Verified agreement required/);

  // Resolve approval for Sobha agreement by Admin
  const pendingSobhaAppr = getApprovals().find((a) => a.actionType === "partner_agreement_verification");
  assert.notEqual(pendingSobhaAppr, undefined);

  resolveApproval(pendingSobhaAppr!.id, "approved", "RS Lina (Admin)");

  // Now Sobha agreement is approved -> Calculation succeeds!
  const sobhaCalc = calculatePartnerCommission(sobhaPartnerId, 5000000, "2026-06-01");
  assert.equal(sobhaCalc.commissionBps, 250);
  assert.equal(sobhaCalc.commissionAED, 125000); // 2.5% of 5M AED = 125,000 AED

  // Audit Log verification
  const auditEntries = getAuditLog();
  assert.equal(auditEntries.length >= 2, true);
  assert.equal(auditEntries.some((a) => a.action === "AGREEMENT_APPROVED"), true);

  // Statutory UAE VAT verification
  const vatResult = evaluateUaeVat({
    isSupplierVatRegistered: true,
    supplierTrn: "100458920100003",
    clientResidency: "uae_resident",
    propertyLocation: "uae",
  });
  assert.equal(vatResult.vatApplicable, true);
  assert.equal(vatResult.ratePercent, 5);

  const nonRegisteredVat = evaluateUaeVat({
    isSupplierVatRegistered: false,
    clientResidency: "uae_resident",
    propertyLocation: "uae",
  });
  assert.equal(nonRegisteredVat.vatApplicable, false);
  assert.equal(nonRegisteredVat.ratePercent, 0);
}

async function runAll() {
  await testConfidentialRouting();
  testCentralDatabaseTables();
  console.log("All central database integration and security tests passed successfully!");
}

runAll().catch((err) => {
  console.error("Integration test error:", err);
  process.exit(1);
});
