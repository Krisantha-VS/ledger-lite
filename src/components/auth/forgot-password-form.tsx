"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, Lock } from "lucide-react";
import { AUTH_BASE, AUTH_CLIENT_ID, APP_URL } from "@/shared/config";

export function ForgotPasswordForm() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${AUTH_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          clientId: AUTH_CLIENT_ID,
          redirectTo: `${APP_URL}/login`,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Request failed");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
                Forgot password?
              </h1>
              <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                {sent ? "Check your inbox" : "Enter your email to reset your password"}
              </p>
            </div>
          </div>

          {sent ? (
            <div className="space-y-4">
              <p className="text-center text-sm" style={{ color: "hsl(var(--ll-text-primary))" }}>
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium" style={{ color: "hsl(var(--ll-accent))" }}>{email}</span>.
                Check your email and follow the link to reset your password.
              </p>
              <p className="text-center text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="transition-colors hover:text-white"
                  style={{ color: "hsl(var(--ll-accent))" }}
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email" placeholder="Email address" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
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
                  : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            <Link href="/login" className="transition-colors hover:text-white" style={{ color: "hsl(var(--ll-accent))" }}>
              Back to login
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
