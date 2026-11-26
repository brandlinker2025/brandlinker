import assert from "node:assert/strict";
import {
  SUPPORTING_PROJECTS,
  SupportingPlatformManager,
} from "./supporting-platforms";

async function runSupportingPlatformsTests() {
  console.log("Starting Supporting Platforms Integration & Task Queue Test Suite...");

  const manager = new SupportingPlatformManager();

  // 1. Verify all 6 approved supporting projects are registered
  const projects = manager.getRegisteredProjects();
  assert.equal(projects.length, 6, "Must register all 6 supporting repositories");

  const projectIds = projects.map((p) => p.id);
  assert.ok(projectIds.includes("rs-ai-studio"));
  assert.ok(projectIds.includes("brandlinker-ai-studio"));
  assert.ok(projectIds.includes("rs-video-editor"));
  assert.ok(projectIds.includes("free-llm-resources"));
  assert.ok(projectIds.includes("cheap-ticket-finder"));
  assert.ok(projectIds.includes("language-tutor-rs"));

  // 2. Normal non-publishing task executes directly to queued
  const nonPublishTask = manager.submitTask({
    taskId: "task-001",
    sourcePlatform: "brandlinkerbd.com",
    targetProjectId: "cheap-ticket-finder",
    action: "query_fare_index",
    payload: { route: "DAC-DXB" },
    idempotencyKey: "idem-fare-001",
    maxRetries: 3,
  });
  assert.equal(nonPublishTask.status, "queued");
  assert.equal(nonPublishTask.requiresApproval, false);

  // 3. Publishing task strictly requires human approval gate
  const publishTask = manager.submitTask({
    taskId: "task-002",
    sourcePlatform: "rslina.com",
    targetProjectId: "brandlinker-ai-studio",
    action: "publish_social_ad_creative",
    payload: { campaign: "Travel Gear 2026" },
    idempotencyKey: "idem-publish-002",
    maxRetries: 3,
  });
  assert.equal(publishTask.status, "approval_required");
  assert.equal(publishTask.requiresApproval, true);

  // 4. Human approval unblocks task to queued
  const approved = manager.approveTask(publishTask.taskId, "RS Lina (Owner)");
  assert.equal(approved.status, "queued");
  assert.equal(approved.approvedBy, "RS Lina (Owner)");

  // 5. Idempotent submission returns exact existing task
  const duplicate = manager.submitTask({
    taskId: "task-999-different-id",
    sourcePlatform: "rslina.com",
    targetProjectId: "cheap-ticket-finder",
    action: "query_fare_index",
    payload: { route: "DAC-DXB" },
    idempotencyKey: "idem-fare-001", // matching idempotencyKey
    maxRetries: 3,
  });
  assert.equal(duplicate.taskId, "task-001", "Must return existing task for duplicate idempotencyKey");

  console.log("All Supporting Platforms Integration & Task Queue assertions passed cleanly!");
}

runSupportingPlatformsTests().catch((err) => {
  console.error("Supporting platforms test failure:", err);
  process.exit(1);
});
