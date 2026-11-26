import { createHmac, timingSafeEqual, createHash } from "node:crypto";

export const PRIVATE_SESSION_COOKIE = "rs_private_session";
const SESSION_DURATION_SECONDS = 86400; // 24 hours

function getSecretKey(): string | null {
  const secret = process.env.ADMIN_TOKEN || process.env.RS_SERVICE_TOKEN || process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    // Fail closed: Never fall back to a hardcoded string
    return null;
  }
  return secret;
}

export type SessionPayload = {
  actor: string;
  role: "owner";
  issuedAt: number;
  expiresAt: number;
};

// Sign a session token: payload.signature (fails closed if secret missing)
export function signSession(actor = "owner"): string {
  const secret = getSecretKey();
  if (!secret) {
    throw new Error("Cannot sign session: Server authentication credentials are unconfigured. Failing closed.");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    actor,
    role: "owner",
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${hmac}`;
}

// Verify session token; returns null if invalid, expired, tampered, or secret missing (fails closed)
export function verifySession(token: string | null | undefined): SessionPayload | null {
  if (!token || typeof token !== "string") return null;

  const secret = getSecretKey();
  if (!secret) return null; // Fail closed

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, providedSig] = parts;

  try {
    // Verify HMAC signature in constant time
    const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
    const sigA = createHash("sha256").update(providedSig).digest();
    const sigB = createHash("sha256").update(expectedSig).digest();

    if (!timingSafeEqual(sigA, sigB)) {
      return null;
    }

    const raw = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now || payload.role !== "owner") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Verify if a provided access key matches the owner credentials
export function verifyOwnerCredentials(providedKey: string | null | undefined): boolean {
  if (!providedKey || typeof providedKey !== "string") return false;

  const configuredTokens = [
    process.env.ADMIN_TOKEN,
    process.env.RS_SERVICE_TOKEN,
    process.env.OWNER_ACCESS_KEY,
  ].filter(Boolean) as string[];

  if (configuredTokens.length === 0) {
    return false;
  }

  const providedHash = createHash("sha256").update(providedKey.trim(), "utf8").digest();

  for (const configured of configuredTokens) {
    const configuredHash = createHash("sha256").update(configured.trim(), "utf8").digest();
    if (timingSafeEqual(providedHash, configuredHash)) {
      return true;
    }
  }

  return false;
}

// Standard cookie settings
export function getSessionCookieOptions() {
  return {
    name: PRIVATE_SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
