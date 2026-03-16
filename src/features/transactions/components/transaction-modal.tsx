"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";

interface TxPayload {
  accountId: number;
  categoryId: number;
  type: string;
  amount: number;
  date: string;
  note?: string;
  transferToId?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (payload: TxPayload) => Promise<void>;
}

export function TransactionModal({ open, onClose, onSave }: Props) {
  const { accounts }    = useAccounts();
  const { categories }  = useCategories();

  const [type, setType]         = useState("expense");
  const [accountId, setAccount] = useState("");
  const [catId, setCat]         = useState("");
  const [amount, setAmount]     = useState("");
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote]         = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!open) return;
    setType("expense"); setAmount(""); setNote(""); setError("");
    setDate(new Date().toISOString().slice(0, 10));
    if (accounts.length)   setAccount(String(accounts[0].id));
    if (categories.length) setCat(String(categories[0].id));
  }, [open, accounts, categories]);

  const filteredCats = categories.filter(c =>
    type === "income"  ? c.type !== "expense" :
    type === "expense" ? c.type !== "income"  : true
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload: TxPayload = {
        accountId:  parseInt(accountId),
        categoryId: parseInt(catId),
        type,
        amount:     parseFloat(amount),
        date,
        note:       note || undefined,
      };
      if (type === "transfer" && transferTo) payload.transferToId = parseInt(transferTo);
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = "ll-input";

  return (
    <Modal open={open} onClose={onClose} title="New Transaction" size="md">
      <form onSubmit={submit} className="space-y-3">
        {/* Type tabs */}
        <div className="flex rounded-lg p-0.5" style={{ background: "hsl(var(--ll-bg-base))" }}>
          {["expense", "income", "transfer"].map(t => (
            <button
              key={t} type="button"
              onClick={() => setType(t)}
              className="flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-all"
              style={{
                background: type === t ? "hsl(var(--ll-bg-surface))" : "transparent",
                color: type === t ? "hsl(var(--ll-text-primary))" : "hsl(var(--ll-text-muted))",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <select className={inputStyle} value={accountId} onChange={e => setAccount(e.target.value)}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        {type === "transfer" && (
          <select className={inputStyle} value={transferTo} onChange={e => setTransferTo(e.target.value)}>
            <option value="">Transfer to account…</option>
            {accounts.filter(a => String(a.id) !== accountId).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}

        <select className={inputStyle} value={catId} onChange={e => setCat(e.target.value)}>
          {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        <input
          className={`${inputStyle} ll-mono`} type="number" step="0.01" min="0.01" required
          placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)}
        />
        <input
          className={inputStyle} type="date" required
          value={date} onChange={e => setDate(e.target.value)}
        />
        <input
          className={inputStyle} placeholder="Note (optional)"
          value={note} onChange={e => setNote(e.target.value)}
        />

        {error && <p className="text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{error}</p>}

        <button
          type="submit" disabled={saving}
          className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          {saving ? "Saving…" : "Add Transaction"}
        </button>
      </form>
    </Modal>
  );
}
