import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_URL  = (process.env.NEXT_PUBLIC_AUTH_URL  ?? 'https://auth-saas.royalda.com').trim();
const CLIENT_ID =  process.env.NEXT_PUBLIC_AUTH_CLIENT_ID ?? '';

export async function POST(_req: NextRequest) {
  const jar          = await cookies();
  const refreshToken = jar.get('ll_refresh')?.value;
  if (!refreshToken) return NextResponse.json({ success: false }, { status: 401 });

  const res = await fetch(`${AUTH_URL}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken, clientId: CLIENT_ID }),
  });

  if (!res.ok) return NextResponse.json({ success: false }, { status: 401 });

  const json = await res.json();
  return NextResponse.json({ success: true, data: { accessToken: json.data.accessToken } });
}
