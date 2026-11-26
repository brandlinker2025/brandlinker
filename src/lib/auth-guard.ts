import { canPerformAction, type Role } from "@foundation/policy";
import { verifyAdminToken } from "@foundation/admin-auth";
import { createHash, timingSafeEqual } from "node:crypto";
import { verifySession, PRIVATE_SESSION_COOKIE } from "@/lib/private-auth";

export type SessionInfo = {
  authorized: boolean;
  role: Role;
  actor: string;
  error?: string;
};

// Mask sensitive credentials so they are never leaked to client or logs
export function maskSecret(secret?: string): string {
  if (!secret) return "Not Configured";
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

// Timing-safe comparison for tokens of any length
function safeTokenEqual(provided: string | null, configured: string | undefined): boolean {
  if (!provided || !configured) return false;
  const digest = (v: string) => createHash("sha256").update(v, "utf8").digest();
  return timingSafeEqual(digest(provided), digest(configured));
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers.get("x-admin-token") || req.headers.get("x-machine-token");
  if (customHeader) {
    return customHeader.trim();
  }
  return null;
}

const REVOKED_EXPOSED_TOKENS = new Set([
  "rs-2026-master-key-secure-prod-token",
  "bl_exec_cb9e623ad1e93ce1b5efb35d4538cad2bff3d6790104be92",
]);

export function verifyRequestSession(req: Request): SessionInfo {
  // 1. Check for signed expiring session cookie (zero raw credentials stored)
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );
    const sessionToken = cookies[PRIVATE_SESSION_COOKIE];
    if (sessionToken) {
      const verified = verifySession(sessionToken);
      if (verified && verified.role === "owner") {
        return {
          authorized: true,
          role: "admin",
          actor: "RS Lina (Founder & Executive)",
        };
      }
    }
  }

  // 2. Check for Bearer token or header
  const token = extractBearerToken(req);

  if (!token) {
    return {
      authorized: false,
      role: "partner",
      actor: "anonymous",
      error: "Authentication token required.",
    };
  }

  // Strictly reject revoked / exposed tokens immediately
  if (REVOKED_EXPOSED_TOKENS.has(token)) {
    return {
      authorized: false,
      role: "partner",
      actor: "revoked-token",
      error: "Security Violation: This token has been revoked due to prior exposure. Please use rotated credentials.",
    };
  }

  const configuredAdminToken = process.env.ADMIN_TOKEN || process.env.RS_SERVICE_TOKEN;
  const configuredManagerToken = process.env.MANAGER_TOKEN;
  const configuredAuditorToken = process.env.AUDITOR_TOKEN;

  // Use timing-safe token verification
  if (configuredAdminToken && safeTokenEqual(token, configuredAdminToken)) {
    return {
      authorized: true,
      role: "admin",
      actor: "RS Lina (Founder & Executive)",
    };
  }

  if (safeTokenEqual(token, configuredManagerToken)) {
    return {
      authorized: true,
      role: "manager",
      actor: "Operations Manager",
    };
  }

  if (safeTokenEqual(token, configuredAuditorToken)) {
    return {
      authorized: true,
      role: "auditor",
      actor: "Gemini Pro (Independent Auditor)",
    };
  }

  return {
    authorized: false,
    role: "partner",
    actor: "unverified",
    error: "Invalid or expired token.",
  };
}

export function requireAction(req: Request, action: string): { authorized: boolean; role: Role; actor: string; error?: string } {
  const session = verifyRequestSession(req);
  if (!session.authorized) {
    return session;
  }

  if (!canPerformAction(session.role, action)) {
    return {
      authorized: false,
      role: session.role,
      actor: session.actor,
      error: `Role '${session.role}' is not permitted to perform action '${action}'.`,
    };
  }

  return session;
}
