import { NextResponse } from "next/server";
import { requireAction } from "@/lib/auth-guard";
import { getStandardFreeAdapters } from "@foundation/adapters";
import { dispatchAgent, agents } from "@foundation/agents";
import { getAllProviderStats, executeFree } from "@foundation/router";

export async function GET() {
  const adapters = getStandardFreeAdapters();
  const stats = getAllProviderStats();

  const providerSummaries = adapters.map((a) => {
    const s = stats[a.provider.id] || {
      successCount: 0,
      failureCount: 0,
      totalLatencyMs: 0,
      lastLatencyMs: 0,
    };
    return {
      id: a.provider.id,
      name: a.provider.name,
      free: a.provider.free,
      enabled: a.provider.enabled,
      healthy: a.provider.healthy,
      remaining: a.provider.remaining,
      confidentialAllowed: a.provider.confidentialAllowed,
      rateLimitRPM: a.provider.rateLimitRPM,
      rateLimitRPD: a.provider.rateLimitRPD,
      models: a.provider.models,
      stats: s,
    };
  });

  return NextResponse.json({
    providers: providerSummaries,
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      capability: a.capability,
      module: a.module,
      status: a.status,
      confidentialDefault: a.confidentialDefault,
      sampleInput: a.sampleInput,
    })),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentId, prompt, confidential, preferredProviderId } = body;

    const action = confidential ? "view_confidential" : "read_public";
    const session = requireAction(req, action);
    if (!session.authorized) {
      return NextResponse.json({ error: session.error }, { status: 403 });
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Valid prompt is required." }, { status: 400 });
    }

    const adapters = getStandardFreeAdapters();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000); // 35s safety timeout

    let result;
    try {
      if (agentId) {
        result = await dispatchAgent(
          agentId,
          prompt.trim(),
          adapters,
          controller.signal,
          Boolean(confidential)
        );
      } else {
        result = await executeFree(
          {
            prompt: prompt.trim(),
            confidential: Boolean(confidential),
            preferredProviderId,
          },
          adapters,
          controller.signal
        );
      }
    } finally {
      clearTimeout(timeout);
    }

    return NextResponse.json({
      ...result,
      actor: session.actor,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "Internal AI execution error",
      },
      { status: 500 }
    );
  }
}
