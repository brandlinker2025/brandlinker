import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FileJobStore } from "./file-job-store";
import { ProductionSqlJobStore, MemorySqlDatabase } from "./durable-job-store";
import { transitionJob } from "./job-service";
import type { Job } from "./job-store";

async function runStoreTests() {
  console.log("Starting Durable JobStore & Concurrency Verification Suite...");

  // SECTION 1: FileJobStore Persistence & Restart Resilience
  const testDbPath = path.join(process.cwd(), "data", "test-jobs.json");
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const fileStore1 = new FileJobStore(testDbPath);
  const now = new Date().toISOString();
  const initialJob: Job = {
    id: "job-restart-101",
    agentId: "executive",
    state: "queued",
    revision: 1,
    createdAt: now,
    updatedAt: now,
    idempotencyKey: "idem-key-abc-123",
  };

  const created = await fileStore1.createOrGet(initialJob);
  assert.equal(created.id, "job-restart-101");
  assert.equal(created.revision, 1);

  // Idempotency deduplication check
  const duplicateJob: Job = {
    id: "job-duplicate-attempt",
    agentId: "executive",
    state: "queued",
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    idempotencyKey: "idem-key-abc-123", // same key
  };
  const fetchedDuplicate = await fileStore1.createOrGet(duplicateJob);
  assert.equal(fetchedDuplicate.id, "job-restart-101");

  // State Transition via job-service
  const runningJob = await transitionJob(fileStore1, "job-restart-101", "running");
  assert.equal(runningJob.state, "running");
  assert.equal(runningJob.revision, 2);

  // Concurrency conflict check
  const staleUpdate: Job = { ...runningJob, state: "succeeded", revision: 3 };
  const conflictResult = await fileStore1.compareAndSet("job-restart-101", 1, staleUpdate); // expected 1, current is 2
  assert.equal(conflictResult, false);

  // Process Restart Simulation: create a second instance loading the same file
  const fileStore2 = new FileJobStore(testDbPath);
  const retrievedAfterRestart = await fileStore2.get("job-restart-101");
  assert.notEqual(retrievedAfterRestart, null);
  assert.equal(retrievedAfterRestart?.state, "running");
  assert.equal(retrievedAfterRestart?.revision, 2);

  // Transition to succeeded on second instance
  const finalJob = await transitionJob(fileStore2, "job-restart-101", "succeeded");
  assert.equal(finalJob.state, "succeeded");
  assert.equal(finalJob.revision, 3);

  // Cleanup test file
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // SECTION 2: Production SQL Durable Store & Inter-Process Concurrency Simulation
  const sqlDb = new MemorySqlDatabase();
  const sqlStore = new ProductionSqlJobStore(sqlDb);
  await sqlStore.initSchema();

  const sqlJob: Job = {
    id: "job-sql-201",
    agentId: "commerce",
    state: "queued",
    revision: 1,
    createdAt: now,
    updatedAt: now,
    idempotencyKey: "idem-sql-xyz-789",
  };

  await sqlStore.createOrGet(sqlJob);

  // Competing Worker Process Simulation
  // Worker A and Worker B both read revision 1 simultaneously
  const workerA_read = await sqlStore.get("job-sql-201");
  const workerB_read = await sqlStore.get("job-sql-201");
  assert.notEqual(workerA_read, null);
  assert.notEqual(workerB_read, null);
  assert.equal(workerA_read?.revision, 1);
  assert.equal(workerB_read?.revision, 1);

  // Worker A updates revision 1 -> 2
  const workerA_ok = await sqlStore.compareAndSet("job-sql-201", 1, {
    ...workerA_read!,
    state: "running",
    revision: 2,
    updatedAt: new Date().toISOString(),
  });
  assert.equal(workerA_ok, true);

  // Worker B attempts to update revision 1 -> 2 with stale revision -> MUST BE REJECTED ATOMICALLY
  const workerB_ok = await sqlStore.compareAndSet("job-sql-201", 1, {
    ...workerB_read!,
    state: "cancelled",
    revision: 2,
    updatedAt: new Date().toISOString(),
  });
  assert.equal(workerB_ok, false); // Rejected! Atomic concurrency preserved.

  console.log("Atomic concurrency, idempotency, and persistence across processes verified successfully!");
}

runStoreTests().catch((err) => {
  console.error("Job store test failure:", err);
  process.exitCode = 1;
});
