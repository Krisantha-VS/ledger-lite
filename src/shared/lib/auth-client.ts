// Access token lives in sessionStorage. Refresh token lives in an httpOnly
// cookie (path=/api/auth/refresh) — never accessible to JS.

const TOKEN_KEY = 'll_token';

// ─── Storage ─────────────────────────────────────────────

export function storeTokens(access: string) {
  sessionStorage.setItem(TOKEN_KEY, access);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearTokens(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
}

// Consume the short-lived _at_init cookie set by the OAuth callback.
// Called once on app init — reads, stores, then immediately clears the cookie.
export function consumeInitToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )ll_at_init=([^;]*)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  document.cookie = 'll_at_init=; Path=/; Max-Age=0';
  return token;
}

// ─── Refresh mutex ────────────────────────────────────────

let _refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (res.status === 401 || res.status === 403) {
        window.dispatchEvent(new Event('auth:expired'));
        clearTokens();
        return null;
      }
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.success) {
        window.dispatchEvent(new Event('auth:expired'));
        clearTokens();
        return null;
      }
      storeTokens(json.data.accessToken);
      return json.data.accessToken as string;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── authFetch ────────────────────────────────────────────

export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type') && options.method !== 'GET')
    headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...options, headers });
    }
  }

  return res;
}
