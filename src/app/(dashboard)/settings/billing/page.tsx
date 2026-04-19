"use client"

import { useState } from "react"
import { CreditCard, AlertTriangle, Sparkles, CalendarX, Zap, X } from "lucide-react"
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

const STATUS_INDICATOR: Record<string, { label: string; dot: string }> = {
  active:    { label: "Active",    dot: "hsl(142 71% 45%)" },
  past_due:  { label: "Past Due",  dot: "hsl(38 92% 50%)"  },
  cancelled: { label: "Cancelled", dot: "hsl(var(--ll-expense))" },
  canceled:  { label: "Cancelled", dot: "hsl(var(--ll-expense))" },
}

const UPGRADE_PLANS = [
  { plan: "lite", billing: "monthly", label: "Lite", price: "$9",  cadence: "/month", note: "Billed monthly"              },
  { plan: "lite", billing: "annual",  label: "Lite", price: "$7",  cadence: "/month", note: "Billed $84/year · save 22%" },
  { plan: "pro",  billing: "monthly", label: "Pro",  price: "$19", cadence: "/month", note: "Billed monthly"              },
  { plan: "pro",  billing: "annual",  label: "Pro",  price: "$15", cadence: "/month", note: "Billed $180/year · save 21%"},
]

export default function BillingPage() {
  const { data, isLoading } = useBilling()
  const invalidate = useInvalidateBilling()
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const [cancelled, setCancelled] = useState(false)

  const plan       = data?.plan ?? "free"
  const badge      = PLAN_BADGE[plan] ?? PLAN_BADGE.free
  const statusInfo = data ? (STATUS_INDICATOR[data.status] ?? { label: data.status, dot: "hsl(var(--ll-text-muted))" }) : null
  const canCancel  = !!data && plan !== "free" && data.status === "active" && !cancelled

  async function handleCancel(immediately = false) {
    const msg = immediately
      ? "Cancel immediately? Your plan will revert to Free right now."
      : "Cancel at period end? You will keep access until your billing period ends."
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
    <div className="mx-auto max-w-lg space-y-6">

      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5" style={{ color: "hsl(var(--ll-accent))" }} />
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Billing</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Your subscription and billing details</p>
        </div>
      </div>

      {!isLoading && data?.inGracePeriod && (
        <div className="flex items-start gap-3 rounded-lg p-4"
          style={{ background: "hsl(38 92% 50% / 0.1)", border: "1px solid hsl(38 92% 50% / 0.35)" }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(38 92% 50%)" }} />
          <p className="text-sm" style={{ color: "hsl(38 92% 60%)" }}>
            <span className="font-semibold">Payment failed</span> — your access continues until{" "}
            <span className="font-medium">{formatDate(data.gracePeriodEndsAt)}</span>. Please update your payment method.
          </p>
        </div>
      )}

      {!isLoading && (data?.cancelAtPeriodEnd || cancelled) && !data?.inGracePeriod && (
        <div className="flex items-start gap-3 rounded-lg p-4"
          style={{ background: "hsl(var(--ll-expense) / 0.08)", border: "1px solid hsl(var(--ll-expense) / 0.25)" }}>
          <CalendarX className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(var(--ll-expense))" }} />
          <p className="text-sm" style={{ color: "hsl(var(--ll-expense))" }}>
            Your subscription will end on{" "}
            <span className="font-medium">{formatDate(data?.currentPeriodEnd ?? null)}</span>.
          </p>
        </div>
      )}

      <div className="ll-card p-5">
        <h2 className="mb-4 text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Current plan</h2>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
              {canCancel && (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCancel(true)} disabled={cancelling}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ color: "hsl(var(--ll-expense))", border: "1px solid hsl(var(--ll-expense) / 0.4)" }}>
                    <X className="h-3 w-3" />
                    {cancelling ? "Cancelling..." : "Cancel now"}
                  </button>
                  {!data?.cancelAtPeriodEnd && (
                    <button onClick={() => handleCancel(false)} disabled={cancelling}
                      className="text-xs transition-opacity hover:opacity-70 disabled:opacity-50"
                      style={{ color: "hsl(var(--ll-text-muted))" }}>
                      at period end
                    </button>
                  )}
                </div>
              )}
            </div>

            {cancelError && (
              <p className="text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{cancelError}</p>
            )}

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--ll-text-muted))" }}>Billing</dt>
                <dd className="mt-0.5 text-sm capitalize" style={{ color: "hsl(var(--ll-text-primary))" }}>{data?.billing ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--ll-text-muted))" }}>Status</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-sm" style={{ color: "hsl(var(--ll-text-primary))" }}>
                  {statusInfo && <span className="inline-block h-2 w-2 rounded-full" style={{ background: statusInfo.dot }} />}
                  {statusInfo?.label ?? "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  {data?.cancelAtPeriodEnd ? "Ends on" : "Renews on"}
                </dt>
                <dd className="mt-0.5 text-sm" style={{ color: "hsl(var(--ll-text-primary))" }}>
                  {formatDate(data?.currentPeriodEnd ?? null)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {!isLoading && plan === "free" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
            <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Upgrade your plan</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {UPGRADE_PLANS.map(({ plan: p, billing, label, price, cadence, note }) => (
              <button key={`${p}-${billing}`} onClick={() => startCheckout(p, billing)}
                className="ll-card flex flex-col items-start gap-1.5 p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ border: p === "pro" ? "1px solid hsl(var(--ll-accent) / 0.4)" : undefined }}>
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: p === "pro" ? "hsl(270 80% 68%)" : "hsl(239 84% 70%)" }}>
                    {label}
                  </span>
                  {billing === "annual" && (
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 45%)" }}>
                      SAVE
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold" style={{ color: "hsl(var(--ll-text-primary))" }}>{price}</span>
                  <span className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>{cadence}</span>
                </div>
                <p className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>{note}</p>
                <div className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ background: "hsl(var(--ll-accent))" }}>
                  <Zap className="h-3 w-3" />
                  Choose {label} {billing === "annual" ? "Annual" : "Monthly"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
