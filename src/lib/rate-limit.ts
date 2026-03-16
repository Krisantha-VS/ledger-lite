/**
 * In-process rate limiter using a sliding window.
 * For production at scale, swap the store for Redis (Upstash).
 */

interface Window {
  hits: number[];
  blocked: boolean;
}

const store = new Map<string, Window>();

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const DEFAULTS: RateLimitOptions = { limit: 60, windowMs: 60_000 };

/**
 * Check and record a rate-limit hit for the given key.
 * Returns `{ ok: true }` or `{ ok: false, retryAfterMs }`.
 */
export function rateLimit(
  key: string,
  opts: RateLimitOptions = DEFAULTS,
): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const win  = store.get(key) ?? { hits: [], blocked: false };

  // Slide the window — drop expired hits
  win.hits = win.hits.filter(t => now - t < opts.windowMs);

  if (win.hits.length >= opts.limit) {
    const oldest       = win.hits[0];
    const retryAfterMs = opts.windowMs - (now - oldest);
    store.set(key, win);
    return { ok: false, retryAfterMs };
  }

  win.hits.push(now);
  store.set(key, win);
  return { ok: true };
}

/** Extract a rate-limit key from a request (userId preferred, falls back to IP). */
export function rateLimitKey(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  return `ip:${ip}`;
}
