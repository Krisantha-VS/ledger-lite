"use client";

import { useState, memo } from "react";
import { Trash2, Pencil } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Transaction, TransactionType } from "@/shared/types";

const signColor: Record<TransactionType, string> = {
  income:   "hsl(var(--ll-income))",
  expense:  "hsl(var(--ll-expense))",
  transfer: "hsl(var(--ll-accent))",
};
const sign: Record<TransactionType, string> = { income: "+", expense: "-", transfer: "" };

export const TransactionRow = memo(function TransactionRow({
  tx,
  onDelete,
  onEdit,
}: {
  tx: Transaction;
  onDelete: (id: number) => void;
  onEdit: (tx: Transaction) => void;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm"
        style={{ background: "hsl(var(--ll-accent) / 0.08)" }}
      >
        <CategoryIcon icon={tx.categoryIcon ?? "💸"} size={14} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          {tx.note ?? tx.categoryName}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
            {formatDate(tx.date, "short")}
          </span>
          <Badge variant={tx.type}>{tx.type}</Badge>
          {tx.isRecurring && (
            <span className="rounded bg-white/5 px-1 text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
              recurring
            </span>
          )}
        </div>
      </div>

      <span className="ll-mono text-xs font-semibold" style={{ color: signColor[tx.type] }}>
        {sign[tx.type]}{formatCurrency(tx.amount)}
      </span>

      <button
        onClick={() => onEdit(tx)}
        className="ml-1 rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10"
        style={{ color: "hsl(var(--ll-text-muted))" }}
        aria-label="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => setConfirm(true)}
        className="rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10"
        style={{ color: "hsl(var(--ll-text-muted))" }}
        aria-label="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); onDelete(tx.id); }}
        title="Delete transaction?"
        description="This transaction will be permanently removed."
      />
    </div>
  );
});
