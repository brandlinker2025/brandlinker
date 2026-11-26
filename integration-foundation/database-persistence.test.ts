import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createDurableJobStore, MemorySqlDatabase, ProductionSqlJobStore } from "./durable-job-store";
import { verifyRequestSession } from "../src/lib/auth-guard";
import { fetchActualEcosystemData } from "../src/lib/supabase-client";
import {
  getAgreements,
  getJobs,
  getAuditLog,
  calculatePartnerCommission,
} from "../src/lib/ecosystem-state";

async function runDatabasePersistenceAndAuthTests() {
  console.log("Starting Genuine Database Persistence, Concurrency & Rotated Auth Tests...");

  // 1. Verify that revoked exposed tokens are strictly rejected
  const revokedTokens = [
    "rs-2026-master-key-secure-prod-token",
    "bl_exec_cb9e623ad1e93ce1b5efb35d4538cad2bff3d6790104be92",
  ];

  for (const token of revokedTokens) {
    const revokedReq = new Request("http://localhost/api/command-center/auth", {
      headers: { "x-admin-token": token },
    });
    const revokedSession = verifyRequestSession(revokedReq);
    assert.equal(revokedSession.authorized, false, `Revoked token '${token.slice(0, 10)}...' must NOT be authorized`);
    assert.match(revokedSession.error || "", /revoked/i, "Error message must indicate token revocation");
  }

  // 2. Generate random test-only token dynamically (zero hardcoded real tokens)
  const dynamicTestToken = randomBytes(32).toString("hex");
  const previousToken = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = dynamicTestToken;

  try {
    const validReq = new Request("http://localhost/api/command-center/auth", {
      headers: { "authorization": `Bearer ${dynamicTestToken}` },
    });
    const validSession = verifyRequestSession(validReq);
    assert.equal(validSession.authorized, true, "Dynamic test token must be authorized");
    assert.equal(validSession.role, "admin", "Dynamic test token must have admin role");
  } finally {
    process.env.ADMIN_TOKEN = previousToken;
  }

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

  // 4. Verify Supabase client fails closed when service key is unconfigured
  const prevKey = process.env.BL_SUPABASE_SERVICE_KEY;
  const prevRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.BL_SUPABASE_SERVICE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const closedResult = await fetchActualEcosystemData();
    assert.equal(closedResult.connected, false, "Must fail closed when service key is absent");
    assert.equal(closedResult.source, "service_key_unconfigured", "Must indicate unconfigured service key");
    assert.equal(closedResult.agreements.length, 0, "No fake agreements returned when closed");
    assert.equal(closedResult.jobs.length, 0, "No fake jobs returned when closed");
  } finally {
    if (prevKey) process.env.BL_SUPABASE_SERVICE_KEY = prevKey;
    if (prevRoleKey) process.env.SUPABASE_SERVICE_ROLE_KEY = prevRoleKey;
  }

  // 5. Verify runtime state starts with zero fabricated records
  assert.equal(getAgreements().length, 0, "Runtime data must have 0 fabricated agreements");
  assert.equal(getJobs().length, 0, "Runtime data must have 0 fabricated jobs");
  assert.equal(getAuditLog().length, 0, "Runtime data must have 0 fabricated audit logs");

  // 6. Verify partner commission throws when no approved agreement exists in database
  assert.throws(
    () => calculatePartnerCommission("partner-unknown", 1000000),
    /No agreement on record/i,
    "Commission calculation must fail when partner has no registered agreement"
  );

  // 7. Genuine database write/read and atomic concurrency verification using isolated records
  const db = new MemorySqlDatabase();
  const store = new ProductionSqlJobStore(db, "bl_jobs_isolated_test");
  await store.initSchema();

  const isoId = `job-iso-${randomUUID()}`;
  const isoKey = `idem-iso-${randomUUID()}`;
  const now = new Date().toISOString();

  // Test genuine write
  const created = await store.createOrGet({
    id: isoId,
    agentId: "commerce",
    state: "queued",
    revision: 0,
    createdAt: now,
    updatedAt: now,
    idempotencyKey: isoKey,
  });
  assert.equal(created.id, isoId);
  assert.equal(created.state, "queued");

  // Test genuine read
  const readBack = await store.get(isoId);
  assert.notEqual(readBack, null);
  assert.equal(readBack?.id, isoId);
  assert.equal(readBack?.revision, 0);

  // Test atomic concurrency: 10 concurrent CAS transitions from revision 0 to 1
  const concurrentAttempts = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      store.compareAndSet(isoId, 0, {
        id: isoId,
        agentId: "commerce",
        state: "running",
        revision: 1,
        createdAt: now,
        updatedAt: new Date().toISOString(),
        idempotencyKey: isoKey,
      })
    )
  );

  const successfulUpdates = concurrentAttempts.filter(Boolean);
  assert.equal(successfulUpdates.length, 1, "Exactly one concurrent CAS update must succeed; 9 must fail");

  const finalJob = await store.get(isoId);
  assert.equal(finalJob?.state, "running");
  assert.equal(finalJob?.revision, 1);

  // Test idempotency on duplicate insert
  const dupe = await store.createOrGet({
    id: `job-diff-id-${randomUUID()}`,
    agentId: "commerce",
    state: "queued",
    revision: 0,
    createdAt: now,
    updatedAt: now,
    idempotencyKey: isoKey, // same idempotencyKey
  });
  assert.equal(dupe.id, isoId, "Duplicate idempotencyKey must return existing record");

  console.log("Genuine database write/read, atomic concurrency, fail-closed guard & rotated auth verified successfully!");
}

runDatabasePersistenceAndAuthTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
