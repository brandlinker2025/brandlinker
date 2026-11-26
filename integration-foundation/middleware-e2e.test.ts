import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { signSession, PRIVATE_SESSION_COOKIE } from "../src/lib/private-auth";

async function runMiddlewareE2eTests() {
  console.log("Starting Next.js Middleware E2E Access Control & Privacy Leakage Tests...");

  const testSecret = randomBytes(32).toString("hex");
  const previousToken = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = testSecret;

  try {
    // 1. Direct Unauthorized Access to Homepage -> MUST redirect to /login
    const reqHome = new NextRequest("http://localhost:3847/", { method: "GET" });
    const resHome = await middleware(reqHome);
    assert.equal(resHome.status, 307, "Direct access to homepage must return 307 redirect");
    assert.equal(resHome.headers.get("location"), "http://localhost:3847/login", "Must redirect to /login");
    assert.equal(resHome.headers.get("x-robots-tag"), "noindex, nofollow");

    // 2. Direct Unauthorized Access to Deep Personal Route -> MUST redirect with ?next parameter
    const reqCareer = new NextRequest("http://localhost:3847/career", { method: "GET" });
    const resCareer = await middleware(reqCareer);
    assert.equal(resCareer.status, 307);
    assert.equal(resCareer.headers.get("location"), "http://localhost:3847/login?next=%2Fcareer");

    // 3. Direct Unauthorized Access to Command Center -> MUST redirect with ?next parameter
    const reqCC = new NextRequest("http://localhost:3847/command-center", { method: "GET" });
    const resCC = await middleware(reqCC);
    assert.equal(resCC.status, 307);
    assert.equal(resCC.headers.get("location"), "http://localhost:3847/login?next=%2Fcommand-center");

    // 4. Unauthorized API Request -> MUST return 401 JSON (not redirect)
    const reqApi = new NextRequest("http://localhost:3847/api/command-center/data", { method: "GET" });
    const resApi = await middleware(reqApi);
    assert.equal(resApi.status, 401, "Unauthorized API call must return 401");
    const jsonBody = await resApi.json();
    assert.match(jsonBody.error, /private domain|authentication required/i);
    assert.match(resApi.headers.get("cache-control") || "", /no-store/);

    // 5. Public /login route -> MUST be allowed
    const reqLogin = new NextRequest("http://localhost:3847/login", { method: "GET" });
    const resLogin = await middleware(reqLogin);
    assert.equal(resLogin.status, 200, "Public login route must pass through");

    // 6. Next.js Static Asset -> MUST be allowed
    const reqStatic = new NextRequest("http://localhost:3847/_next/static/chunks/main.js", { method: "GET" });
    const resStatic = await middleware(reqStatic);
    assert.equal(resStatic.status, 200, "Static bundles must pass through to render login UI");

    // 7. Unauthorized Image Optimization Request (/_next/image) -> MUST return 401 JSON
    const reqImageOpt = new NextRequest("http://localhost:3847/_next/image?url=%2Fcorporate%2Fportrait.jpg&w=640&q=75", { method: "GET" });
    const resImageOpt = await middleware(reqImageOpt);
    assert.equal(resImageOpt.status, 401, "Unauthorized /_next/image request must return 401");
    const imgBody = await resImageOpt.json();
    assert.match(imgBody.error, /private domain|authentication required/i);

    // 8. Unauthorized Private Media File -> MUST redirect to /login
    const reqMedia = new NextRequest("http://localhost:3847/corporate/portrait-dark.jpg", { method: "GET" });
    const resMedia = await middleware(reqMedia);
    assert.equal(resMedia.status, 307, "Direct access to private media must redirect to /login");

    // 9. Authenticated Request with Valid rs_private_session Cookie -> MUST pass through
    const validSession = signSession("owner");
    const reqAuth = new NextRequest("http://localhost:3847/career", {
      method: "GET",
      headers: {
        cookie: `${PRIVATE_SESSION_COOKIE}=${validSession}`,
      },
    });
    const resAuth = await middleware(reqAuth);
    assert.equal(resAuth.status, 200, "Authenticated request must pass through to destination");
    assert.equal(resAuth.headers.get("x-robots-tag"), "noindex, nofollow, noarchive, nosnippet");
    assert.equal(resAuth.headers.get("cache-control"), "private, no-cache, no-store, must-revalidate");

    // 10. Authenticated API Request with Bearer Token -> MUST pass through
    const reqBearer = new NextRequest("http://localhost:3847/api/command-center/data", {
      method: "GET",
      headers: {
        authorization: `Bearer ${testSecret}`,
      },
    });
    const resBearer = await middleware(reqBearer);
    assert.equal(resBearer.status, 200, "Valid Bearer token must pass through");

    // 11. Tampered Session Cookie -> MUST be rejected and redirected
    const tamperedReq = new NextRequest("http://localhost:3847/gallery", {
      method: "GET",
      headers: {
        cookie: `${PRIVATE_SESSION_COOKIE}=tampered.token.data`,
      },
    });
    const tamperedRes = await middleware(tamperedReq);
    assert.equal(tamperedRes.status, 307, "Tampered cookie must redirect to /login");

    // 12. Missing Secrets Fail-Closed: When secret is absent, ALL requests fail closed
    delete process.env.ADMIN_TOKEN;
    delete process.env.RS_SERVICE_TOKEN;
    delete process.env.SESSION_SECRET;

    const noSecretReq = new NextRequest("http://localhost:3847/career", {
      method: "GET",
      headers: {
        cookie: `${PRIVATE_SESSION_COOKIE}=${validSession}`,
      },
    });
    const noSecretRes = await middleware(noSecretReq);
    assert.equal(noSecretRes.status, 307, "When secrets are missing, middleware MUST fail closed and redirect");

    // 13. Audit Metadata Leakage in Root Metadata (Verified via static source inspection)
    const layoutSrc = readFileSync("src/app/layout.tsx", "utf8");
    assert.equal(layoutSrc.includes("Razia Sultana Lina"), false, "Root metadata must NOT leak owner name");
    assert.equal(layoutSrc.includes("ACI Motors"), false, "Root metadata must NOT leak employer");
    assert.equal(layoutSrc.includes("Yamaha"), false, "Root metadata must NOT leak personal associations");
    assert.equal(layoutSrc.includes("index: false"), true, "Robots index must be false");
    assert.equal(layoutSrc.includes("follow: false"), true, "Robots follow must be false");

    console.log("All Next.js Middleware E2E Access Control & Privacy Leakage assertions passed cleanly!");
  } finally {
    process.env.ADMIN_TOKEN = previousToken;
  }
}

runMiddlewareE2eTests().catch((err) => {
  console.error("Middleware E2E test error:", err);
  process.exit(1);
});
