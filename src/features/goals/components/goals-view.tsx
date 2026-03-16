"use client";

import { useState } from "react";
import { Plus, Flag } from "lucide-react";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { GoalCard } from "./goal-card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Goal } from "@/shared/types";

const COLOURS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#a855f7"];

export function GoalsView() {
  const { goals, loading, createGoal, updateGoal, deleteGoal } = useGoals();
  const { accounts } = useAccounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Goal | null>(null);

  const [name, setName]         = useState("");
  const [target, setTarget]     = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [accountId, setAccountId]   = useState("");
  const [colour, setColour]     = useState(COLOURS[0]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const openNew = () => {
    setEditing(null); setName(""); setTarget(""); setTargetDate("");
    setAccountId(""); setColour(COLOURS[0]); setError("");
    setModalOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g); setName(g.name); setTarget(String(g.targetAmount));
    setTargetDate(g.targetDate ?? ""); setAccountId(g.accountId ? String(g.accountId) : "");
    setColour(g.colour); setError("");
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = {
        name, targetAmount: parseFloat(target),
        targetDate: targetDate || null,
        accountId: accountId ? parseInt(accountId) : null,
        colour,
      };
      if (editing) await updateGoal(editing.id, payload);
      else         await createGoal(payload);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
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
              key={g.id}
              goal={g}
              onDelete={deleteGoal}
              onEdit={openEdit}
              onComplete={id => updateGoal(id, { isCompleted: true })}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Goal" : "New Goal"} size="sm">
        <form onSubmit={submit} className="space-y-3">
          <input className="ll-input" placeholder="Goal name" required value={name} onChange={e => setName(e.target.value)} />
          <input className="ll-input ll-mono" type="number" step="0.01" min="1" placeholder="Target amount" required value={target} onChange={e => setTarget(e.target.value)} />
          <input className="ll-input" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          <select className="ll-input" value={accountId} onChange={e => setAccountId(e.target.value)}>
            <option value="">Link to account (optional)</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            {COLOURS.map(c => (
              <button key={c} type="button" onClick={() => setColour(c)}
                className="h-6 w-6 rounded-full"
                style={{ background: c, outline: colour === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
              />
            ))}
          </div>
          {error && <p className="text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{error}</p>}
          <button
            type="submit" disabled={saving}
            className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "hsl(var(--ll-accent))" }}
          >
            {saving ? "Saving…" : editing ? "Update" : "Create Goal"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
