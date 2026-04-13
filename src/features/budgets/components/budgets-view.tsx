"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Target, Trash2, RefreshCw } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
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
  rollover:   z.boolean(),
});
type FormData = z.infer<typeof schema>;

export function BudgetsView() {
  const { budgets, loading, upsertBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: undefined, amount: undefined, rollover: false },
  });

  const rolloverValue = watch("rollover");

  const openModal = () => {
    reset({ categoryId: undefined, amount: undefined, rollover: false });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    await upsertBudget({ categoryId: data.categoryId, amount: data.amount, rollover: data.rollover });
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

      {/* QW3: Summary stats bar */}
      {!loading && budgets.length > 0 && (() => {
        const totalLimit = budgets.reduce((s, b) => s + (b.effectiveAmount ?? Number(b.amount)), 0);
        const totalSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);
        const overCount  = budgets.filter(b => (b.spent ?? 0) > (b.effectiveAmount ?? Number(b.amount))).length;
        return (
          <div className="flex flex-wrap gap-4 rounded-xl p-3" style={{ background: "hsl(var(--ll-bg-surface))" }}>
            {[
              { label: "Budgets",     value: String(budgets.length) },
              { label: "Total limit", value: formatCurrency(totalLimit) },
              { label: "Spent",       value: formatCurrency(totalSpent) },
              { label: "Over limit",  value: String(overCount), accent: overCount > 0 },
            ].map(chip => (
              <div key={chip.label} className="flex flex-col">
                <span className="text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>{chip.label}</span>
                <span
                  className="text-sm font-semibold ll-mono"
                  style={{ color: chip.accent !== undefined ? (chip.accent ? "hsl(var(--ll-accent))" : "hsl(var(--ll-income))") : "hsl(var(--ll-text-primary))" }}
                >
                  {chip.value}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

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
            const effective = b.effectiveAmount ?? Number(b.amount);
            const pct       = Math.min(100, ((b.spent ?? 0) / effective) * 100);
            const over      = (b.spent ?? 0) > effective;
            // M3: amber near-limit state
            const nearLimit = !over && pct >= 75;
            const barColor  = over ? "hsl(var(--ll-expense))" : nearLimit ? "hsl(var(--ll-warning))" : "hsl(var(--ll-accent))";
            return (
              <div key={b.id} className="ll-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <CategoryIcon icon={b.categoryIcon ?? "📦"} size={14} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                          {b.categoryName}
                        </span>
                        {/* M3: nearly-at-limit badge */}
                        {nearLimit && (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "hsl(var(--ll-warning) / 0.1)", color: "hsl(var(--ll-warning))" }}>
                            Nearly at limit
                          </span>
                        )}
                      </div>
                      {b.rollover && (b.rolloverAmount ?? 0) > 0 && (
                        <p className="text-[10px] flex items-center gap-1" style={{ color: "hsl(var(--ll-text-muted))" }}>
                          <RefreshCw className="h-2.5 w-2.5" />
                          +{formatCurrency(b.rolloverAmount!)} rolled over
                        </p>
                      )}
                    </div>
                    {over && (
                      <span className="shrink-0 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-400">
                        Over by {formatCurrency((b.spent ?? 0) - effective)}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p className="ll-mono text-xs font-semibold" style={{ color: over ? "hsl(var(--ll-expense))" : "hsl(var(--ll-text-primary))" }}>
                        {formatCurrency(b.spent ?? 0)} <span className="font-normal" style={{ color: "hsl(var(--ll-text-muted))" }}>/ {formatCurrency(effective)}</span>
                      </p>
                      {/* M3: remaining text uses amber when near limit */}
                      <p className="text-[10px]" style={{ color: over ? "hsl(var(--ll-expense))" : nearLimit ? "hsl(var(--ll-warning))" : "hsl(var(--ll-text-muted))" }}>
                        {over ? `${Math.round(pct)}% used` : `${formatCurrency(effective - (b.spent ?? 0))} left`}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteId(b.id)}
                      className="cursor-pointer rounded p-1 transition-colors hover:bg-rose-500/10"
                      style={{ color: "hsl(var(--ll-text-muted))" }}
                      aria-label={`Delete ${b.categoryName} budget`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "hsl(var(--ll-border))" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
                {/* QW4-UI: pace forecast indicator */}
                {b.pace && b.pace.daysRemaining > 0 && (
                  <p className="mt-1.5 text-[10px]" style={{ color: b.pace.isOnTrack ? "hsl(var(--ll-text-muted))" : "hsl(var(--ll-expense))" }}>
                    {b.pace.isOnTrack
                      ? `On pace · projected ${formatCurrency(b.pace.projectedEnd)} this month`
                      : `⚠ On pace to exceed by ${formatCurrency(b.pace.projectedEnd - (b.effectiveAmount ?? Number(b.amount)))}`
                    }
                  </p>
                )}
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
            type="button"
            onClick={() => setValue("rollover", !rolloverValue)}
            className="flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors"
            style={{
              borderColor: rolloverValue ? "hsl(var(--ll-accent))" : "hsl(var(--ll-border))",
              background: rolloverValue ? "hsl(var(--ll-accent) / 0.05)" : "transparent",
            }}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5" style={{ color: rolloverValue ? "hsl(var(--ll-accent))" : "hsl(var(--ll-text-muted))" }} />
              <div>
                <p className="text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>Rollover unused budget</p>
                <p className="text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>Carry unspent balance to next month</p>
              </div>
            </div>
            <div
              className="h-4 w-7 rounded-full transition-colors relative"
              style={{ background: rolloverValue ? "hsl(var(--ll-accent))" : "hsl(var(--ll-border))" }}
            >
              <div
                className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
                style={{ transform: rolloverValue ? "translateX(14px)" : "translateX(2px)" }}
              />
            </div>
          </button>

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
