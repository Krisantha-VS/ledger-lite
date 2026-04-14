"use client";

import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDashboardSummary, useNetWorth } from "@/features/summary/hooks/useSummary";
import { formatCurrency } from "@/shared/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiCards() {
  const router = useRouter();
  const { summary, loading }           = useDashboardSummary();
  const { data: netWorthData, loading: nwLoading } = useNetWorth();

  if (loading || nwLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  const cards = [
    {
      label: "Net Worth",
      value: formatCurrency(netWorthData?.netWorth ?? 0),
      icon: Landmark,
      color: "hsl(var(--ll-accent))",
      bg: "hsl(var(--ll-accent) / 0.10)",
    },
    {
      label: "Income",
      value: formatCurrency(summary?.monthIncome ?? 0),
      icon: TrendingUp,
      color: "hsl(var(--ll-income))",
      bg: "hsl(var(--ll-income) / 0.08)",
    },
    {
      label: "Expenses",
      value: formatCurrency(summary?.monthExpenses ?? 0),
      icon: TrendingDown,
      color: "hsl(var(--ll-expense))",
      bg: "hsl(var(--ll-expense) / 0.08)",
    },
    {
      label: "Net",
      value: formatCurrency(summary?.monthNet ?? 0),
      icon: DollarSign,
      color: (summary?.monthNet ?? 0) >= 0 ? "hsl(var(--ll-income))" : "hsl(var(--ll-expense))",
      bg: "hsl(var(--ll-accent) / 0.08)",
    },
    {
      label: "Budgets Over",
      value: String(summary?.budgetsOverLimit ?? 0),
      icon: AlertTriangle,
      color: (summary?.budgetsOverLimit ?? 0) > 0 ? "hsl(var(--ll-expense))" : "hsl(var(--ll-income))",
      bg: (summary?.budgetsOverLimit ?? 0) > 0 ? "hsl(var(--ll-expense) / 0.08)" : "hsl(var(--ll-income) / 0.08)",
    },
  ];

  const [hero, ...rest] = cards;

  return (
    <div className="space-y-3">
      {/* Row 1: Net Worth hero + Income + Expenses */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="ll-card col-span-2 flex items-center gap-4 overflow-hidden p-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: hero.bg }}>
            <hero.icon className="h-5 w-5" style={{ color: hero.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium" style={{ color: "hsl(var(--ll-text-muted))" }}>{hero.label}</p>
            <p className="ll-mono text-2xl font-bold tracking-tight" title={hero.value} style={{ color: hero.color }}>{hero.value}</p>
          </div>
        </div>
        {rest.slice(0, 2).map(c => (
          <div key={c.label} className="ll-card flex items-center gap-3 overflow-hidden p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: c.bg }}>
              <c.icon className="h-4 w-4" style={{ color: c.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium" style={{ color: "hsl(var(--ll-text-muted))" }}>{c.label}</p>
              <p className="ll-mono truncate text-xs font-bold" title={c.value} style={{ color: c.color }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Row 2: Net + Budgets Over */}
      <div className="grid grid-cols-2 gap-3">
        {rest.slice(2).map(c => {
          const isBudgetsOver = c.label === "Budgets Over";
          return (
            <div
              key={c.label}
              className={`ll-card flex items-center gap-3 overflow-hidden p-4${isBudgetsOver ? " cursor-pointer hover:ring-1 hover:ring-[hsl(var(--ll-border))]" : ""}`}
              onClick={isBudgetsOver ? () => router.push("/budgets") : undefined}
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: c.bg }}>
                <c.icon className="h-4 w-4" style={{ color: c.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium" style={{ color: "hsl(var(--ll-text-muted))" }}>{c.label}</p>
                <p className="ll-mono truncate text-xs font-bold" title={c.value} style={{ color: c.color }}>{c.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
