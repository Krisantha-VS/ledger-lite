"use client";

import { useEffect, useState } from "react";
import { CreditCard, AlertTriangle, Sparkles, CalendarX } from "lucide-react";
import { authFetch } from "@/shared/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

interface BillingData {
  plan: "free" | "lite" | "pro";
  status: "active" | "past_due" | "cancelled" | string;
  billing: "monthly" | "annual" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  gracePeriodEndsAt: string | null;
  inGracePeriod: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const PLAN_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  free: {
    label: "Free",
    bg: "hsl(var(--ll-bg-base))",
    color: "hsl(var(--ll-text-muted))",
  },
  lite: {
    label: "Lite",
    bg: "hsl(239 84% 67% / 0.15)",
    color: "hsl(239 84% 70%)",
  },
  pro: {
    label: "Pro",
    bg: "hsl(270 80% 60% / 0.15)",
    color: "hsl(270 80% 68%)",
  },
};

const STATUS_INDICATOR: Record<string, { label: string; dot: string }> = {
  active:    { label: "Active",    dot: "hsl(142 71% 45%)" },
  past_due:  { label: "Past Due",  dot: "hsl(38 92% 50%)"  },
  cancelled: { label: "Cancelled", dot: "hsl(var(--ll-expense))" },
};

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/v1/billing")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const plan = data?.plan ?? "free";
  const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;
  const statusInfo = data ? (STATUS_INDICATOR[data.status] ?? { label: data.status, dot: "hsl(var(--ll-text-muted))" }) : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5" style={{ color: "hsl(var(--ll-accent))" }} />
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
            Billing
          </h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            Your subscription and billing details
          </p>
        </div>
      </div>

      {/* Grace period warning */}
      {!loading && data?.inGracePeriod && (
        <div
          className="flex items-start gap-3 rounded-lg p-4"
          style={{
            background: "hsl(38 92% 50% / 0.1)",
            border: "1px solid hsl(38 92% 50% / 0.35)",
          }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(38 92% 50%)" }} />
          <p className="text-sm" style={{ color: "hsl(38 92% 60%)" }}>
            <span className="font-semibold">Payment failed</span> — your access continues until{" "}
            <span className="font-medium">{formatDate(data.gracePeriodEndsAt)}</span>. Please update
            your payment method to avoid interruption.
          </p>
        </div>
      )}

      {/* Cancel at period end notice */}
      {!loading && data?.cancelAtPeriodEnd && !data?.inGracePeriod && (
        <div
          className="flex items-start gap-3 rounded-lg p-4"
          style={{
            background: "hsl(var(--ll-expense) / 0.08)",
            border: "1px solid hsl(var(--ll-expense) / 0.25)",
          }}
        >
          <CalendarX className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(var(--ll-expense))" }} />
          <p className="text-sm" style={{ color: "hsl(var(--ll-expense))" }}>
            Your subscription will end on{" "}
            <span className="font-medium">{formatDate(data.currentPeriodEnd)}</span>.
          </p>
        </div>
      )}

      {/* Plan card */}
      <div className="ll-card p-5">
        <h2 className="mb-4 text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Current plan
        </h2>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Plan badge + upgrade CTA */}
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{ background: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>

              {plan === "free" && (
                <a
                  href="/#pricing"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "hsl(var(--ll-accent))" }}
                >
                  <Sparkles className="h-3 w-3" />
                  Upgrade
                </a>
              )}
            </div>

            {/* Details grid */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  Billing
                </dt>
                <dd className="mt-0.5 text-sm capitalize" style={{ color: "hsl(var(--ll-text-primary))" }}>
                  {data?.billing ?? "—"}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  Status
                </dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-sm" style={{ color: "hsl(var(--ll-text-primary))" }}>
                  {statusInfo && (
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: statusInfo.dot }}
                    />
                  )}
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
    </div>
  );
}
