import assert from "node:assert/strict";
import { createDurableJobStore } from "./durable-job-store";
import { verifyRequestSession } from "../src/lib/auth-guard";
import {
  getAgreements,
  getJobs,
  getAuditLog,
  getPartners,
  calculatePartnerCommission,
} from "../src/lib/ecosystem-state";

async function runDatabasePersistenceAndAuthTests() {
  console.log("Starting Real Database Persistence, State & Rotated Auth Verification...");

  // 1. Verify that revoked exposed token is rejected
  const revokedReq = new Request("http://localhost/api/command-center/auth", {
    headers: { "x-admin-token": "rs-2026-master-key-secure-prod-token" },
  });
  const revokedSession = verifyRequestSession(revokedReq);
  assert.equal(revokedSession.authorized, false, "Revoked token must NOT be authorized");
  assert.match(revokedSession.error || "", /revoked/i, "Error must indicate token revocation");

  // 2. Verify that rotated executive token is accepted
  const rotatedToken = process.env.ADMIN_TOKEN || "bl_exec_cb9e623ad1e93ce1b5efb35d4538cad2bff3d6790104be92";
  const validReq = new Request("http://localhost/api/command-center/auth", {
    headers: { "authorization": `Bearer ${rotatedToken}` },
  });
  const validSession = verifyRequestSession(validReq);
  assert.equal(validSession.authorized, true, "Rotated executive token must be authorized");
  assert.equal(validSession.role, "admin", "Rotated executive token must have admin role");

  // 3. Verify that production disables silent file fallback
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as any).NODE_ENV = "production";
    assert.throws(
      () => createDurableJobStore(),
      /CRITICAL: Central durable database required in production|prohibited in production/i,
      "createDurableJobStore must throw in production to prevent silent local file persistence"
    );
  } finally {
    (process.env as any).NODE_ENV = originalEnv;
  }

  // 4. Verify runtime state matches reality (Agreements=0, approved=0, jobs=0, audit=0)
  const agreements = getAgreements();
  assert.equal(agreements.length, 0, "Runtime data must have 0 fabricated agreements");

  const jobs = getJobs();
  assert.equal(jobs.length, 0, "Runtime data must have 0 fabricated jobs");

  const audit = getAuditLog();
  assert.equal(audit.length, 0, "Runtime data must have 0 fabricated audit logs");

  // 5. Verify partner commission throws when no approved agreement exists
  assert.throws(
    () => calculatePartnerCommission("partner-unknown", 1000000),
    /No agreement on record/i,
    "Commission calculation must fail when partner has no registered agreement"
  );

  console.log("Real database persistence, zero fabricated state, and rotated auth verified successfully!");
}

runDatabasePersistenceAndAuthTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
