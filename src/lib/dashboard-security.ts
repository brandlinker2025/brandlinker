import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Timing-safe string comparison to protect against side-channel timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) {
      // Execute dummy comparison to maintain uniform time
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Endpoint verifier for supporting platforms:
 * Performs real HTTP checks against platform endpoints
 */
export async function checkSupportingPlatformEndpoint(baseUrl: string, timeoutMs: number = 2500): Promise<{
  online: boolean;
  statusCode?: number;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(baseUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "BrandLinker-Health-Probe/1.0" },
    });
    clearTimeout(timer);
    return {
      online: res.status < 500,
      statusCode: res.status,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      online: false,
      error: err.name === "AbortError" ? "Connection Timed Out" : err.message,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Supplier Connectivity Check:
 * Distinguishes configured credentials from verified live supplier connectivity
 */
export async function verifySupplierConnectivity(supplier: "cjdropshipping" | "aliexpress"): Promise<{
  configured: boolean;
  verifiedConnectivity: boolean;
  status: "unconfigured" | "credentials_present_not_verified" | "verified_connected" | "connection_failed";
  details: string;
}> {
  if (supplier === "cjdropshipping") {
    const email = process.env.CJ_EMAIL;
    const apiKey = process.env.CJ_API_KEY;
    if (!email || !apiKey) {
      return {
        configured: false,
        verifiedConnectivity: false,
        status: "unconfigured",
        details: "Missing CJ_EMAIL or CJ_API_KEY in environment",
      };
    }
    // Attempt live auth token probe against CJ Open API
    try {
      const res = await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, apiKey }),
      });
      const data = await res.json();
      if (data.code === 200 && data.data?.accessToken) {
        return {
          configured: true,
          verifiedConnectivity: true,
          status: "verified_connected",
          details: "Live access token acquired from CJdropshipping API",
        };
      } else {
        return {
          configured: true,
          verifiedConnectivity: false,
          status: "connection_failed",
          details: `CJ API returned rejection: ${data.message || data.code}`,
        };
      }
    } catch (err: any) {
      return {
        configured: true,
        verifiedConnectivity: false,
        status: "connection_failed",
        details: `Network error contacting CJ API: ${err.message}`,
      };
    }
  }

  if (supplier === "aliexpress") {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;
    if (!appKey || !appSecret) {
      return {
        configured: false,
        verifiedConnectivity: false,
        status: "unconfigured",
        details: "Missing ALIEXPRESS_APP_KEY or ALIEXPRESS_APP_SECRET in environment",
      };
    }
    return {
      configured: true,
      verifiedConnectivity: false,
      status: "credentials_present_not_verified",
      details: "AliExpress credentials present; requires active OAuth session token for live quotes",
    };
  }

  return {
    configured: false,
    verifiedConnectivity: false,
    status: "unconfigured",
    details: "Unknown supplier",
  };
}
