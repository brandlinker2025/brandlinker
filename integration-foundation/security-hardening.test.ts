import assert from "node:assert/strict";
import http from "node:http";
import { timingSafeCompare } from "../src/lib/dashboard-security";

async function runSecuritySuite() {
  console.log("Starting BrandLinkerBD Security & Path Traversal Verification Suite...");

  // 1. Timing-Safe Comparison Test
  assert.equal(timingSafeCompare("secret_token_123", "secret_token_123"), true, "Identical tokens must match");
  assert.equal(timingSafeCompare("secret_token_123", "wrong_token_456"), false, "Different tokens must not match");
  assert.equal(timingSafeCompare("short", "much_longer_string"), false, "Different length tokens must not match");
  console.log("Timing-safe comparison verified cleanly!");

  const PORT = 3848;

  // Helper for HTTP requests
  const request = (path: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "localhost",
          port: PORT,
          path,
          method: "GET",
          headers,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve({ status: res.statusCode || 0, body, headers: res.headers }));
        }
      );
      req.on("error", reject);
      req.end();
    });
  };

  // 2. Test Path Traversal & Restricted File Protection
  const forbiddenPaths = [
    "/.env.local",
    "/.env",
    "/.git/config",
    "/src/lib/supabase-client.ts",
    "/docs/MASTER-PROGRESS.md",
    "/package.json",
    "/tsconfig.json",
    "/../BrandLinker.com/.env.local",
    "/%2e%2e/.env.local",
  ];

  for (const p of forbiddenPaths) {
    const res = await request(p);
    assert.equal(
      res.status === 403 || res.status === 404,
      true,
      `Access to sensitive path '${p}' must be blocked (HTTP 403/404, got ${res.status})`
    );
  }
  console.log("Static file serving restriction and path traversal defense verified!");

  // 3. Test CORS & Security Headers
  const dashRes = await request("/dashboard.html");
  assert.equal(dashRes.status, 200, "Approved public dashboard.html must be served");
  assert.equal(dashRes.headers["access-control-allow-origin"], undefined, "Wildcard CORS must NOT be present");
  assert.equal(dashRes.headers["x-frame-options"], "SAMEORIGIN", "X-Frame-Options must be SAMEORIGIN");
  assert.equal(dashRes.headers["x-content-type-options"], "nosniff", "X-Content-Type-Options must be nosniff");
  console.log("Same-origin and security headers verified!");

  // 4. Test Private API Unauthenticated Access
  const unauthApi = await request("/api/dashboard");
  assert.equal(unauthApi.status, 401, "Unauthenticated /api/dashboard must return HTTP 401");
  assert.ok(unauthApi.headers["cache-control"]?.includes("no-store"), "Must enforce Cache-Control: no-store");
  console.log("Unauthenticated API rejection & Cache-Control: no-store verified!");

  // 5. Test Authenticated API Access & Disconnected DB Behavior
  const adminToken = process.env.ADMIN_TOKEN || "97c6054f3eb89c16ee773adfb60be88561009d1579d7691ebe05eeeb5be9089d";
  const authApi = await request("/api/dashboard", {
    Authorization: `Bearer ${adminToken}`,
  });

  // When central Supabase database is unreachable or credentials missing, it MUST return HTTP 503
  const isConnected = Boolean(process.env.BL_SUPABASE_SERVICE_KEY);
  if (!isConnected) {
    assert.equal(authApi.status, 503, "When database is disconnected, must return HTTP 503");
    const json = JSON.parse(authApi.body);
    assert.equal(json.database.connected, false, "database.connected must be false");
    assert.equal(json.database.status, "Database Disconnected");
    console.log("Database Disconnected (HTTP 503) fail-closed behavior verified cleanly!");
  } else {
    assert.equal(authApi.status, 200, "When database is connected, must return HTTP 200");
  }

  console.log("All BrandLinkerBD Security & Path Traversal assertions passed cleanly!");
}

runSecuritySuite().catch((err) => {
  console.error("Security suite failed:", err);
  process.exit(1);
});
