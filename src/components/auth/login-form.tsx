"use client";

import { Wallet, Lock } from "lucide-react";

export function LoginForm() {
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

          <a
            href="/api/auth/login-start"
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-all duration-150 active:scale-[0.98]"
            style={{ background: "hsl(var(--ll-accent))" }}
          >
            Continue with AuthSaas
          </a>

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
