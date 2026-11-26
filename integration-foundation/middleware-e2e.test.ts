import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { middleware, config } from "../src/middleware";
import { signSession, PRIVATE_SESSION_COOKIE } from "../src/lib/private-auth";

/**
 * RSLina.com Scoped Access Control & Privacy Architecture Tests
 *
 * Requirements:
 * 1. Public Personal Portfolio (homepage, /career, /work, /riding, /gallery, /freelance, /collaborate,
 *    media, fonts, static assets) is freely accessible to the public with full SEO.
 * 2. ONLY AI Command Center (/command-center) and internal business APIs
 *    (/api/command-center/*, /api/jobs, /api/agents, /api/automation/*) require owner authentication.
 * 3. Root layout includes public metadata, robots allows indexing for public portfolio.
 * 4. Robots.txt disallows /api/ and /command-center.
 * 5. Sitemap.xml exposes only public portfolio routes and omits /command-center.
 */
async function runMiddlewareE2eTests() {
  console.log("Starting Next.js Middleware Scoped Access Control & Privacy Tests...");

  const testSecret = randomBytes(32).toString("hex");
  const previousToken = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = testSecret;

  try {
    // 1. Verify Config Matcher strictly covers /command-center and private APIs
    assert.ok(config.matcher.includes("/command-center"), "Matcher must include /command-center");
    assert.ok(config.matcher.includes("/command-center/:path*"), "Matcher must include /command-center/:path*");
    assert.ok(config.matcher.includes("/api/command-center/:path*"), "Matcher must include /api/command-center/:path*");
    assert.ok(config.matcher.includes("/api/jobs"), "Matcher must include /api/jobs");
    assert.ok(config.matcher.includes("/api/agents"), "Matcher must include /api/agents");

    // 2. Direct Unauthorized Access to AI Command Center -> MUST redirect to /login?next=%2Fcommand-center
    const reqCC = new NextRequest("http://localhost:3847/command-center", { method: "GET" });
    const resCC = await middleware(reqCC);
    assert.equal(resCC.status, 307, "Unauthorized access to /command-center must return 307 redirect");
    assert.equal(resCC.headers.get("location"), "http://localhost:3847/login?next=%2Fcommand-center");
    assert.equal(resCC.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.match(resCC.headers.get("cache-control") || "", /no-store/);

    // 3. Unauthorized Access to Sub-route of Command Center -> MUST redirect with query param
    const reqCCSub = new NextRequest("http://localhost:3847/command-center/analytics", { method: "GET" });
    const resCCSub = await middleware(reqCCSub);
    assert.equal(resCCSub.status, 307);
    assert.equal(resCCSub.headers.get("location"), "http://localhost:3847/login?next=%2Fcommand-center%2Fanalytics");

    // 4. Unauthorized API Request -> MUST return 401 JSON (not redirect)
    const reqApi = new NextRequest("http://localhost:3847/api/command-center/data", { method: "GET" });
    const resApi = await middleware(reqApi);
    assert.equal(resApi.status, 401, "Unauthorized internal API call must return 401");
    const jsonBody = await resApi.json();
    assert.match(jsonBody.error, /AI Command Center and internal APIs require owner authentication/i);
    assert.match(resApi.headers.get("cache-control") || "", /no-store/);

    // 5. Unauthorized Jobs API -> MUST return 401 JSON
    const reqJobs = new NextRequest("http://localhost:3847/api/jobs", { method: "GET" });
    const resJobs = await middleware(reqJobs);
    assert.equal(resJobs.status, 401, "Unauthorized jobs API must return 401");

    // 6. Authenticated Request to Command Center with Valid rs_private_session Cookie -> MUST pass through
    const validSession = signSession("owner");
    const reqAuthCC = new NextRequest("http://localhost:3847/command-center", {
      method: "GET",
      headers: {
        cookie: `${PRIVATE_SESSION_COOKIE}=${validSession}`,
      },
    });
    const resAuthCC = await middleware(reqAuthCC);
    assert.equal(resAuthCC.status, 200, "Authenticated request to /command-center must pass through");
    assert.equal(resAuthCC.headers.get("x-robots-tag"), "noindex, nofollow, noarchive, nosnippet");
    assert.equal(resAuthCC.headers.get("cache-control"), "private, no-cache, no-store, must-revalidate");

    // 7. Authenticated API Request with Bearer Token -> MUST pass through
    const reqBearer = new NextRequest("http://localhost:3847/api/command-center/data", {
      method: "GET",
      headers: {
        authorization: `Bearer ${testSecret}`,
      },
    });
    const resBearer = await middleware(reqBearer);
    assert.equal(resBearer.status, 200, "Valid Bearer token must pass through");

    // 8. Tampered Session Cookie on Protected Route -> MUST be rejected and redirected
    const tamperedReq = new NextRequest("http://localhost:3847/command-center", {
      method: "GET",
      headers: {
        cookie: `${PRIVATE_SESSION_COOKIE}=tampered.token.data`,
      },
    });
    const tamperedRes = await middleware(tamperedReq);
    assert.equal(tamperedRes.status, 307, "Tampered cookie must redirect to /login");

    // 9. Missing Secrets Fail-Closed: When secret is absent, protected requests fail closed
    delete process.env.ADMIN_TOKEN;
    delete process.env.RS_SERVICE_TOKEN;
    delete process.env.SESSION_SECRET;

    const noSecretReq = new NextRequest("http://localhost:3847/command-center", {
      method: "GET",
      headers: {
        cookie: `${PRIVATE_SESSION_COOKIE}=${validSession}`,
      },
    });
    const noSecretRes = await middleware(noSecretReq);
    assert.equal(noSecretRes.status, 307, "When secrets are missing, middleware MUST fail closed and redirect");

    // 10. Verify Public Portfolio SEO in Root Layout
    const layoutSrc = readFileSync("src/app/layout.tsx", "utf8");
    assert.ok(layoutSrc.includes("Razia Sultana Lina"), "Root layout must include RS Lina portfolio branding");
    assert.ok(layoutSrc.includes("index: true"), "Robots index must be true for public portfolio");
    assert.ok(layoutSrc.includes("follow: true"), "Robots follow must be true for public portfolio");
    assert.ok(layoutSrc.includes("<SiteHeader />"), "SiteHeader must be rendered on public portfolio");
    assert.ok(layoutSrc.includes("<SiteFooter />"), "SiteFooter must be rendered on public portfolio");

    // 11. Verify Navigation Links: Command Center must NOT be in public header/footer/homepage
    const headerSrc = readFileSync("src/components/site-header.tsx", "utf8");
    assert.equal(headerSrc.includes("/command-center"), false, "SiteHeader must NOT leak command center link");

    const footerSrc = readFileSync("src/components/site-footer.tsx", "utf8");
    assert.equal(footerSrc.includes("/command-center"), false, "SiteFooter must NOT leak command center link");

    const homeSrc = readFileSync("src/app/page.tsx", "utf8");
    assert.equal(homeSrc.includes("/command-center"), false, "Homepage must NOT link to command center");

    // 12. Verify Robots.txt and Sitemap.ts
    const robotsSrc = readFileSync("src/app/robots.ts", "utf8");
    assert.ok(robotsSrc.includes('allow: "/"'), "Robots must allow public portfolio indexing");
    assert.ok(robotsSrc.includes("/command-center"), "Robots must disallow /command-center");

    const sitemapSrc = readFileSync("src/app/sitemap.ts", "utf8");
    assert.ok(sitemapSrc.includes("/career"), "Sitemap must include public /career route");
    assert.ok(sitemapSrc.includes("/work"), "Sitemap must include public /work route");
    assert.ok(sitemapSrc.includes("/riding"), "Sitemap must include public /riding route");
    assert.equal(sitemapSrc.includes("/command-center"), false, "Sitemap must NOT expose /command-center");

    console.log("All Next.js Scoped Access Control, Privacy & SEO assertions passed cleanly!");
  } finally {
    process.env.ADMIN_TOKEN = previousToken;
  }
}

runMiddlewareE2eTests().catch((err) => {
  console.error("Middleware E2E test error:", err);
  process.exit(1);
});
