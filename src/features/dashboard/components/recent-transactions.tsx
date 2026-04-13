"use client";

import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRightLeft } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { TransactionType } from "@/shared/types";

export function RecentTransactions() {
  const { transactions, loading } = useTransactions({ perPage: 8 });

  return (
    <div className="ll-card">
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "hsl(var(--ll-border))" }}>
        <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Recent Transactions
        </h2>
      </div>
      <div className="divide-y" style={{ borderColor: "hsl(var(--ll-border))" }}>
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))
          : transactions.length === 0
            ? <EmptyState icon={ArrowRightLeft} title="No transactions yet" />
            : transactions.map(tx => (
                <TransactionItem key={tx.id} tx={tx} />
              ))
        }
      </div>
    </div>
  );
}

function TransactionItem({ tx }: { tx: import("@/shared/types").Transaction }) {
  const typeColor: Record<TransactionType, string> = {
    income:   "hsl(var(--ll-income))",
    expense:  "hsl(var(--ll-expense))",
    transfer: "hsl(var(--ll-accent))",
  };
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm"
        style={{ background: "hsl(var(--ll-accent) / 0.08)" }}
      >
        <CategoryIcon icon={tx.categoryIcon ?? "💸"} size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          {tx.note ?? tx.categoryName ?? "Transaction"}
        </p>
        <p className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
          {formatDate(tx.date, "short")} · <Badge variant={tx.type}>{tx.type}</Badge>
        </p>
      </div>
      <span className="ll-mono text-xs font-semibold" style={{ color: typeColor[tx.type] }}>
        {sign}{formatCurrency(tx.amount)}
      </span>
    </div>
  );
}
