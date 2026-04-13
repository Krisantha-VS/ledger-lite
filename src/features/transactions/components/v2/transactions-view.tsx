"use client";

import { useState } from "react";
import { Plus, ArrowRightLeft, Search, Filter, Download, ChevronLeft, ChevronRight, MoreHorizontal, Calendar, Tag, CreditCard } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { TransactionModal } from "../transaction-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import type { Transaction, TransactionType } from "@/shared/types";

const TYPES: { label: string; value: string }[] = [
  { label: "All Activity", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expenses", value: "expense" },
  { label: "Transfers", value: "transfer" },
];

export function TransactionsViewV2() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const { transactions, total, loading, createTransaction, updateTransaction, deleteTransaction } = useTransactions({
    page, perPage: 15, type: filter === "all" ? undefined : filter,
  });

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--v2-text-primary))]">Ledger Activity</h1>
          <p className="text-xs text-[hsl(var(--v2-text-muted))] mt-1">
            Detailed audit trail of all financial movements across your accounts.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="flex h-9 items-center gap-2 rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] px-3 text-xs font-semibold text-[hsl(var(--v2-text-primary))] hover:bg-[hsl(var(--v2-bg))] transition-colors shadow-sm">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
           <button
            onClick={() => setShowCreate(true)}
            className="flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--v2-accent))] px-4 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="v2-card flex flex-col divide-y md:flex-row md:divide-y-0 md:divide-x overflow-hidden">
         <div className="flex-1 flex items-center bg-[hsl(var(--v2-bg))] p-1">
            {TYPES.map(t => (
               <button
                  key={t.value}
                  onClick={() => { setFilter(t.value); setPage(1); }}
                  className={cn(
                    "flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm",
                    filter === t.value ? "bg-[hsl(var(--v2-surface))] text-[hsl(var(--v2-accent))] shadow-sm" : "text-[hsl(var(--v2-text-muted))] hover:text-[hsl(var(--v2-text-primary))]"
                  )}
               >
                  {t.label}
               </button>
            ))}
         </div>
         <div className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--v2-surface))]">
            <Filter className="h-3.5 w-3.5 text-[hsl(var(--v2-text-muted))]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Advanced Filters</span>
         </div>
         <div className="relative flex-1 bg-[hsl(var(--v2-surface))]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--v2-text-muted))]" />
            <input 
              type="text" 
              placeholder="Filter by note, category..." 
              className="w-full h-full bg-transparent pl-9 pr-4 text-xs text-[hsl(var(--v2-text-primary))] outline-none py-3"
            />
         </div>
      </div>

      {/* Table */}
      <div className="v2-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-[hsl(var(--v2-bg))] text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--v2-text-muted))]">
              <th className="px-6 py-4 font-bold">Date</th>
              <th className="px-6 py-4 font-bold">Transaction Details</th>
              <th className="px-6 py-4 font-bold">Category</th>
              <th className="px-6 py-4 font-bold">Account</th>
              <th className="px-6 py-4 font-bold text-right">Amount</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--v2-border))]">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i}>
                   <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                   <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                   <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                   <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                   <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                   <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
               <tr>
                  <td colSpan={6} className="py-20">
                     <EmptyState icon={ArrowRightLeft} title="No entries found" description="Try adjusting your filters or add a new transaction manually." />
                  </td>
               </tr>
            ) : (
              transactions.map(tx => (
                <TransactionRowV2 key={tx.id} tx={tx} onEdit={setEditTx} onDelete={deleteTransaction} />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-[hsl(var(--v2-bg)/0.5)] px-6 py-4" style={{ borderColor: "hsl(var(--v2-border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">
              Showing {Math.min(transactions.length, 15)} of {total} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] text-[hsl(var(--v2-text-muted))] hover:text-[hsl(var(--v2-text-primary))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center px-3">
                 <span className="text-[10px] font-bold text-[hsl(var(--v2-text-primary))]">{page}</span>
                 <span className="text-[10px] font-bold text-[hsl(var(--v2-text-muted))] mx-1">/</span>
                 <span className="text-[10px] font-bold text-[hsl(var(--v2-text-muted))]">{totalPages}</span>
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] text-[hsl(var(--v2-text-muted))] hover:text-[hsl(var(--v2-text-primary))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
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
          if (editTx) await updateTransaction({ id: editTx.id, data: p });
          else await createTransaction(p);
          setEditTx(null); setShowCreate(false);
        }}
      />
    </div>
  );
}

function TransactionRowV2({ tx, onEdit }: { tx: Transaction; onEdit: (tx: Transaction) => void; onDelete: (id: number) => void }) {
  const typeColor: Record<TransactionType, string> = {
    income:   "text-emerald-600",
    expense:  "text-rose-600",
    transfer: "text-[hsl(var(--v2-accent))]",
  };
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "";

  return (
    <tr className="hover:bg-[hsl(var(--v2-bg))] transition-colors group">
      <td className="px-6 py-4 whitespace-nowrap">
         <div className="flex flex-col">
            <span className="text-xs font-bold text-[hsl(var(--v2-text-primary))]">{formatDate(tx.date, "short")}</span>
            <span className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase">{new Date(tx.date).getFullYear()}</span>
         </div>
      </td>
      <td className="px-6 py-4">
         <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] text-sm shadow-sm">
               <CategoryIcon icon={tx.categoryIcon ?? "💸"} size={14} />
            </div>
            <div className="min-w-0">
               <p className="truncate text-xs font-bold text-[hsl(var(--v2-text-primary))]">{tx.note ?? tx.categoryName ?? "Transaction"}</p>
               <div className="flex items-center gap-1">
                  <span className={cn("text-[9px] font-bold uppercase px-1 rounded-sm bg-opacity-10", 
                    tx.type === 'income' ? 'bg-emerald-500 text-emerald-600' : 
                    tx.type === 'expense' ? 'bg-rose-500 text-rose-600' : 
                    'bg-blue-500 text-blue-600'
                  )}>
                    {tx.type}
                  </span>
                  {tx.isRecurring && <Calendar className="h-2.5 w-2.5 text-[hsl(var(--v2-accent))]" />}
               </div>
            </div>
         </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
         <div className="flex items-center gap-2">
            <Tag className="h-3 w-3 text-[hsl(var(--v2-text-muted))]" />
            <span className="text-xs font-medium text-[hsl(var(--v2-text-secondary))]">{tx.categoryName}</span>
         </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
         <div className="flex items-center gap-2">
            <CreditCard className="h-3 w-3 text-[hsl(var(--v2-text-muted))]" />
            <span className="text-xs font-medium text-[hsl(var(--v2-text-secondary))]">{tx.accountName}</span>
         </div>
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap">
         <span className={cn("text-xs font-bold tracking-tight", typeColor[tx.type])}>
            {sign}{formatCurrency(tx.amount)}
         </span>
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap">
         <button onClick={() => onEdit(tx)} className="p-1.5 rounded-md text-[hsl(var(--v2-text-muted))] hover:bg-[hsl(var(--v2-bg))] hover:text-[hsl(var(--v2-accent))] transition-all opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
         </button>
      </td>
    </tr>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
