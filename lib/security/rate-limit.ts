type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as unknown as {
  requestRateLimits?: Map<string, RateLimitEntry>;
};

const requestRateLimits =
  globalForRateLimit.requestRateLimits ?? new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.requestRateLimits = requestRateLimits;
}

export function checkRequestRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const now = Date.now();
  const key = `${scope}:${clientIp(request)}`;
  const current = requestRateLimits.get(key);

  if (!current || current.resetAt <= now) {
    requestRateLimits.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    pruneExpiredEntries(now);
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const value = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  return /^[0-9a-f:.]+$/i.test(value) ? value : "unknown";
}

function pruneExpiredEntries(now: number) {
  if (requestRateLimits.size < 1000) {
    return;
  }

  for (const [key, entry] of requestRateLimits) {
    if (entry.resetAt <= now) {
      requestRateLimits.delete(key);
    }
  }
}
