"use client";

import { useState } from "react";
import { Plus, Wallet, MoreVertical, ArrowUpRight, ArrowDownRight, LayoutGrid, List } from "lucide-react";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { AccountModal } from "../account-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/shared/lib/formatters";
import type { Account } from "@/shared/types";

export function AccountsViewV2() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const handleSave = async (payload: { name: string; type: string; startingBalance: number; colour: string }) => {
    if (editing) await updateAccount(editing.id, payload as Partial<Account>);
    else await createAccount(payload);
    setModalOpen(false);
  };

  const openEdit = (a: Account) => { setEditing(a); setModalOpen(true); };
  const openNew = () => { setEditing(null); setModalOpen(true); };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--v2-text-primary))]">Accounts</h1>
          <p className="text-xs text-[hsl(var(--v2-text-muted))] mt-1">
            Manage your liquid assets and credit facilities across all institutions.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex items-center rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] p-1 shadow-sm">
             <button 
                onClick={() => setView("grid")}
                className={cn("p-1.5 rounded-sm transition-colors", view === "grid" ? "bg-[hsl(var(--v2-bg))] text-[hsl(var(--v2-accent))]" : "text-[hsl(var(--v2-text-muted))] hover:text-[hsl(var(--v2-text-primary))]")}
             >
               <LayoutGrid className="h-3.5 w-3.5" />
             </button>
             <button
                onClick={() => setView("list")}
                className={cn("p-1.5 rounded-sm transition-colors", view === "list" ? "bg-[hsl(var(--v2-bg))] text-[hsl(var(--v2-accent))]" : "text-[hsl(var(--v2-text-muted))] hover:text-[hsl(var(--v2-text-primary))]")}
             >
               <List className="h-3.5 w-3.5" />
             </button>
           </div>
           
           <button
            onClick={openNew}
            className="flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--v2-accent))] px-4 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="v2-card p-12">
          <EmptyState
            icon={Wallet}
            title="No accounts linked"
            description="Link your first bank account or credit card to begin tracking."
            action={
              <button
                onClick={openNew}
                className="mt-4 flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--v2-accent))] px-4 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
              >
                Connect Account
              </button>
            }
          />
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map(a => (
            <AccountCardV2
              key={a.id}
              account={a}
              onEdit={openEdit}
              onDelete={deleteAccount}
            />
          ))}
        </div>
      ) : (
        <div className="v2-card overflow-hidden">
           <table className="w-full text-left">
              <thead className="border-b bg-[hsl(var(--v2-bg))] text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--v2-text-muted))]">
                 <tr>
                    <th className="px-6 py-3">Account Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Balance</th>
                    <th className="px-6 py-3"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--v2-border))] text-xs">
                 {accounts.map(a => (
                    <tr key={a.id} className="hover:bg-[hsl(var(--v2-bg))] transition-colors group">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="h-2 w-2 rounded-full" style={{ backgroundColor: a.colour }} />
                             <span className="font-bold text-[hsl(var(--v2-text-primary))]">{a.name}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-[hsl(var(--v2-text-muted))] capitalize">{a.type}</td>
                       <td className="px-6 py-4">
                          <span className="v2-badge bg-emerald-500/10 text-emerald-600">Active</span>
                       </td>
                       <td className="px-6 py-4 text-right font-bold text-[hsl(var(--v2-text-primary))]">
                          {formatCurrency(a.balance)}
                       </td>
                       <td className="px-6 py-4 text-right">
                          <button onClick={() => openEdit(a)} className="p-1 text-[hsl(var(--v2-text-muted))] hover:text-[hsl(var(--v2-accent))] transition-colors opacity-0 group-hover:opacity-100">
                             <MoreVertical className="h-4 w-4" />
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
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

function AccountCardV2({ account, onEdit }: { account: Account; onEdit: (a: Account) => void; onDelete: (id: number) => void }) {
  return (
    <div className="v2-card group p-6 hover:border-[hsl(var(--v2-accent)/0.3)] transition-all">
       <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] text-[hsl(var(--v2-text-muted))] group-hover:bg-[hsl(var(--v2-accent)/0.05)] transition-colors shadow-sm">
                <Wallet className="h-5 w-5" style={{ color: account.colour }} />
             </div>
             <div>
                <h3 className="text-sm font-bold text-[hsl(var(--v2-text-primary))]">{account.name}</h3>
                <p className="text-[10px] font-medium text-[hsl(var(--v2-text-muted))] uppercase tracking-wider">{account.type}</p>
             </div>
          </div>
          <button onClick={() => onEdit(account)} className="p-1.5 rounded-md text-[hsl(var(--v2-text-muted))] hover:bg-[hsl(var(--v2-bg))] hover:text-[hsl(var(--v2-accent))] transition-all">
             <MoreVertical className="h-4 w-4" />
          </button>
       </div>

       <div className="space-y-1">
          <p className="text-[10px] font-bold text-[hsl(var(--v2-text-muted))] uppercase tracking-widest">Available Balance</p>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl font-bold tracking-tight text-[hsl(var(--v2-text-primary))]">{formatCurrency(account.balance)}</span>
             <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-500/10 px-1 py-0.5 rounded">
                <ArrowUpRight className="h-2.5 w-2.5" />
                1.2%
             </span>
          </div>
       </div>

       <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: "hsl(var(--v2-border))" }}>
          <div className="flex flex-col">
             <span className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase">Currency</span>
             <span className="text-xs font-semibold">{account.currency}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase">Security</span>
             <span className="v2-badge bg-emerald-500/10 text-emerald-600">Encrypted</span>
          </div>
       </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
