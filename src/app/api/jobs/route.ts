import { randomUUID } from "node:crypto";
import { authorizeBearer } from "@foundation/admin-auth";
import { findAgent } from "@foundation/agents";
import { createSupabaseJobStore } from "@foundation/supabase-job-store";
import { createDurableJobStore } from "@foundation/durable-job-store";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

const headers = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

const reply = (data: unknown, status = 200) => Response.json(data, { status, headers });

function authorized(req: Request) {
  const configuredToken = process.env.RS_SERVICE_TOKEN || process.env.ADMIN_TOKEN;
  return authorizeBearer(req.headers.get("authorization"), configuredToken);
}

function getStore() {
  if (process.env.BL_SUPABASE_URL && process.env.BL_SUPABASE_SERVICE_KEY) {
    return createSupabaseJobStore();
  }
  // Fall back to local durable store when central cloud key is unconfigured in current dev environment
  return createDurableJobStore();
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`jobs-get:${ip}`, 60, 60);
  if (!rateLimit.allowed) return reply({ error: "Too Many Requests" }, 429);

  if (!authorized(req)) return reply({ error: "Unauthorized" }, 401);
  const id = new URL(req.url).searchParams.get("id");
  if (!id || id.length > 128) return reply({ error: "Invalid id" }, 400);

  try {
    const job = await getStore().get(id);
    return job ? reply(job) : reply({ error: "Not found" }, 404);
  } catch {
    return reply({ error: "Database unavailable" }, 503);
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`jobs-post:${ip}`, 30, 60);
  if (!rateLimit.allowed) return reply({ error: "Too Many Requests" }, 429);

  if (!authorized(req)) return reply({ error: "Unauthorized" }, 401);

  try {
    const raw = await req.text();
    if (raw.length > 4096) return reply({ error: "Payload too large" }, 413);
    const body = JSON.parse(raw);

    if (
      typeof body?.agentId !== "string" ||
      !findAgent(body.agentId) ||
      typeof body.idempotencyKey !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(body.idempotencyKey)
    ) {
      return reply({ error: "Invalid request" }, 400);
    }

    const now = new Date().toISOString();
    const job = await getStore().createOrGet({
      id: randomUUID(),
      agentId: body.agentId,
      state: "queued",
      revision: 0,
      createdAt: now,
      updatedAt: now,
      idempotencyKey: body.idempotencyKey,
    });

    return reply(job);
  } catch (e) {
    return reply(
      { error: e instanceof SyntaxError ? "Invalid JSON" : "Job unavailable" },
      e instanceof SyntaxError ? 400 : 503
    );
  }
}
