"use client";

import { useGoals } from "@/features/goals/hooks/useGoals";
import { formatCurrency } from "@/shared/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Plus } from "lucide-react";
import Link from "next/link";

export function GoalsProgressWidget() {
  const { goals, loading } = useGoals();

  const active = goals.filter(g => !g.isCompleted).slice(0, 4);

  if (loading) return <Skeleton className="h-56 rounded-xl" />;

  return (
    <div className="ll-card overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "hsl(var(--ll-border))" }}>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Goals</p>
        </div>
        <Link href="/goals" className="text-[11px] font-medium hover:underline" style={{ color: "hsl(var(--ll-accent))" }}>
          View all →
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Target className="h-8 w-8 opacity-20" style={{ color: "hsl(var(--ll-text-muted))" }} />
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>No active goals</p>
          <Link href="/goals"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: "hsl(var(--ll-accent))" }}>
            <Plus className="h-3 w-3" /> Add a goal
          </Link>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "hsl(var(--ll-border) / 0.5)" }}>
          {active.map(g => {
            const current = g.currentBalance ?? 0;
            const target  = Number(g.targetAmount);
            const pct     = Math.min(100, target > 0 ? (current / target) * 100 : 0);
            return (
              <div key={g.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: g.colour }} />
                    <p className="text-xs font-medium truncate" style={{ color: "hsl(var(--ll-text-primary))" }}>{g.name}</p>
                  </div>
                  <span className="text-xs font-semibold ll-mono shrink-0 ml-2" style={{ color: g.colour }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full mb-1" style={{ background: "hsl(var(--ll-border))" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: g.colour }} />
                </div>
                <p className="text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  {formatCurrency(current)} <span style={{ opacity: 0.6 }}>of {formatCurrency(target)}</span>
                  {current < target && <span style={{ color: g.colour }}> · {formatCurrency(target - current)} to go</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
