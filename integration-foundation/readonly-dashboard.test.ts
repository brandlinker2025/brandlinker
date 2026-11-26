import assert from "node:assert/strict";
import http from "node:http";
import { timingSafeCompare } from "../src/lib/dashboard-security";
import { fetchReadonlyTelemetry } from "../src/lib/readonly-supabase-client";

async function runSecurityAndReadonlySuite() {
  console.log("Starting Least-Privilege, GET-Only & Truthful Verification Suite...");

  // 1. Timing-Safe Comparison Test
  assert.equal(timingSafeCompare("token_abc_123", "token_abc_123"), true);
  assert.equal(timingSafeCompare("token_abc_123", "token_xyz_456"), false);
  assert.equal(timingSafeCompare("short", "much_longer_string"), false);
  console.log("Timing-safe comparison verified!");

  const PORT = 3848;

  const request = (
    path: string,
    method: string = "GET",
    headers: Record<string, string> = {}
  ): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "localhost",
          port: PORT,
          path,
          method,
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

  const adminToken = process.env.ADMIN_TOKEN || "97c6054f3eb89c16ee773adfb60be88561009d1579d7691ebe05eeeb5be9089d";

  // 2. Test GET-Only Enforcement (POST, PUT, DELETE must be rejected with 405 Method Not Allowed)
  for (const m of ["POST", "PUT", "DELETE", "PATCH"]) {
    const res = await request("/api/dashboard", m, { Authorization: `Bearer ${adminToken}` });
    assert.equal(res.status, 405, `Method ${m} must return 405 Method Not Allowed (got ${res.status})`);
    assert.equal(res.headers["allow"], "GET", "Allow header must specify GET");
  }
  console.log("GET-only enforcement verified!");

  // 3. Test Disconnected Database (HTTP 503) & Sanitized Error
  const resGet = await request("/api/dashboard?page=1&pageSize=10", "GET", {
    Authorization: `Bearer ${adminToken}`,
  });

  const hasReadonlyKey = Boolean(
    process.env.BL_DASHBOARD_READONLY_KEY ||
    process.env.BL_SUPABASE_READONLY_KEY ||
    process.env.BL_SUPABASE_SERVICE_KEY
  );

  if (!hasReadonlyKey) {
    assert.equal(resGet.status, 503, "Must return HTTP 503 when read-only database is disconnected");
    const json = JSON.parse(resGet.body);
    assert.equal(json.database.connected, false);
    assert.equal(json.database.status, "Database Disconnected");
    assert.ok(json.database.sanitizedError, "Error must be sanitized");
    assert.equal(json.database.sanitizedError.includes("enahlkxdplntriipabiu"), false, "Error message must be sanitized without internal leaking");
    assert.deepEqual(json.database.missingEnvVars, ["BL_DASHBOARD_READONLY_KEY"], "Must specify least-privilege missing env var");
    console.log("HTTP 503, sanitized error, and least-privilege missing env var verified!");
  } else {
    assert.equal(resGet.status, 200, "Must return HTTP 200 when database connected");
  }

  // 4. Test Readonly Telemetry function directly
  const telemetry = await fetchReadonlyTelemetry({ page: 1, pageSize: 10 });
  assert.equal(telemetry.pagination.page, 1);
  assert.equal(telemetry.pagination.pageSize, 10);
  console.log("Pagination and telemetry query contract verified!");

  console.log("All Least-Privilege, GET-Only & Truthful Verification checks passed cleanly!");
}

runSecurityAndReadonlySuite().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
