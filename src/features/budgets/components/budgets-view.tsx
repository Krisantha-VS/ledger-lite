"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Target, Trash2 } from "lucide-react";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/shared/lib/formatters";

const schema = z.object({
  categoryId: z.number().int().positive("Select a category"),
  amount:     z.number().positive("Must be greater than 0"),
});
type FormData = z.infer<typeof schema>;

export function BudgetsView() {
  const { budgets, loading, upsertBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: undefined, amount: undefined },
  });

  const openModal = () => {
    reset({ categoryId: undefined, amount: undefined });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    await upsertBudget({ categoryId: data.categoryId, amount: data.amount });
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Budgets</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Monthly spending limits</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white"
          style={{ background: "hsl(var(--ll-accent))" }}
          aria-label="New budget"
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
            <button onClick={openModal} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "hsl(var(--ll-accent))" }}>
              Add Budget
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {budgets.map(b => {
            const pct  = Math.min(100, ((b.spent ?? 0) / b.amount) * 100);
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
                      onClick={() => setDeleteId(b.id)}
                      className="rounded p-1 transition-colors hover:bg-rose-500/10"
                      style={{ color: "hsl(var(--ll-text-muted))" }}
                      aria-label={`Delete ${b.categoryName} budget`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "hsl(var(--ll-border))" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: over ? "hsl(var(--ll-expense))" : "hsl(var(--ll-accent))" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) { deleteBudget(deleteId); setDeleteId(null); } }}
        title="Delete budget?"
        description="This spending limit will be permanently removed."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Set Budget" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Category</label>
            <select className="ll-input" aria-label="Category" {...register("categoryId", { valueAsNumber: true })}>
              <option value="">Select category…</option>
              {categories.filter(c => c.type !== "income").map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Monthly limit</label>
            <input className="ll-input ll-mono" type="number" step="0.01" min="1" placeholder="0.00" aria-label="Monthly limit" {...register("amount", { valueAsNumber: true })} />
            {errors.amount && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.amount.message}</p>}
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "hsl(var(--ll-accent))" }}
          >
            {isSubmitting ? "Saving…" : "Save Budget"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
