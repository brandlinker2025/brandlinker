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

import { calculateCommission, type AgreementTerms } from "./agreement-commission";

// 5. Central bl_* Database Tables & Agreement Commission Tests
function testCentralDatabaseTables() {
  // Verify 5 canonical platforms
  const platforms = getPlatforms();
  assert.equal(platforms.length, 5);
  assert.equal(platforms.some((p) => p.id === "rslina"), true);
  assert.equal(platforms.some((p) => p.id === "brandlinker-dubai"), true);

  // Runtime starts with ZERO fabricated agreements (agreements=0, jobs=0, audit=0)
  assert.equal(getAgreements().length, 0, "Runtime agreements must start at 0 (no fabricated data)");
  assert.equal(getJobs().length, 0, "Runtime jobs must start at 0");
  assert.equal(getAuditLog().length, 0, "Runtime audit log must start at 0");

  // Test commission calculation using test fixtures (strictly kept in test file)
  const testTerms: AgreementTerms = {
    agreementId: "test-emaar-fixture",
    evidenceId: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "approved",
    approvedBy: "rs-lina-admin",
    validFrom: "2024-01-01",
    validUntil: "2027-12-31",
    commissionBasisPoints: 300,
  };
  const minorCalc = calculateCommission(400000000, testTerms, "2026-06-01");
  assert.equal(minorCalc, 12000000); // 3% of 4M AED = 120,000 AED (in fils)

  // Draft agreement -> calculation MUST throw
  assert.throws(() => {
    calculateCommission(500000000, { ...testTerms, status: "draft" }, "2026-06-01");
  }, /Verified agreement required|Invalid agreement/);

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
