"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { AUTH_CLIENT_ID } from "@/shared/config";

export function RegisterForm() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res  = await fetch("/proxy/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: AUTH_CLIENT_ID, name, email, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Registration failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--ll-accent) / 0.08)", filter: "blur(120px)" }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="ll-glass p-8 shadow-2xl">
          <div className="mb-6 flex flex-col items-center gap-2">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: "hsl(var(--ll-accent) / 0.15)" }}
            >
              <BrandMark className="h-5 w-5" style={{ color: "hsl(var(--ll-accent))" }} />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: "hsl(var(--ll-text-primary))" }}>
                Create account
              </h1>
              <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                Start tracking your finances today.
              </p>
            </div>
          </div>

          {done ? (
            <div
              className="rounded-lg p-4 text-center text-sm"
              style={{ background: "hsl(var(--ll-income) / 0.1)", color: "hsl(var(--ll-income))" }}
            >
              Account created!{" "}
              <Link href="/login" style={{ textDecoration: "underline" }}>
                Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input
                type="text" placeholder="Full name" required
                value={name} onChange={e => setName(e.target.value)}
                className="ll-input"
              />
              <input
                type="email" placeholder="Email address" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="ll-input"
              />
              <input
                type="password" placeholder="Password (min 8 chars)" required minLength={8}
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
                  : "Create account"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "hsl(var(--ll-accent))" }}>
              Sign in
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
