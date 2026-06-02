"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, X, AlertTriangle } from "lucide-react"
import { useBilling, startCheckout, BillingData } from "@/shared/hooks/useBilling"

export function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { data: billing, isLoading } = useBilling()

  if (isLoading || !billing) return null

  const isCanceledWithAccess =
    billing.status === "canceled" &&
    billing.cancelAtPeriodEnd &&
    billing.currentPeriodEnd != null &&
    new Date(billing.currentPeriodEnd) > new Date()

  if (billing.plan === "free" && !dismissed) {
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

  if (isCanceledWithAccess) {
    const endDate = new Date(billing.currentPeriodEnd!).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const planLabel = billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)

    return (
      <div
        className="flex items-center gap-3 px-4 lg:px-6 shrink-0"
        style={{
          minHeight: "44px",
          background: "linear-gradient(90deg, hsl(38 92% 50% / 0.12) 0%, hsl(38 92% 50% / 0.06) 100%)",
          borderBottom: "1px solid hsl(38 92% 50% / 0.3)",
        }}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 hidden sm:block" style={{ color: "hsl(38 92% 50%)" }} />

        <span className="text-xs flex-1 min-w-0" style={{ color: "hsl(var(--ll-text-muted))" }}>
          <span className="hidden sm:inline">Your {planLabel} plan ends on {endDate} — renew to keep access</span>
          <span className="inline sm:hidden">{planLabel} ends {endDate}</span>
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/settings/billing"
            className="rounded-md px-3 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "hsl(38 92% 50%)" }}
          >
            Renew
          </Link>
        </div>
      </div>
    )
  }

  return null
}
