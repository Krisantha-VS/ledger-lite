"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Target, Trash2, RefreshCw, Pencil, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/shared/lib/formatters";
import { BudgetSuggestions } from "./budget-suggestions";
import type { Budget } from "@/shared/types";

const schema = z.object({
  categoryId: z.number().int().positive("Select a category"),
  amount:     z.number().positive("Must be greater than 0"),
  rollover:   z.boolean(),
});
type FormData = z.infer<typeof schema>;

type FilterType = "all" | "over" | "near" | "ok";
type SortType   = "category" | "pct" | "amount";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all",  label: "All" },
  { value: "over", label: "Over limit" },
  { value: "near", label: "Near limit" },
  { value: "ok",   label: "On track" },
];

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: "category", label: "Category A–Z" },
  { value: "pct",      label: "% spent ↓" },
  { value: "amount",   label: "Budget ↓" },
];

export function BudgetsView() {
  const { budgets, loading, upsertBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();

  const [modalOpen, setModalOpen]   = useState(false);
  const [deleteId,  setDeleteId]    = useState<number | null>(null);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [filter, setFilter]         = useState<FilterType>("all");
  const [sort,   setSort]           = useState<SortType>("category");
  const [sortOpen, setSortOpen]     = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: undefined, amount: undefined, rollover: false },
  });

  const rolloverValue = watch("rollover");

  const openCreate = () => {
    setEditBudget(null);
    reset({ categoryId: undefined, amount: undefined, rollover: false });
    setModalOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditBudget(b);
    reset({ categoryId: b.categoryId, amount: Number(b.amount), rollover: b.rollover });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    await upsertBudget({ categoryId: data.categoryId, amount: data.amount, rollover: data.rollover });
    setModalOpen(false);
  };

  const displayed = useMemo(() => {
    let list = [...budgets];
    // Filter
    list = list.filter(b => {
      const eff  = b.effectiveAmount ?? Number(b.amount);
      const pct  = ((b.spent ?? 0) / eff) * 100;
      const over = (b.spent ?? 0) > eff;
      const near = !over && pct >= 75;
      if (filter === "over") return over;
      if (filter === "near") return near;
      if (filter === "ok")   return !over && !near;
      return true;
    });
    // Sort
    list.sort((a, b) => {
      if (sort === "category") return (a.categoryName ?? "").localeCompare(b.categoryName ?? "");
      if (sort === "pct") {
        const pctA = ((a.spent ?? 0) / (a.effectiveAmount ?? Number(a.amount))) * 100;
        const pctB = ((b.spent ?? 0) / (b.effectiveAmount ?? Number(b.amount))) * 100;
        return pctB - pctA;
      }
      if (sort === "amount") return Number(b.amount) - Number(a.amount);
      return 0;
    });
    return list;
  }, [budgets, filter, sort]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Budgets</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Monthly spending limits</p>
        </div>
        <Button onClick={openCreate} aria-label="New budget">
          <Plus className="h-3.5 w-3.5" />
          New Budget
        </Button>
      </div>

      {/* F3: AI budget suggestions */}
      <BudgetSuggestions
        onAccept={async (categoryId, amount) => {
          await upsertBudget({ categoryId, amount, rollover: false });
        }}
      />

      {/* Summary stats bar */}
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

      {/* Filter + Sort bar */}
      {!loading && budgets.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1">
            {FILTER_OPTIONS.map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
                style={{
                  background: filter === f.value ? "hsl(var(--ll-accent))" : "hsl(var(--ll-bg-surface))",
                  color: filter === f.value ? "hsl(var(--ll-accent-fg))" : "hsl(var(--ll-text-muted))",
                }}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <button onClick={() => setSortOpen(p => !p)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors"
              style={{ background: "hsl(var(--ll-bg-surface))", color: "hsl(var(--ll-text-secondary))", borderColor: "hsl(var(--ll-border))" }}>
              {SORT_OPTIONS.find(s => s.value === sort)?.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-1 z-10 rounded-xl overflow-hidden shadow-lg min-w-[140px]"
                style={{ background: "hsl(var(--ll-bg-elevated))", border: "1px solid hsl(var(--ll-border))" }}>
                {SORT_OPTIONS.map(s => (
                  <button key={s.value}
                    onClick={() => { setSort(s.value); setSortOpen(false); }}
                    className="flex w-full px-3 py-2 text-xs text-left transition-colors hover:bg-white/5"
                    style={{ color: sort === s.value ? "hsl(var(--ll-accent))" : "hsl(var(--ll-text-secondary))" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No budgets set"
          description="Set spending limits for your categories"
          action={<Button onClick={openCreate} size="md">Add Budget</Button>}
        />
      ) : displayed.length === 0 ? (
        <p className="py-8 text-center text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
          No budgets match this filter.
        </p>
      ) : (
        <div className="space-y-2">
          {displayed.map(b => {
            const effective = b.effectiveAmount ?? Number(b.amount);
            const pct       = Math.min(100, ((b.spent ?? 0) / effective) * 100);
            const over      = (b.spent ?? 0) > effective;
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
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "hsl(var(--ll-expense)/0.1)", color: "hsl(var(--ll-expense))" }}>
                        Over by {formatCurrency((b.spent ?? 0) - effective)}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p className="ll-mono text-xs font-semibold" style={{ color: over ? "hsl(var(--ll-expense))" : "hsl(var(--ll-text-primary))" }}>
                        {formatCurrency(b.spent ?? 0)} <span className="font-normal" style={{ color: "hsl(var(--ll-text-muted))" }}>/ {formatCurrency(effective)}</span>
                      </p>
                      <p className="text-[10px]" style={{ color: over ? "hsl(var(--ll-expense))" : nearLimit ? "hsl(var(--ll-warning))" : "hsl(var(--ll-text-muted))" }}>
                        {over ? `${Math.round(pct)}% used` : `${formatCurrency(effective - (b.spent ?? 0))} left`}
                      </p>
                    </div>
                    <button
                      onClick={() => openEdit(b)}
                      className="cursor-pointer rounded p-1 transition-colors hover:bg-[hsl(var(--ll-accent)/0.1)]"
                      style={{ color: "hsl(var(--ll-text-muted))" }}
                      aria-label={`Edit ${b.categoryName} budget`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
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
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
                </div>
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
        description="This spending limit will be removed. Your existing transactions in this category are not affected."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editBudget ? "Edit Budget" : "Set Budget"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Category</label>
            <select className="ll-input" aria-label="Category" disabled={!!editBudget} {...register("categoryId", { valueAsNumber: true })}>
              <option value="">Select category…</option>
              {categories.filter(c => c.type !== "income").map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {editBudget && (
              <p className="mt-0.5 text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>Category cannot be changed. Delete and re-add to change category.</p>
            )}
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
            <div className="h-4 w-7 rounded-full transition-colors relative" style={{ background: rolloverValue ? "hsl(var(--ll-accent))" : "hsl(var(--ll-border))" }}>
              <div className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
                style={{ transform: rolloverValue ? "translateX(14px)" : "translateX(2px)" }} />
            </div>
          </button>

          <button
            type="submit" disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "hsl(var(--ll-accent))" }}
          >
            {isSubmitting ? "Saving…" : editBudget ? "Update Budget" : "Save Budget"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
