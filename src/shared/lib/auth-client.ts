import { AUTH_CLIENT_ID } from "@/shared/config";

// Tokens are namespaced to prevent collision with other apps on the same domain.
const TOKEN_KEY   = "ll_token";
const REFRESH_KEY = "ll_refresh";

// ─── Storage ─────────────────────────────────────────────

export function storeTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Refresh mutex ────────────────────────────────────────
// Prevents multiple concurrent 401s from each firing a refresh.

let _refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res  = await fetch("/proxy/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken, clientId: AUTH_CLIENT_ID }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        window.dispatchEvent(new Event("auth:expired"));
        clearTokens();
        return null;
      }
      const { accessToken, refreshToken: newRefresh } = json.data;
      storeTokens(accessToken, newRefresh ?? refreshToken);
      return accessToken as string;
    } catch {
      window.dispatchEvent(new Event("auth:expired"));
      clearTokens();
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
  if (!headers.has("Content-Type") && options.method !== "GET")
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      return fetch(url, { ...options, headers });
    }
  }

  return res;
}
