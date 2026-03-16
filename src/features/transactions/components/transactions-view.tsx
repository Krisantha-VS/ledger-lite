"use client";

import { useState } from "react";
import { Plus, ArrowRightLeft } from "lucide-react";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { TransactionRow } from "./transaction-row";
import { TransactionModal } from "./transaction-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useKeyboardShortcuts } from "@/features/keyboard/useKeyboardShortcuts";

const TYPES = ["all", "income", "expense", "transfer"];

export function TransactionsView() {
  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useKeyboardShortcuts({ onNewTransaction: () => setModalOpen(true) });

  const { transactions, total, loading, createTransaction, deleteTransaction } = useTransactions({
    page, perPage: 20, type: filter || undefined,
  });

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Transactions</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>{total} total</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-all active:scale-95"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-1">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => { setFilter(t === "all" ? "" : t); setPage(1); }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all"
            style={{
              background: (filter === t || (t === "all" && !filter)) ? "hsl(var(--ll-accent))" : "hsl(var(--ll-bg-surface))",
              color: (filter === t || (t === "all" && !filter)) ? "#fff" : "hsl(var(--ll-text-muted))",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="ll-card overflow-hidden">
        <div className="divide-y" style={{ borderColor: "hsl(var(--ll-border))" }}>
          {loading
            ? [...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))
            : transactions.length === 0
              ? <EmptyState icon={ArrowRightLeft} title="No transactions" description="Add your first transaction" />
              : transactions.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} onDelete={deleteTransaction} />
                ))
          }
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "hsl(var(--ll-border))" }}>
            <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded px-2 py-1 text-xs disabled:opacity-30"
                style={{ color: "hsl(var(--ll-text-muted))" }}
              >
                ‹ Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded px-2 py-1 text-xs disabled:opacity-30"
                style={{ color: "hsl(var(--ll-text-muted))" }}
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async (p) => { await createTransaction(p); }}
      />
    </div>
  );
}
