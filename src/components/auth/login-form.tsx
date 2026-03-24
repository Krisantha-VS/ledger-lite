"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, Lock } from "lucide-react";
import { AUTH_CLIENT_ID } from "@/shared/config";
import { storeTokens } from "@/shared/lib/auth-client";

export function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res  = await fetch("/proxy/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: AUTH_CLIENT_ID, email, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Login failed");
      const tokens = json.data.tokens ?? json.data;
      storeTokens(tokens.accessToken, tokens.refreshToken);
      // Hard redirect so the dashboard starts with a clean React tree
      // and tokens are guaranteed to be in localStorage before any
      // component mounts and reads them.
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--ll-accent) / 0.08)", filter: "blur(120px)" }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="ll-glass p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl ring-1"
              style={{
                background: "hsl(var(--ll-accent) / 0.15)",
                outline: "1px solid hsl(var(--ll-accent) / 0.3)",
              }}
            >
              <Wallet className="h-5 w-5" style={{ color: "hsl(var(--ll-accent))" }} />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: "hsl(var(--ll-text-primary))" }}>
                LedgerLite
              </h1>
              <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                Your finances, clearly.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email" placeholder="Email address" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              className="ll-input"
            />
            <input
              type="password" placeholder="Password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="ll-input"
            />

            {error && <p className="text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{error}</p>}

            <button
              type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "hsl(var(--ll-accent))" }}
            >
              {loading
                ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            No account?{" "}
            <Link href="/register" className="transition-colors hover:text-white" style={{ color: "hsl(var(--ll-accent))" }}>
              Create one
            </Link>
          </p>

          <div className="mt-5 flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" style={{ color: "hsl(var(--ll-text-muted))" }} />
            <span className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
              TLS encrypted · Secured by AuthSaas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
