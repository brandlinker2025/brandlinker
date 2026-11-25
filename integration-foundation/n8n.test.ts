import assert from "node:assert/strict";
import { POST, GET } from "../src/app/api/automation/webhook/route";

async function runN8nTests() {
  console.log("Starting n8n Automation Webhook & Machine Integration Tests...");

  const validToken = process.env.MACHINE_API_TOKEN || "rs-machine-dev-token";

  // Test 1: Missing Token -> 401
  const reqNoAuth = new Request("http://localhost/api/automation/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actionType: "draft", title: "Test Job" }),
  });
  const resNoAuth = await POST(reqNoAuth);
  assert.equal(resNoAuth.status, 401);

  // Test 2: Invalid Token -> 401
  const reqBadAuth = new Request("http://localhost/api/automation/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-machine-token": "wrong-token-abc",
    },
    body: JSON.stringify({ actionType: "draft", title: "Test Job" }),
  });
  const resBadAuth = await POST(reqBadAuth);
  assert.equal(resBadAuth.status, 401);

  // Test 3: Valid Token + Safe Draft Action -> Queued directly
  const reqSafe = new Request("http://localhost/api/automation/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-machine-token": validToken,
      "x-idempotency-key": `idem-safe-${Date.now()}`,
    },
    body: JSON.stringify({
      actionType: "draft",
      title: "Generate Social Post Draft",
      module: "studio",
      payload: { platform: "instagram", topic: "luxury lifestyle" },
    }),
  });
  const resSafe = await POST(reqSafe);
  assert.equal(resSafe.status, 200);
  const dataSafe = await resSafe.json();
  assert.equal(dataSafe.success, true);
  assert.equal(dataSafe.state, "queued");
  assert.equal(dataSafe.requiresApproval, false);

  // Test 4: Valid Token + Sensitive Write Action -> Awaiting Approval
  const reqSensitive = new Request("http://localhost/api/automation/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-machine-token": validToken,
      "x-idempotency-key": `idem-sensitive-${Date.now()}`,
    },
    body: JSON.stringify({
      actionType: "publish",
      title: "Publish Video to YouTube Channel",
      module: "studio",
      payload: { videoId: "vid-999", visibility: "public" },
    }),
  });
  const resSensitive = await POST(reqSensitive);
  assert.equal(resSensitive.status, 200);
  const dataSensitive = await resSensitive.json();
  assert.equal(dataSensitive.success, true);
  assert.equal(dataSensitive.state, "awaiting_approval");
  assert.equal(dataSensitive.requiresApproval, true);

  // Test 5: Idempotency Key deduplication
  const sharedKey = `idem-dedup-${Date.now()}`;
  const reqFirst = new Request("http://localhost/api/automation/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-machine-token": validToken,
      "x-idempotency-key": sharedKey,
    },
    body: JSON.stringify({ actionType: "draft", title: "Dedup Test Job" }),
  });
  const resFirst = await POST(reqFirst);
  assert.equal(resFirst.status, 200);

  // Send exact same request with same key
  const reqSecond = new Request("http://localhost/api/automation/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-machine-token": validToken,
      "x-idempotency-key": sharedKey,
    },
    body: JSON.stringify({ actionType: "draft", title: "Dedup Test Job" }),
  });
  const resSecond = await POST(reqSecond);
  assert.equal(resSecond.status, 200);
  const dataSecond = await resSecond.json();
  assert.equal(dataSecond.message.includes("Duplicate request ignored"), true);

  // Test 6: Worker Poll GET endpoint
  const reqPoll = new Request("http://localhost/api/automation/webhook", {
    method: "GET",
    headers: { "x-machine-token": validToken },
  });
  const resPoll = await GET(reqPoll);
  assert.equal(resPoll.status, 200);
  const dataPoll = await resPoll.json();
  assert.equal(dataPoll.status, "online");
  assert.equal(typeof dataPoll.queuedCount, "number");

  console.log("All n8n automation and safe payload integration tests passed successfully!");
}

runN8nTests().catch((err) => {
  console.error("n8n test failure:", err);
  process.exitCode = 1;
});
