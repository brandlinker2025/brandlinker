import assert from "node:assert/strict";
import { FileJobStore } from "./file-job-store";
import { executeN8nWorkflow, type N8nWorkflowDefinition } from "./n8n-workflow-runner";
import path from "node:path";
import fs from "node:fs";

async function runRealN8nWorkflowTests() {
  console.log("Starting Real n8n Workflow Execution Test Suite...");

  const testDb = path.join(process.cwd(), "data", "test-wf-store.json");
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

  const store = new FileJobStore(testDb);
  const machineToken = "test-n8n-machine-secret-2026";

  // Test 1: Real safe content generation workflow (No approval required)
  const safeWorkflow: N8nWorkflowDefinition = {
    id: "wf-social-media-content",
    name: "Social Media Draft Generator",
    active: true,
    nodes: [
      { id: "1", name: "Webhook Receiver", type: "webhook_trigger", parameters: {} },
      { id: "2", name: "Security Gate", type: "policy_gate", parameters: { actionType: "draft" } },
      { id: "3", name: "Creative Agent", type: "agent_dispatch", parameters: { agentId: "creative" } },
      { id: "4", name: "Output Formatter", type: "transformer", parameters: {} },
    ],
  };

  const safeResult = await executeN8nWorkflow(
    safeWorkflow,
    {
      actionType: "draft",
      topic: "Luxury Penthouse in Downtown Dubai",
      platform: "LinkedIn",
    },
    {
      store,
      machineToken,
      expectedToken: machineToken,
      idempotencyKey: `idem-wf-safe-${Date.now()}`,
    }
  );

  assert.equal(safeResult.finalState, "succeeded");
  assert.equal(safeResult.approvalRequired, false);
  assert.equal(safeResult.executedNodes.length, 4);
  assert.equal(safeResult.output.status, "ready_for_delivery");

  // Test 2: Real sensitive publishing workflow (Approval Gate Enforced)
  const sensitiveWorkflow: N8nWorkflowDefinition = {
    id: "wf-youtube-video-publisher",
    name: "YouTube Channel Video Publisher",
    active: true,
    nodes: [
      { id: "1", name: "Webhook Receiver", type: "webhook_trigger", parameters: {} },
      { id: "2", name: "Security Gate", type: "policy_gate", parameters: { actionType: "publish" } },
      { id: "3", name: "Publisher Node", type: "output_webhook", parameters: {} },
    ],
  };

  const sensitiveResult = await executeN8nWorkflow(
    sensitiveWorkflow,
    {
      actionType: "publish",
      videoTitle: "Exclusive Dubai Penthouse Tour 4K",
      channelId: "UC_BrandLinker",
    },
    {
      store,
      machineToken,
      expectedToken: machineToken,
      idempotencyKey: `idem-wf-sensitive-${Date.now()}`,
    }
  );

  assert.equal(sensitiveResult.finalState, "awaiting_approval");
  assert.equal(sensitiveResult.approvalRequired, true);
  assert.equal(sensitiveResult.executedNodes.length, 2); // Stopped at policy gate!

  // Cleanup test database
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

  console.log("Real n8n workflow execution and policy gating verified successfully!");
}

runRealN8nWorkflowTests().catch((err) => {
  console.error("n8n workflow test failure:", err);
  process.exitCode = 1;
});
