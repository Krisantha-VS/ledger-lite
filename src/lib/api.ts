import { NextResponse } from "next/server";
import { ZodError } from "zod";
export { getUserId } from "@/lib/auth";

export const ok = <T>(data: T, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

export const unauthorized = () => fail("Unauthorized", 401);
export const notFound     = () => fail("Not found", 404);

export function handleError(e: unknown) {
  if (e instanceof ZodError)
    return fail(e.issues.map(x => x.message).join(", "), 400);
  if (e instanceof AuthError) return unauthorized();
  console.error("[ledger-lite]", e);
  return fail("Internal server error", 500);
}

export class AuthError extends Error {}
