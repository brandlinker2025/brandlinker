import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  signSession,
  verifySession,
  verifyOwnerCredentials,
  getSessionCookieOptions,
  PRIVATE_SESSION_COOKIE,
} from "../src/lib/private-auth";
import {
  signSessionEdge,
  verifySessionEdge,
  verifyOwnerBearerToken,
} from "../src/lib/edge-auth";

async function runPrivateAccessTests() {
  console.log("Starting Full-Domain Private Access & Session Security Verification...");

  // 1. Dynamic Test-Only Secret Generation (Zero real tokens in tests)
  const testSecret = randomBytes(32).toString("hex");
  const previousAdminToken = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = testSecret;

  try {
    // 2. Owner Credentials Verification
    assert.equal(verifyOwnerCredentials(testSecret), true, "Valid owner secret must authenticate");
    assert.equal(verifyOwnerCredentials("wrong-password-attempt"), false, "Invalid secret must be rejected");
    assert.equal(verifyOwnerCredentials(""), false, "Empty secret must be rejected");
    assert.equal(verifyOwnerCredentials(null), false, "Null secret must be rejected");

    // 3. Session Signing and Verification (Node crypto)
    const sessionToken = signSession("owner");
    assert.notEqual(sessionToken, "", "Session token must be non-empty string");
    assert.equal(sessionToken.includes("."), true, "Session token must contain payload.sig format");

    const verified = verifySession(sessionToken);
    assert.notEqual(verified, null, "Valid session token must verify cleanly");
    assert.equal(verified?.role, "owner", "Session role must be 'owner'");
    assert.equal(verified?.actor, "owner", "Session actor must be 'owner'");

    // 4. Tampering Protection
    const [payloadB64, sig] = sessionToken.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ actor: "attacker", role: "owner", exp: 9999999999 })).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${sig}`;
    assert.equal(verifySession(tamperedToken), null, "Tampered session payload must be rejected");

    const forgedSig = randomBytes(32).toString("base64url");
    const forgedToken = `${payloadB64}.${forgedSig}`;
    assert.equal(verifySession(forgedToken), null, "Forged signature must be rejected");

    // 5. Expired Session Protection
    const expiredPayload = Buffer.from(JSON.stringify({
      actor: "owner",
      role: "owner",
      issuedAt: Math.floor(Date.now() / 1000) - 10000,
      expiresAt: Math.floor(Date.now() / 1000) - 10, // expired 10s ago
    })).toString("base64url");
    const crypto = await import("node:crypto");
    const expiredSig = crypto.createHmac("sha256", testSecret).update(expiredPayload).digest("base64url");
    assert.equal(verifySession(`${expiredPayload}.${expiredSig}`), null, "Expired session must return null");

    // 6. Edge Runtime Web Crypto Verification (Parity between Node and Edge)
    const edgeToken = await signSessionEdge(testSecret, "owner");
    assert.equal(await verifySessionEdge(edgeToken, testSecret), true, "Edge signed session must verify");
    assert.equal(await verifySessionEdge(edgeToken, "wrong-edge-secret"), false, "Wrong secret must fail edge verify");

    // 7. Owner Bearer Token Verification
    assert.equal(await verifyOwnerBearerToken(`Bearer ${testSecret}`, testSecret), true, "Bearer token must match");
    assert.equal(await verifyOwnerBearerToken(`Bearer wrong-token`, testSecret), false, "Wrong bearer token must fail");
    assert.equal(await verifyOwnerBearerToken("NoBearer", testSecret), false, "Malformed header must fail");

    // 8. Session Cookie Attributes Verification
    const cookieOpts = getSessionCookieOptions();
    assert.equal(cookieOpts.name, PRIVATE_SESSION_COOKIE);
    assert.equal(cookieOpts.httpOnly, true, "Cookie MUST be HttpOnly");
    assert.equal(cookieOpts.sameSite, "strict", "Cookie MUST be SameSite=Strict");
    assert.equal(cookieOpts.path, "/", "Cookie path MUST be /");
    assert.equal(cookieOpts.maxAge, 86400, "Cookie maxAge MUST be 24h");

    console.log("All full-domain private access & session security assertions verified successfully!");
  } finally {
    process.env.ADMIN_TOKEN = previousAdminToken;
  }
}

runPrivateAccessTests().catch((err) => {
  console.error("Private access test failed:", err);
  process.exit(1);
});
