"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/shared/lib/formatters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { accountTypeLabel, accountTypeIcon } from "@/lib/account-types";
import { useAccountHistory } from "@/features/accounts/hooks/useAccounts";
import type { Account } from "@/shared/types";

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onViewTransactions,
}: {
  account: Account;
  onEdit: (a: Account) => void;
  onDelete: (id: number) => void;
  onViewTransactions?: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const balance  = account.balance ?? account.startingBalance;
  const TypeIcon = accountTypeIcon(account.type);
  const history  = useAccountHistory(account.id);

  return (
    <div className="ll-card group relative overflow-hidden p-5">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: account.colour }} />
      <div className="pl-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
              style={{ background: account.colour + "22", color: account.colour }}
            >
              <TypeIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "hsl(var(--ll-text-muted))" }}>
                {accountTypeLabel(account.type)}
              </p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
                {account.name}
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={() => onEdit(account)} className="rounded-md p-1.5 transition-colors hover:bg-white/5" style={{ color: "hsl(var(--ll-text-muted))" }} aria-label="Edit account">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setConfirm(true)} className="rounded-md p-1.5 transition-colors hover:bg-rose-500/10" style={{ color: "hsl(var(--ll-text-muted))" }} aria-label="Delete account">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={() => { setConfirm(false); onDelete(account.id); }}
          title="Delete account?"
          description="All transactions linked to this account will also be removed."
          variant="danger"
        />

        <p className={`ll-mono ll-balance mt-3 text-2xl font-bold ${balance < 0 ? "ll-balance-negative" : ""}`}>
          {formatCurrency(balance)}
        </p>
        {history.length >= 2 && (
          <div className="mt-3 h-12 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`sparkGrad-${account.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={account.colour} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={account.colour} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--ll-bg-surface))", border: "1px solid hsl(var(--ll-border))", borderRadius: 6, fontSize: 11 }}
                  formatter={(v: number) => [formatCurrency(v), "Balance"]}
                  labelStyle={{ color: "hsl(var(--ll-text-muted))" }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={account.colour}
                  strokeWidth={1.5}
                  fill={`url(#sparkGrad-${account.id})`}
                  dot={false}
                  activeDot={{ r: 3, fill: account.colour }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {onViewTransactions && (
          <button
            onClick={onViewTransactions}
            className="mt-3 text-[11px] font-medium transition-colors hover:underline"
            style={{ color: "hsl(var(--ll-accent))" }}
          >
            View transactions →
          </button>
        )}
      </div>
    </div>
  );
}
