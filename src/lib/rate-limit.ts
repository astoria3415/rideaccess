/**
 * Minimal in-memory sliding-window rate limiter. Sufficient for a
 * single-region deployment; swap for Upstash/Redis if you scale to
 * multiple regions.
 */
const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  hits.set(key, timestamps);

  // Opportunistic cleanup to avoid unbounded growth.
  if (hits.size > 5_000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }

  return {
    success: timestamps.length <= limit,
    remaining: Math.max(0, limit - timestamps.length),
  };
}

export function getClientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
