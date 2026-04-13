"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";
import { formatCurrency } from "@/shared/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

interface Suggestion {
  description: string;
  avgAmount:   number;
  type:        string;
  recurrence:  "weekly" | "monthly";
  occurrences: number;
}

interface ConfirmPayload {
  accountId:  number;
  categoryId: number;
}

function useSuggestions() {
  return useQuery<Suggestion[]>({
    queryKey: ["recurring-suggestions"],
    queryFn: async () => {
      const res  = await authFetch("/api/v1/transactions/recurring-suggestions");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Suggestion[];
    },
    staleTime: 10 * 60_000,
  });
}

export function RecurringSuggestions({
  accounts,
  categories,
}: {
  accounts:   { id: number; name: string }[];
  categories: { id: number; name: string }[];
}) {
  const { data: suggestions, isLoading } = useSuggestions();
  const qc = useQueryClient();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState<Record<string, ConfirmPayload | null>>({});

  if (isLoading) return <Skeleton className="h-24 rounded-xl" />;

  const visible = (suggestions ?? []).filter((s) => !dismissed.has(s.description));
  if (visible.length === 0) return null;

  const shown = expanded ? visible : visible.slice(0, 3);

  const dismiss = (desc: string) => setDismissed((prev) => new Set([...prev, desc]));

  const confirm = async (s: Suggestion) => {
    const payload = confirming[s.description];
    if (!payload?.accountId || !payload?.categoryId) {
      toast.error("Select an account and category first");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    try {
      const res  = await authFetch("/api/v1/transactions", {
        method: "POST",
        body:   JSON.stringify({
          accountId:   payload.accountId,
          categoryId:  payload.categoryId,
          type:        s.type,
          amount:      s.avgAmount,
          date:        today,
          note:        s.description,
          isRecurring: true,
          recurrence:  s.recurrence,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`"${s.description}" added as recurring`);
      dismiss(s.description);
      qc.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  return (
    <div className="ll-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid hsl(var(--ll-border))" }}>
        <RefreshCw className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
        <p className="text-sm font-semibold flex-1" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Recurring detected
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: "hsl(var(--ll-accent) / 0.12)", color: "hsl(var(--ll-accent))" }}
        >
          {visible.length}
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: "hsl(var(--ll-border) / 0.5)" }}>
        {shown.map((s) => {
          const isEditing = s.description in confirming;
          const payload   = confirming[s.description] ?? { accountId: 0, categoryId: 0 };

          return (
            <div key={s.description} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                      {s.description}
                    </p>
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                      style={{
                        background: s.recurrence === "monthly" ? "hsl(239 84% 67% / 0.12)" : "hsl(var(--ll-accent) / 0.12)",
                        color: s.recurrence === "monthly" ? "hsl(239 84% 67%)" : "hsl(var(--ll-accent))",
                      }}
                    >
                      {s.recurrence}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                    {formatCurrency(s.avgAmount)} avg · {s.occurrences} occurrences
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() =>
                      setConfirming((prev) =>
                        isEditing
                          ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== s.description))
                          : { ...prev, [s.description]: { accountId: 0, categoryId: 0 } }
                      )
                    }
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-white"
                    style={{ background: "hsl(var(--ll-accent))" }}
                  >
                    {isEditing ? "Cancel" : "Add"}
                  </button>
                  <button
                    onClick={() => dismiss(s.description)}
                    className="rounded-lg p-1 transition-colors"
                    style={{ color: "hsl(var(--ll-text-muted))" }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-2 flex gap-2">
                  <select
                    className="ll-input flex-1 text-xs"
                    value={payload.accountId || ""}
                    onChange={(e) =>
                      setConfirming((prev) => ({ ...prev, [s.description]: { ...payload, accountId: parseInt(e.target.value) } }))
                    }
                  >
                    <option value="">Account…</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select
                    className="ll-input flex-1 text-xs"
                    value={payload.categoryId || ""}
                    onChange={(e) =>
                      setConfirming((prev) => ({ ...prev, [s.description]: { ...payload, categoryId: parseInt(e.target.value) } }))
                    }
                  >
                    <option value="">Category…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button
                    onClick={() => confirm(s)}
                    className="shrink-0 rounded-lg px-3 py-1 text-xs font-medium text-white"
                    style={{ background: "hsl(var(--ll-income))" }}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visible.length > 3 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex w-full items-center justify-center gap-1.5 py-2 text-xs"
          style={{ color: "hsl(var(--ll-text-muted))", borderTop: "1px solid hsl(var(--ll-border))" }}
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Show less</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> {visible.length - 3} more</>
          )}
        </button>
      )}
    </div>
  );
}
