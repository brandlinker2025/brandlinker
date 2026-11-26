export const PRIVATE_SESSION_COOKIE = "rs_private_session";
const SESSION_DURATION_SECONDS = 86400; // 24 hours

export function getAuthSecret(): string | null {
  const secret = process.env.ADMIN_TOKEN || process.env.RS_SERVICE_TOKEN || process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return null; // Fail closed
  }
  return secret;
}

// Convert base64url string to Uint8Array
function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convert Uint8Array to base64url string
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Sign a session token using Web Crypto HMAC-SHA256
export async function signSessionEdge(secret: string, actor = "owner"): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    actor,
    role: "owner",
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_SECONDS,
  };

  const enc = new TextEncoder();
  const payloadJson = JSON.stringify(payload);
  const payloadBytes = enc.encode(payloadJson);
  const payloadB64 = bytesToBase64Url(payloadBytes);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(sigBuffer));

  return `${payloadB64}.${sigB64}`;
}

// Verify a session token using Web Crypto HMAC-SHA256 (fails closed if secret missing)
export async function verifySessionEdge(token: string | null | undefined, secret: string | null): Promise<boolean> {
  if (!secret || !token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadB64, sigB64] = parts;

  try {
    const enc = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToBytes(sigB64);
    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, sigBytes as any, enc.encode(payloadB64));
    if (!isValid) return false;

    const payloadBytes = base64UrlToBytes(payloadB64);
    const payloadText = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadText);

    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now || payload.role !== "owner") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Verify Bearer authorization token against owner key (fails closed if secret missing)
export async function verifyOwnerBearerToken(header: string | null, secret: string | null): Promise<boolean> {
  if (!secret || !header || !header.startsWith("Bearer ")) return false;
  const token = header.slice(7).trim();
  if (token.length < 16) return false;

  const enc = new TextEncoder();
  const hashA = await crypto.subtle.digest("SHA-256", enc.encode(token));
  const hashB = await crypto.subtle.digest("SHA-256", enc.encode(secret));

  const u8A = new Uint8Array(hashA);
  const u8B = new Uint8Array(hashB);
  if (u8A.length !== u8B.length) return false;

  let match = 0;
  for (let i = 0; i < u8A.length; i++) {
    match |= u8A[i] ^ u8B[i];
  }
  return match === 0;
}
