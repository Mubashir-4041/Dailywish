/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Suitable for a single-instance deployment. For multi-instance / serverless
 * production, swap the Map for a shared store (Upstash Redis / Vercel KV) -
 * the `rateLimit` signature is intentionally storage-agnostic.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Periodically evict expired buckets to bound memory.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of store) if (v.resetAt < now) store.delete(k);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms
  retryAfter: number; // seconds
}

export function rateLimit(
  key: string,
  { limit = 60, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt, retryAfter: 0 };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const success = bucket.count <= limit;
  return {
    success,
    limit,
    remaining,
    reset: bucket.resetAt,
    retryAfter: success ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Preset limiters for common endpoints. */
export const limiters = {
  auth: { limit: 8, windowMs: 60_000 }, // brute-force protection
  api: { limit: 100, windowMs: 60_000 },
  write: { limit: 30, windowMs: 60_000 },
  newsletter: { limit: 5, windowMs: 60_000 },
} as const;
