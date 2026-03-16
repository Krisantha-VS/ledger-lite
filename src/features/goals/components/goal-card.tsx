"use client";

import { useState } from "react";
import { CheckCircle2, Trash2, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Goal } from "@/shared/types";

export function GoalCard({
  goal,
  onDelete,
  onComplete,
  onEdit,
}: {
  goal: Goal;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onEdit: (g: Goal) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const current = goal.currentBalance ?? 0;
  const target  = Number(goal.targetAmount);
  const pct     = Math.min(100, target > 0 ? (current / target) * 100 : 0);

  return (
    <div className="ll-card group relative overflow-hidden p-5">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: goal.colour }} />

      <div className="pl-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
              {goal.name}
            </p>
            {goal.isCompleted && <CheckCircle2 className="h-4 w-4 text-green-400" />}
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit(goal)}
              className="rounded-md p-1.5 transition-colors hover:bg-white/5"
              style={{ color: "hsl(var(--ll-text-muted))" }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {!goal.isCompleted && (
              <button
                onClick={() => onComplete(goal.id)}
                className="rounded-md p-1.5 transition-colors hover:bg-green-500/10"
                style={{ color: "hsl(var(--ll-text-muted))" }}
                title="Mark complete"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setConfirm(true)}
              className="rounded-md p-1.5 transition-colors hover:bg-rose-500/10"
              style={{ color: "hsl(var(--ll-text-muted))" }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="ll-mono text-xl font-bold" style={{ color: "hsl(var(--ll-text-primary))" }}>
              {formatCurrency(current)}
            </p>
            <p className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
              of {formatCurrency(target)}
            </p>
          </div>
          <p className="ll-mono text-lg font-semibold" style={{ color: goal.colour }}>
            {Math.round(pct)}%
          </p>
        </div>

        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: "hsl(var(--ll-border))" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: goal.colour }}
          />
        </div>

        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={() => { setConfirm(false); onDelete(goal.id); }}
          title="Delete goal?"
          description="This savings goal and its progress will be permanently removed."
        />

        {goal.targetDate && !goal.isCompleted && (
          <p className="mt-2 text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
            Target: {formatDate(goal.targetDate, "short")}
            {goal.projectedCompletionDate && (
              <span> · Projected: {formatDate(goal.projectedCompletionDate, "short")}</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
