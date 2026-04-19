"use client"

import { useState } from "react"
import { CreditCard, AlertTriangle, CalendarX, X, Check, Zap } from "lucide-react"
import { useBilling, useInvalidateBilling, startCheckout } from "@/shared/hooks/useBilling"
import { authFetch } from "@/shared/lib/auth-client"
import { Skeleton } from "@/components/ui/skeleton"

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
}

const PLAN_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  free: { label: "Free", bg: "hsl(var(--ll-bg-base))",  color: "hsl(var(--ll-text-muted))" },
  lite: { label: "Lite", bg: "hsl(239 84% 67% / 0.15)", color: "hsl(239 84% 70%)"          },
  pro:  { label: "Pro",  bg: "hsl(270 80% 60% / 0.15)", color: "hsl(270 80% 68%)"          },
}

const STATUS_DOT: Record<string, string> = {
  active:    "hsl(142 71% 45%)",
  past_due:  "hsl(38 92% 50%)",
  cancelled: "hsl(var(--ll-expense))",
  canceled:  "hsl(var(--ll-expense))",
}

const PLANS = {
  lite: {
    label: "Lite",
    color: "hsl(239 84% 70%)",
    monthly: { price: "$9",  annual: "$108" },
    annual:  { price: "$7",  annual: "$84", saving: "Save 22%" },
    features: ["3 accounts", "Unlimited transactions", "12 months history", "3 goals", "3 AI imports/mo"],
  },
  pro: {
    label: "Pro",
    color: "hsl(270 80% 68%)",
    monthly: { price: "$19", annual: "$228" },
    annual:  { price: "$15", annual: "$180", saving: "Save 21%" },
    features: ["Unlimited accounts", "Unlimited transactions", "Full history", "Unlimited goals", "Unlimited AI imports"],
  },
}

export default function BillingPage() {
  const { data, isLoading } = useBilling()
  const invalidate = useInvalidateBilling()
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const [cancelled, setCancelled] = useState(false)

  const plan       = data?.plan ?? "free"
  const badge      = PLAN_BADGE[plan] ?? PLAN_BADGE.free
  const statusDot  = data ? (STATUS_DOT[data.status] ?? "hsl(var(--ll-text-muted))") : null
  const statusLabel = data?.status === "past_due" ? "Past due" : data?.status ? (data.status.charAt(0).toUpperCase() + data.status.slice(1)) : "—"
  const canCancel  = !!data && plan !== "free" && data.status === "active" && !cancelled

  async function handleCancel(immediately = false) {
    const msg = immediately
      ? "Cancel immediately? Your plan reverts to Free right now."
      : "Cancel at period end? You keep access until your billing period ends."
    if (!confirm(msg)) return
    setCancelling(true)
    setCancelError("")
    try {
      const res  = await authFetch("/api/v1/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immediately }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Failed to cancel")
      setCancelled(true)
      invalidate()
    } catch (e: any) {
      setCancelError(e.message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5" style={{ color: "hsl(var(--ll-accent))" }} />
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Billing</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Manage your subscription</p>
        </div>
      </div>

      {/* Grace period warning */}
      {!isLoading && data?.inGracePeriod && (
        <div className="flex items-start gap-3 rounded-lg p-4"
          style={{ background: "hsl(38 92% 50% / 0.1)", border: "1px solid hsl(38 92% 50% / 0.35)" }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(38 92% 50%)" }} />
          <p className="text-sm" style={{ color: "hsl(38 92% 60%)" }}>
            <span className="font-semibold">Payment failed.</span> Access continues until{" "}
            <span className="font-medium">{formatDate(data.gracePeriodEndsAt)}</span>. Please update your payment method.
          </p>
        </div>
      )}

      {/* Cancel at period end notice */}
      {!isLoading && (data?.cancelAtPeriodEnd || cancelled) && !data?.inGracePeriod && (
        <div className="flex items-start gap-3 rounded-lg p-4"
          style={{ background: "hsl(var(--ll-expense) / 0.08)", border: "1px solid hsl(var(--ll-expense) / 0.25)" }}>
          <CalendarX className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(var(--ll-expense))" }} />
          <p className="text-sm" style={{ color: "hsl(var(--ll-expense))" }}>
            Subscription ends on <span className="font-medium">{formatDate(data?.currentPeriodEnd ?? null)}</span>.
          </p>
        </div>
      )}

      {/* Current plan */}
      <div className="ll-card p-5">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                  style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
                {statusDot && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                    <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: statusDot }} />
                    {statusLabel}
                  </span>
                )}
              </div>
              {plan !== "free" && data?.currentPeriodEnd && (
                <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  {data.cancelAtPeriodEnd ? "Ends" : "Renews"} {formatDate(data.currentPeriodEnd)}
                  {data.billing && <span className="ml-1 capitalize">· {data.billing}</span>}
                </p>
              )}
              {plan === "free" && (
                <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Limited features · upgrade to unlock more</p>
              )}
            </div>

            {canCancel && (
              <div className="flex flex-col items-end gap-1">
                <button onClick={() => handleCancel(true)} disabled={cancelling}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ color: "hsl(var(--ll-expense))", border: "1px solid hsl(var(--ll-expense) / 0.35)" }}>
                  <X className="h-3 w-3" />
                  {cancelling ? "Cancelling..." : "Cancel now"}
                </button>
                {!data?.cancelAtPeriodEnd && (
                  <button onClick={() => handleCancel(false)} disabled={cancelling}
                    className="text-[11px] underline underline-offset-2 transition-opacity hover:opacity-70 disabled:opacity-50"
                    style={{ color: "hsl(var(--ll-text-muted))" }}>
                    or cancel at period end
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {cancelError && <p className="mt-3 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{cancelError}</p>}
      </div>

      {/* Upgrade plans — free users only */}
      {!isLoading && plan === "free" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Choose a plan</h2>

            {/* Billing toggle */}
            <div className="flex items-center rounded-lg p-0.5 gap-0.5"
              style={{ background: "hsl(var(--ll-bg-base))", border: "1px solid hsl(var(--ll-border))" }}>
              {(["monthly", "annual"] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className="rounded-md px-3 py-1 text-xs font-medium capitalize transition-all"
                  style={billing === b
                    ? { background: "hsl(var(--ll-accent))", color: "#fff" }
                    : { color: "hsl(var(--ll-text-muted))" }}>
                  {b === "annual" ? "Annual · save ~22%" : "Monthly"}
                </button>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-2 gap-4">
            {(["lite", "pro"] as const).map(p => {
              const info    = PLANS[p]
              const pricing = billing === "annual" ? info.annual : info.monthly
              const isPro   = p === "pro"
              return (
                <div key={p} className="ll-card flex flex-col gap-4 p-5"
                  style={isPro ? { border: "1px solid hsl(var(--ll-accent) / 0.4)" } : {}}>
                  {/* Plan name + annual total */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: info.color }}>
                        {info.label}
                      </span>
                      {"saving" in pricing && (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 45%)" }}>
                          {(pricing as any).saving}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold" style={{ color: "hsl(var(--ll-text-primary))" }}>{pricing.price}</span>
                      <span className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>/mo</span>
                    </div>
                    <p className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                      {billing === "annual" ? `Billed ${pricing.annual}/year` : "Billed monthly"}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-1.5">
                    {info.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                        <Check className="h-3 w-3 shrink-0" style={{ color: "hsl(142 71% 45%)" }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button onClick={() => startCheckout(p, billing)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: isPro ? "hsl(var(--ll-accent))" : info.color }}>
                    <Zap className="h-3 w-3" />
                    Get {info.label}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
