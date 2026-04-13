"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowRightLeft, Search } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { TransactionRow } from "./transaction-row";
import { TransactionModal } from "./transaction-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useKeyboardShortcuts } from "@/features/keyboard/useKeyboardShortcuts";
import type { Transaction } from "@/shared/types";

const TYPES = ["all", "income", "expense", "transfer"];

export function TransactionsView() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const urlAccountId = searchParams.get("accountId") ? Number(searchParams.get("accountId")) : undefined;

  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState(() => searchParams.get("type") ?? "");
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("search") ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const [editTx, setEditTx]         = useState<Transaction | null>(null);

  // Sync debouncedSearch to URL after 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      const params = new URLSearchParams();
      if (searchParams.get("accountId")) params.set("accountId", searchParams.get("accountId")!);
      if (filter) params.set("type", filter);
      if (search) params.set("search", search);
      router.replace("/transactions?" + params.toString());
    }, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useKeyboardShortcuts({ onNewTransaction: () => setShowCreate(true) });

  const { transactions, total, loading, createTransaction, updateTransaction, deleteTransaction } = useTransactions({
    page, perPage: 20, type: filter || undefined, search: debouncedSearch || undefined, accountId: urlAccountId,
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
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-all active:scale-95"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none" style={{ color: "hsl(var(--ll-text-muted))" }} />
        <input
          className="ll-input text-sm"
          style={{ paddingLeft: "2.25rem", paddingRight: "2rem" }}
          placeholder="Search by note, category or account…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        {search && (
          <button
            onClick={() => { setSearch(""); setPage(1); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 transition-colors hover:bg-white/10"
            style={{ color: "hsl(var(--ll-text-muted))" }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-1">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => {
              const newFilter = t === "all" ? "" : t;
              setFilter(newFilter);
              setPage(1);
              const params = new URLSearchParams();
              if (searchParams.get("accountId")) params.set("accountId", searchParams.get("accountId")!);
              if (newFilter) params.set("type", newFilter);
              if (search) params.set("search", search);
              router.replace("/transactions?" + params.toString());
            }}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all"
            style={{
              background: (filter === t || (t === "all" && !filter)) ? "hsl(var(--ll-accent))" : "hsl(var(--ll-bg-surface))",
              color: (filter === t || (t === "all" && !filter)) ? "#fff" : "hsl(var(--ll-text-muted))",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Account filter banner */}
      {urlAccountId && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: "hsl(var(--ll-accent)/0.1)", color: "hsl(var(--ll-accent))" }}>
          <span>Filtered by account</span>
          <button onClick={() => router.push('/transactions')} className="ml-auto font-medium hover:underline">Clear ✕</button>
        </div>
      )}

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
                  <TransactionRow key={tx.id} tx={tx} onDelete={deleteTransaction} onEdit={setEditTx} />
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
        open={!!editTx || showCreate}
        onClose={() => { setEditTx(null); setShowCreate(false); }}
        initial={editTx ?? undefined}
        onSave={async (p) => {
          if (editTx) {
            await updateTransaction({ id: editTx.id, data: p });
          } else {
            await createTransaction(p);
          }
        }}
      />
    </div>
  );
}
