"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Target, Trash2, AlertCircle, CheckCircle2, MoreHorizontal, PieChart } from "lucide-react";
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

export function BudgetsViewV2() {
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

  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalSpent    = budgets.reduce((acc, b) => acc + (b.spent ?? 0), 0);
  const overallPct    = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--v2-text-primary))]">Budget Strategy</h1>
          <p className="text-xs text-[hsl(var(--v2-text-muted))] mt-1">
            Optimizing capital allocation across {budgets.length} active spending categories.
          </p>
        </div>
        
        <button
          onClick={openModal}
          className="flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--v2-accent))] px-4 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Configure Budget
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 md:grid-cols-3">
         <div className="v2-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--v2-text-muted))] mb-1">Total Allocated</p>
            <h3 className="text-xl font-bold text-[hsl(var(--v2-text-primary))]">{formatCurrency(totalBudgeted)}</h3>
            <div className="mt-2 flex items-center gap-2">
               <div className="h-1 flex-1 bg-[hsl(var(--v2-bg))] rounded-full overflow-hidden">
                  <div className="h-full bg-[hsl(var(--v2-accent))] rounded-full" style={{ width: '100%' }} />
               </div>
               <span className="text-[10px] font-bold text-[hsl(var(--v2-text-muted))]">100%</span>
            </div>
         </div>
         <div className="v2-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--v2-text-muted))] mb-1">Current Utilization</p>
            <h3 className="text-xl font-bold text-[hsl(var(--v2-text-primary))]">{formatCurrency(totalSpent)}</h3>
            <div className="mt-2 flex items-center gap-2">
               <div className="h-1 flex-1 bg-[hsl(var(--v2-bg))] rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", overallPct > 90 ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, overallPct)}%` }} />
               </div>
               <span className="text-[10px] font-bold text-[hsl(var(--v2-text-muted))]">{Math.round(overallPct)}%</span>
            </div>
         </div>
         <div className="v2-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--v2-text-muted))] mb-1">Variance Analysis</p>
            <div className="flex items-center gap-2">
               <h3 className={cn("text-xl font-bold", totalBudgeted - totalSpent >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {formatCurrency(Math.abs(totalBudgeted - totalSpent))}
               </h3>
               <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">
                  {totalBudgeted - totalSpent >= 0 ? "Surplus" : "Deficit"}
               </span>
            </div>
            <p className="text-[10px] text-[hsl(var(--v2-text-muted))] mt-2 flex items-center gap-1">
               {totalBudgeted - totalSpent >= 0 ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> : <AlertCircle className="h-2.5 w-2.5 text-rose-500" />}
               {totalBudgeted - totalSpent >= 0 ? "Within projected limits" : "Exceeding allocated capital"}
            </p>
         </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="v2-card p-12">
          <EmptyState
            icon={Target}
            title="No strategy defined"
            description="Create your first budget to begin optimizing your monthly cash flow."
            action={
              <button onClick={openModal} className="mt-4 flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--v2-accent))] px-4 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-opacity">
                Set Initial Budget
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map(b => (
            <BudgetCardV2 key={b.id} budget={b} onDelete={() => setDeleteId(b.id)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) { deleteBudget(deleteId); setDeleteId(null); } }}
        title="Terminate Budget?"
        description="This will remove the spending constraints for this category."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Configure Budget Allocation" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Category Asset</label>
            <select className="v2-input w-full h-10 px-3 rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--v2-accent)/0.5)]" {...register("categoryId", { valueAsNumber: true })}>
              <option value="">Select asset class…</option>
              {categories.filter(c => c.type !== "income").map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-[10px] font-bold text-rose-500">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Monthly Capital Limit</label>
            <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[hsl(var(--v2-text-muted))]">$</span>
               <input className="v2-input w-full h-10 pl-7 pr-3 rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] text-sm font-bold outline-none focus:ring-1 focus:ring-[hsl(var(--v2-accent)/0.5)]" type="number" step="0.01" min="1" placeholder="0.00" {...register("amount", { valueAsNumber: true })} />
            </div>
            {errors.amount && <p className="mt-1 text-[10px] font-bold text-rose-500">{errors.amount.message}</p>}
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center rounded-md bg-[hsl(var(--v2-accent))] py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60 transition-all hover:opacity-90"
          >
            {isSubmitting ? "Processing…" : "Authorize Allocation"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function BudgetCardV2({ budget, onDelete }: { budget: any; onDelete: () => void }) {
  const spent = budget.spent ?? 0;
  const limit = budget.amount;
  const pct   = Math.min(100, (spent / limit) * 100);
  const isOver = spent > limit;
  const remaining = Math.max(0, limit - spent);

  return (
    <div className="v2-card group p-6 hover:border-[hsl(var(--v2-accent)/0.3)] transition-all">
       <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] text-lg shadow-sm group-hover:bg-[hsl(var(--v2-accent)/0.05)] transition-colors">
                {budget.categoryIcon ?? "📦"}
             </div>
             <div>
                <h3 className="text-sm font-bold text-[hsl(var(--v2-text-primary))]">{budget.categoryName}</h3>
                <div className="flex items-center gap-1.5">
                   {isOver ? (
                      <span className="v2-badge bg-rose-500/10 text-rose-600">Over Allocation</span>
                   ) : (
                      <span className="v2-badge bg-emerald-500/10 text-emerald-600">Optimized</span>
                   )}
                </div>
             </div>
          </div>
          <button onClick={onDelete} className="p-1.5 rounded-md text-[hsl(var(--v2-text-muted))] hover:bg-rose-500/10 hover:text-rose-600 transition-all">
             <Trash2 className="h-4 w-4" />
          </button>
       </div>

       <div className="space-y-4">
          <div className="flex items-end justify-between">
             <div className="space-y-1">
                <p className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase tracking-widest">Utilized / Limit</p>
                <div className="flex items-baseline gap-1.5">
                   <span className={cn("text-lg font-bold tracking-tight", isOver ? "text-rose-600" : "text-[hsl(var(--v2-text-primary))")}>
                      {formatCurrency(spent)}
                   </span>
                   <span className="text-xs font-bold text-[hsl(var(--v2-text-muted))]">/ {formatCurrency(limit)}</span>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase tracking-widest">Efficiency</p>
                <span className={cn("text-xs font-bold", isOver ? "text-rose-600" : "text-emerald-600")}>
                   {Math.round(pct)}%
                </span>
             </div>
          </div>

          <div className="h-1.5 w-full bg-[hsl(var(--v2-bg))] rounded-full overflow-hidden">
             <div 
               className={cn("h-full rounded-full transition-all duration-700", isOver ? "bg-rose-500" : "bg-[hsl(var(--v2-accent))")} 
               style={{ width: `${pct}%` }} 
             />
          </div>

          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "hsl(var(--v2-border))" }}>
             <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase">Available Balance</span>
                <span className={cn("text-xs font-bold", remaining > 0 ? "text-emerald-600" : "text-rose-600")}>
                   {formatCurrency(remaining)}
                </span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase">Status</span>
                <div className="flex items-center gap-1">
                   {isOver ? <AlertCircle className="h-2.5 w-2.5 text-rose-500" /> : <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />}
                   <span className="text-[10px] font-bold">{isOver ? 'Critical' : 'Healthy'}</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
