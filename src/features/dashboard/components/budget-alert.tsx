"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import Link from "next/link";

export function BudgetAlert() {
  const { budgets } = useBudgets();
  const [dismissed, setDismissed] = useState(false);

  const overLimit = budgets.filter(b => (b.spent ?? 0) > b.amount);

  if (dismissed || overLimit.length === 0) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-xl p-4"
      style={{
        background: "hsl(var(--ll-expense) / 0.08)",
        border: "1px solid hsl(var(--ll-expense) / 0.25)",
      }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-rose-400">
          {overLimit.length === 1
            ? `${overLimit[0].categoryName} is over budget`
            : `${overLimit.length} categories are over budget`}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
          {overLimit.map(b => b.categoryName).join(", ")}
          {" · "}
          <Link href="/budgets" className="underline underline-offset-2">Review budgets</Link>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="rounded p-0.5 transition-colors hover:bg-rose-500/10"
        aria-label="Dismiss"
        style={{ color: "hsl(var(--ll-text-muted))" }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
