import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_URL  = (process.env.NEXT_PUBLIC_AUTH_URL  ?? 'https://auth-saas.royalda.com/api/v1').trim();
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
  if (!json.success) return NextResponse.json({ success: false }, { status: 401 });

  const { accessToken, refreshToken: newRefreshToken } = json.data;

  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ success: true, data: { accessToken } });

  // Rotate the refresh cookie with the new token from auth-saas
  if (newRefreshToken) {
    response.cookies.set('ll_refresh', newRefreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60, // 7 days — matches auth-saas TTL
      secure: isProduction,
    });
  }

  return response;
}
