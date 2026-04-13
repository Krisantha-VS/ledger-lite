"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { AccountCard } from "./account-card";
import { AccountModal } from "./account-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { accountTypeLabel } from "@/lib/account-types";
import type { Account } from "@/shared/types";

const ACCOUNT_TYPES = ["all", "checking", "savings", "cash", "credit", "investment"] as const;

export function AccountsView() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Account | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const router = useRouter();

  const filtered = typeFilter === "all" ? accounts : accounts.filter(a => a.type === typeFilter);

  const handleSave = async (payload: { name: string; type: string; startingBalance: number; colour: string }) => {
    if (editing) await updateAccount(editing.id, payload as Partial<Account>);
    else         await createAccount(payload);
  };

  const openEdit = (a: Account) => { setEditing(a); setModalOpen(true); };
  const openNew  = ()           => { setEditing(null); setModalOpen(true); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Accounts</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            {typeFilter !== "all"
              ? `${filtered.length} of ${accounts.length} account${accounts.length !== 1 ? "s" : ""}`
              : `${accounts.length} account${accounts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-all active:scale-95"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          <Plus className="h-3.5 w-3.5" />
          New Account
        </button>
      </div>

      {!loading && accounts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ACCOUNT_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-all"
              style={{
                background: typeFilter === t ? "hsl(var(--ll-accent))" : "hsl(var(--ll-bg-surface))",
                color: typeFilter === t ? "#fff" : "hsl(var(--ll-text-muted))",
              }}
            >{t === "all" ? "All" : accountTypeLabel(t)}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your first account to start tracking"
          action={
            <button
              onClick={openNew}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "hsl(var(--ll-accent))" }}
            >
              Add Account
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(a => (
            <AccountCard
              key={a.id}
              account={a}
              onEdit={openEdit}
              onDelete={deleteAccount}
              onViewTransactions={() => router.push('/transactions?accountId=' + a.id)}
            />
          ))}
        </div>
      )}

      <AccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editing}
      />
    </div>
  );
}
