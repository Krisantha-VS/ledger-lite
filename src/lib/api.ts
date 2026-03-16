import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getUserId as _getUserId } from "@/lib/auth";

export { } // keep module

// ── Rate-limited getUserId ─────────────────────────────
// Every authenticated route goes through here — one choke point.
export async function getUserId(request: Request): Promise<string> {
  const userId = await _getUserId(request);

  const key    = rateLimitKey(request, userId);
  const result = rateLimit(key, { limit: 120, windowMs: 60_000 }); // 120 req/min per user

  if (!result.ok) {
    throw new RateLimitError(`Rate limit exceeded. Retry in ${Math.ceil((result.retryAfterMs ?? 0) / 1000)}s`);
  }

  return userId;
}

// ── Response helpers ───────────────────────────────────

export const ok = <T>(data: T, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

export const unauthorized = () => fail("Unauthorized", 401);
export const notFound     = () => fail("Not found", 404);

// ── Error handler ──────────────────────────────────────

export function handleError(e: unknown) {
  if (e instanceof ZodError)
    return fail(e.issues.map(x => x.message).join(", "), 400);
  if (e instanceof AuthError)     return unauthorized();
  if (e instanceof RateLimitError) return fail(e.message, 429);
  // Never leak stack traces — log server-side only
  console.error("[ledger-lite]", e instanceof Error ? e.message : e);
  return fail("Internal server error", 500);
}

// ── Error classes ──────────────────────────────────────

export class AuthError      extends Error {}
export class RateLimitError extends Error {}
