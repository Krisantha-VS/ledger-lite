"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Flag } from "lucide-react";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { GoalCard } from "./goal-card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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

export function GoalsView() {
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Goals</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Track your savings targets</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white"
          style={{ background: "hsl(var(--ll-accent))" }}
          aria-label="New goal"
        >
          <Plus className="h-3.5 w-3.5" />
          New Goal
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No goals yet"
          description="Create a savings goal and track your progress"
          action={
            <button onClick={openNew} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "hsl(var(--ll-accent))" }}>
              Add Goal
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map(g => (
            <GoalCard
              key={g.id} goal={g}
              onDelete={deleteGoal}
              onEdit={openEdit}
              onComplete={id => updateGoal(id, { isCompleted: true })}
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editGoal ? "Edit Goal" : "New Goal"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Goal name</label>
            <input className="ll-input" placeholder="e.g. Emergency Fund" aria-label="Goal name" {...register("name")} />
            {errors.name && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Target amount</label>
            <input className="ll-input ll-mono" type="number" step="0.01" min="1" placeholder="0.00" aria-label="Target amount" {...register("targetAmount", { valueAsNumber: true })} />
            {errors.targetAmount && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.targetAmount.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Target date (optional)</label>
            <input className="ll-input" type="date" aria-label="Target date" {...register("targetDate")} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Link to account (optional)</label>
            <select className="ll-input" aria-label="Link to account" {...register("accountId")}>
              <option value="">None</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Colour</label>
            <div className="flex flex-wrap gap-2">
              {COLOURS.map(c => (
                <button key={c} type="button" aria-label={`Colour ${c}`}
                  onClick={() => setValue("colour", c)}
                  className="h-6 w-6 rounded-full transition-all"
                  style={{ background: c, outline: colour === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "hsl(var(--ll-accent))" }}
          >
            {isSubmitting ? "Saving…" : editGoal ? "Update" : "Create Goal"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
