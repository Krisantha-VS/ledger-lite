import { type NextRequest, NextResponse } from "next/server";

const AUTH_UPSTREAM =
  process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth-saas.royalda.com/api/v1";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const upstream = `${AUTH_UPSTREAM}/auth/${path.join("/")}`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  const body = req.method !== "GET" ? await req.text() : undefined;

  const res = await fetch(upstream, {
    method: req.method,
    headers,
    body,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
