"use client";

import { useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/shared/lib/formatters";

export function BudgetsView() {
  const { budgets, loading, upsertBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [catId, setCatId]         = useState("");
  const [amount, setAmount]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await upsertBudget({ categoryId: parseInt(catId), amount: parseFloat(amount) });
      setModalOpen(false); setCatId(""); setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Budgets</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Monthly spending limits</p>
        </div>
        <button
          onClick={() => { setCatId(""); setAmount(""); setModalOpen(true); }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          <Plus className="h-3.5 w-3.5" />
          New Budget
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No budgets set"
          description="Set spending limits for your categories"
          action={
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "hsl(var(--ll-accent))" }}
            >
              Add Budget
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {budgets.map(b => {
            const pct = Math.min(100, ((b.spent ?? 0) / b.amount) * 100);
            const over = (b.spent ?? 0) > b.amount;
            return (
              <div key={b.id} className="ll-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{b.categoryIcon ?? "📦"}</span>
                    <span className="text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                      {b.categoryName}
                    </span>
                    {over && (
                      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-400">
                        Over limit
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="ll-mono text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                      {formatCurrency(b.spent ?? 0)} / {formatCurrency(b.amount)}
                    </span>
                    <button
                      onClick={() => deleteBudget(b.id)}
                      className="rounded p-1 transition-colors hover:bg-rose-500/10"
                      style={{ color: "hsl(var(--ll-text-muted))" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "hsl(var(--ll-border))" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: over ? "hsl(var(--ll-expense))" : "hsl(var(--ll-accent))",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Set Budget" size="sm">
        <form onSubmit={submit} className="space-y-3">
          <select className="ll-input" value={catId} onChange={e => setCatId(e.target.value)} required>
            <option value="">Select category…</option>
            {categories.filter(c => c.type !== "income").map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <input
            className="ll-input ll-mono" type="number" step="0.01" min="1" required
            placeholder="Monthly limit" value={amount} onChange={e => setAmount(e.target.value)}
          />
          {error && <p className="text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{error}</p>}
          <button
            type="submit" disabled={saving}
            className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "hsl(var(--ll-accent))" }}
          >
            {saving ? "Saving…" : "Save Budget"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
