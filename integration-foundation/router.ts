import { eligibleProviders, type Provider } from "./policy";

export type Request = {
  prompt: string;
  confidential: boolean;
  preferredProviderId?: string;
};

export type Adapter = {
  provider: Provider;
  execute: (request: Request, signal: AbortSignal) => Promise<string>;
};

export type Execution =
  | { status: "succeeded"; providerId: string; output: string; latencyMs: number }
  | { status: "unavailable"; attempted: string[]; reason?: string };

// In-memory health and quota monitor for real-time dashboard
const providerStats: Map<
  string,
  {
    successCount: number;
    failureCount: number;
    totalLatencyMs: number;
    lastLatencyMs: number;
    lastSeen?: string;
    lastError?: string;
  }
> = new Map();

export function getProviderStats(providerId: string) {
  return (
    providerStats.get(providerId) || {
      successCount: 0,
      failureCount: 0,
      totalLatencyMs: 0,
      lastLatencyMs: 0,
    }
  );
}

export function getAllProviderStats() {
  const result: Record<string, ReturnType<typeof getProviderStats>> = {};
  for (const [key, val] of providerStats.entries()) {
    result[key] = { ...val };
  }
  return result;
}

export async function executeFree(
  request: Request,
  adapters: readonly Adapter[],
  signal: AbortSignal
): Promise<Execution> {
  if (!request.prompt.trim() || request.prompt.length > 16000) {
    throw new Error("Invalid prompt");
  }

  const attempted: string[] = [];
  const eligible = eligibleProviders(
    adapters.map((a) => a.provider),
    request.confidential
  );

  if (eligible.length === 0) {
    return {
      status: "unavailable",
      attempted,
      reason: request.confidential
        ? "Confidential requests require an eligible private provider (e.g. Local Ollama) to prevent public data exposure."
        : "No healthy free-only AI providers currently configured or within quota.",
    };
  }

  // Sort: preferred provider first, then by remaining quota / latency
  const sortedEligible = [...eligible].sort((a, b) => {
    if (request.preferredProviderId) {
      if (a.id === request.preferredProviderId) return -1;
      if (b.id === request.preferredProviderId) return 1;
    }
    const statsA = getProviderStats(a.id);
    const statsB = getProviderStats(b.id);
    return statsA.failureCount - statsB.failureCount;
  });

  for (const provider of sortedEligible) {
    if (signal.aborted) throw new Error("Cancelled");
    const adapter = adapters.find((a) => a.provider.id === provider.id);
    if (!adapter) continue;

    attempted.push(provider.id);
    const startTime = Date.now();

    try {
      const output = await adapter.execute(request, signal);
      const latencyMs = Date.now() - startTime;
      if (signal.aborted) throw new Error("Cancelled");

      if (typeof output === "string" && output.trim()) {
        const stats = getProviderStats(provider.id);
        stats.successCount += 1;
        stats.totalLatencyMs += latencyMs;
        stats.lastLatencyMs = latencyMs;
        stats.lastSeen = new Date().toISOString();
        providerStats.set(provider.id, stats);

        return {
          status: "succeeded",
          providerId: provider.id,
          output: output.trim(),
          latencyMs,
        };
      }
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const stats = getProviderStats(provider.id);
      stats.failureCount += 1;
      stats.lastLatencyMs = latencyMs;
      stats.lastSeen = new Date().toISOString();
      stats.lastError = err instanceof Error ? err.message : String(err);
      providerStats.set(provider.id, stats);

      if (signal.aborted) throw new Error("Cancelled");
    }
  }

  return {
    status: "unavailable",
    attempted,
    reason: "All attempted free-only providers failed or timed out. Closed-fail policy prevented paid fallback.",
  };
}
