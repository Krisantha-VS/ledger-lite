import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
  .split(",").map(o => o.trim());

export function middleware(req: NextRequest) {
  const { pathname, protocol } = req.nextUrl;

  // ── HTTPS redirect in production ──────────────────────
  if (process.env.NODE_ENV === "production" && protocol === "http:") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  const res = NextResponse.next();

  // ── Security headers on every response ───────────────
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // ── CORS for API routes ───────────────────────────────
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
    }

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: res.headers });
    }

    // ── CSRF: reject cross-origin state-mutating requests ─
    if (["POST", "PATCH", "DELETE"].includes(req.method)) {
      const reqOrigin  = req.headers.get("origin");
      const reqReferer = req.headers.get("referer");
      const host       = req.headers.get("host");

      const originOk  = !reqOrigin  || ALLOWED_ORIGINS.includes(reqOrigin);
      const refererOk = !reqReferer || ALLOWED_ORIGINS.some(o => reqReferer.startsWith(o));
      const sameHost  = !reqOrigin  || (host && reqOrigin.includes(host));

      if (!originOk && !refererOk && !sameHost) {
        return new NextResponse(JSON.stringify({ success: false, error: "CSRF check failed" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
