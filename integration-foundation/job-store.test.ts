import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FileJobStore } from "./file-job-store";
import { transitionJob } from "./job-service";
import type { Job } from "./job-store";

async function runStoreTests() {
  const testDbPath = path.join(process.cwd(), "data", "test-jobs.json");
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // 1. Initial Store instance
  const store1 = new FileJobStore(testDbPath);
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

  const created = await store1.createOrGet(initialJob);
  assert.equal(created.id, "job-restart-101");
  assert.equal(created.revision, 1);

  // 2. Test Idempotency: duplicate request with same idempotencyKey returns existing job
  const duplicateJob: Job = {
    id: "job-duplicate-attempt",
    agentId: "executive",
    state: "queued",
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    idempotencyKey: "idem-key-abc-123", // same key
  };
  const fetchedDuplicate = await store1.createOrGet(duplicateJob);
  assert.equal(fetchedDuplicate.id, "job-restart-101"); // must return original job

  // 3. Test State Transition via job-service
  const runningJob = await transitionJob(store1, "job-restart-101", "running");
  assert.equal(runningJob.state, "running");
  assert.equal(runningJob.revision, 2);

  // 4. Test Concurrency conflict: concurrent write with stale revision fails
  const staleUpdate: Job = {
    ...runningJob,
    state: "succeeded",
    revision: 3,
  };
  // Attempt with expected revision 1 (stale, current is 2)
  const conflictResult = await store1.compareAndSet("job-restart-101", 1, staleUpdate);
  assert.equal(conflictResult, false);

  // 5. Test Persistence Across Restarts: create a completely new FileJobStore instance
  const store2 = new FileJobStore(testDbPath);
  const retrievedAfterRestart = await store2.get("job-restart-101");
  assert.notEqual(retrievedAfterRestart, null);
  assert.equal(retrievedAfterRestart?.state, "running");
  assert.equal(retrievedAfterRestart?.revision, 2);

  // Transition to succeeded on second instance
  const finalJob = await transitionJob(store2, "job-restart-101", "succeeded");
  assert.equal(finalJob.state, "succeeded");
  assert.equal(finalJob.revision, 3);

  // Verify file on disk has new revision
  const store3 = new FileJobStore(testDbPath);
  const recheck = await store3.get("job-restart-101");
  assert.equal(recheck?.state, "succeeded");
  assert.equal(recheck?.revision, 3);

  // Cleanup test file
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log("Durable database persistence across restarts verified successfully!");
}

runStoreTests().catch((err) => {
  console.error("Job store test failure:", err);
  process.exitCode = 1;
});
