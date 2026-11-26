import { timingSafeCompare, verifySupplierConnectivity, checkSupportingPlatformEndpoint } from "../src/lib/dashboard-security";
import { fetchReadonlyTelemetry } from "../src/lib/readonly-supabase-client";
import { verifySession } from "../src/lib/private-auth";
import { SUPPORTING_PROJECTS } from "../integration-foundation/supporting-platforms";

/**
 * Vercel Serverless Function: /api/dashboard
 *
 * Requirements:
 * 1. Strict GET-only enforcement (Reject POST, PUT, DELETE, PATCH with 405 Method Not Allowed).
 * 2. Timing-safe owner token verification.
 * 3. Cache-Control: no-store, private.
 * 4. Least-privilege read-only Supabase queries with exact counts and pagination.
 * 5. When database.connected is false, return HTTP 503 with sanitized error.
 * 6. Unprobed platforms marked "Not Verified" (never falsely labeled "Verified Local").
 */
export default async function handler(req: any, res: any) {
  // 1. Same-Origin & Strict Security Headers (Zero Wildcard CORS)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // 2. Strict GET-Only Enforcement
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Method Not Allowed: /api/dashboard is strictly GET-only.",
    }));
    return;
  }

  // 3. Timing-Safe Owner Authentication Verification
  const authHeader = req.headers["authorization"] || "";
  const adminToken = process.env.ADMIN_TOKEN || "";

  let isAuthorized = false;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer && adminToken && timingSafeCompare(bearer, adminToken)) {
      isAuthorized = true;
    } else if (bearer) {
      const session = verifySession(bearer);
      if (session && session.role === "owner") {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Unauthorized: Valid Owner Authentication (ADMIN_TOKEN or rs_private_session) required.",
      authenticated: false,
    }));
    return;
  }

  // Parse pagination params from query string
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);

  // 4. Query Telemetry via Least-Privilege Read-Only Client
  const telemetry = await fetchReadonlyTelemetry({ page, pageSize });

  // STRICT REQUIREMENT: When database.connected is false, return HTTP 503
  // Never display fake zero metrics or green API Synced badges when database is disconnected.
  if (!telemetry.connected) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Database Disconnected: Central Supabase database (enahlkxdplntriipabiu) is unreachable or missing read credential.",
      database: {
        connected: false,
        status: "Database Disconnected",
        source: telemetry.source,
        sanitizedError: "Database read connection unavailable",
        missingEnvVars: !process.env.BL_DASHBOARD_READONLY_KEY &&
          !process.env.BL_SUPABASE_READONLY_KEY &&
          !process.env.BL_SUPABASE_SERVICE_KEY
            ? ["BL_DASHBOARD_READONLY_KEY"]
            : [],
      },
      metrics: null,
      leads: null,
      jobs: null,
      agreements: null,
      audit: null,
    }));
    return;
  }

  // 5. Truthful Supplier Connectivity Probes
  const [cjStatus, aliStatus] = await Promise.all([
    verifySupplierConnectivity("cjdropshipping"),
    verifySupplierConnectivity("aliexpress"),
  ]);

  const suppliers = [
    {
      provider: "CJdropshipping",
      configured: cjStatus.configured,
      verifiedConnectivity: cjStatus.verifiedConnectivity,
      status: cjStatus.status,
      details: cjStatus.details,
      shippingClassification: "Estimated Matrix Only (Not Verified Quotes)",
      orderGating: "Human Signature Required (Zero Automated Orders)",
    },
    {
      provider: "AliExpress",
      configured: aliStatus.configured,
      verifiedConnectivity: aliStatus.verifiedConnectivity,
      status: aliStatus.status,
      details: aliStatus.details,
      shippingClassification: "Estimated Matrix Only (Not Verified Quotes)",
      orderGating: "Human Signature Required (Zero Automated Orders)",
    },
  ];

  // 6. Supporting Platforms Health Checks (Truthful Reporting: Unprobed = "Not Verified")
  const supportingHealth = await Promise.all(
    SUPPORTING_PROJECTS.map(async (p) => {
      // Probed endpoints only
      const probeMap: Record<string, string> = {
        "cheap-ticket-finder": "https://cheapticketfinder.site",
      };
      const url = probeMap[p.id];
      if (url) {
        const probe = await checkSupportingPlatformEndpoint(url, 2000);
        return {
          id: p.id,
          name: p.name,
          repoPath: p.repoPath,
          role: p.role,
          status: probe.online ? "Verified Online" : "Probe Failed (Offline)",
          endpointCheck: probe,
        };
      }
      // Unprobed platforms MUST be truthfully marked "Not Verified"
      return {
        id: p.id,
        name: p.name,
        repoPath: p.repoPath,
        role: p.role,
        status: "Not Verified",
        details: "No active health probe configured",
      };
    })
  );

  // 7. Return 200 with Live Database State
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    timestamp: new Date().toISOString(),
    database: {
      connected: true,
      status: "Database Connected",
      source: telemetry.source,
    },
    metrics: telemetry.counts,
    pagination: telemetry.pagination,
    leads: telemetry.leads,
    jobs: telemetry.jobs,
    agreements: telemetry.agreements,
    audit: telemetry.audit,
    suppliers,
    supportingProjects: supportingHealth,
  }));
}
