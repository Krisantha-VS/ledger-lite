"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, ArrowRightLeft, Search, CalendarRange, X, ChevronDown, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { useRangeSummary } from "@/features/summary/hooks/useSummary";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { TransactionRow } from "./transaction-row";
import { TransactionModal } from "./transaction-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useKeyboardShortcuts } from "@/features/keyboard/useKeyboardShortcuts";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import type { Transaction } from "@/shared/types";

const TYPES = ["all", "income", "expense", "transfer"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function firstOfMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function groupByDate(transactions: Transaction[]): { date: string; rows: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const d = tx.date.slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(tx);
  }
  return Array.from(map.entries()).map(([date, rows]) => ({ date, rows }));
}

function formatGroupDate(iso: string): string {
  const d    = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.getTime() === today.getTime())     return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

export function TransactionsView() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const urlAccountId = searchParams.get("accountId") ? Number(searchParams.get("accountId")) : undefined;

  const [page,   setPage]   = useState(1);
  const [filter, setFilter] = useState(() => searchParams.get("type") ?? "");
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("search") ?? "");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo,   setDateTo]       = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editTx,    setEditTx]      = useState<Transaction | null>(null);

  const { categories } = useCategories();

  const hasDateRange = !!(dateFrom && dateTo);

  // Sync debouncedSearch after 300ms
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
    page, perPage: 20,
    type:       filter || undefined,
    search:     debouncedSearch || undefined,
    accountId:  urlAccountId,
    categoryId: categoryId,
    dateFrom:   dateFrom || undefined,
    dateTo:     dateTo   || undefined,
  });

  // Period summary for date range
  const { data: rangeSummary, loading: rangeLoading } = useRangeSummary(
    hasDateRange ? dateFrom : undefined,
    hasDateRange ? dateTo   : undefined,
  );

  const totalPages = Math.ceil(total / 20);
  const groups     = useMemo(() => groupByDate(transactions), [transactions]);

  const clearDateRange = () => { setDateFrom(""); setDateTo(""); setShowDatePicker(false); setPage(1); };

  const applyQuickRange = (days: number) => {
    const to   = todayISO();
    const from = new Date(new Date().setDate(new Date().getDate() - days + 1)).toISOString().slice(0, 10);
    setDateFrom(from); setDateTo(to); setPage(1); setShowDatePicker(false);
  };
  const applyThisMonth = () => {
    setDateFrom(firstOfMonthISO()); setDateTo(todayISO()); setPage(1); setShowDatePicker(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Transactions</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>{total} total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {/* Period summary tiles — shown only when date range active */}
      {hasDateRange && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Income",   value: rangeSummary?.income   ?? 0, color: "hsl(var(--ll-income))",  icon: TrendingUp },
            { label: "Spending", value: rangeSummary?.expenses ?? 0, color: "hsl(var(--ll-expense))", icon: TrendingDown },
            { label: "Net",      value: rangeSummary?.net      ?? 0, color: (rangeSummary?.net ?? 0) >= 0 ? "hsl(var(--ll-income))" : "hsl(var(--ll-expense))", icon: Wallet },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="ll-card p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" style={{ color }} />
                <span className="text-[10px] font-medium" style={{ color: "hsl(var(--ll-text-muted))" }}>{label}</span>
              </div>
              {rangeLoading ? (
                <div className="h-4 w-20 rounded animate-pulse" style={{ background: "hsl(var(--ll-border))" }} />
              ) : (
                <span className="ll-mono text-sm font-bold" style={{ color }}>{formatCurrency(Math.abs(value))}</span>
              )}
            </div>
          ))}
        </div>
      )}

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
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type chips */}
        <div className="flex gap-1">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => {
                const newFilter = t === "all" ? "" : t;
                setFilter(newFilter); setPage(1);
                const params = new URLSearchParams();
                if (searchParams.get("accountId")) params.set("accountId", searchParams.get("accountId")!);
                if (newFilter) params.set("type", newFilter);
                if (search) params.set("search", search);
                router.replace("/transactions?" + params.toString());
              }}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all"
              style={{
                background: (filter === t || (t === "all" && !filter)) ? "hsl(var(--ll-accent))" : "hsl(var(--ll-bg-surface))",
                color:      (filter === t || (t === "all" && !filter)) ? "hsl(var(--ll-accent-fg))" : "hsl(var(--ll-text-muted))",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          className="ll-input h-8 py-0 text-xs"
          value={categoryId ?? ""}
          onChange={e => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          style={{ minWidth: 120 }}
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        {/* Date range button */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(p => !p)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors"
            style={{
              background:   hasDateRange ? "hsl(var(--ll-accent)/0.1)" : "hsl(var(--ll-bg-surface))",
              color:        hasDateRange ? "hsl(var(--ll-accent))"      : "hsl(var(--ll-text-muted))",
              borderColor:  hasDateRange ? "hsl(var(--ll-accent)/0.4)"  : "hsl(var(--ll-border))",
            }}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            {hasDateRange ? `${dateFrom} – ${dateTo}` : "Date range"}
            <ChevronDown className="h-3 w-3" />
          </button>

          {showDatePicker && (
            <div className="absolute left-0 mt-1 z-20 rounded-xl shadow-lg p-4 space-y-3 w-72"
              style={{ background: "hsl(var(--ll-bg-elevated))", border: "1px solid hsl(var(--ll-border))" }}>
              {/* Quick ranges */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "This month", fn: applyThisMonth },
                  { label: "Last 7d",    fn: () => applyQuickRange(7) },
                  { label: "Last 30d",   fn: () => applyQuickRange(30) },
                  { label: "Last 90d",   fn: () => applyQuickRange(90) },
                ].map(q => (
                  <button key={q.label} onClick={q.fn}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors hover:bg-white/5"
                    style={{ borderColor: "hsl(var(--ll-border))", color: "hsl(var(--ll-text-secondary))" }}>
                    {q.label}
                  </button>
                ))}
              </div>
              {/* Custom inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] mb-0.5 block" style={{ color: "hsl(var(--ll-text-muted))" }}>From</label>
                  <input type="date" className="ll-input text-xs" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
                </div>
                <div>
                  <label className="text-[10px] mb-0.5 block" style={{ color: "hsl(var(--ll-text-muted))" }}>To</label>
                  <input type="date" className="ll-input text-xs" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <button onClick={clearDateRange} className="text-[11px] hover:underline" style={{ color: "hsl(var(--ll-text-muted))" }}>Clear</button>
                <button onClick={() => setShowDatePicker(false)}
                  className="rounded-lg px-3 py-1 text-xs font-medium text-white"
                  style={{ background: "hsl(var(--ll-accent))" }}>Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Clear date chip */}
        {hasDateRange && (
          <button onClick={clearDateRange} className="flex items-center gap-1 text-[11px] hover:underline" style={{ color: "hsl(var(--ll-text-muted))" }}>
            <X className="h-3 w-3" /> Clear range
          </button>
        )}
      </div>

      {/* Account filter banner */}
      {urlAccountId && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: "hsl(var(--ll-accent)/0.1)", color: "hsl(var(--ll-accent))" }}>
          <span>Filtered by account</span>
          <button onClick={() => router.push('/transactions')} className="ml-auto font-medium hover:underline">Clear ✕</button>
        </div>
      )}

      <div className="ll-card overflow-hidden">
        {loading ? (
          <div className="divide-y" style={{ borderColor: "hsl(var(--ll-border))" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2 w-24" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState icon={ArrowRightLeft} title="No transactions" description="Add your first transaction" />
        ) : (
          <div className="divide-y" style={{ borderColor: "hsl(var(--ll-border))" }}>
            {groups.map(({ date, rows }) => (
              <div key={date}>
                {/* Date group header */}
                <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-1.5"
                  style={{ background: "hsl(var(--ll-bg-surface))", borderBottom: "1px solid hsl(var(--ll-border) / 0.5)" }}>
                  <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--ll-text-muted))" }}>
                    {formatGroupDate(date)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "hsl(var(--ll-border) / 0.4)" }} />
                  <span className="text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                    {rows.length} txn{rows.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {rows.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} onDelete={deleteTransaction} onEdit={setEditTx} />
                ))}
              </div>
            ))}
          </div>
        )}

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
