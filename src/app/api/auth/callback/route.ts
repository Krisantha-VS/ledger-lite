import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_URL  = (process.env.NEXT_PUBLIC_AUTH_URL  ?? 'https://auth-saas.royalda.com').trim();
const CLIENT_ID =  process.env.NEXT_PUBLIC_AUTH_CLIENT_ID ?? '';
const APP_URL   = (process.env.NEXT_PUBLIC_APP_URL   ?? 'http://localhost:3000').trim();

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');

  const jar          = await cookies();
  const savedState   = jar.get('ll_oauth_state')?.value;
  const codeVerifier = jar.get('ll_oauth_verifier')?.value;

  if (!code || !state || state !== savedState || !codeVerifier) {
    return NextResponse.redirect(`${APP_URL}/login?auth_error=invalid_state`);
  }

  const tokenRes = await fetch(`${AUTH_URL}/oauth/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      grant_type:    'authorization_code',
      code,
      client_id:     CLIENT_ID,
      code_verifier: codeVerifier,
      redirect_uri:  `${APP_URL}/api/auth/callback`,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}/login?auth_error=token_exchange_failed`);
  }

  const { data } = await tokenRes.json();
  const { access_token, refresh_token } = data;

  const isProduction = process.env.NODE_ENV === 'production';
  const secure       = isProduction ? '; Secure' : '';

  const html = `<!DOCTYPE html><html><head>
    <meta http-equiv="refresh" content="0;url=${APP_URL}/dashboard">
    <title>Signing in...</title>
  </head><body></body></html>`;

  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

  res.headers.append('Set-Cookie',
    `ll_refresh=${refresh_token}; HttpOnly; SameSite=Lax; Path=/api/auth/refresh; Max-Age=604800${secure}`);
  res.headers.append('Set-Cookie',
    `ll_at_init=${encodeURIComponent(access_token)}; SameSite=Lax; Path=/; Max-Age=30${secure}`);
  res.headers.append('Set-Cookie', 'll_oauth_state=; Path=/; Max-Age=0');
  res.headers.append('Set-Cookie', 'll_oauth_verifier=; Path=/; Max-Age=0');

  return res;
}
