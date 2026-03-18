"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Flag, Target, Calendar, CreditCard, MoreVertical, Trophy, Clock, TrendingUp } from "lucide-react";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import type { Goal } from "@/shared/types";

const COLOURS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#a855f7"];

const schema = z.object({
  name:         z.string().min(1, "Name is required").max(100),
  targetAmount: z.number().positive("Must be greater than 0"),
  targetDate:   z.string().optional(),
  accountId:    z.string().optional(),
  colour:       z.string().length(7),
});
type FormData = z.infer<typeof schema>;

export function GoalsViewV2() {
  const { goals, loading, createGoal, updateGoal, deleteGoal } = useGoals();
  const { accounts } = useAccounts();

  const [open, setOpen]         = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", targetAmount: undefined, targetDate: "", accountId: "", colour: COLOURS[0] },
  });

  const colour = watch("colour");

  const openNew = () => {
    setEditGoal(null);
    reset({ name: "", targetAmount: undefined, targetDate: "", accountId: "", colour: COLOURS[0] });
    setOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditGoal(g);
    reset({
      name:         g.name,
      targetAmount: Number(g.targetAmount),
      targetDate:   g.targetDate ?? "",
      accountId:    g.accountId ? String(g.accountId) : "",
      colour:       g.colour,
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      name:         data.name,
      targetAmount: data.targetAmount,
      targetDate:   data.targetDate || null,
      accountId:    data.accountId ? parseInt(data.accountId) : null,
      colour:       data.colour,
    };
    if (editGoal) await updateGoal(editGoal.id, payload);
    else          await createGoal(payload);
    setOpen(false);
  };

  const completedCount = goals.filter(g => g.isCompleted).length;
  const totalTarget    = goals.reduce((acc, g) => acc + Number(g.targetAmount), 0);
  const totalSaved     = goals.reduce((acc, g) => acc + (g.currentBalance ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--v2-text-primary))]">Capital Growth Goals</h1>
          <p className="text-xs text-[hsl(var(--v2-text-muted))] mt-1">
            Managing {goals.length} strategic accumulation targets and benchmarks.
          </p>
        </div>
        
        <button
          onClick={openNew}
          className="flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--v2-accent))] px-4 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Define New Goal
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
         <div className="v2-card p-4">
            <div className="flex items-center gap-2 text-[hsl(var(--v2-text-muted))] mb-1">
               <Target className="h-3 w-3" />
               <span className="text-[9px] font-bold uppercase tracking-widest">Active Goals</span>
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--v2-text-primary))]">{goals.length - completedCount}</h3>
         </div>
         <div className="v2-card p-4">
            <div className="flex items-center gap-2 text-[hsl(var(--v2-text-muted))] mb-1">
               <Trophy className="h-3 w-3" />
               <span className="text-[9px] font-bold uppercase tracking-widest">Completed</span>
            </div>
            <h3 className="text-xl font-bold text-emerald-600">{completedCount}</h3>
         </div>
         <div className="v2-card p-4">
            <div className="flex items-center gap-2 text-[hsl(var(--v2-text-muted))] mb-1">
               <TrendingUp className="h-3 w-3" />
               <span className="text-[9px] font-bold uppercase tracking-widest">Total Value</span>
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--v2-text-primary))]">{formatCurrency(totalSaved)}</h3>
         </div>
         <div className="v2-card p-4">
            <div className="flex items-center gap-2 text-[hsl(var(--v2-text-muted))] mb-1">
               <Clock className="h-3 w-3" />
               <span className="text-[9px] font-bold uppercase tracking-widest">Global Progress</span>
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--v2-accent))]">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</h3>
         </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="v2-card p-12">
          <EmptyState
            icon={Flag}
            title="No accumulation targets"
            description="Define your first financial milestone to begin tracking your progress."
            action={
              <button onClick={openNew} className="mt-4 flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--v2-accent))] px-4 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-opacity">
                Create First Goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map(g => (
            <GoalCardV2
              key={g.id} goal={g}
              onEdit={openEdit}
              onComplete={id => updateGoal(id, { isCompleted: true })}
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editGoal ? "Modify Goal Parameters" : "Define Goal Benchmark"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Benchmark Name</label>
            <input className="v2-input w-full h-10 px-3 rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--v2-accent)/0.5)]" placeholder="e.g. Q4 Capital Reserve" {...register("name")} />
            {errors.name && <p className="mt-1 text-[10px] font-bold text-rose-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Accumulation Target</label>
            <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[hsl(var(--v2-text-muted))]">$</span>
               <input className="v2-input w-full h-10 pl-7 pr-3 rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] text-sm font-bold outline-none focus:ring-1 focus:ring-[hsl(var(--v2-accent)/0.5)]" type="number" step="0.01" min="1" placeholder="0.00" {...register("targetAmount", { valueAsNumber: true })} />
            </div>
            {errors.targetAmount && <p className="mt-1 text-[10px] font-bold text-rose-500">{errors.targetAmount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Maturity Date</label>
               <input className="v2-input w-full h-10 px-3 rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] text-xs outline-none focus:ring-1 focus:ring-[hsl(var(--v2-accent)/0.5)]" type="date" {...register("targetDate")} />
             </div>
             <div>
               <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Custodial Account</label>
               <select className="v2-input w-full h-10 px-2 rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] text-xs outline-none focus:ring-1 focus:ring-[hsl(var(--v2-accent)/0.5)]" {...register("accountId")}>
                 <option value="">None</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </select>
             </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Signature Colour</label>
            <div className="flex flex-wrap gap-2.5">
              {COLOURS.map(c => (
                <button key={c} type="button" 
                  onClick={() => setValue("colour", c)}
                  className="h-6 w-6 rounded-full transition-all border-2 border-transparent hover:scale-110"
                  style={{ background: c, borderColor: colour === c ? 'white' : 'transparent', boxShadow: colour === c ? `0 0 0 1px ${c}` : 'none' }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center rounded-md bg-[hsl(var(--v2-accent))] py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60 transition-all hover:opacity-90"
          >
            {isSubmitting ? "Processing…" : editGoal ? "Authorize Update" : "Establish Goal"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function GoalCardV2({ goal, onEdit, onComplete }: { goal: Goal; onEdit: (g: Goal) => void; onComplete: (id: number) => void }) {
  const current = goal.currentBalance ?? 0;
  const target  = Number(goal.targetAmount);
  const pct     = Math.min(100, (current / target) * 100);
  const remaining = Math.max(0, target - current);

  return (
    <div className="v2-card group p-6 hover:border-[hsl(var(--v2-accent)/0.3)] transition-all flex flex-col h-full">
       <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] shadow-sm transition-colors group-hover:bg-[hsl(var(--v2-accent)/0.05)]">
                <Target className="h-5 w-5" style={{ color: goal.colour }} />
             </div>
             <div>
                <h3 className="text-sm font-bold text-[hsl(var(--v2-text-primary))]">{goal.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: goal.colour }} />
                   <span className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase tracking-widest">Priority Asset</span>
                </div>
             </div>
          </div>
          <button onClick={() => onEdit(goal)} className="p-1.5 rounded-md text-[hsl(var(--v2-text-muted))] hover:bg-[hsl(var(--v2-bg))] transition-all">
             <MoreVertical className="h-4 w-4" />
          </button>
       </div>

       <div className="flex-1 space-y-5">
          <div className="flex items-end justify-between">
             <div className="space-y-1">
                <p className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase tracking-widest">Progress to Benchmark</p>
                <div className="flex items-baseline gap-1.5">
                   <span className="text-2xl font-bold tracking-tight text-[hsl(var(--v2-text-primary))]">
                      {formatCurrency(current)}
                   </span>
                   <span className="text-xs font-bold text-[hsl(var(--v2-text-muted))]">/ {formatCurrency(target)}</span>
                </div>
             </div>
             <div className="text-right">
                <span className="text-sm font-bold text-[hsl(var(--v2-accent))]">{Math.round(pct)}%</span>
             </div>
          </div>

          <div className="relative h-2 w-full bg-[hsl(var(--v2-bg))] rounded-full overflow-hidden">
             <div 
               className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out" 
               style={{ width: `${pct}%`, backgroundColor: goal.colour }} 
             />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: "hsl(var(--v2-border))" }}>
             <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase flex items-center gap-1">
                   <Calendar className="h-2.5 w-2.5" /> Maturity
                </p>
                <span className="text-[10px] font-bold text-[hsl(var(--v2-text-primary))]">{goal.targetDate ? formatDate(goal.targetDate, "short") : 'Ongoing'}</span>
             </div>
             <div className="space-y-0.5 text-right">
                <p className="text-[9px] font-bold text-[hsl(var(--v2-text-muted))] uppercase flex items-center justify-end gap-1">
                   <CreditCard className="h-2.5 w-2.5" /> Source
                </p>
                <span className="text-[10px] font-bold text-[hsl(var(--v2-text-primary))] truncate block">{goal.accountId ? 'Linked' : 'Consolidated'}</span>
             </div>
          </div>
       </div>

       {!goal.isCompleted && pct >= 100 && (
          <button 
            onClick={() => onComplete(goal.id)}
            className="mt-6 w-full py-2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-md hover:bg-emerald-600 transition-colors"
          >
             Finalize Achievement
          </button>
       )}
       {goal.isCompleted && (
          <div className="mt-6 flex items-center justify-center gap-2 py-2 bg-emerald-500/10 rounded-md">
             <Trophy className="h-3.5 w-3.5 text-emerald-600" />
             <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Achieved</span>
          </div>
       )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
