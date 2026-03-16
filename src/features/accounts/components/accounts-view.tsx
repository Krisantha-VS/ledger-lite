"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { AccountCard } from "./account-card";
import { AccountModal } from "./account-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Account } from "@/shared/types";

export function AccountsView() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Account | null>(null);

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
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
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
          {accounts.map(a => (
            <AccountCard
              key={a.id}
              account={a}
              onEdit={openEdit}
              onDelete={deleteAccount}
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
