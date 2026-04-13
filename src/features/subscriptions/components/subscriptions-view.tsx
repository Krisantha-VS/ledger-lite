"use client";

import { Repeat2, Calendar, TrendingUp } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { useSubscriptions } from "@/features/subscriptions/hooks/useSubscriptions";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/shared/lib/formatters";

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function SubscriptionsView() {
  const { subscriptions, totalMonthly, loading } = useSubscriptions();

  const totalAnnual = totalMonthly * 12;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Subscriptions</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Recurring payments tracked automatically</p>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && subscriptions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="ll-card p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "hsl(var(--ll-text-muted))" }}>Monthly Total</p>
            <p className="mt-1 text-xl font-bold ll-mono" style={{ color: "hsl(var(--ll-expense))" }}>
              {formatCurrency(totalMonthly)}
            </p>
          </div>
          <div className="ll-card p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "hsl(var(--ll-text-muted))" }}>Annual Total</p>
            <p className="mt-1 text-xl font-bold ll-mono" style={{ color: "hsl(var(--ll-text-primary))" }}>
              {formatCurrency(totalAnnual)}
            </p>
          </div>
          <div className="ll-card p-4 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "hsl(var(--ll-text-muted))" }}>Active Subscriptions</p>
            <p className="mt-1 text-xl font-bold" style={{ color: "hsl(var(--ll-text-primary))" }}>
              {subscriptions.length}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={Repeat2}
          title="No subscriptions detected"
          description="Mark transactions as recurring to track them here"
        />
      ) : (
        <div className="space-y-2">
          {subscriptions.map(sub => {
            const days = daysUntil(sub.nextDue);
            const isDueSoon = days !== null && days <= 7 && days >= 0;
            const isOverdue = days !== null && days < 0;

            return (
              <div key={sub.key} className="ll-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-base flex-shrink-0"
                      style={{ background: `${sub.categoryColour}22` }}
                    >
                      <CategoryIcon icon={sub.categoryIcon} size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                        {sub.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: "hsl(var(--ll-accent) / 0.1)",
                            color: "hsl(var(--ll-accent))",
                          }}
                        >
                          {sub.recurrence}
                        </span>
                        <span className="text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                          {sub.categoryName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold ll-mono" style={{ color: "hsl(var(--ll-expense))" }}>
                      {formatCurrency(sub.lastAmount)}
                    </p>
                    <p className="text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                      {formatCurrency(sub.monthlyEquivalent)}/mo
                    </p>
                  </div>
                </div>

                {sub.nextDue && (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 flex-shrink-0" style={{
                      color: isOverdue ? "hsl(var(--ll-expense))" : isDueSoon ? "#f59e0b" : "hsl(var(--ll-text-muted))"
                    }} />
                    <span className="text-[10px]" style={{
                      color: isOverdue ? "hsl(var(--ll-expense))" : isDueSoon ? "#f59e0b" : "hsl(var(--ll-text-muted))"
                    }}>
                      {isOverdue
                        ? `Overdue by ${Math.abs(days!)} day${Math.abs(days!) !== 1 ? "s" : ""}`
                        : days === 0
                          ? "Due today"
                          : isDueSoon
                            ? `Due in ${days} day${days !== 1 ? "s" : ""}`
                            : `Next: ${new Date(sub.nextDue).toLocaleDateString()}`
                      }
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && subscriptions.length > 0 && (
        <div className="ll-card p-4 flex items-start gap-3">
          <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--ll-accent))" }} />
          <div>
            <p className="text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
              Subscription insight
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--ll-text-muted))" }}>
              Your subscriptions account for {formatCurrency(totalMonthly)}/mo. Review regularly to cancel unused services.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
