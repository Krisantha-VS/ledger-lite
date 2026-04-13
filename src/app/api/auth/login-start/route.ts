import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const AUTH_URL  = (process.env.NEXT_PUBLIC_AUTH_URL  ?? 'https://auth-saas.royalda.com').trim();
const CLIENT_ID =  process.env.NEXT_PUBLIC_AUTH_CLIENT_ID ?? '';
const APP_URL   = (process.env.NEXT_PUBLIC_APP_URL   ?? 'http://localhost:3000').trim();

function generateVerifier() { return crypto.randomBytes(40).toString('base64url'); }
function deriveChallenge(v: string) { return crypto.createHash('sha256').update(v).digest('base64url'); }

export async function GET(_req: NextRequest) {
  const verifier    = generateVerifier();
  const challenge   = deriveChallenge(verifier);
  const state       = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${APP_URL}/api/auth/callback`;

  const url = new URL(`${AUTH_URL}/oauth/authorize`);
  url.searchParams.set('response_type',         'code');
  url.searchParams.set('client_id',             CLIENT_ID);
  url.searchParams.set('redirect_uri',          redirectUri);
  url.searchParams.set('code_challenge',        challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state',                 state);

  const res = NextResponse.redirect(url.toString());
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieBase = `Path=/; HttpOnly; SameSite=Lax; Max-Age=300${isProduction ? '; Secure' : ''}`;
  res.headers.append('Set-Cookie', `ll_oauth_verifier=${verifier}; ${cookieBase}`);
  res.headers.append('Set-Cookie', `ll_oauth_state=${state}; ${cookieBase}`);
  return res;
}
