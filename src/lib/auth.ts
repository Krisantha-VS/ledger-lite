import { jwtVerify, errors as joseErrors } from "jose";
import { AuthError } from "@/lib/api";

function getSecret(): Uint8Array {
  // Support multiple common secret env names to avoid prod misconfig 500s.
  const secretStr =
    process.env.AUTH_JWT_SECRET ??
    process.env.JWT_ACCESS_SECRET ??
    process.env.JWT_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET;

  if (!secretStr) throw new Error("JWT secret env var is required (AUTH_JWT_SECRET/JWT_ACCESS_SECRET/JWT_SECRET/AUTH_SECRET/NEXTAUTH_SECRET)");
  return new TextEncoder().encode(secretStr);
}

export async function verifyJWT(
  token: string
): Promise<{ sub: string; name?: string; email?: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) throw new AuthError("Invalid token: missing sub");
    return payload as { sub: string; name?: string; email?: string };
  } catch (e) {
    if (e instanceof joseErrors.JWTExpired) throw new AuthError("Token expired");
    if (e instanceof joseErrors.JWTInvalid) throw new AuthError("Invalid token");
    throw e instanceof AuthError ? e : new AuthError("Unauthorized");
  }
}

export function extractBearer(header: string | null): string {
  if (!header?.startsWith("Bearer ")) throw new AuthError("Missing token");
  return header.slice(7);
}

export async function getUserId(request: Request): Promise<string> {
  const token = extractBearer(request.headers.get("Authorization"));
  const payload = await verifyJWT(token);
  return payload.sub;
}

export async function getUserEmail(request: Request): Promise<string | null> {
  try {
    const token = extractBearer(request.headers.get("Authorization"));
    const payload = await verifyJWT(token);
    return payload.email ?? null;
  } catch {
    return null;
  }
}
