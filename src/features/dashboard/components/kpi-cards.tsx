"use client";

import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { useDashboardSummary } from "@/features/summary/hooks/useSummary";
import { formatCurrency } from "@/shared/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiCards() {
  const { summary, loading } = useDashboardSummary();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  const cards = [
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

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(c => (
        <div key={c.label} className="ll-card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: c.bg }}>
            <c.icon className="h-4 w-4" style={{ color: c.color }} />
          </div>
          <div>
            <p className="text-[11px] font-medium" style={{ color: "hsl(var(--ll-text-muted))" }}>{c.label}</p>
            <p className="ll-mono text-sm font-semibold" style={{ color: c.color }}>{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
