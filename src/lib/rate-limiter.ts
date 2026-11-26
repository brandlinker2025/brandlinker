// Distributed and resilient rate limiter for API protection across serverless and node instances

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
};

type RateLimitRecord = {
  timestamps: number[];
};

const localHits = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale local records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of localHits.entries()) {
    record.timestamps = record.timestamps.filter((t) => now - t < 300000);
    if (record.timestamps.length === 0) {
      localHits.delete(key);
    }
  }
}, 300000).unref();

export async function checkRateLimitAsync(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // If external distributed Redis is configured, use atomic distributed commands
  if (redisUrl && redisToken) {
    try {
      const endpoint = `${redisUrl}/pipeline`;
      const now = Date.now();
      const clearBefore = now - windowSeconds * 1000;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["ZREMRANGEBYSCORE", key, "0", String(clearBefore)],
          ["ZADD", key, String(now), String(now)],
          ["ZCARD", key],
          ["EXPIRE", key, String(windowSeconds)],
        ]),
      });

      if (res.ok) {
        const data = await res.json();
        const currentCount = data[2]?.result || 1;
        const allowed = currentCount <= maxRequests;
        return {
          allowed,
          limit: maxRequests,
          remaining: Math.max(0, maxRequests - currentCount),
          resetSeconds: windowSeconds,
        };
      }
    } catch {
      // Fallback to local memory limiter on connection error
    }
  }

  // Local sliding window implementation
  return checkRateLimit(key, maxRequests, windowSeconds);
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let record = localHits.get(key);

  if (!record) {
    record = { timestamps: [] };
    localHits.set(key, record);
  }

  // Filter timestamps outside sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - record.timestamps.length,
    resetSeconds: windowSeconds,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}
