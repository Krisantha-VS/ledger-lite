"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, X } from "lucide-react"
import { useBilling, startCheckout } from "@/shared/hooks/useBilling"

export function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { data: billing, isLoading } = useBilling()

  if (isLoading || !billing || billing.plan !== "free" || dismissed) return null

  return (
    <div
      className="flex items-center gap-3 px-4 lg:px-6 shrink-0"
      style={{
        minHeight: "44px",
        background: "linear-gradient(90deg, hsl(var(--ll-accent) / 0.12) 0%, hsl(var(--ll-accent) / 0.06) 100%)",
        borderBottom: "1px solid hsl(var(--ll-accent) / 0.2)",
      }}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 hidden sm:block" style={{ color: "hsl(var(--ll-accent))" }} />

      <span className="text-xs flex-1 min-w-0" style={{ color: "hsl(var(--ll-text-muted))" }}>
        <span className="hidden sm:inline">You&apos;re on the Free plan — limited to 50 transactions</span>
        <span className="inline sm:hidden">Free plan · 50 transaction limit</span>
      </span>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => startCheckout("lite", "monthly")}
          className="rounded-md px-3 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          Upgrade $9/mo
        </button>
        <Link
          href="/settings/billing"
          className="hidden sm:inline text-[11px] font-medium transition-opacity hover:opacity-80"
          style={{ color: "hsl(var(--ll-accent))" }}
        >
          See plans →
        </Link>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="ml-1 rounded p-0.5 transition-opacity hover:opacity-70 shrink-0"
        style={{ color: "hsl(var(--ll-text-muted))" }}
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
