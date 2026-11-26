import { authorizeBearer } from "@foundation/admin-auth";
import { agents } from "@foundation/agents";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export function GET(request: Request) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`agents-get:${ip}`, 30, 60);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too Many Requests", retryAfter: rateLimit.resetSeconds },
      { status: 429, headers }
    );
  }

  const configuredToken = process.env.RS_SERVICE_TOKEN;
  if (!authorizeBearer(request.headers.get("authorization"), configuredToken)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  return Response.json(
    {
      agents,
      executionEnabled: true,
      freeProviderRouting: "active",
      confidentialPolicy: "strict_local_only",
    },
    { headers }
  );
}
